import { useState, useRef, useMemo, useEffect } from "react";
import { sameOriginMedia } from "../lib/media";
import { Link } from "react-router-dom";
import {
  Shirt,
  Check, ChevronRight, ChevronLeft,
  Upload, Plus, Trash2,
} from "lucide-react";

// The WebGL preview is lazy-loaded inside StudioPreview, which both screens share.
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import FileUploadBox from "../components/FileUploadBox";
import PriceEstimateBox from "../components/PriceEstimateBox";
import StudioPreview from "../components/StudioPreview";
import { hasOwnNeck } from "../components/ProductMockup";
import ProductGlyph from "../components/ProductGlyph";
import ColorPicker from "../components/ColorPicker";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import EnquiryWhatsAppCta from "../components/EnquiryWhatsAppCta";
import type { EnquiryWhatsAppResponse } from "../lib/enquiryWhatsApp";
import { useFormTracking } from "../hooks/useFormTracking";
import { useDesignToolConfig, useDesignSubmission } from "../hooks/useDesignSubmission";
import { designToQuoteRequest } from "../lib/legacyQuote";
import type { UploadedFileWithRole } from "../hooks/useFileUpload";
import { ENQUIRY_V2 } from "../lib/features";
import { isoDate } from "../lib/format";
import { cleanSizes, sumSizes, type SizeMatrix } from "../lib/sizes";
import { isGarment, hasSizeOnly } from "../lib/garments";
import type {
  DeliveryMethod,
  DesignSubmissionPayload,
  DesignSubmissionPlacement,
  EnquiryNamesetEntry,
  EnquiryPriority,
} from "../types/landing";

/*
 * The ERP sends one coarse icon name per category ("Trophy" for every jersey), which made the
 * picker a wall of identical tiles. ProductGlyph draws the product's own silhouette from its name
 * instead, so the icon list is no longer needed here.
 */

const FIELD =
  "w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 [color-scheme:light]";
const LABEL = "block text-xs font-body font-medium uppercase tracking-[0.08em] text-forest-900/60 mb-2";

const PRIORITY_LABELS: Record<EnquiryPriority, string> = {
  LOW: "Low — no fixed date",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: "Self pickup at our showroom",
  delivery: "Delivery by ASK Creative",
  courier: "Courier",
};

/** front → Front, left_sleeve → Left Sleeve, back_only → Back Only. */
const pretty = (value: string): string =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const emptyNameset = (): EnquiryNamesetEntry => ({ name: "", number: "", size: "", remark: "" });

/**
 * Doc 07 — the Online Design Tool, four steps:
 *   1 Choose your product · 2 Design (customize + artwork, one screen) · 3 Submit for quotation
 *
 * Customizing and uploading used to be two screens. They are one now (user, 31-Oct-2026:
 * "step customize dan upload design harusnya jadi satu"), because they are one decision: you
 * cannot judge a colour without seeing the print on it, and you cannot place a print without
 * seeing the garment. The preview sits beside both and follows every field.
 *
 * Every option offered here comes from the ERP's own admin-editable lists, because the ERP
 * validates each submitted value against them (06 §9 "Admin should be able to enable/disable
 * product options without asking developer to change code"). The finished configuration is one
 * POST /design-submissions (06 B5) with the artwork files that were uploaded in step 3.
 */
export default function OnlineDesign() {
  const { studio, options, isPending, error } = useDesignToolConfig();

  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Step 2 — customise
  const [collar, setCollar] = useState("");
  const [fabric, setFabric] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [color, setColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [concept, setConcept] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [sizes, setSizes] = useState<SizeMatrix>({});

  // Step 2 — names and numbers
  const [namesetRequired, setNamesetRequired] = useState(false);
  const [namesetPosition, setNamesetPosition] = useState("");
  const [numberStyle, setNumberStyle] = useState("");
  const [namesetRemark, setNamesetRemark] = useState("");
  const [namesetEntries, setNamesetEntries] = useState<EnquiryNamesetEntry[]>([emptyNameset()]);

  // Step 3 — artwork + placements
  const [artwork, setArtwork] = useState<UploadedFileWithRole[]>([]);
  /**
   * The uploaded file the 3D preview can put on the product. Only a raster or SVG image can be a
   * texture — a PDF, AI or EPS is the real print file and the designer opens it, so those upload
   * fine and simply are not drawn on the model.
   */
  const artworkPreviewUrl = useMemo(() => {
    const img = artwork.find((f) => /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(f.mime ?? ""));
    return sameOriginMedia(img?.url);
  }, [artwork]);
  const [placements, setPlacements] = useState<DesignSubmissionPlacement[]>([]);

  // Step 4 — contact, deadline, delivery
  const [contact, setContact] = useState({ name: "", email: "", phone: "", company: "" });
  const [eventDate, setEventDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState<EnquiryPriority>("NORMAL");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | "">("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [enquiryNo, setEnquiryNo] = useState("");
  const [result, setResult] = useState<EnquiryWhatsAppResponse | null>(null);

  // The time-captcha the ERP checks (a submit under 3 s after the form opened is refused).
  // Stamped on mount, not during render, so the value is stable for the whole visit.
  const formOpenedAt = useRef(0);
  useEffect(() => {
    formOpenedAt.current = Math.floor(Date.now() / 1000);
  }, []);
  const designSubmission = useDesignSubmission();
  const quoteRequest = useQuoteRequest();
  const pending = designSubmission.isPending || quoteRequest.isPending;
  const track = useFormTracking("online_design");

  // Funnel start = first real engagement (a product is chosen).
  useEffect(() => {
    if (selectedProduct) track.start();
  }, [selectedProduct, track]);

  // The first option of each ERP list is the default until the visitor picks another one. Derived
  // at render — never written back into state from an effect, so one render always shows one
  // consistent configuration.
  const category = activeCategory || options?.categories[0] || "";
  const collarValue = collar || options?.collars[0] || "";
  const fabricValue = fabric || options?.fabrics[0] || "";
  const sleeveValue = sleeve || options?.sleeves[0] || "";
  const colorValue = color || options?.colors[0] || "#1d4ed8";
  const namesetPositionValue = namesetPosition || options?.nameset_positions[0] || "";

  const products = useMemo(
    () => (studio?.products ?? []).filter((p) => p.category === category),
    [studio, category],
  );

  /** Products the ERP knows (it refuses a product name that is not on its own list). */
  const allowedProducts = useMemo(
    () => new Set((options?.products ?? []).map((p) => p.name.toLowerCase())),
    [options],
  );

  const sizeList = useMemo(() => options?.sizes ?? [], [options]);
  const wearable = isGarment(selectedProduct) || hasSizeOnly(selectedProduct);

  /**
   * Non-apparel products (mug, lanyard, banner…) have no size breakdown, but the ERP always
   * stores the quantity in the size matrix, against a key from its own size list. So one size
   * carries the whole quantity: a "one size" entry when the admin configured one, else the
   * first size on the list.
   */
  const oneSizeKey = useMemo(
    () => sizeList.find((s) => /^(one ?size|free ?size|n\/?a|std|standard)$/i.test(s)) ?? sizeList[0] ?? "",
    [sizeList],
  );

  const total = useMemo(() => sumSizes(sizes), [sizes]);

  /**
   * 06 §5 p.3 "view estimated price": the design-tool product the customer picked, which carries the
   * catalogue row the ERP prices from (null when the admin has not linked one — then no estimate is
   * shown rather than a guess).
   */
  const selectedOption = useMemo(
    () => (options?.products ?? []).find((p) => p.name === selectedProduct) ?? null,
    [options, selectedProduct],
  );
  const minQty = options?.min_quantity ?? 1;
  const maxQty = options?.max_quantity ?? 100000;
  const namedCount = namesetEntries.filter((r) => (r.name ?? "").trim() !== "").length;

  const setSizeQty = (size: string, value: string) => {
    const n = Math.trunc(Number(value));
    setSizes((prev) => {
      const next = { ...prev };
      if (!value || !Number.isFinite(n) || n <= 0) delete next[size];
      else next[size] = n;
      return next;
    });
  };

  const togglePlacement = (position: string) =>
    setPlacements((rows) =>
      rows.some((r) => r.position === position)
        ? rows.filter((r) => r.position !== position)
        : [...rows, { position, note: "" }],
    );

  const setPlacementField = (position: string, field: "note" | "artwork_index", value: string) =>
    setPlacements((rows) =>
      rows.map((r) =>
        r.position !== position
          ? r
          : field === "note"
            ? { ...r, note: value }
            : { ...r, artwork_index: value === "" ? undefined : Number(value) },
      ),
    );

  const setNamesetField = (index: number, field: keyof EnquiryNamesetEntry, value: string) =>
    setNamesetEntries((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  /** Step 2 is complete when the configuration can actually be quoted. */
  const customizeReady = total >= minQty && total <= maxQty && colorValue.trim() !== "";

  const buildPayload = (): DesignSubmissionPayload | null => {
    if (!selectedProduct) {
      toast.error("Please choose a product first.");
      return null;
    }
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      toast.error("Name, email and phone are required.");
      return null;
    }
    const matrix = cleanSizes(sizes);
    if (Object.keys(matrix).length === 0) {
      toast.error("Please enter the quantity you need.");
      return null;
    }
    if (total < minQty) {
      toast.error(`The minimum order quantity is ${minQty} pieces.`);
      return null;
    }
    if (total > maxQty) {
      toast.error(`For more than ${maxQty} pieces please contact our sales team.`);
      return null;
    }
    if (namedCount > total) {
      toast.error("There are more names than pieces ordered.");
      return null;
    }

    const entries = namesetEntries
      .filter((row) => (row.name ?? "").trim() !== "")
      .map((row) => ({
        name: (row.name ?? "").trim(),
        number: (row.number ?? "").trim() || undefined,
        size: (row.size ?? "").trim() || undefined,
        remark: (row.remark ?? "").trim() || undefined,
      }));

    return {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      company_name: contact.company.trim() || undefined,

      category,
      product: selectedProduct,

      design: {
        design_concept: concept.trim() || undefined,
        main_color: colorValue,
        secondary_color: secondaryColor.trim() || undefined,
        collar: wearable && collarValue ? collarValue : undefined,
        fabric: fabricValue || undefined,
        sleeve: wearable && sleeveValue ? sleeveValue : undefined,
        design_notes: designNotes.trim() || undefined,
      },
      sizes: matrix,

      placements: placements.length > 0
        ? placements.map((p) => ({
            position: p.position,
            artwork_index: p.artwork_index,
            note: (p.note ?? "").trim() || undefined,
          }))
        : undefined,

      nameset: namesetRequired || entries.length > 0
        ? {
            required: true,
            position: namesetPositionValue || undefined,
            number_style: numberStyle.trim() || undefined,
            remark: namesetRemark.trim() || undefined,
            entries: entries.length > 0 ? entries : undefined,
          }
        : undefined,

      artwork: artwork.length > 0
        ? artwork.map((f) => ({ path: f.path, original_name: f.original_name }))
        : undefined,

      event_date: eventDate || undefined,
      delivery_date: deliveryDate || undefined,
      priority,
      delivery_method: deliveryMethod || undefined,
      delivery_address: deliveryAddress.trim() || undefined,
      notes: notes.trim() || undefined,

      website: "",
      _t: formOpenedAt.current,
    };
  };

  const onError = (err: unknown) => {
    const status = (err as { status?: number })?.status;
    const message = (err as { message?: string })?.message;
    if (status === 429) toast.error("Too many requests. Please try again in a moment.");
    else if (status === 422) toast.error(message ?? "Please check your details and try again.");
    else toast.error("Something went wrong on our side. Please try again.");
  };

  const onDone = (no?: string, res?: EnquiryWhatsAppResponse | null) => {
    track.markSubmitted();
    setEnquiryNo(no ?? "");
    setResult(res ?? null);
    setSubmitted(true);
    toast.success(no ? `Design submitted — reference ${no}` : "Design submitted! Our sales team will follow up.");
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;

    // The finished configuration goes to POST /design-submissions once the ERP serves Stage 4
    // (VITE_ENQUIRY_V2=1); until then the same data is carried by the legacy quote request.
    if (ENQUIRY_V2) {
      designSubmission.mutate(payload, { onSuccess: (res) => onDone(res?.enquiry_no, res), onError });
    } else {
      quoteRequest.mutate(designToQuoteRequest(payload), {
        onSuccess: (res) => onDone((res as { enquiry_no?: string })?.enquiry_no, res as EnquiryWhatsAppResponse),
        onError,
      });
    }
  };

  // ── Loading / error states ───────────────────────────────────────────
  if (isPending) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#d7ff00] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-forest-900/60 font-body">Loading design studio...</p>
        </div>
      </section>
    );
  }
  if (error || !studio || !options) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-forest-900 font-body mb-2">Design studio unavailable.</p>
          <p className="text-forest-900/60 text-sm">Please refresh the page or contact us via WhatsApp.</p>
        </div>
      </section>
    );
  }
  if (!options.enabled) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-forest-900 font-body">Design studio is currently offline.</p>
        </div>
      </section>
    );
  }

  const heroEyebrow = studio.hero.eyebrow ?? "Design Tool";
  const heroHeading = studio.hero.heading ?? "Design Your Custom Product Online";
  const heroSubheading = studio.hero.subheading
    ?? "Choose a product, upload your artwork, customize the design, and submit for quotation.";
  const waNumber = studio.whatsapp_number ?? "60102174774";
  const today = isoDate(new Date());

  return (
    <>
      <SEOHead
        title="Online Design Tool | Design Custom Jerseys & Products with ASK Creative"
        description="Design your custom jersey, apparel, banner, mug, lanyard or corporate gift online. Upload artwork, add names and numbers, choose quantity and submit for quotation."
        keywords="online design tool, custom jersey design, design your own jersey, online printing tool"
        canonical="/online-design"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">{heroEyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">{heroHeading}</h1>
          <p className="text-white/50 text-lg font-body max-w-[640px] mx-auto">{heroSubheading}</p>
        </div>
      </section>

      {/* Step Wizard */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-10 md:mb-14">
            {["Choose Product", "Design", "Submit"].map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-medium ${step > i + 1 ? "bg-teal-500 text-white" : step === i + 1 ? "bg-[#d7ff00] text-[#0d1f16]" : "bg-forest-900/10 text-forest-900/40"}`}>
                    {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-body mt-2 hidden md:block text-forest-900/60">{label}</span>
                </div>
                {i < 3 && <div className={`h-0.5 flex-1 mx-2 md:mx-4 ${step > i + 1 ? "bg-teal-500" : "bg-forest-900/10"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose Product */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,380px)] gap-8 lg:gap-10">
              <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Choose Your Product</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {options.categories.map((cat) => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setSelectedProduct(null); }}
                    className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${category === cat ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70 hover:bg-forest-900/10"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map((product) => {
                  const known = allowedProducts.size === 0 || allowedProducts.has(product.name.toLowerCase());
                  return (
                    <button key={product.id} onClick={() => setSelectedProduct(product.name)} disabled={!known}
                      title={known ? undefined : "This product is not available for online design right now."}
                      className={`flex flex-col items-center gap-3 p-5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedProduct === product.name ? "border-[#d7ff00] bg-[#d7ff00]/5" : "border-forest-900/10 hover:border-forest-900/30"}`}>
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-10 h-10 object-contain" />
                        : <ProductGlyph product={product.name} className="w-10 h-10 text-forest-900/70" />}
                      <span className="text-sm font-body text-forest-900 text-center leading-snug">{product.name}</span>
                    </button>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-forest-900/50 text-sm font-body col-span-full">
                    No products in this category yet — please choose another one.
                  </p>
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => selectedProduct && setStep(2)} disabled={!selectedProduct}
                  className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  Start designing <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              </div>

              {/* The model, right here on the first screen — picking a product should show you the
                  product, not a name in a box (user, 31-Oct: "pada saat pilih product category dan
                  product type juga tampil model"). */}
              <div className="lg:sticky lg:top-28 h-fit">
                {selectedProduct ? (
                  <StudioPreview
                    product={selectedProduct} collar={collarValue} color={colorValue}
                    secondaryColor={secondaryColor} sleeve={sleeveValue} fabric={fabricValue}
                    size={Object.keys(cleanSizes(sizes))[0] ?? sizeList[0] ?? "M"}
                    caption={selectedProduct}
                    sub={wearable && isGarment(selectedProduct) && !hasOwnNeck(selectedProduct) ? collarValue : category}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-forest-900/15 bg-off-white h-[340px] md:h-[400px] flex flex-col items-center justify-center gap-3 px-8 text-center">
                    <Shirt className="w-10 h-10 text-forest-900/20" />
                    <p className="text-sm font-body text-forest-900/50">
                      Pick a product and it appears here — front and back, in your colours, with your artwork on it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Design — customizing and the artwork, on one screen. */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl text-forest-900 uppercase">Design Your Product</h2>
                <p className="text-sm font-body text-forest-900/55 mt-1">
                  Everything on the right changes the model on the left. Upload your artwork and you will see it on the product.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,460px)_1fr] gap-8 lg:gap-10">
                {/* The model stays in view while the form is filled in. */}
                <div className="lg:sticky lg:top-28 h-fit space-y-3">
                  <StudioPreview
                    product={selectedProduct ?? "T-Shirt"}
                    collar={collarValue}
                    color={colorValue}
                    secondaryColor={secondaryColor}
                    sleeve={sleeveValue}
                    fabric={fabricValue}
                    size={Object.keys(cleanSizes(sizes))[0] ?? sizeList[0] ?? "M"}
                    artworkUrl={artworkPreviewUrl}
                    autoRotate={!artworkPreviewUrl}
                    caption={selectedProduct ?? undefined}
                    sub={[
                      wearable && isGarment(selectedProduct) && !hasOwnNeck(selectedProduct ?? "") ? collarValue : null,
                      total > 0 ? `${total} pcs` : null,
                    ].filter(Boolean).join(" · ") || category}
                    height="h-[360px] md:h-[460px]"
                  />
                  {artworkPreviewUrl ? (
                    <p className="text-xs font-body text-forest-900/55 px-1">
                      This is a guide, not the final artwork — our designer sets the exact size and position before printing.
                    </p>
                  ) : (
                    <p className="text-xs font-body text-forest-900/55 px-1">
                      Upload your artwork below and it appears on the product here.
                    </p>
                  )}

                  {/* What the choices add up to, kept next to the picture they describe. */}
                  <div className="rounded-lg border border-forest-900/10 divide-y divide-forest-900/10">
                    <dl className="px-4 py-3 space-y-1.5 text-sm font-body">
                      <div className="flex justify-between gap-3">
                        <dt className="text-forest-900/55">Pieces</dt>
                        <dd className="text-forest-900 font-medium">{total || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-forest-900/55">Main colour</dt>
                        <dd className="flex items-center gap-2 text-forest-900">
                          <span className="w-4 h-4 rounded-full border border-forest-900/15" style={{ backgroundColor: colorValue }} />
                          {colorValue}
                        </dd>
                      </div>
                      {secondaryColor && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-forest-900/55">Secondary</dt>
                          <dd className="flex items-center gap-2 text-forest-900">
                            <span className="w-4 h-4 rounded-full border border-forest-900/15" style={{ backgroundColor: secondaryColor }} />
                            {secondaryColor}
                          </dd>
                        </div>
                      )}
                      {wearable && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-forest-900/55">Cut</dt>
                          <dd className="text-forest-900 text-right">
                            {[isGarment(selectedProduct) ? collarValue : null, sleeveValue, fabricValue].filter(Boolean).join(" · ") || "—"}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt className="text-forest-900/55">Artwork</dt>
                        <dd className="text-forest-900">{artwork.length ? `${artwork.length} file${artwork.length > 1 ? "s" : ""}` : "none yet"}</dd>
                      </div>
                    </dl>
                    {total > 0 && (
                      <div className="px-4 py-3">
                        <PriceEstimateBox studioProductId={selectedOption?.id} totalQty={total} compact />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <ColorPicker
                    label="Main colour" labelClassName={LABEL}
                    value={colorValue} onChange={setColor} swatches={options.colors}
                    hint="Tap a stock colour, or pick your own club colour with the wheel."
                  />
                  <ColorPicker
                    label="Secondary colour (optional)" labelClassName={LABEL}
                    value={secondaryColor} onChange={setSecondaryColor} swatches={options.colors}
                    clearable
                    hint="Used for the collar, cuffs and hem — you can see it change on the model."
                  />

                  {/* Collar + sleeve apply to garments only. */}
                  {wearable && options.collars.length > 0 && (
                    <div>
                      <label className={LABEL}>Collar type</label>
                      <div className="flex flex-wrap gap-2">
                        {options.collars.map((c) => (
                          <button key={c} type="button" onClick={() => setCollar(c)}
                            className={`px-3 py-1.5 rounded-md text-sm font-body transition-colors ${collarValue === c ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {wearable && options.sleeves.length > 0 && (
                    <div>
                      <label className={LABEL} htmlFor="d-sleeve">Sleeve type</label>
                      <select id="d-sleeve" className={FIELD} value={sleeveValue} onChange={(e) => setSleeve(e.target.value)}>
                        {options.sleeves.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  {options.fabrics.length > 0 && (
                    <div>
                      <label className={LABEL} htmlFor="d-fabric">Fabric / material</label>
                      <select id="d-fabric" className={FIELD} value={fabricValue} onChange={(e) => setFabric(e.target.value)}>
                        {options.fabrics.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Quantity — the size matrix for apparel, one quantity for everything else. */}
                  {wearable && sizeList.length > 1 ? (
                    <div>
                      <label className={LABEL}>Size breakdown</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {sizeList.map((s) => (
                          <label key={s} className="text-center">
                            <span className="block text-xs font-body text-forest-900/60 mb-1">{s}</span>
                            <input type="number" min={0} step={1} inputMode="numeric"
                              aria-label={`Quantity for size ${s}`}
                              value={sizes[s] ?? ""}
                              onChange={(e) => setSizeQty(s, e.target.value)}
                              className="w-full px-2 py-2 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body text-center focus:outline-none focus:border-teal-500 [color-scheme:light]" />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className={LABEL} htmlFor="d-qty">Quantity</label>
                      <input id="d-qty" type="number" min={1} step={1} inputMode="numeric" className={FIELD}
                        value={oneSizeKey ? sizes[oneSizeKey] ?? "" : ""}
                        onChange={(e) => setSizeQty(oneSizeKey, e.target.value)}
                        placeholder={`e.g. ${minQty}`} />
                    </div>
                  )}

                  <div className="rounded-md bg-off-white px-4 py-3" id="d-total">
                    <p className="text-sm font-body text-forest-900">
                      Total: <span className="font-medium text-teal-600">{total}</span> pieces
                    </p>
                    <p className="text-xs font-body text-forest-900/50 mt-1">
                      Minimum {minQty}, maximum {maxQty} pieces online. Final price is confirmed by our sales team in RM.
                    </p>
                    {total > 0 && total < minQty && (
                      <p className="text-xs font-body text-red-600 mt-1">At least {minQty} pieces are needed.</p>
                    )}
                    {total > maxQty && (
                      <p className="text-xs font-body text-red-600 mt-1">
                        For more than {maxQty} pieces, please contact our sales team directly.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="d-concept">Design concept / theme</label>
                    <input id="d-concept" className={FIELD} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="e.g. Company futsal team 2027" />
                  </div>

                  {/* Names and numbers */}
                  <div>
                    <label className="flex items-center gap-2 mb-3">
                      <input type="checkbox" checked={namesetRequired} onChange={(e) => setNamesetRequired(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                      <span className="text-sm font-body text-forest-900">I need names and numbers printed</span>
                    </label>
                    {namesetRequired && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL} htmlFor="d-nameset-pos">Position</label>
                            <select id="d-nameset-pos" className={FIELD} value={namesetPositionValue} onChange={(e) => setNamesetPosition(e.target.value)}>
                              {options.nameset_positions.map((p) => <option key={p} value={p}>{pretty(p)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={LABEL} htmlFor="d-number-style">Number style</label>
                            <input id="d-number-style" className={FIELD} value={numberStyle} onChange={(e) => setNumberStyle(e.target.value)} placeholder="e.g. Block, 25 cm" />
                          </div>
                        </div>
                        <div>
                          <label className={LABEL} htmlFor="d-nameset-remark">Remarks about the list</label>
                          <input id="d-nameset-remark" className={FIELD} value={namesetRemark} onChange={(e) => setNamesetRemark(e.target.value)} placeholder="e.g. Names in capital letters" />
                        </div>
                        <div className="space-y-2">
                          {namesetEntries.map((row, i) => (
                            <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.4fr_0.6fr_0.8fr_auto] gap-2">
                              <input className={FIELD} value={row.name ?? ""} onChange={(e) => setNamesetField(i, "name", e.target.value)} placeholder="Name" aria-label={`Name, row ${i + 1}`} />
                              <input className={FIELD} value={row.number ?? ""} onChange={(e) => setNamesetField(i, "number", e.target.value)} placeholder="No." aria-label={`Number, row ${i + 1}`} />
                              <select className={FIELD} value={row.size ?? ""} onChange={(e) => setNamesetField(i, "size", e.target.value)} aria-label={`Size, row ${i + 1}`}>
                                <option value="">Size</option>
                                {sizeList.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button type="button" aria-label={`Remove row ${i + 1}`}
                                onClick={() => setNamesetEntries((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows))}
                                className="text-forest-900/40 hover:text-red-600 transition-colors px-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => setNamesetEntries((rows) => (rows.length < 100 ? [...rows, emptyNameset()] : rows))}
                            className="inline-flex items-center gap-1.5 text-sm font-body text-teal-600 hover:text-teal-700">
                            <Plus className="w-4 h-4" /> Add another name
                          </button>
                          <p className="text-xs font-body text-forest-900/50">
                            {namedCount} of {total || 0} pieces named.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Artwork — on the same screen as the colours, because one is judged against
                      the other (user, 31-Oct: "step customize dan upload design harusnya jadi satu"). */}
                  <div className="pt-2 border-t border-forest-900/10">
                    <h3 className="text-sm font-body font-medium text-forest-900 mb-1 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Your artwork
                    </h3>
                    <p className="text-xs font-body text-forest-900/55 mb-3">
                      PNG, JPG or SVG appears on the model straight away. PDF, AI and EPS are the print files —
                      upload them too and our designer works from those.
                    </p>
                    <FileUploadBox
                      files={artwork}
                      onChange={setArtwork}
                      showRoles={false}
                      onInteract={track.start}
                      hint="Drop your artwork here or click to browse"
                    />

                    <div className="mt-5">
                      <h4 className="text-sm font-body font-medium text-forest-900 mb-2">Where should it be printed?</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {options.placements.map((position) => {
                          const on = placements.some((p) => p.position === position);
                          return (
                            <button key={position} type="button" onClick={() => togglePlacement(position)}
                              aria-pressed={on}
                              className={`px-3 py-1.5 rounded-md text-sm font-body transition-colors ${on ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70 hover:bg-forest-900/10"}`}>
                              {pretty(position)}
                            </button>
                          );
                        })}
                      </div>
                      {placements.length > 0 && (
                        <div className="space-y-2">
                          {placements.map((p) => (
                            <div key={p.position} className="grid grid-cols-1 sm:grid-cols-[0.7fr_1fr_1.3fr] gap-2 items-center">
                              <span className="text-sm font-body text-forest-900">{pretty(p.position)}</span>
                              <select className={FIELD} aria-label={`Artwork file for ${pretty(p.position)}`}
                                value={p.artwork_index ?? ""}
                                onChange={(e) => setPlacementField(p.position, "artwork_index", e.target.value)}>
                                <option value="">Any uploaded file</option>
                                {artwork.map((f, i) => (
                                  <option key={f.path} value={i}>{f.original_name}</option>
                                ))}
                              </select>
                              <input className={FIELD} aria-label={`Note for ${pretty(p.position)}`}
                                value={p.note ?? ""} onChange={(e) => setPlacementField(p.position, "note", e.target.value)}
                                placeholder="Size / position note (optional)" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="d-notes">Notes for the designer</label>
                    <textarea id="d-notes" rows={3} className={`${FIELD} resize-none`} value={designNotes} onChange={(e) => setDesignNotes(e.target.value)} placeholder="Sponsor logos, fonts, reference links…" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(3)} disabled={!customizeReady}
                  className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review and submit */}
          {step === 3 && (
            <div>
              {!submitted ? (
                <>
                  <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Review &amp; Submit</h2>
                  <div className="bg-off-white rounded-lg p-6 mb-6">
                    <h3 className="text-forest-900 text-base font-body font-medium mb-4">Your configuration</h3>
                    <div className="space-y-2 text-sm font-body">
                      <div className="flex justify-between gap-4"><span className="text-forest-900/60">Product</span><span className="text-forest-900 font-medium text-right">{category} / {selectedProduct}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-forest-900/60">Main colour</span><span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border border-forest-900/10" style={{ backgroundColor: colorValue }} /><span className="text-forest-900">{colorValue}</span></span></div>
                      {secondaryColor && <div className="flex justify-between gap-4"><span className="text-forest-900/60">Secondary colour</span><span className="text-forest-900">{secondaryColor}</span></div>}
                      {wearable && collarValue && <div className="flex justify-between gap-4"><span className="text-forest-900/60">Collar</span><span className="text-forest-900">{collarValue}</span></div>}
                      {wearable && sleeveValue && <div className="flex justify-between gap-4"><span className="text-forest-900/60">Sleeve</span><span className="text-forest-900">{sleeveValue}</span></div>}
                      {fabricValue && <div className="flex justify-between gap-4"><span className="text-forest-900/60">Fabric</span><span className="text-forest-900">{fabricValue}</span></div>}
                      <div className="flex justify-between gap-4">
                        <span className="text-forest-900/60">Sizes</span>
                        <span className="text-forest-900 text-right">
                          {Object.entries(cleanSizes(sizes)).map(([s, q]) => `${s} × ${q}`).join(", ") || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4"><span className="text-forest-900/60">Total</span><span className="text-forest-900">{total} pieces</span></div>
                      {placements.length > 0 && (
                        <div className="flex justify-between gap-4"><span className="text-forest-900/60">Artwork placement</span><span className="text-forest-900 text-right">{placements.map((p) => pretty(p.position)).join(", ")}</span></div>
                      )}
                      {(namesetRequired || namedCount > 0) && (
                        <div className="flex justify-between gap-4"><span className="text-forest-900/60">Names &amp; numbers</span><span className="text-forest-900">{namedCount} entries</span></div>
                      )}
                      <div className="flex justify-between gap-4"><span className="text-forest-900/60">Artwork files</span><span className="text-forest-900">{artwork.length}</span></div>
                    </div>
                  </div>

                  {/* 06 §5 p.3 — the estimate again on the review step, before "SUBMIT FOR QUOTATION". */}
                  <PriceEstimateBox studioProductId={selectedOption?.id} totalQty={total} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL} htmlFor="d-name">Your name *</label>
                      <input id="d-name" className={FIELD} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required placeholder="e.g. Ahmad bin Ali" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-company">Company / organisation</label>
                      <input id="d-company" className={FIELD} value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-email">Email *</label>
                      <input id="d-email" type="email" className={FIELD} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-phone">Phone / WhatsApp *</label>
                      <input id="d-phone" type="tel" className={FIELD} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required placeholder="e.g. 010 217 4774" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-event">Event date</label>
                      <input id="d-event" type="date" min={today} className={FIELD} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-delivery-date">Needed by (delivery date)</label>
                      <input id="d-delivery-date" type="date" min={today} className={FIELD} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-priority">Priority</label>
                      <select id="d-priority" className={FIELD} value={priority} onChange={(e) => setPriority(e.target.value as EnquiryPriority)}>
                        {options.priorities.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p] ?? p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="d-delivery">Collection or delivery</label>
                      <select id="d-delivery" className={FIELD} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod | "")}>
                        <option value="">Decide later</option>
                        {options.delivery_methods.map((m) => <option key={m} value={m}>{DELIVERY_LABELS[m] ?? m}</option>)}
                      </select>
                    </div>
                    {deliveryMethod !== "" && deliveryMethod !== "pickup" && (
                      <div className="sm:col-span-2">
                        <label className={LABEL} htmlFor="d-address">Delivery address</label>
                        <textarea id="d-address" rows={2} className={`${FIELD} resize-none`} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, city, postcode, state" />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="d-remarks">Anything else we should know?</label>
                      <textarea id="d-remarks" rows={3} className={`${FIELD} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes or requirements…" />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep(2)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                    <button onClick={handleSubmit} disabled={pending} className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                      {pending ? "Submitting…" : "Submit for Quotation"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8 text-white" /></div>
                  <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">Thank You!</h3>
                  {enquiryNo && (
                    <p className="text-forest-900 text-base font-body mb-3">
                      Your enquiry number is <span className="font-medium">{enquiryNo}</span> — please quote it when you contact us.
                    </p>
                  )}
                  <EnquiryWhatsAppCta
                    response={result}
                    input={{
                      enquiryNo,
                      customerName: contact.name,
                      company: contact.company,
                      product: [category, selectedProduct].filter(Boolean).join(" / "),
                      totalQty: total,
                      eventDate,
                      neededBy: deliveryDate,
                    }}
                  />
                  <p className="text-forest-900/70 text-base font-body max-w-[480px] mx-auto mb-8">Our sales team will contact you within 24 hours with your quotation in RM. For urgent enquiries, please WhatsApp us directly.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#128C7E] transition-colors">WhatsApp Our Team</a>
                    <Link to="/" className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors">Back to Home</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

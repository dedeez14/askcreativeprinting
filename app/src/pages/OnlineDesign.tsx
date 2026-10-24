import { useState, useRef, useMemo, useEffect, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import {
  Shirt, Trophy, HardHat, StickyNote, Wine, Award, FileText,
  Gift, Tag, Sticker, Briefcase, Crown, Star, Heart,
  Package, ShoppingBag, Image as ImageIcon,
  Check, ChevronRight, ChevronLeft, Palette, Type, Ruler,
  Loader2, Move3D, Plus, Trash2,
  type LucideIcon,
} from "lucide-react";

// WebGL preview is heavy (three.js) — only pulled in when the user reaches Step 2.
const Product3DPreview = lazy(() => import("../components/Product3DPreview"));
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import FileUploadBox from "../components/FileUploadBox";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
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

const ICONS: Record<string, LucideIcon> = {
  Shirt, Trophy, HardHat, StickyNote, Wine, Award, FileText,
  Gift, Tag, Sticker, Briefcase, Crown, Star, Heart,
  Package, ShoppingBag, Image: ImageIcon,
};
const iconFor = (name: string): LucideIcon => ICONS[name] ?? Shirt;

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
 *   1 Choose your product · 2 Customize · 3 Upload your artwork · 4 Submit for quotation
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

  const onDone = (no?: string) => {
    track.markSubmitted();
    setEnquiryNo(no ?? "");
    setSubmitted(true);
    toast.success(no ? `Design submitted — reference ${no}` : "Design submitted! Our sales team will follow up.");
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;

    // The finished configuration goes to POST /design-submissions once the ERP serves Stage 4
    // (VITE_ENQUIRY_V2=1); until then the same data is carried by the legacy quote request.
    if (ENQUIRY_V2) {
      designSubmission.mutate(payload, { onSuccess: (res) => onDone(res?.enquiry_no), onError });
    } else {
      quoteRequest.mutate(designToQuoteRequest(payload), {
        onSuccess: (res) => onDone((res as { enquiry_no?: string })?.enquiry_no),
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
            {["Choose Product", "Customize", "Upload Design", "Submit"].map((label, i) => (
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
                  const Icon = iconFor(product.icon);
                  const known = allowedProducts.size === 0 || allowedProducts.has(product.name.toLowerCase());
                  return (
                    <button key={product.id} onClick={() => setSelectedProduct(product.name)} disabled={!known}
                      title={known ? undefined : "This product is not available for online design right now."}
                      className={`flex flex-col items-center gap-3 p-5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedProduct === product.name ? "border-[#d7ff00] bg-[#d7ff00]/5" : "border-forest-900/10 hover:border-forest-900/30"}`}>
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-8 h-8 object-contain" />
                        : <Icon className="w-8 h-8 text-forest-900/70" />}
                      <span className="text-sm font-body text-forest-900">{product.name}</span>
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
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Customize Your Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Live 3D preview — reflects the chosen product, collar, colour and size. */}
                <div className="bg-off-white rounded-lg overflow-hidden relative h-fit">
                  <div className="h-[340px] md:h-[420px] w-full">
                    <Suspense
                      fallback={
                        <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-forest-900/50">
                          <Loader2 className="w-7 h-7 animate-spin" />
                          <p className="text-xs font-body">Loading 3D preview…</p>
                        </div>
                      }
                    >
                      <Product3DPreview
                        product={selectedProduct ?? "T-Shirt"}
                        collar={collarValue}
                        color={colorValue}
                        size={Object.keys(cleanSizes(sizes))[0] ?? sizeList[0] ?? "M"}
                      />
                    </Suspense>
                  </div>
                  <div className="absolute top-3 left-3 bg-white/85 backdrop-blur px-3 py-1.5 rounded-md pointer-events-none">
                    <p className="text-xs font-body font-medium text-forest-900">{selectedProduct}</p>
                    {wearable && (
                      <p className="text-[11px] font-body text-forest-900/60">
                        {isGarment(selectedProduct) ? `${collarValue} · ` : ""}{total > 0 ? `${total} pcs` : "No quantity yet"}
                      </p>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/85 backdrop-blur px-2.5 py-1 rounded-md pointer-events-none">
                    <Move3D className="w-3.5 h-3.5 text-forest-900/60" />
                    <span className="text-[11px] font-body text-forest-900/60">Drag to rotate · scroll to zoom</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Colour */}
                  <div>
                    <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Palette className="w-4 h-4" /> Main colour</label>
                    {options.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {options.colors.map((c) => (
                          <button key={c} onClick={() => setColor(c)} type="button"
                            aria-label={`Main colour ${c}`}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${colorValue === c ? "border-forest-900 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    ) : (
                      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(colorValue) ? colorValue : "#1d4ed8"}
                        onChange={(e) => setColor(e.target.value)} aria-label="Main colour"
                        className="h-10 w-20 rounded-md border border-forest-900/15 bg-white" />
                    )}
                  </div>

                  {/* Secondary colour */}
                  <div>
                    <label className={LABEL} htmlFor="d-second">Secondary colour (optional)</label>
                    {options.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setSecondaryColor("")}
                          className={`px-3 py-1.5 rounded-md text-xs font-body ${secondaryColor === "" ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70"}`}>
                          None
                        </button>
                        {options.colors.map((c) => (
                          <button key={c} type="button" onClick={() => setSecondaryColor(c)}
                            aria-label={`Secondary colour ${c}`}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${secondaryColor === c ? "border-forest-900 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    ) : (
                      <input id="d-second" type="color" value={/^#[0-9a-fA-F]{6}$/.test(secondaryColor) ? secondaryColor : "#ffffff"}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-20 rounded-md border border-forest-900/15 bg-white" />
                    )}
                  </div>

                  {/* Collar + sleeve apply to garments only. */}
                  {wearable && options.collars.length > 0 && (
                    <div>
                      <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Type className="w-4 h-4" /> Collar type</label>
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
                      <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Ruler className="w-4 h-4" /> Size breakdown</label>
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

                  <div className="rounded-md bg-off-white px-4 py-3">
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

          {/* Step 3: Upload Design */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Upload Your Design</h2>
              <FileUploadBox
                files={artwork}
                onChange={setArtwork}
                showRoles={false}
                onInteract={track.start}
                hint="Drop your artwork here or click to browse"
              />

              <div className="mt-8">
                <h3 className="text-forest-900 text-base font-body font-medium mb-3">Where should the artwork go?</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {options.placements.map((position) => {
                    const on = placements.some((p) => p.position === position);
                    return (
                      <button key={position} type="button" onClick={() => togglePlacement(position)}
                        className={`px-3 py-1.5 rounded-md text-sm font-body transition-colors ${on ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70"}`}>
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

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(2)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(4)} className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Step 4: Submit */}
          {step === 4 && (
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
                    <button onClick={() => setStep(3)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
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

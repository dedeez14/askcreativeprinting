import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Check, MessageCircle, Plus, Trash2 } from "lucide-react";
import OrderBar from "../components/OrderBar";
import { sameOriginMedia } from "../lib/media";
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import FileUploadBox from "../components/FileUploadBox";
import StudioPreview from "../components/StudioPreview";
import ColorPicker from "../components/ColorPicker";
import { useDesignToolConfig } from "../hooks/useDesignSubmission";
import { previewProductFor } from "../lib/previewProduct";
import { useEnquiry } from "../hooks/useEnquiry";
import EnquiryWhatsAppCta from "../components/EnquiryWhatsAppCta";
import type { EnquiryWhatsAppResponse } from "../lib/enquiryWhatsApp";
import { enquiryToQuoteRequest } from "../lib/legacyQuote";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import { useFormTracking } from "../hooks/useFormTracking";
import { useSettings } from "../hooks/useSettings";
import { toFileRef, type UploadedFileWithRole } from "../hooks/useFileUpload";
import { ENQUIRY_V2 } from "../lib/features";
import { attributionFields } from "../lib/attribution";
import { captureChatRef } from "../lib/chatRef";
import { ADULT_SIZES, KIDS_SIZES, cleanSizes, sizeLabel, sumSizes, type SizeMatrix } from "../lib/sizes";
import { isoDate } from "../lib/format";
import type {
  DeliveryMethod,
  EnquiryNamesetEntry,
  EnquiryPayload,
  EnquiryPriority,
  ErpJobType,
} from "../types/landing";

/**
 * 06 B4 "Website Quotation Form — Required Fields": customer, product (category, type and the
 * ERP job type), design, quantity + size matrix, nameset, files, deadline and delivery — all of
 * it in one submission, plus the campaign source (B15) and the anti-spam pair the ERP checks
 * (honeypot + minimum fill time).
 */

/* 06 §3 "Add Strong Product Categories" — the three groups and their product types. */
const PRODUCT_GROUPS: Array<{ category: string; types: string[]; jobType: ErpJobType }> = [
  {
    category: "Custom Apparel",
    jobType: "SUBLIMATION",
    types: [
      "Sublimation Jersey", "Football Jersey", "Running Jersey / Singlet", "Basketball Jersey",
      "Baseball Jersey", "Corporate Shirt", "Polo Shirt", "Hoodie", "Varsity Jacket",
      "Windbreaker", "Trackset", "Apron", "Pants / Shorts",
    ],
  },
  {
    category: "Printing Services",
    jobType: "DTF_HEATPRESS",
    types: [
      "T-Shirt Printing", "Silkscreen Printing", "Heat Press", "Embroidery",
      "Large Format Printing", "Banner / Bunting / Backdrop", "Sticker / Digital Print",
    ],
  },
  {
    category: "Corporate & Premium Gifts",
    jobType: "OTHER",
    types: [
      "Mug", "Medal", "Plaque", "Umbrella", "Bag", "Lanyard", "Keychain",
      "Luggage Tag", "Wristband", "ID Card",
    ],
  },
];

/* Fallback for an ERP without GET /settings → job_types (06 B4: the ERP Job Type master is the list). */
const JOB_TYPES: Array<{ value: ErpJobType; label: string }> = [
  { value: "SUBLIMATION", label: "Sublimation" },
  { value: "BANNER", label: "Banner" },
  { value: "DTF_HEATPRESS", label: "DTF / Heat Press" },
  { value: "DESIGN_ONLY", label: "Design Only" },
  { value: "OTHER", label: "Other / not sure" },
];

const PRIORITIES: Array<{ value: EnquiryPriority; label: string }> = [
  { value: "LOW", label: "Low — no fixed date" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const DELIVERY_METHODS: Array<{ value: DeliveryMethod; label: string }> = [
  { value: "pickup", label: "Self pickup at our showroom" },
  { value: "delivery", label: "Delivery by ASK Creative" },
  { value: "courier", label: "Courier" },
];

const NAME_NUMBER_OPTIONS = [
  { value: "", label: "Not required" },
  { value: "NAMES", label: "Names only" },
  { value: "NUMBERS", label: "Numbers only" },
  { value: "NAMES_AND_NUMBERS", label: "Names and numbers" },
];

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

// 16px text below md: iOS Safari zooms the page into any field smaller than that.
const FIELD =
  "w-full min-h-11 px-4 py-2.5 rounded-md border border-forest-900/15 bg-white text-forest-900 text-base md:text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 [color-scheme:light]";
const SIZE_BOX =
  "w-full h-11 px-2 rounded-md border border-forest-900/15 bg-white text-forest-900 text-base md:text-sm font-body text-center focus:outline-none focus:border-teal-500 [color-scheme:light]";
const LABEL = "block text-xs font-body font-medium uppercase tracking-[0.08em] text-forest-900/60 mb-2";
const SECTION = "font-display text-lg text-forest-900 uppercase mb-5 pt-2";

const emptyNameset = (): EnquiryNamesetEntry => ({ name: "", number: "", size: "", remark: "" });

export default function Quotation() {
  const [submitted, setSubmitted] = useState(false);
  const [enquiryNo, setEnquiryNo] = useState<string>("");
  const [result, setResult] = useState<EnquiryWhatsAppResponse | null>(null);
  // The time-captcha the ERP checks (a submit under 3 s after the form opened is refused).
  // Stamped on mount, not during render, so the value is stable for the whole visit.
  const formOpenedAt = useRef(0);
  useEffect(() => {
    formOpenedAt.current = Math.floor(Date.now() / 1000);
  }, []);
  const track = useFormTracking("quotation");
  const { data: settings } = useSettings();
  const salesTeam = settings?.sales_team?.length ? settings.sales_team : FALLBACK_SALES_TEAM;

  const enquiry = useEnquiry();
  const quoteRequest = useQuoteRequest();
  const pending = enquiry.isPending || quoteRequest.isPending;

  // Customer
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // The sales team's chat form asks these too (17-Nov-2026) — all optional.
  const [attn, setAttn] = useState("");
  const [icTin, setIcTin] = useState("");
  const [tradingLicence, setTradingLicence] = useState("");
  // Opened from a link sales sent in WhatsApp: the chat's code (lib/chatRef), read once on mount.
  const chatRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    chatRef.current = captureChatRef();
  }, []);

  // Product
  /*
   * The same admin-editable vocabulary the Online Design studio uses (colours, collars, sleeves,
   * fabrics). It is optional here: if the ERP is unreachable the form still works, the colour
   * picker simply offers the wheel instead of stock swatches.
   */
  const { options: studioOptions } = useDesignToolConfig();

  const [category, setCategory] = useState(PRODUCT_GROUPS[0].category);
  const [productType, setProductType] = useState("");
  const [jobType, setJobType] = useState<ErpJobType>(PRODUCT_GROUPS[0].jobType);

  // Design
  const previewModel = useMemo(() => previewProductFor(productType), [productType]);

  const [design, setDesign] = useState({
    design_concept: "",
    main_color: "",
    secondary_color: "",
    collar_type: "",
    fabric_type: "",
    sleeve_type: "",
    name_number_required: "",
    design_notes: "",
  });

  // Quantity
  const [sizes, setSizes] = useState<SizeMatrix>({});
  const [totalQty, setTotalQty] = useState("");

  // Nameset
  const [namesetOpen, setNamesetOpen] = useState(false);
  const [nameset, setNameset] = useState<EnquiryNamesetEntry[]>([emptyNameset()]);

  // Deadline + delivery
  const [eventDate, setEventDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState<EnquiryPriority>("NORMAL");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | "">("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Files + remarks
  const [files, setFiles] = useState<UploadedFileWithRole[]>([]);
  const [notes, setNotes] = useState("");
  /** The first uploaded image, drawn on the preview (a PDF/AI/EPS is for the designer, not the mockup). */
  const artworkPreviewUrl = useMemo(() => {
    const img = files.find((f) => /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(f.mime ?? ""));
    return sameOriginMedia(img?.url);
  }, [files]);
  const [honeypot, setHoneypot] = useState("");

  const today = isoDate(new Date());
  const group = useMemo(
    () => PRODUCT_GROUPS.find((g) => g.category === category) ?? PRODUCT_GROUPS[0],
    [category],
  );
  const matrixTotal = useMemo(() => sumSizes(sizes), [sizes]);

  const onCategoryChange = (value: string) => {
    setCategory(value);
    setProductType("");
    const next = PRODUCT_GROUPS.find((g) => g.category === value);
    if (next) setJobType(next.jobType);
  };

  const setSizeQty = (size: string, value: string) => {
    const n = Math.trunc(Number(value));
    setSizes((prev) => {
      const next = { ...prev };
      if (!value || !Number.isFinite(n) || n <= 0) delete next[size];
      else next[size] = n;
      return next;
    });
  };

  const setNamesetField = (index: number, field: keyof EnquiryNamesetEntry, value: string) =>
    setNameset((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const buildPayload = (): EnquiryPayload | null => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Name, email and phone are required.");
      return null;
    }
    if (!productType) {
      toast.error("Please choose the product you need.");
      return null;
    }

    const matrix = cleanSizes(sizes);
    const typedTotal = Math.trunc(Number(totalQty));
    const total = matrixTotal > 0 ? matrixTotal : Number.isFinite(typedTotal) && typedTotal > 0 ? typedTotal : 0;
    if (total <= 0) {
      toast.error("Please enter the quantity, or fill in the size breakdown.");
      return null;
    }

    const designDetails = Object.fromEntries(
      Object.entries(design).filter(([, v]) => v.trim() !== ""),
    ) as EnquiryPayload["design_details"];

    const namesetRows = namesetOpen
      ? nameset
          .filter((row) => (row.name ?? "").trim() !== "")
          .map((row) => ({
            name: (row.name ?? "").trim(),
            number: (row.number ?? "").trim() || undefined,
            size: (row.size ?? "").trim() || undefined,
            remark: (row.remark ?? "").trim() || undefined,
          }))
      : [];

    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company_name: company.trim() || undefined,
      attn: attn.trim() || undefined,
      ic_tin_no: icTin.trim() || undefined,
      trading_licence_no: tradingLicence.trim() || undefined,
      chat_ref: chatRef.current,

      product_category: category,
      product_type: productType,
      product_name_snapshot: productType,
      erp_job_type: jobType,

      design_details: designDetails && Object.keys(designDetails).length > 0 ? designDetails : undefined,

      total_qty: total,
      size_breakdown: Object.keys(matrix).length > 0 ? matrix : undefined,
      nameset_data: namesetRows.length > 0 ? namesetRows : undefined,

      event_date: eventDate || undefined,
      delivery_date: deliveryDate || undefined,
      priority,
      delivery_method: deliveryMethod || undefined,
      delivery_address: deliveryAddress.trim() || undefined,

      uploaded_files: files.length > 0 ? files.map(toFileRef) : undefined,

      ...attributionFields(),

      website: honeypot,
      _t: formOpenedAt.current,
      notes: notes.trim() || undefined,
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
    toast.success(no ? `Quotation request submitted — reference ${no}` : "Quotation request submitted!");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    // The complete B4 enquiry goes to POST /enquiries once the ERP serves Stage 4
    // (VITE_ENQUIRY_V2=1). Until then the same data is carried by the legacy quote request,
    // so nothing a visitor types is lost.
    if (ENQUIRY_V2) {
      enquiry.mutate(payload, { onSuccess: (res) => onDone(res?.enquiry_no, res), onError });
    } else {
      quoteRequest.mutate(enquiryToQuoteRequest(payload), {
        onSuccess: (res) => onDone((res as { enquiry_no?: string })?.enquiry_no, res as EnquiryWhatsAppResponse),
        onError,
      });
    }
  };

  return (
    <>
      <SEOHead
        title="Get Your Free Quotation | ASK Creative Printing Sabah"
        description="Request a free quotation for custom printing, sublimation jerseys, apparel, embroidery, banners and premium gifts in Kota Kinabalu, Sabah."
        keywords="quotation, custom printing quote, jersey printing price, printing quotation Kota Kinabalu"
        canonical="/quotation"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-10 pb-8 md:pt-16 md:pb-12 lg:pt-20 lg:pb-14">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-3">
            Get Your Free Quotation
          </h1>
          <p className="text-white/60 text-base md:text-lg font-body max-w-[600px] mx-auto">
            Fill in the details below and our sales team will prepare a quotation for you. Prices are
            quoted in RM and confirmed by our sales team.
          </p>
        </div>
      </section>

      {/* Quotation Form */}
      <section className="bg-white pt-6 pb-10 md:pt-12 md:pb-20">
        <div className="max-w-[880px] mx-auto px-5 md:px-10">
          {!submitted ? (
            <div className="bg-white sm:border border-forest-900/15 rounded-lg sm:p-6 md:p-10">
              <form id="quote-form" onSubmit={handleSubmit} onChange={track.start} className="space-y-8">
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px" }}
                  aria-hidden="true"
                />

                {/* ── Your details ── */}
                <div>
                  <h2 className={SECTION}>Your details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL} htmlFor="q-name">Full name *</label>
                      <input id="q-name" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ahmad bin Ali" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-company">Company / organisation</label>
                      <input id="q-company" className={FIELD} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-phone">Phone / WhatsApp *</label>
                      <input id="q-phone" type="tel" className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 010 217 4774" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-email">Email *</label>
                      <input id="q-email" type="email" className={FIELD} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-attn">Attn</label>
                      <input id="q-attn" className={FIELD} value={attn} onChange={(e) => setAttn(e.target.value)} maxLength={120} placeholder="Optional — who the quotation is addressed to" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-ic-tin">IC / TIN no.</label>
                      <input id="q-ic-tin" className={FIELD} value={icTin} onChange={(e) => setIcTin(e.target.value)} maxLength={40} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-licence">Company trading licence</label>
                      <input id="q-licence" className={FIELD} value={tradingLicence} onChange={(e) => setTradingLicence(e.target.value)} maxLength={60} placeholder="Optional" />
                    </div>
                  </div>
                </div>

                {/*
                  Product, quantity and design sit in one band with a single sticky model beside
                  them. One canvas, not three: the customer sees the model from the moment they
                  pick a product type and it keeps following them down through the design fields
                  (user, 31-Oct-2026: "pada saat pilih product category dan product type juga
                  tampil model").
                */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(260px,320px)] lg:gap-8 lg:items-start">
                  {/* The model, following the product type and every design field beside it. First in the
                      markup so that on a phone it can stay pinned under the header while the fields
                      below it scroll (from lg it is the right-hand column again). Hidden on a phone
                      until there is a product to show. */}
                  <div className={`${previewModel ? "" : "hidden lg:block"} sticky top-16 lg:top-28 z-20 -mx-5 px-5 pt-1 pb-3 bg-white/95 backdrop-blur shadow-[0_10px_14px_-12px_rgba(13,31,22,0.35)] lg:shadow-none sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 lg:mx-0 lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:order-last h-fit`}>
                    {previewModel ? (
                      <>
                        <StudioPreview
                          product={previewModel}
                          collar={design.collar_type || undefined}
                          color={design.main_color || undefined}
                          secondaryColor={design.secondary_color || undefined}
                          sleeve={design.sleeve_type || undefined}
                          fabric={design.fabric_type || undefined}
                          artworkUrl={artworkPreviewUrl}
                          caption={productType || previewModel}
                          sub={category}
                          height="h-[170px] sm:h-[220px] lg:h-[300px]"
                          collapsible
                        />
                        <p className="hidden lg:block text-xs font-body text-forest-900/50 mt-2">
                          A guide to what you are describing — the finished artwork comes from our designer.
                        </p>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-forest-900/15 bg-off-white h-[300px] flex items-center justify-center px-6 text-center">
                        <p className="text-sm font-body text-forest-900/50">
                          Choose a product type and it appears here.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-8 min-w-0">

                {/* ── What you need ── */}
                <div>
                  <h2 className={SECTION}>What you need</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL} htmlFor="q-category">Product category *</label>
                      <select id="q-category" className={FIELD} value={category} onChange={(e) => onCategoryChange(e.target.value)} required>
                        {PRODUCT_GROUPS.map((g) => (
                          <option key={g.category} value={g.category}>{g.category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-product">Product type *</label>
                      <select id="q-product" className={FIELD} value={productType} onChange={(e) => setProductType(e.target.value)} required>
                        <option value="">Select a product</option>
                        {group.types.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="q-jobtype">Printing / job type *</label>
                      <select id="q-jobtype" className={FIELD} value={jobType} onChange={(e) => setJobType(e.target.value as ErpJobType)} required>
                        {(settings?.job_types?.length ? settings.job_types : JOB_TYPES).map((j) => (
                          <option key={j.value} value={j.value}>{j.label}</option>
                        ))}
                      </select>
                      <p className="text-forest-900/40 text-xs font-body mt-2">
                        Not sure? Choose "Other / not sure" and our sales team will confirm it with you.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Quantity and sizes ── */}
                <div>
                  <h2 className={SECTION}>Quantity and sizes</h2>
                  <div className="space-y-4">
                    <div>
                      <p className={LABEL}>Adult sizes</p>
                      <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-4 gap-2">
                        {ADULT_SIZES.map((size) => (
                          <label key={size} className="text-center">
                            <span className="block text-xs font-body text-forest-900/60 mb-1">{sizeLabel(size)}</span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              aria-label={`Quantity for adult size ${sizeLabel(size)}`}
                              value={sizes[size] ?? ""}
                              onChange={(e) => setSizeQty(size, e.target.value)}
                              className={SIZE_BOX}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={LABEL}>Kids sizes</p>
                      <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-2">
                        {KIDS_SIZES.map((size) => (
                          <label key={size} className="text-center">
                            <span className="block text-xs font-body text-forest-900/60 mb-1">{sizeLabel(size)}</span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              aria-label={`Quantity for kids size ${sizeLabel(size)}`}
                              value={sizes[size] ?? ""}
                              onChange={(e) => setSizeQty(size, e.target.value)}
                              className={SIZE_BOX}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                      <div>
                        <label className={LABEL} htmlFor="q-total">Total quantity *</label>
                        <input
                          id="q-total"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          className={FIELD}
                          value={matrixTotal > 0 ? matrixTotal : totalQty}
                          onChange={(e) => setTotalQty(e.target.value)}
                          readOnly={matrixTotal > 0}
                          placeholder="e.g. 30"
                          required={matrixTotal === 0}
                        />
                      </div>
                      <p className="text-forest-900/50 text-xs font-body">
                        {matrixTotal > 0
                          ? `Added up from the size breakdown: ${matrixTotal} pieces.`
                          : "Fill in the size breakdown above and the total is added up for you."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Design details ──
                    The model sits beside these fields and follows every one of them, so a customer
                    can see what they are describing instead of imagining it (user, 31-Oct-2026:
                    "input input lain yang bisa merubah model harusnya model disesuaikan pada form
                    input yang di pilih"). */}
                <div>
                  <h2 className={SECTION}>Design details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 content-start">
                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="q-concept">Design concept / theme</label>
                      <input id="q-concept" className={FIELD} value={design.design_concept} onChange={(e) => setDesign({ ...design, design_concept: e.target.value })} placeholder="e.g. School sports day 2027" />
                    </div>
                    <div className="sm:col-span-2">
                      <ColorPicker
                        label="Main colour" labelClassName={LABEL}
                        value={design.main_color}
                        onChange={(hex) => setDesign({ ...design, main_color: hex })}
                        swatches={studioOptions?.colors ?? []}
                        clearable
                        hint="Pick a colour and the model takes it straight away."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ColorPicker
                        label="Secondary colour" labelClassName={LABEL}
                        value={design.secondary_color}
                        onChange={(hex) => setDesign({ ...design, secondary_color: hex })}
                        swatches={studioOptions?.colors ?? []}
                        clearable
                        hint="The collar, cuffs and hem use this one."
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-collar">Collar type</label>
                      <select id="q-collar" className={FIELD} value={design.collar_type}
                        onChange={(e) => setDesign({ ...design, collar_type: e.target.value })}>
                        <option value="">Not sure / let the designer advise</option>
                        {(studioOptions?.collars ?? ["Round Neck", "V-Neck", "Polo Collar", "Mandarin Collar", "Rib Collar", "Hoodie"])
                          .map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-fabric">Fabric</label>
                      <select id="q-fabric" className={FIELD} value={design.fabric_type}
                        onChange={(e) => setDesign({ ...design, fabric_type: e.target.value })}>
                        <option value="">Not sure / let the designer advise</option>
                        {(studioOptions?.fabrics ?? ["Cotton", "Dry Fit", "Microfiber", "Fleece", "Satin"])
                          .map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-sleeve">Sleeve type</label>
                      <select id="q-sleeve" className={FIELD} value={design.sleeve_type}
                        onChange={(e) => setDesign({ ...design, sleeve_type: e.target.value })}>
                        <option value="">Not sure / let the designer advise</option>
                        {(studioOptions?.sleeves ?? ["Sleeveless", "Short Sleeve", "3/4 Sleeve", "Long Sleeve"])
                          .map((sl) => <option key={sl} value={sl}>{sl}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-namenumber">Names / numbers needed</label>
                      <select id="q-namenumber" className={FIELD} value={design.name_number_required} onChange={(e) => setDesign({ ...design, name_number_required: e.target.value })}>
                        {NAME_NUMBER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL} htmlFor="q-design-notes">Notes for the designer</label>
                      <textarea id="q-design-notes" rows={3} className={`${FIELD} resize-none`} value={design.design_notes} onChange={(e) => setDesign({ ...design, design_notes: e.target.value })} placeholder="Logo placement, sponsor logos, fonts, anything the designer should know…" />
                    </div>
                  </div>
                </div>
                  </div>

                </div>
                {/* ── Names and numbers ── */}
                <div>
                  <h2 className={SECTION}>Names and numbers</h2>
                  <label className="flex items-center gap-3 min-h-11 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={namesetOpen}
                      onChange={(e) => setNamesetOpen(e.target.checked)}
                      className="w-5 h-5 shrink-0 accent-teal-500"
                    />
                    <span className="text-sm font-body text-forest-900">
                      I want to type in the name and number list now
                    </span>
                  </label>
                  {namesetOpen ? (
                    <div className="space-y-3">
                      {nameset.map((row, i) => (
                        <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.4fr_0.6fr_0.6fr_1.4fr_auto] gap-2 rounded-lg sm:rounded-none border sm:border-0 border-forest-900/10 p-2 sm:p-0">
                          <input className={FIELD} value={row.name ?? ""} onChange={(e) => setNamesetField(i, "name", e.target.value)} placeholder="Name" aria-label={`Name, row ${i + 1}`} />
                          <input className={FIELD} value={row.number ?? ""} onChange={(e) => setNamesetField(i, "number", e.target.value)} placeholder="No." aria-label={`Number, row ${i + 1}`} />
                          <input className={FIELD} value={row.size ?? ""} onChange={(e) => setNamesetField(i, "size", e.target.value)} placeholder="Size" aria-label={`Size, row ${i + 1}`} />
                          <input className={FIELD} value={row.remark ?? ""} onChange={(e) => setNamesetField(i, "remark", e.target.value)} placeholder="Remark" aria-label={`Remark, row ${i + 1}`} />
                          <button
                            type="button"
                            onClick={() => setNameset((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows))}
                            aria-label={`Remove row ${i + 1}`}
                            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-forest-900/50 hover:text-red-600 hover:bg-off-white transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNameset((rows) => (rows.length < 50 ? [...rows, emptyNameset()] : rows))}
                        className="min-h-11 inline-flex items-center gap-1.5 text-sm font-body font-medium text-teal-700 hover:text-teal-800"
                      >
                        <Plus className="w-4 h-4" /> Add another row
                      </button>
                    </div>
                  ) : (
                    <p className="text-forest-900/50 text-sm font-body">
                      You can also upload the list as a CSV or Excel file below — we read it for you.
                    </p>
                  )}
                </div>

                {/* ── Deadline and delivery ── */}
                <div>
                  <h2 className={SECTION}>Deadline and delivery</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL} htmlFor="q-event">Event date</label>
                      <input id="q-event" type="date" min={today} className={FIELD} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-delivery-date">Needed by (delivery date)</label>
                      <input id="q-delivery-date" type="date" min={today} className={FIELD} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-priority">Priority</label>
                      <select id="q-priority" className={FIELD} value={priority} onChange={(e) => setPriority(e.target.value as EnquiryPriority)}>
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="q-delivery-method">Collection or delivery</label>
                      <select id="q-delivery-method" className={FIELD} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod | "")}>
                        <option value="">Decide later</option>
                        {DELIVERY_METHODS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    {deliveryMethod !== "" && deliveryMethod !== "pickup" && (
                      <div className="sm:col-span-2">
                        <label className={LABEL} htmlFor="q-address">Delivery address</label>
                        <textarea id="q-address" rows={2} className={`${FIELD} resize-none`} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, city, postcode, state" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Files ── */}
                <div>
                  <h2 className={SECTION}>Artwork, logo and lists</h2>
                  <FileUploadBox
                    files={files}
                    onChange={setFiles}
                    onInteract={track.start}
                    hint="Upload your logo, artwork, design reference, size list or name and number list"
                  />
                </div>

                {/* ── Remarks ── */}
                <div>
                  <label className={LABEL} htmlFor="q-notes">Anything else we should know?</label>
                  <textarea id="q-notes" rows={4} className={`${FIELD} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes or requirements…" />
                </div>

                {/* The send button rides along the foot of the screen while the form is in view, with
                    what has been asked for so far — no scrolling back down to find it. */}
                <OrderBar
                  bleed="-mx-5 sm:-mx-6 md:-mx-10 lg:mx-0"
                  title={`${productType || "No product chosen yet"}${(matrixTotal || Number(totalQty) || 0) > 0 ? ` · ${matrixTotal || Number(totalQty)} pcs` : ""}`}
                  detail="Free quotation in RM, usually within 24 hours"
                  whatsappText="Hi ASK Creative, I would like a quotation."
                  action={{
                    form: "quote-form",
                    busy: pending,
                    label: pending ? "Sending…" : <><span className="sm:hidden">Send</span><span className="hidden sm:inline">Request quotation</span></>,
                    icon: pending ? undefined : <Send className="w-4 h-4" />,
                  }}
                />
              </form>

              {/* WhatsApp Alternatives */}
              <div className="mt-8 pt-6 border-t border-forest-900/10 text-center">
                <p className="text-forest-900/60 text-sm font-body mb-3">Prefer WhatsApp? Message our sales team directly:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {salesTeam.map((member) => (
                    <a
                      key={member.phone}
                      href={`https://wa.me/${member.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-11 inline-flex items-center gap-1.5 text-sm font-body text-[#128C7E] hover:text-[#0b6b5f] transition-colors border border-[#25D366]/40 hover:border-[#128C7E] rounded-md px-3"
                    >
                      <MessageCircle className="w-3 h-3" />
                      {member.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">
                Quotation Request Submitted
              </h3>
              {enquiryNo && (
                <p className="text-forest-900 text-base font-body mb-3">
                  Your enquiry number is <span className="font-medium">{enquiryNo}</span> — please quote it when you contact us.
                </p>
              )}
              <EnquiryWhatsAppCta
                response={result}
                input={{
                  enquiryNo,
                  customerName: name,
                  company,
                  product: productType,
                  totalQty: matrixTotal > 0 ? matrixTotal : Math.trunc(Number(totalQty)) || 0,
                  eventDate,
                  neededBy: deliveryDate,
                }}
              />
              <p className="text-forest-900/70 text-base font-body max-w-[480px] mx-auto mb-8">
                Thank you! Our sales team will review your request and get back to you within 24 hours.
                A confirmation email is on its way to you.
              </p>
              <Link
                to="/"
                className="inline-flex min-h-11 items-center bg-forest-900 text-white px-6 rounded-md text-sm font-body font-medium hover:bg-forest-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

import { useState, useRef, useMemo, useEffect } from "react";
import { sameOriginMedia } from "../lib/media";
import { Link } from "react-router-dom";
import {
  Shirt,
  Check, ChevronRight,
  Plus, Minus, Trash2, Send, Maximize2,
} from "lucide-react";

// The WebGL preview is lazy-loaded inside StudioPreview, which both screens share.
import { toast } from "sonner";
import { submitErrorMessage } from "../lib/submitError";
import SEOHead from "../components/SEOHead";
import FileUploadBox from "../components/FileUploadBox";
import PriceEstimateBox from "../components/PriceEstimateBox";
import StudioPreview from "../components/StudioPreview";
import { hasOwnNeck } from "../components/ProductMockup";
import OrderBar from "../components/OrderBar";
import { usePriceEstimate } from "../hooks/useEstimate";
import { formatMoney } from "../lib/format";
import ProductGlyph from "../components/ProductGlyph";
import ColorPicker from "../components/ColorPicker";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import EnquiryWhatsAppCta from "../components/EnquiryWhatsAppCta";
import type { EnquiryWhatsAppResponse } from "../lib/enquiryWhatsApp";
import { useFormTracking } from "../hooks/useFormTracking";
import { useDesignToolConfig, useDesignSubmission } from "../hooks/useDesignSubmission";
import { designToQuoteRequest } from "../lib/legacyQuote";
import { uploadOne, UPLOAD_MAX_BYTES, type UploadedFileWithRole } from "../hooks/useFileUpload";
import { ApiError } from "../lib/api";
import DesignStage, { type GarmentLook } from "../editor/DesignStage";
import DesignTools from "../editor/DesignTools";
import { useEditorKeys } from "../editor/keys";
import EditorSheet from "../editor/EditorSheet";
import { useMediaQuery } from "../editor/useMediaQuery";
import {
  addLayer, imageRatio, loadDoc, makeImage, outside, saveDoc, useDesignHistory,
} from "../editor/state";
import { emptyDoc, isEmptyDoc, type DesignDoc, type Side as DesignSide } from "../editor/types";
import { fullPrintAllowed, fullPrintByDefault, hasBack, printArea } from "../editor/printAreas";
import { wrapsFor } from "../editor/wrap";
import { buildDesignJson, designSummary, renderSidePng, sidesWithDesign } from "../editor/exportDesign";
import type { UploadedFile } from "../types/landing";
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

// 16px text below md: iOS Safari zooms the page into any field smaller than that.
const FIELD =
  "w-full min-h-11 px-4 py-2.5 rounded-md border border-forest-900/15 bg-white text-forest-900 text-base md:text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 [color-scheme:light]";
const CHIP = "min-h-11 px-4 rounded-md text-sm font-body transition-colors";
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

const STEPS = ["Product", "Design", "Send"];

/** RM without the ".00" of a round figure — the bar has a phone's width to say it in. */
const rm = (n: number) => formatMoney(n).replace(/\.00$/, "");

const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i;
const LAST_KEY = "ask-design:last";

/** The ERP allows 5 writes a minute per visitor; a preview upload that hits it waits and tries again. */
async function withRateLimitRetry<T>(fn: () => Promise<T>, onWait: () => void): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 429 || attempt >= 4) throw err;
      onWait();
      await new Promise((r) => setTimeout(r, 15000));
    }
  }
}

/** Upload paths a design uses (its pictures and picture fills). */
const pathsInDoc = (d: DesignDoc): Set<string> => new Set([
  ...d.layers.flatMap((l) => (l.type === "image" && l.path ? [l.path] : [])),
  ...Object.values(d.fills).flatMap((f) => (f && f.kind === "image" && f.path ? [f.path] : [])),
]);

interface Boot { product: string; category?: string; color?: string; secondary?: string; doc: DesignDoc }

/** The design the visitor left on this device (read once, when the page opens). */
function readBoot(): Boot | null {
  try {
    const last = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as Omit<Boot, "doc"> | null;
    if (!last?.product) return null;
    const doc = loadDoc(last.product);
    return doc && !isEmptyDoc(doc) ? { ...last, doc } : null;
  } catch {
    return null;
  }
}

const descriptor = (f: UploadedFile): UploadedFile => ({
  path: f.path, url: f.url, original_name: f.original_name, mime: f.mime, ext: f.ext, size: f.size,
});

/**
 * One numbered block of the design step. The numbers are real: the blocks are the order in which a
 * customer is asked to decide things, and the bar at the foot says what is still missing.
 * Declared at module level so typing in a field never remounts the block it is in.
 */
function Block({ n, title, hint, id, children }: {
  n: number; title: string; hint?: React.ReactNode; id?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[300px] sm:scroll-mt-[380px] lg:scroll-mt-32">
      <h3 className="flex items-center gap-3 font-display text-lg md:text-xl text-forest-900 uppercase leading-tight">
        <span className="w-7 h-7 shrink-0 rounded-full bg-[#0d1f16] text-[#d7ff00] text-sm font-body font-medium flex items-center justify-center">{n}</span>
        {title}
      </h3>
      {hint && <p className="text-sm font-body text-forest-900/60 mt-1.5 mb-4 pl-10">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

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
  // A refresh brings the visitor back to the product they were designing, in their colours.
  const [boot] = useState(readBoot);

  const [step, setStep] = useState(1);
  const wizardTop = useRef<HTMLDivElement>(null);
  /** Each step opens at its top — Next sat at the foot of a long step, and the next one used to
   * open scrolled to its own foot. */
  const goStep = (n: number) => {
    setStep(n);
    setEditorOpen(false);
    requestAnimationFrame(() => wizardTop.current?.scrollIntoView({ block: "start" }));
  };
  const [side, setSide] = useState<"front" | "back">("front");
  const [activeCategory, setActiveCategory] = useState<string>(boot?.category ?? "");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(boot?.product ?? null);

  // Step 2 — customise
  const [collar, setCollar] = useState("");
  const [fabric, setFabric] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [color, setColor] = useState(boot?.color ?? "");
  const [secondaryColor, setSecondaryColor] = useState(boot?.secondary ?? "");
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
  const [artwork, setArtwork] = useState<UploadedFileWithRole[]>(() => (boot?.doc.assets ?? []).map((a) => ({ ...a, role: "artwork" })));
  const [placements, setPlacements] = useState<DesignSubmissionPlacement[]>([]);

  // ── The design editor (user, 11-Nov-2026: "gambar bisa di geser geser dibajunya, dan juga bisa tambah
  // text dibajunya"; "baju juga bisa bercorak dan full custom full paint"). The design is one document
  // with undo/redo, autosaved per product on this device, drawn on the same flat mockup as before.
  const { doc, update, undo, redo, reset, canUndo, canRedo } = useDesignHistory(() => boot?.doc ?? emptyDoc());
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [preparing, setPreparing] = useState(false);
  const previewCache = useRef<{ key: string; previews: NonNullable<DesignSubmissionPayload["previews"]> } | null>(null);

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
  /** The uploaded pictures (the ones the editor can place). */
  const imageFiles = useMemo(() => artwork.filter((f) => IMAGE_MIME.test(f.mime ?? "")), [artwork]);

  /** Put a freshly uploaded picture on the side being edited. */
  const placeImage = async (f: UploadedFile, onSide: DesignSide) => {
    const src = sameOriginMedia(f.url) ?? f.url;
    const ratio = await imageRatio(src);
    const d = docRef.current;
    const layer = makeImage({ product: selectedProduct ?? "T-Shirt", side: onSide, mode: d.mode }, src, ratio, { path: f.path, name: f.original_name });
    update(addLayer(layer));
    setSelectedId(layer.id);
  };

  /**
   * The upload box and the editor share one list of files: a picture added in the box lands on the
   * garment, a file removed there leaves the garment too.
   */
  const changeArtwork = (next: UploadedFileWithRole[]) => {
    const before = new Set(artwork.map((f) => f.path));
    const kept = new Set(next.map((f) => f.path));
    const removed = artwork.filter((f) => !kept.has(f.path)).map((f) => f.path);
    setArtwork(next);
    if (removed.length) {
      update((d) => ({
        ...d,
        layers: d.layers.filter((l) => !(l.type === "image" && l.path && removed.includes(l.path))),
        fills: Object.fromEntries(Object.entries(d.fills).filter(([, f]) => !(f && f.kind === "image" && f.path && removed.includes(f.path)))),
      }));
    }
    next.filter((f) => !before.has(f.path) && IMAGE_MIME.test(f.mime ?? "")).forEach((f) => void placeImage(f, side));
  };

  /** The editor's own "Image" button: upload, then join the files sent with the enquiry. */
  const uploadImage = async (file: File): Promise<UploadedFile | null> => {
    if (file.size > UPLOAD_MAX_BYTES) { toast.error(`${file.name} is larger than 10 MB.`); return null; }
    if (artwork.length >= 20) { toast.error("You can attach up to 20 files."); return null; }
    try {
      const up = await uploadOne(file);
      setArtwork((list) => [...list, { ...up, role: "artwork" }]);
      return up;
    } catch (err) {
      const status = (err as { status?: number })?.status;
      toast.error(status === 429 ? "Too many uploads in a minute — please wait a moment and try again." : `${file.name}: ${err instanceof Error ? err.message : "Upload failed."}`);
      return null;
    }
  };

  useEffect(() => {
    if (boot) toast.success("Your saved design is back — tap Start designing to carry on.");
  }, [boot]);

  /**
   * Choosing a product: its saved design comes back; a design in progress moves along with the
   * customer (garments share one board), with anything now outside the print area pointed out.
   */
  const chooseProduct = (name: string) => {
    setSelectedProduct(name);
    if (name === selectedProduct) return;
    setSelectedId(null);
    // A mug or a banner has only a front, and no switch to get back to it.
    if (!hasBack(name)) setSide("front");
    const saved = loadDoc(name);
    const takeSaved = !!saved && !isEmptyDoc(saved) && !isEmptyDoc(doc)
      && window.confirm(`You have a saved design for the ${name}. Open it? (Cancel brings your current design across instead.)`);
    if (isEmptyDoc(doc) || takeSaved) {
      const next = saved ?? emptyDoc(fullPrintByDefault(name) ? "full" : "simple");
      if (next.mode === "full" && !fullPrintAllowed(name)) next.mode = "simple";
      reset(next);
      if (saved?.assets.length) {
        setArtwork((list) => [...list, ...saved.assets.filter((a) => !list.some((f) => f.path === a.path)).map((a) => ({ ...a, role: "artwork" as const }))]);
      }
      return;
    }
    const mode = doc.mode === "full" && !fullPrintAllowed(name) ? "simple" : doc.mode;
    if (mode !== doc.mode) update((d) => ({ ...d, mode }));
    if (!hasBack(name) && doc.layers.some((l) => l.side === "back")) {
      toast.info(`The ${name} has no back to print on — the back of your design is kept for a garment.`);
    }
    // A wrapping full print has no edge to fall off (the silhouette and the side seams do the cutting).
    const out = wrapsFor(name, mode) ? [] : doc.layers.filter((l) => (l.side === "front" || hasBack(name)) && outside(l, printArea(name, l.side, mode)));
    if (out.length) {
      toast.warning(`${out.length} element${out.length > 1 ? "s" : ""} of your design ${out.length > 1 ? "fall" : "falls"} outside the print area of the ${name} — outlined in red, please move ${out.length > 1 ? "them" : "it"}.`);
    }
  };

  // Autosave, per product, on this device.
  useEffect(() => {
    if (!selectedProduct) return;
    const t = setTimeout(() => {
      const used = pathsInDoc(doc);
      saveDoc(selectedProduct, isEmptyDoc(doc) ? null : { ...doc, assets: artwork.filter((f) => used.has(f.path)).map(descriptor) });
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify({ product: selectedProduct, category: activeCategory, color, secondary: secondaryColor }));
      } catch { /* storage unavailable */ }
    }, 300);
    return () => clearTimeout(t);
  }, [doc, selectedProduct, artwork, activeCategory, color, secondaryColor]);

  const startOver = () => {
    if (!isEmptyDoc(doc) && !window.confirm("Start over? Everything on the garment will be removed.")) return;
    reset(emptyDoc(selectedProduct && fullPrintByDefault(selectedProduct) ? "full" : "simple"));
    setSelectedId(null);
    if (selectedProduct) saveDoc(selectedProduct, null);
  };

  useEditorKeys(step === 2 && (isDesktop || editorOpen), {
    doc, update, undo, redo, selectedId, onSelect: setSelectedId, product: selectedProduct ?? "T-Shirt",
  });

  const designSubmission = useDesignSubmission();
  const quoteRequest = useQuoteRequest();
  const pending = designSubmission.isPending || quoteRequest.isPending || preparing;
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

  const togglePlacement = (position: string) => {
    const adding = !placements.some((r) => r.position === position);
    // Show the side being printed: ticking "Back" turns the preview round.
    if (adding) setSide(/back/i.test(position) ? "back" : "front");
    setPlacements((rows) =>
      rows.some((r) => r.position === position)
        ? rows.filter((r) => r.position !== position)
        : [...rows, { position, note: "" }],
    );
  };

  /** The sides that carry part of the design. */
  const designedSides = useMemo(() => {
    const painted = doc.mode === "full" && Object.keys(doc.fills).length > 0;
    return {
      front: painted || doc.layers.some((l) => l.side === "front"),
      back: painted || doc.layers.some((l) => l.side === "back"),
    };
  }, [doc]);

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

  // The same cached query PriceEstimateBox reads, for the one-line figure in the bar.
  const estimate = usePriceEstimate(selectedOption?.id, total).data;
  const estimateLine = estimate?.priced && estimate.total_min !== null
    ? `Estimate ${rm(estimate.total_min)}${estimate.total_max !== null && estimate.total_max > estimate.total_min ? ` – ${rm(estimate.total_max)}` : ""}`
    : "";

  /** Instead of a dead, greyed-out Next: say what is missing and take the customer to it. */
  const toReview = () => {
    if (total < minQty || total > maxQty) {
      toast.error(total > maxQty
        ? `For more than ${maxQty} pieces please contact our sales team.`
        : `Add your sizes first — at least ${minQty} pieces in total.`);
      document.getElementById("d-sizes")?.scrollIntoView({ block: "start" });
      return;
    }
    if (customizeReady) {
      // Open the review on a side that carries the artwork, not on the bare back left from a flip.
      setSide(designedSides.front || !designedSides.back ? "front" : "back");
      goStep(3);
    }
  };

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

    // The sides designed in the editor are print positions too (the ERP's own placement list), so the
    // brief says "front + back" even when the customer never ticked the chips.
    const positions = [...placements];
    (["front", "back"] as const).forEach((s) => {
      if (designedSides[s] && options?.placements.includes(s) && !positions.some((p) => p.position === s)) {
        positions.push({ position: s, note: "Placed in the online editor" });
      }
    });

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

      placements: positions.length > 0
        ? positions.map((p) => ({
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

  const onError = (err: unknown) => toast.error(submitErrorMessage(err));

  const onDone = (no?: string, res?: EnquiryWhatsAppResponse | null) => {
    track.markSubmitted();
    setEnquiryNo(no ?? "");
    setResult(res ?? null);
    setSubmitted(true);
    toast.success(no ? `Design submitted — reference ${no}` : "Design submitted! Our sales team will follow up.");
  };

  const look: GarmentLook = {
    product: selectedProduct ?? "T-Shirt", collar: collarValue, color: colorValue,
    secondaryColor, sleeve: sleeveValue, fabric: fabricValue,
  };

  /**
   * The editor's output joins the submission: a PNG of each designed side (uploaded like any artwork
   * file — the first as `preview`, the others appended to `artwork`, so existing artwork indices stay
   * valid), the design JSON (`editor`) and a plain-text reading appended to the design notes.
   * A preview that cannot be drawn or uploaded never blocks the enquiry.
   */
  const withDesign = async (payload: DesignSubmissionPayload): Promise<DesignSubmissionPayload> => {
    const product = payload.product;
    const sides = sidesWithDesign(doc, product);
    if (sides.length === 0) return payload;

    const cacheKey = JSON.stringify([doc, look]);
    let incomplete = false;
    let previews = previewCache.current?.key === cacheKey ? previewCache.current.previews : null;
    if (!previews) {
      previews = [];
      let warned = false;
      for (const s of sides) {
        const out = await renderSidePng(look, doc, s);
        if (!out) continue;
        const { blob, missing } = out;
        if (missing) incomplete = true;
        try {
          const up = await withRateLimitRetry(
            () => uploadOne(new File([blob], `design-preview-${s}.png`, { type: "image/png" })),
            () => { if (!warned) { warned = true; toast.info("Uploading your design preview — this takes a few seconds…"); } },
          );
          previews.push({ side: s, path: up.path, original_name: up.original_name, url: up.url });
        } catch { /* sent without this preview */ }
      }
      // Only a complete set is reused on a retry; a failed side is drawn again next time.
      if (previews.length === sides.length) previewCache.current = { key: cacheKey, previews };
    }

    const artworkPaths = (payload.artwork ?? []).map((a) => a.path);
    const editor = buildDesignJson(doc, { product, artworkPaths, garmentColors: { main: colorValue, secondary: secondaryColor || undefined } });
    editor.previews = previews.map((p) => ({ side: p.side, path: p.path, file_name: p.original_name }));
    if (incomplete || previews.length < sides.length) editor.preview_incomplete = true;
    const summary = designSummary(doc, product);
    const notes = [payload.design.design_notes, summary].filter(Boolean).join("\n\n");
    const extra = previews.slice(1).map((p) => ({ path: p.path, original_name: p.original_name }));

    return {
      ...payload,
      design: { ...payload.design, design_notes: notes ? notes.slice(0, 2000) : undefined },
      preview: previews[0] ? { path: previews[0].path, original_name: previews[0].original_name } : payload.preview,
      artwork: [...(payload.artwork ?? []), ...extra].slice(0, 20),
      editor,
      previews,
    };
  };

  const handleSubmit = async () => {
    if (pending) return;
    const base = buildPayload();
    if (!base) return;
    setPreparing(true);
    let payload = base;
    try {
      payload = await withDesign(base);
    } catch {
      // The enquiry still goes; the designer at least reads the design in the notes.
      const summary = designSummary(doc, base.product);
      payload = summary
        ? { ...base, design: { ...base.design, design_notes: [base.design.design_notes, summary].filter(Boolean).join("\n\n").slice(0, 2000) } }
        : base;
      toast.warning("We could not attach the picture of your design — it is described in the notes instead.");
    } finally {
      setPreparing(false);
    }

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

  const previewSize = Object.keys(cleanSizes(sizes))[0] ?? sizeList[0] ?? "M";
  const collarShown = wearable && isGarment(selectedProduct) && !hasOwnNeck(selectedProduct ?? "") ? collarValue : null;
  const optionalCount = [eventDate, deliveryDate, deliveryMethod, notes.trim(), priority !== "NORMAL" ? priority : ""].filter(Boolean).length;

  const hasStyleBlock = (wearable && (options.collars.length > 0 || options.sleeves.length > 0)) || options.fabrics.length > 0;
  const nAfterStyle = hasStyleBlock ? 4 : 3;

  const editorTools = (
    <DesignTools
      doc={doc} update={update} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
      product={selectedProduct ?? "T-Shirt"} side={side} setSide={setSide}
      selectedId={selectedId} onSelect={setSelectedId}
      mainColor={colorValue} secondaryColor={secondaryColor || undefined} palette={options.colors}
      hasSleeves={!/sleeveless/i.test(sleeveValue) && !/basketball|singlet/i.test(selectedProduct ?? "")}
      uploadImage={uploadImage} images={imageFiles}
      sampleName={namesetEntries[0]?.name ?? ""} sampleNumber={namesetEntries[0]?.number ?? ""}
      onNamePlaceholder={() => setNamesetRequired(true)}
      onStartOver={startOver}
    />
  );

  const summary = (
    <dl className="px-4 py-3 space-y-1.5 text-sm font-body">
      <div className="flex justify-between gap-3">
        <dt className="text-forest-900/55">Product</dt>
        <dd className="text-forest-900 font-medium text-right">{selectedProduct}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-forest-900/55">Pieces</dt>
        <dd className="text-forest-900 font-medium text-right">
          {total || "—"}
          {total > 0 && (
            <span className="block text-xs font-normal text-forest-900/60">
              {Object.entries(cleanSizes(sizes)).map(([s, q]) => `${s} × ${q}`).join(", ")}
            </span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-forest-900/55">Colours</dt>
        <dd className="flex items-center gap-1.5 text-forest-900">
          <span className="w-4 h-4 rounded-full border border-forest-900/15" style={{ backgroundColor: colorValue }} />
          {secondaryColor && <span className="w-4 h-4 rounded-full border border-forest-900/15" style={{ backgroundColor: secondaryColor }} />}
          <span className="text-xs text-forest-900/60">{[colorValue, secondaryColor].filter(Boolean).join(" + ")}</span>
        </dd>
      </div>
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
        <dd className="text-forest-900 text-right">
          {artwork.length ? `${artwork.length} file${artwork.length > 1 ? "s" : ""}` : "None — our designer can create it"}
          {placements.length > 0 && <span className="block text-xs text-forest-900/60">{placements.map((p) => pretty(p.position)).join(", ")}</span>}
        </dd>
      </div>
      {(doc.layers.length > 0 || doc.mode === "full") && (
        <div className="flex justify-between gap-3">
          <dt className="text-forest-900/55">Design</dt>
          <dd className="text-forest-900 text-right">
            {doc.mode === "full" ? "Full print" : "Logo print"}
            {doc.layers.length > 0 && ` · ${doc.layers.length} element${doc.layers.length > 1 ? "s" : ""}`}
          </dd>
        </div>
      )}
      {(namesetRequired || namedCount > 0) && (
        <div className="flex justify-between gap-3">
          <dt className="text-forest-900/55">Names &amp; numbers</dt>
          <dd className="text-forest-900">{namedCount} of {total || 0}</dd>
        </div>
      )}
    </dl>
  );

  return (
    <>
      <SEOHead
        title="Online Design Tool | Design Custom Jerseys & Products with ASK Creative"
        description="Design your custom jersey, apparel, banner, mug, lanyard or corporate gift online. Upload artwork, add names and numbers, choose quantity and submit for quotation."
        keywords="online design tool, custom jersey design, design your own jersey, online printing tool"
        canonical="/online-design"
      />

      {/* Page Hero — short on a phone, so the tool itself starts on the first screen. */}
      <section className="bg-[#0d1f16] pt-10 pb-8 md:pt-16 md:pb-12 lg:pt-20 lg:pb-14">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-3">{heroEyebrow}</p>
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-3">{heroHeading}</h1>
          <p className="text-white/60 text-base md:text-lg font-body max-w-[640px] mx-auto">{heroSubheading}</p>
        </div>
      </section>

      {/* Step Wizard */}
      <section className="bg-white pt-6 pb-10 md:pt-10 md:pb-16">
        <div className="max-w-[1040px] mx-auto px-5 md:px-10">
          <div ref={wizardTop} className="scroll-mt-20 lg:scroll-mt-24" />

          {!submitted && (
            <>
              {/* Where am I: three named steps, the finished ones clickable. */}
              <ol className="flex items-center gap-2 mb-6 md:mb-8" aria-label="Steps">
                {STEPS.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const current = step === n;
                  return (
                    <li key={label} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
                      <button type="button" disabled={!done} onClick={() => goStep(n)}
                        aria-current={current ? "step" : undefined}
                        aria-label={done ? `Back to step ${n}: ${label}` : `Step ${n}: ${label}`}
                        className="flex items-center gap-2 min-h-11 shrink-0 disabled:cursor-default group">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-medium transition-colors ${done ? "bg-teal-500 text-white group-hover:bg-teal-600" : current ? "bg-[#d7ff00] text-[#0d1f16] ring-4 ring-[#d7ff00]/25" : "bg-forest-900/10 text-forest-900/45"}`}>
                          {done ? <Check className="w-4 h-4" /> : n}
                        </span>
                        <span className={`text-sm font-body ${current ? "text-forest-900 font-medium" : done ? "text-forest-900/70 underline-offset-4 group-hover:underline" : "text-forest-900/45"}`}>{label}</span>
                      </button>
                      {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 min-w-3 rounded ${done ? "bg-teal-500" : "bg-forest-900/10"}`} />}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {/* Step 1: Choose Product */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,380px)] gap-6 lg:gap-10">
              <div className="min-w-0">
                <h2 className="font-display text-2xl text-forest-900 uppercase">Choose your product</h2>
                <p className="text-sm font-body text-forest-900/60 mt-1 mb-5">Tap the product you want printed. You can come back and change it.</p>
                <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Category">
                  {options.categories.map((cat) => (
                    <button key={cat} type="button" onClick={() => { setActiveCategory(cat); setSelectedProduct(null); }}
                      aria-pressed={category === cat}
                      className={`${CHIP} font-medium ${category === cat ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/75 hover:bg-forest-900/10"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {products.map((product) => {
                    const known = allowedProducts.size === 0 || allowedProducts.has(product.name.toLowerCase());
                    const on = selectedProduct === product.name;
                    return (
                      <button key={product.id} type="button" onClick={() => chooseProduct(product.name)} disabled={!known}
                        aria-pressed={on}
                        title={known ? undefined : "This product is not available for online design right now."}
                        className={`relative flex flex-col items-center gap-3 p-4 md:p-5 rounded-lg border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${on ? "border-[#0d1f16] bg-[#d7ff00]/15" : "border-forest-900/10 hover:border-forest-900/30"}`}>
                        {on && <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0d1f16] flex items-center justify-center"><Check className="w-3.5 h-3.5 text-[#d7ff00]" /></span>}
                        {product.image_url
                          ? <img src={product.image_url} alt="" className="w-10 h-10 object-contain" />
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
              </div>

              {/* The model, right here on the first screen — picking a product should show you the
                  product, not a name in a box (user, 31-Oct: "pada saat pilih product category dan
                  product type juga tampil model"). */}
              <div className="lg:sticky lg:top-28 h-fit">
                {selectedProduct ? (
                  <StudioPreview
                    product={selectedProduct} collar={collarValue} color={colorValue}
                    secondaryColor={secondaryColor} sleeve={sleeveValue} fabric={fabricValue}
                    size={previewSize}
                    caption={selectedProduct}
                    sub={collarShown ?? category}
                    side={side} onSideChange={setSide}
                    height="h-[240px] sm:h-[300px] lg:h-[360px]"
                    stage={(s) => <DesignStage {...look} doc={doc} side={s} idPrefix="s1" svgClassName="h-[88%] w-auto max-w-full" />}
                  />
                ) : (
                  <div className="hidden lg:flex rounded-xl border border-dashed border-forest-900/15 bg-off-white h-[400px] flex-col items-center justify-center gap-3 px-8 text-center">
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
              <h2 className="font-display text-2xl text-forest-900 uppercase">Design your {selectedProduct ?? "product"}</h2>
              <p className="text-sm font-body text-forest-900/60 mt-1 mb-5">
                Upload your logo, pick colours and enter your sizes. The preview updates as you go.
              </p>

              {/* Flex on a phone so the preview can stay pinned under the header while the blocks scroll
                  beneath it (a grid row would hold it in place); the two-column grid from lg up. */}
              <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(340px,460px)_1fr] lg:gap-10 lg:items-start">
                <div className="sticky top-16 lg:top-28 z-20 -mx-5 px-5 pt-1 pb-3 bg-white/95 backdrop-blur shadow-[0_10px_14px_-12px_rgba(13,31,22,0.35)] md:-mx-10 md:px-10 lg:mx-0 lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none lg:space-y-3">
                  <StudioPreview
                    product={selectedProduct ?? "T-Shirt"}
                    collar={collarValue}
                    color={colorValue}
                    secondaryColor={secondaryColor}
                    sleeve={sleeveValue}
                    fabric={fabricValue}
                    size={previewSize}
                    side={side} onSideChange={(s) => { setSide(s); setSelectedId(null); }}
                    caption={selectedProduct ?? undefined}
                    sub={[collarShown, total > 0 ? `${total} pcs` : null].filter(Boolean).join(" · ") || category}
                    height="h-[170px] sm:h-[240px] lg:h-[clamp(300px,calc(100vh-460px),480px)]"
                    collapsible
                    barExtra={
                      <button type="button" onClick={() => setEditorOpen(true)} aria-label="Open the full-screen editor" title="Full screen"
                        className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-forest-900/70 hover:text-forest-900">
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    }
                    stage={(s) => (
                      <DesignStage {...look} doc={doc} side={s} idPrefix="s2"
                        interactive={isDesktop && !editorOpen} update={update}
                        selectedId={selectedId} onSelect={setSelectedId}
                        onRequestEdit={isDesktop ? undefined : () => setEditorOpen(true)}
                        svgClassName="h-[92%] w-auto max-w-full" />
                    )}
                  />
                  <p className="hidden lg:block text-xs font-body text-forest-900/55 px-1">
                    Drag, resize and rotate right on the garment. A guide, not the final artwork — our designer
                    prepares the print file and checks it with you before printing.
                  </p>
                  <div className="hidden lg:block rounded-lg border border-forest-900/10 bg-white">
                    {summary}
                  </div>
                </div>

                <div className="space-y-10 min-w-0">
                  {/* Artwork first: it is what the customer came with, and what the preview is for
                      (on the same screen as the colours — user, 31-Oct: "step customize dan upload
                      design harusnya jadi satu"). */}
                  <Block n={1} title="Your design" id="d-artwork"
                    hint="Put your logo, text, names and numbers on the garment — or colour the whole garment with a full print. No artwork yet? Skip this — our designer can create it.">
                    {!isDesktop && (
                      <button type="button" onClick={() => setEditorOpen(true)}
                        className="mb-4 w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d1f16] px-4 text-base font-body font-medium text-[#d7ff00]">
                        <Maximize2 className="w-5 h-5" /> Open the design editor
                      </button>
                    )}
                    {!editorOpen && editorTools}

                    <p className="text-sm font-body font-medium text-forest-900 mt-6 mb-1">Print files</p>
                    <p className="text-xs font-body text-forest-900/55 mb-2">
                      Pictures you upload here go on the garment too. Have a PDF, AI or EPS print file? Add it here — our designer opens it.
                    </p>
                    <FileUploadBox
                      files={artwork}
                      onChange={changeArtwork}
                      showRoles={false}
                      onInteract={track.start}
                      hint="Tap to upload your logo or artwork"
                    />

                    <div className="mt-6">
                      <p className="text-sm font-body font-medium text-forest-900 mb-2">Where should it be printed?</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {options.placements.map((position) => {
                          const on = placements.some((p) => p.position === position);
                          return (
                            <button key={position} type="button" onClick={() => togglePlacement(position)}
                              aria-pressed={on}
                              className={`${CHIP} inline-flex items-center gap-1.5 ${on ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/75 hover:bg-forest-900/10"}`}>
                              {on && <Check className="w-4 h-4 text-[#d7ff00]" />}
                              {pretty(position)}
                            </button>
                          );
                        })}
                      </div>
                      {placements.length > 0 && (
                        <div className="space-y-3">
                          {placements.map((p) => (
                            <div key={p.position} className="rounded-lg border border-forest-900/10 p-3 grid grid-cols-1 sm:grid-cols-[0.6fr_1fr_1.3fr] gap-2 sm:items-center">
                              <span className="text-sm font-body font-medium text-forest-900">{pretty(p.position)}</span>
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
                                placeholder="Size or position (optional)" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Block>

                  <Block n={2} title="Colours">
                    <div className="space-y-6">
                      <ColorPicker
                        label="Main colour" labelClassName={LABEL}
                        value={colorValue} onChange={setColor} swatches={options.colors}
                        hint="Tap a colour, or use the colour wheel for your own club colour."
                      />
                      <ColorPicker
                        label="Second colour (optional)" labelClassName={LABEL}
                        value={secondaryColor} onChange={setSecondaryColor} swatches={options.colors}
                        clearable
                        hint="Used for the collar, cuffs and hem."
                      />
                    </div>
                  </Block>

                  {hasStyleBlock ? (
                    <Block n={3} title={wearable ? "Cut and fabric" : "Material"}>
                      <div className="space-y-5">
                        {/* Collar + sleeve apply to garments only. */}
                        {wearable && options.collars.length > 0 && (
                          <div>
                            <p className={LABEL}>Collar</p>
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Collar">
                              {options.collars.map((c) => (
                                <button key={c} type="button" onClick={() => setCollar(c)} aria-pressed={collarValue === c}
                                  className={`${CHIP} ${collarValue === c ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/75 hover:bg-forest-900/10"}`}>
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {wearable && options.sleeves.length > 0 && (
                            <div>
                              <label className={LABEL} htmlFor="d-sleeve">Sleeve</label>
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
                        </div>
                      </div>
                    </Block>
                  ) : null}

                  {/* Quantity — the size matrix for apparel, one quantity for everything else. */}
                  <Block n={nAfterStyle} title={wearable && sizeList.length > 1 ? "Sizes and quantity" : "Quantity"} id="d-sizes"
                    hint={`Minimum ${minQty}, maximum ${maxQty} pieces online.`}>
                    {wearable && sizeList.length > 1 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sizeList.map((s) => {
                          const q = sizes[s] ?? 0;
                          return (
                            <div key={s} className={`rounded-lg border p-1.5 transition-colors ${q ? "border-teal-500/60 bg-teal-50/50" : "border-forest-900/15"}`}>
                              <p className="text-center text-sm font-body font-medium text-forest-900 mb-1">{s}</p>
                              <div className="flex items-center gap-1">
                                <button type="button" aria-label={`One less size ${s}`} disabled={!q} onClick={() => setSizeQty(s, String(q - 1))}
                                  className="w-11 h-11 shrink-0 rounded-md bg-off-white text-forest-900 inline-flex items-center justify-center disabled:opacity-35 hover:bg-forest-900/10">
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input type="number" min={0} step={1} inputMode="numeric" placeholder="0"
                                  aria-label={`Quantity for size ${s}`}
                                  value={sizes[s] ?? ""}
                                  onChange={(e) => setSizeQty(s, e.target.value)}
                                  className="w-full min-w-0 h-11 rounded-md border border-forest-900/15 bg-white text-forest-900 text-base font-body text-center placeholder:text-forest-900/30 focus:outline-none focus:border-teal-500 [color-scheme:light]" />
                                <button type="button" aria-label={`One more size ${s}`} onClick={() => setSizeQty(s, String(q + 1))}
                                  className="w-11 h-11 shrink-0 rounded-md bg-off-white text-forest-900 inline-flex items-center justify-center hover:bg-forest-900/10">
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="max-w-[220px]">
                        <label className={LABEL} htmlFor="d-qty">Quantity</label>
                        <input id="d-qty" type="number" min={1} step={1} inputMode="numeric" className={FIELD}
                          value={oneSizeKey ? sizes[oneSizeKey] ?? "" : ""}
                          onChange={(e) => setSizeQty(oneSizeKey, e.target.value)}
                          placeholder={`e.g. ${minQty}`} />
                      </div>
                    )}

                    <div className="mt-4 space-y-3" id="d-total">
                      <p className="text-sm font-body text-forest-900">
                        Total: <span className="font-semibold">{total}</span> piece{total === 1 ? "" : "s"}
                        {total > 0 && total < minQty && (
                          <span className="text-red-600"> — add {minQty - total} more (minimum {minQty})</span>
                        )}
                        {total > maxQty && (
                          <span className="text-red-600"> — for more than {maxQty} pieces, please contact our sales team</span>
                        )}
                      </p>
                      <PriceEstimateBox studioProductId={selectedOption?.id} totalQty={total} />
                    </div>
                  </Block>

                  {/* Names and numbers */}
                  <Block n={nAfterStyle + 1} title="Names and numbers">
                    <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                      <input type="checkbox" checked={namesetRequired} onChange={(e) => setNamesetRequired(e.target.checked)} className="w-5 h-5 accent-teal-500" />
                      <span className="text-sm font-body text-forest-900">Print a name and/or number on each piece</span>
                    </label>
                    {namesetRequired && (
                      <div className="space-y-3 mt-3">
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
                            <div key={i} className="grid grid-cols-[1fr_5.5rem] sm:grid-cols-[1.4fr_0.6fr_0.8fr_auto] gap-2 rounded-lg sm:rounded-none border sm:border-0 border-forest-900/10 p-2 sm:p-0">
                              <input className={FIELD} value={row.name ?? ""} onChange={(e) => setNamesetField(i, "name", e.target.value)} placeholder="Name" aria-label={`Name, row ${i + 1}`} />
                              <input className={FIELD} value={row.number ?? ""} onChange={(e) => setNamesetField(i, "number", e.target.value)} placeholder="No." aria-label={`Number, row ${i + 1}`} />
                              <select className={FIELD} value={row.size ?? ""} onChange={(e) => setNamesetField(i, "size", e.target.value)} aria-label={`Size, row ${i + 1}`}>
                                <option value="">Size</option>
                                {sizeList.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button type="button" aria-label={`Remove row ${i + 1}`}
                                onClick={() => setNamesetEntries((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows))}
                                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-forest-900/50 hover:text-red-600 hover:bg-off-white transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button type="button"
                              onClick={() => setNamesetEntries((rows) => (rows.length < 100 ? [...rows, emptyNameset()] : rows))}
                              className="min-h-11 inline-flex items-center gap-1.5 text-sm font-body font-medium text-teal-700 hover:text-teal-800">
                              <Plus className="w-4 h-4" /> Add another name
                            </button>
                            <p className="text-xs font-body text-forest-900/55">
                              {namedCount} of {total || 0} pieces named.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Block>

                  <Block n={nAfterStyle + 2} title="Notes for the designer" hint="Optional — anything that helps us get it right first time.">
                    <div className="space-y-4">
                      <div>
                        <label className={LABEL} htmlFor="d-concept">Design concept / theme</label>
                        <input id="d-concept" className={FIELD} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="e.g. Company futsal team 2027" />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="d-notes">Notes</label>
                        <textarea id="d-notes" rows={3} className={`${FIELD} resize-none`} value={designNotes} onChange={(e) => setDesignNotes(e.target.value)} placeholder="Sponsor logos, fonts, reference links…" />
                      </div>
                    </div>
                  </Block>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review and submit */}
          {step === 3 && !submitted && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase">Check and send</h2>
              <p className="text-sm font-body text-forest-900/60 mt-1 mb-5">
                Leave your details and our sales team sends your quotation in RM, usually within 24 hours.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-8 lg:gap-10 lg:items-start">
                <aside className="space-y-4">
                  <StudioPreview
                    product={selectedProduct ?? "T-Shirt"} collar={collarValue} color={colorValue}
                    secondaryColor={secondaryColor} sleeve={sleeveValue} fabric={fabricValue} size={previewSize}
                    side={side} onSideChange={setSide}
                    stage={(s) => <DesignStage {...look} doc={doc} side={s} idPrefix="s3" svgClassName="h-[88%] w-auto max-w-full" />}
                    caption={selectedProduct ?? undefined} sub={category}
                    height="h-[150px] sm:h-[240px]"
                  />
                  <div className="rounded-lg border border-forest-900/10">
                    {summary}
                    <div className="border-t border-forest-900/10 px-2 py-1">
                      <button type="button" onClick={() => goStep(2)}
                        className="min-h-11 px-2 text-sm font-body font-medium text-teal-700 hover:text-teal-800">
                        Change the design
                      </button>
                    </div>
                  </div>
                  {/* 06 §5 p.3 — the estimate again on the review step, before "SUBMIT FOR QUOTATION". */}
                  <PriceEstimateBox studioProductId={selectedOption?.id} totalQty={total} />
                </aside>

                <div className="space-y-6 min-w-0">
                  <section>
                    <h3 className="font-display text-lg text-forest-900 uppercase mb-4">Your contact details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL} htmlFor="d-name">Your name *</label>
                        <input id="d-name" autoComplete="name" className={FIELD} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required placeholder="e.g. Ahmad bin Ali" />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="d-phone">Phone / WhatsApp *</label>
                        <input id="d-phone" type="tel" autoComplete="tel" className={FIELD} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required placeholder="e.g. 010 217 4774" />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="d-email">Email *</label>
                        <input id="d-email" type="email" autoComplete="email" className={FIELD} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required placeholder="you@example.com" />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="d-company">Company / organisation</label>
                        <input id="d-company" autoComplete="organization" className={FIELD} value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} placeholder="Optional" />
                      </div>
                    </div>
                  </section>

                  {/* Dates, delivery and remarks are optional: folded away so they do not read as required
                      or push the send button down. Same fields, same values sent. */}
                  <details className="group rounded-lg border border-forest-900/10" open={optionalCount > 0 ? true : undefined}>
                    <summary className="list-none cursor-pointer min-h-11 px-4 py-3 flex items-center justify-between gap-3 text-sm font-body font-medium text-forest-900">
                      <span>Dates, delivery and other notes <span className="font-normal text-forest-900/55">(optional)</span></span>
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-4">
                      <div>
                        <label className={LABEL} htmlFor="d-event">Event date</label>
                        <input id="d-event" type="date" min={today} className={FIELD} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="d-delivery-date">Needed by</label>
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
                  </details>
                  <p className="text-xs font-body text-forest-900/55">
                    Sending is free and commits you to nothing — the price is confirmed by our sales team before any work starts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitted && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8 text-white" /></div>
              <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">Design sent</h3>
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
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="min-h-11 inline-flex items-center bg-[#25D366] text-white px-6 rounded-md text-sm font-body font-medium hover:bg-[#128C7E] transition-colors">WhatsApp Our Team</a>
                <Link to="/" className="min-h-11 inline-flex items-center border border-forest-900/20 text-forest-900 px-6 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors">Back to Home</Link>
              </div>
            </div>
          )}

          {/* One obvious next action per step, with the order so far — always within thumb reach. */}
          {!submitted && step === 1 && (
            <OrderBar
              title={selectedProduct ?? "No product chosen yet"}
              detail={selectedProduct ? category : "Tap a product above to start"}
              whatsappText="Hi ASK Creative, I need help with the online design tool."
              action={{
                label: "Start designing",
                icon: <ChevronRight className="w-4 h-4" />,
                onClick: () => {
                  if (!selectedProduct) { toast.error("Tap a product first."); return; }
                  goStep(2);
                },
              }}
            />
          )}
          {!submitted && step === 2 && (
            <OrderBar
              title={`${selectedProduct ?? ""} · ${total} pc${total === 1 ? "" : "s"}`}
              detail={total < minQty
                ? `Add your sizes — minimum ${minQty} pieces`
                : estimateLine || "Price confirmed by our sales team"}
              onBack={() => goStep(1)}
              whatsappText={`Hi ASK Creative, I am designing a ${selectedProduct ?? "product"} online and have a question.`}
              action={{ label: "Review", icon: <ChevronRight className="w-4 h-4" />, onClick: toReview }}
            />
          )}
          {!submitted && step === 3 && (
            <OrderBar
              title={`${selectedProduct ?? ""} · ${total} pcs`}
              detail={estimateLine || "Price confirmed by our sales team"}
              onBack={() => goStep(2)}
              whatsappText={`Hi ASK Creative, I am sending a ${selectedProduct ?? "product"} design for a quotation.`}
              action={{
                label: preparing ? "Preparing…" : pending ? "Sending…" : <><span className="sm:hidden">Send</span><span className="hidden sm:inline">Send for quotation</span></>,
                icon: pending ? undefined : <Send className="w-4 h-4" />,
                onClick: () => void handleSubmit(),
                busy: pending,
              }}
            />
          )}
        </div>
      </section>

      <EditorSheet
        open={editorOpen && step === 2}
        onClose={() => setEditorOpen(false)}
        title={`Design your ${selectedProduct ?? "product"}`}
        stage={
          <DesignStage {...look} doc={doc} side={side} idPrefix="fs" interactive lockTouch update={update}
            selectedId={selectedId} onSelect={setSelectedId} svgClassName="h-full w-full" />
        }
        tools={editorTools}
      />
    </>
  );
}

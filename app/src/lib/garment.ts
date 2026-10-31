import { useEffect, useState } from "react";
import * as THREE from "three";

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt((hex || "#1f2937").replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v + 255 * amt))),
  );
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const SIZE_SCALE: Record<string, number> = {
  S: 0.86, M: 0.93, L: 1.0, XL: 1.07, XXL: 1.13, XXXL: 1.2,
};

/**
 * What each garment is, beyond its silhouette.
 *
 * The shape itself now comes from a draped mesh, so this table no longer carries radii and
 * profiles — only the things the mesh cannot know: which sleeve a product is sold with by
 * default, whether it opens down the front, and whether it has a hood.
 */
export type GarmentKind = {
  /** Used when the customer has not picked a sleeve length yet. */
  sleeve: "sleeveless" | "short" | "threequarter" | "long";
  placket?: "half" | "full";
  hood?: boolean;
  /** A tighter athletic cut reads narrower than a boxy one. */
  fit?: number;
};

export const GARMENTS: Record<string, GarmentKind> = {
  "T-Shirt":           { sleeve: "short" },
  "Polo Shirt":        { sleeve: "short", placket: "half" },
  "Corporate Shirt":   { sleeve: "long", placket: "full", fit: 0.96 },
  "Hoodie":            { sleeve: "long", hood: true, fit: 1.07 },
  "Windbreaker":       { sleeve: "long", placket: "full", fit: 1.06 },
  "Football Jersey":   { sleeve: "short", fit: 0.97 },
  "Basketball Jersey": { sleeve: "sleeveless", fit: 0.96 },
  "Baseball Jersey":   { sleeve: "short", placket: "full" },
  "Running Singlet":   { sleeve: "sleeveless", fit: 0.92 },
};

/** Which draped mesh to load. The customer's choice wins over the product's default. */
export function cutFor(product: string, sleeve?: string): string {
  const kind = GARMENTS[product];
  const s = (sleeve ?? "").toLowerCase();
  if (s) {
    if (s.includes("sleeveless") || s.includes("singlet") || s.includes("tank")) return "tee-sleeveless";
    if (s.includes("long")) return "tee-long";
    if (s.includes("3/4") || s.includes("three") || s.includes("quarter")) return "tee-threequarter";
    if (s.includes("short") || s.includes("cap") || s.includes("raglan")) return "tee-short";
  }
  return `tee-${kind?.sleeve ?? "short"}`;
}

export type FabricSurface = {
  roughness: number;
  metalness: number;
  /** Knitwear catches a soft halo at grazing angles; a shirting weave barely does. */
  sheen: number;
  /** Which CC0 weave to lay over the surface, from public/fabric/. */
  maps: "cotton" | "polyester" | "fleece";
  /** Repeats per unit of the mesh's own space. A weave is much smaller than a shirt. */
  weaveScale: number;
  /** How far the weave is allowed to move the roughness: 0 = smooth, 1 = full. */
  weaveAmount: number;
};

/** Cotton drinks light, dry-fit and satin give some back. The weave, as a material. */
export function fabricSurface(fabric: string | undefined): FabricSurface {
  const f = (fabric ?? "").toLowerCase();
  if (f.includes("satin") || f.includes("silk"))
    return { roughness: 0.38, metalness: 0.04, sheen: 0.8, maps: "cotton", weaveScale: 55, weaveAmount: 0.35 };
  if (f.includes("fleece") || f.includes("terry"))
    return { roughness: 0.97, metalness: 0, sheen: 0.2, maps: "fleece", weaveScale: 28, weaveAmount: 0.8 };
  if (f.includes("dry") || f.includes("micro") || f.includes("poly") || f.includes("mesh"))
    return { roughness: 0.72, metalness: 0.01, sheen: 0.4, maps: "polyester", weaveScale: 60, weaveAmount: 0.6 };
  return { roughness: 0.92, metalness: 0, sheen: 0.3, maps: "cotton", weaveScale: 50, weaveAmount: 0.6 };
}

/**
 * Load the customer's artwork as a texture.
 *
 * Deliberately not drei's `useTexture`: that suspends, and a half-filled form should keep
 * showing the garment while the file decodes rather than blanking the whole preview.
 */
export function useArtwork(url?: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let live = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (!live) { t.dispose(); return; }
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        setTex(t);
      },
      undefined,
      () => { if (live) setTex(null); },
    );
    return () => { live = false; };
  }, [url]);
  return tex;
}

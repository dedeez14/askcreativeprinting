import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GARMENTS, cutFor, fabricSurface, shade, useArtwork } from "../lib/garment";

/**
 * The garment the customer is designing, as a real draped mesh.
 *
 * The studio used to build shirts from lathed profiles, which gave every product the same
 * smooth slab: no folds, no weight, nothing that read as cloth (user, 31-Oct-2026: "tidak
 * suka dengan model yang sekarang terlihat kaku itu"). These meshes are cut as a pattern and
 * dropped onto a body form in Blender's cloth solver, so the hem, the waist and the underarms
 * already carry the folds fabric actually falls into. See assets3d/make_garments.py.
 *
 * Three things are layered on top of that shape here:
 *   • the customer's colour, as a tint — the mesh ships untextured on purpose
 *   • a CC0 weave (normal + roughness) so a tinted surface reads as fabric, not plastic
 *   • the uploaded artwork, projected from the front in object space
 *
 * The artwork is deliberately NOT placed through UVs. Projecting it means the print lands on
 * the chest no matter how the mesh happens to be unwrapped, and because it is blended before
 * lighting, the garment's own folds and weave fall across the print the way ink on cloth does.
 */

const MODEL_BASE = "/models";
const FABRIC_BASE = "/fabric";

/** Where the print sits, in the mesh's own units: x centred, y up from the hem. */
const PRINT = { halfWidth: 0.125, top: 0.885, bottom: 0.635 };

/*
 * Trim is positioned in the mesh's own units and scaled with it, so these stay right however
 * the mesh is normalised. The torso is an ellipse, not a circle, so the bands are squashed
 * front-to-back by the same ratio the body has at that height.
 */
const NECK = { radius: 0.106, squash: 0.90 };
const FRONT_Z = 0.142;

/** Everything the mesh is normalised to, so the camera framing never has to change. */
const TARGET_HEIGHT = 2.05;

type Props = {
  product: string;
  collar: string;
  color: string;
  secondaryColor?: string;
  sleeve?: string;
  fabric?: string;
  artworkUrl?: string;
};

/** Load the weave without suspending — the garment stays up while the texture arrives. */
function useWeave(name: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let live = true;
    new THREE.TextureLoader().load(
      `${FABRIC_BASE}/${name}-roughness.webp`,
      (t) => {
        if (!live) { t.dispose(); return; }
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
        setTex(t);
      },
      undefined,
      () => { if (live) setTex(null); },
    );
    return () => { live = false; };
  }, [name]);

  return tex;
}

export default function GarmentModel({
  product, collar, color, secondaryColor, sleeve, fabric, artworkUrl,
}: Props) {
  const kind = GARMENTS[product];
  const cut = cutFor(product, sleeve);
  const { scene } = useGLTF(`${MODEL_BASE}/${cut}.glb`);
  const surface = useMemo(() => fabricSurface(fabric), [fabric]);
  const art = useArtwork(artworkUrl);
  const weave = useWeave(surface.maps);

  const trim = useMemo(
    () => (/^#[0-9a-fA-F]{6}$/.test(secondaryColor ?? "") ? (secondaryColor as string) : shade(color, -0.16)),
    [secondaryColor, color],
  );

  /** The mesh as it comes out of the file, normalised to a known height and centred. */
  const base = useMemo(() => {
    let geom: THREE.BufferGeometry | null = null;
    scene.traverse((o) => { if (!geom && (o as THREE.Mesh).isMesh) geom = (o as THREE.Mesh).geometry; });
    if (!geom) return null;
    const g = (geom as THREE.BufferGeometry).clone();
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const height = box.max.y - box.min.y;
    return {
      geometry: g,
      scale: TARGET_HEIGHT / height,
      centreY: (box.max.y + box.min.y) / 2,
      top: box.max.y,
      bottom: box.min.y,
    };
  }, [scene]);

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color || "#1f2937"),
      roughness: surface.roughness,
      metalness: surface.metalness,
      sheen: surface.sheen,
      sheenRoughness: 0.9,
      sheenColor: new THREE.Color("#ffffff"),
      side: THREE.DoubleSide,
    });

    /*
     * Two things are injected here, and both read the mesh's own coordinates rather than its
     * UVs.
     *
     * The artwork is projected from the front, so the print lands on the chest however the
     * mesh happens to be unwrapped, and — because it is blended before lighting — the
     * garment's folds fall across it the way they fall across ink on cloth.
     *
     * The weave is sampled the same way, projected on all three axes and blended by the
     * surface normal. Tiling it through the UVs instead left a grid of seams across the
     * shirt, because the unwrap packs the garment as many small islands.
     */
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uArt = { value: art };
      shader.uniforms.uArtOn = { value: art ? 1 : 0 };
      shader.uniforms.uArtRect = {
        value: new THREE.Vector4(
          -PRINT.halfWidth, PRINT.bottom,
          PRINT.halfWidth * 2, PRINT.top - PRINT.bottom,
        ),
      };
      shader.uniforms.uWeave = { value: weave };
      shader.uniforms.uWeaveOn = { value: weave ? 1 : 0 };
      shader.uniforms.uWeaveScale = { value: surface.weaveScale };
      shader.uniforms.uWeaveAmt = { value: surface.weaveAmount };

      shader.vertexShader = `varying vec3 vGarmentPos;\nvarying vec3 vGarmentNrm;\n${shader.vertexShader}`
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vGarmentPos = position;")
        .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n  vGarmentNrm = normal;");

      shader.fragmentShader = `
        uniform sampler2D uArt;
        uniform float uArtOn;
        uniform vec4 uArtRect;
        uniform sampler2D uWeave;
        uniform float uWeaveOn;
        uniform float uWeaveScale;
        uniform float uWeaveAmt;
        varying vec3 vGarmentPos;
        varying vec3 vGarmentNrm;

        float garmentWeave() {
          vec3 n = abs(normalize(vGarmentNrm));
          vec3 w = n / max(n.x + n.y + n.z, 1e-4);
          return texture2D(uWeave, vGarmentPos.yz * uWeaveScale).g * w.x
               + texture2D(uWeave, vGarmentPos.xz * uWeaveScale).g * w.y
               + texture2D(uWeave, vGarmentPos.xy * uWeaveScale).g * w.z;
        }
      ${shader.fragmentShader}`
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           if (uArtOn > 0.5 && vGarmentNrm.z > 0.18) {
             vec2 auv = (vGarmentPos.xy - uArtRect.xy) / uArtRect.zw;
             if (auv.x > 0.0 && auv.x < 1.0 && auv.y > 0.0 && auv.y < 1.0) {
               vec4 ink = texture2D(uArt, vec2(auv.x, auv.y));
               diffuseColor.rgb = mix(diffuseColor.rgb, ink.rgb, ink.a);
             }
           }`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           if (uWeaveOn > 0.5) {
             float weave = garmentWeave();
             roughnessFactor = clamp(
               mix(roughnessFactor, roughnessFactor * (0.78 + 0.44 * weave), uWeaveAmt),
               0.06, 1.0);
           }`,
        );
    };
    m.customProgramCacheKey = () => (art ? "art" : "plain");
    return m;
  }, [color, surface, weave, art]);

  useEffect(() => () => material.dispose(), [material]);

  const trimMaterial = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(trim),
      roughness: Math.min(0.95, surface.roughness + 0.05),
      sheen: surface.sheen * 0.8,
      side: THREE.DoubleSide,
    }),
    [trim, surface],
  );
  useEffect(() => () => trimMaterial.dispose(), [trimMaterial]);

  if (!base) return null;

  const s = base.scale * (kind?.fit ?? 1);
  const neckY = (base.top - base.centreY) * s;
  const c = (collar ?? "").toLowerCase();
  const hooded = kind?.hood || c.includes("hood");
  const placket = kind?.placket;

  return (
    <group position={[0, -base.centreY * s, 0]}>
      <mesh geometry={base.geometry} material={material} scale={[s, s, s]} castShadow receiveShadow />

      {/* Neck rib. Every one of these garments has one, and without it the opening reads
          as a hole cut in a sheet rather than a finished collar. */}
      {!hooded && (
        <mesh
          position={[0, base.centreY * s + neckY - 0.012 * s, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, NECK.squash, 1]}
          material={trimMaterial}
          castShadow
        >
          <torusGeometry args={[NECK.radius * s, (c.includes("mandarin") ? 0.030 : 0.016) * s, 10, 48]} />
        </mesh>
      )}

      {/* Front opening, for the products that have one. */}
      {placket && (
        <mesh
          position={[
            0,
            base.centreY * s + neckY - (placket === "full" ? 0.30 : 0.12) * s,
            FRONT_Z * s,
          ]}
          material={trimMaterial}
          castShadow
        >
          <boxGeometry args={[0.024 * s, (placket === "full" ? 0.52 : 0.18) * s, 0.006 * s]} />
        </mesh>
      )}

      {/* Hood, sitting behind the neck where it hangs when it is not worn up. */}
      {hooded && (
        <mesh
          position={[0, base.centreY * s + neckY - 0.03 * s, -0.08 * s]}
          rotation={[0.5, 0, 0]}
          material={material}
          castShadow
        >
          <sphereGeometry args={[0.15 * s, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload(`${MODEL_BASE}/tee-short.glb`);

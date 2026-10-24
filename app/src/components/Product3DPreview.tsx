import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * Interactive 3D product preview for the Online Design studio.
 *
 * Garments are built as real volumetric meshes (not flat extrusions):
 *   • torso  – an elliptical tube whose radius follows a chest→waist→hem profile
 *   • yoke   – a domed shoulder surface with a genuine neck opening cut into it,
 *              the opening's shape/depth coming from the selected collar
 *   • sleeves– tapered tubes angled out and down from the shoulders
 *   • collar – rib band / polo flaps / mandarin stand / hood on top of the opening
 *
 * Selections drive the model live: product → silhouette, collar → neckline,
 * colour → fabric material, size → overall scale.
 */

export interface Product3DPreviewProps {
  product: string;
  collar: string;
  color: string;
  size: string;
}

/* ─────────────────────────── helpers ─────────────────────────── */

/** Shade a hex colour by `amt` (-1 darkens, +1 lightens) for trims/accents. */
function shade(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt, 0.04, 0.96));
  return `#${c.getHexString()}`;
}

const SIZE_SCALE: Record<string, number> = {
  S: 0.86, M: 0.93, L: 1.0, XL: 1.07, XXL: 1.13, XXXL: 1.2,
};

type GarmentSpec = {
  chest: number;               // half chest width (x radius at the chest)
  flat: number;                // z/x ratio — how deep the body is front-to-back
  len: number;                 // shoulder → hem
  profile: [number, number][]; // [t, radius multiplier] down the body
  sleeveLen: number;           // 0 = sleeveless
  sleeveAngle: number;         // radians below horizontal
  rArm: number;                // sleeve radius at the armhole
  rCuff: number;               // sleeve radius at the cuff
  neckX: number;               // neck opening half width
  neckZ: number;               // neck opening half depth
  placket?: "half" | "full";
  hood?: boolean;
};

/** Straight-ish body (tees, hoodies) vs tapered athletic cut. */
const STRAIGHT: [number, number][] = [[0, 0.99], [0.14, 1.0], [0.55, 0.98], [1, 1.01]];
const TAPERED:  [number, number][] = [[0, 0.99], [0.14, 1.0], [0.55, 0.93], [1, 0.96]];
const BOXY:     [number, number][] = [[0, 1.0], [0.14, 1.0], [0.60, 1.0], [1, 1.02]];

const GARMENTS: Record<string, GarmentSpec> = {
  "T-Shirt":           { chest: 0.72, flat: 0.46, len: 1.62, profile: STRAIGHT, sleeveLen: 0.46, sleeveAngle: 0.22, rArm: 0.27, rCuff: 0.235, neckX: 0.235, neckZ: 0.15 },
  "Polo Shirt":        { chest: 0.71, flat: 0.46, len: 1.62, profile: STRAIGHT, sleeveLen: 0.44, sleeveAngle: 0.22, rArm: 0.26, rCuff: 0.225, neckX: 0.215, neckZ: 0.14, placket: "half" },
  "Corporate Shirt":   { chest: 0.68, flat: 0.44, len: 1.74, profile: TAPERED,  sleeveLen: 1.02, sleeveAngle: 0.34, rArm: 0.235, rCuff: 0.14, neckX: 0.21, neckZ: 0.135, placket: "full" },
  "Hoodie":            { chest: 0.80, flat: 0.52, len: 1.66, profile: BOXY,     sleeveLen: 1.02, sleeveAngle: 0.32, rArm: 0.28, rCuff: 0.175, neckX: 0.25, neckZ: 0.16, hood: true },
  "Windbreaker":       { chest: 0.78, flat: 0.50, len: 1.62, profile: BOXY,     sleeveLen: 1.00, sleeveAngle: 0.32, rArm: 0.275, rCuff: 0.17, neckX: 0.235, neckZ: 0.15, placket: "full" },
  "Football Jersey":   { chest: 0.70, flat: 0.44, len: 1.58, profile: TAPERED,  sleeveLen: 0.40, sleeveAngle: 0.22, rArm: 0.255, rCuff: 0.225, neckX: 0.23, neckZ: 0.145 },
  "Basketball Jersey": { chest: 0.68, flat: 0.42, len: 1.64, profile: TAPERED,  sleeveLen: 0.00, sleeveAngle: 0,    rArm: 0,     rCuff: 0,     neckX: 0.25, neckZ: 0.155 },
  "Baseball Jersey":   { chest: 0.72, flat: 0.46, len: 1.60, profile: STRAIGHT, sleeveLen: 0.42, sleeveAngle: 0.22, rArm: 0.26,  rCuff: 0.23,  neckX: 0.23, neckZ: 0.145, placket: "full" },
  "Running Singlet":   { chest: 0.62, flat: 0.40, len: 1.52, profile: TAPERED,  sleeveLen: 0.00, sleeveAngle: 0,    rArm: 0,     rCuff: 0,     neckX: 0.20, neckZ: 0.13 },
};

/** Radius multiplier at normalised height `t` (0 = shoulder, 1 = hem). */
function profileAt(profile: [number, number][], t: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const [t0, r0] = profile[i];
    const [t1, r1] = profile[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      const s = k * k * (3 - 2 * k); // smoothstep
      return r0 + (r1 - r0) * s;
    }
  }
  return profile[profile.length - 1][1];
}

/** Shortest signed distance between two angles. */
const angleGap = (a: number, b: number) =>
  Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

/**
 * How far the neckline dips below the shoulder line at angle `a`.
 * Front centre is a = π/2 (+z). This is what makes a V-neck a V.
 */
function necklineDip(a: number, collar: string): number {
  const d = angleGap(a, Math.PI / 2);           // 0 at the front centre
  const back = angleGap(a, -Math.PI / 2);
  const backDip = Math.max(0, 1 - back / 1.3) * 0.03; // slight scoop at the nape
  switch (collar) {
    case "V-Neck":
      return Math.max(0, 1 - d / 1.0) * 0.5 + backDip;
    case "Polo Collar":
      return Math.max(0, 1 - d / 0.85) * 0.17 + backDip;
    case "Hoodie":
      return Math.max(0, 1 - d / 1.25) * 0.12 + backDip;
    case "Mandarin Collar":
      return Math.max(0, 1 - d / 1.0) * 0.05 + backDip;
    default: // Round Neck / Rib Collar
      return Math.max(0, 1 - d / 1.15) * 0.09 + backDip;
  }
}

/* ───────────────────── geometry builders ───────────────────── */

/** Elliptical tube from shoulder to hem following the body profile. */
function buildTorso(spec: GarmentSpec): THREE.BufferGeometry {
  const SEG_Y = 40, SEG_R = 64;
  const pos: number[] = [], idx: number[] = [];

  for (let i = 0; i <= SEG_Y; i++) {
    const t = i / SEG_Y;
    const y = -t * spec.len;
    const r = spec.chest * profileAt(spec.profile, t);
    const rz = r * spec.flat;
    for (let j = 0; j <= SEG_R; j++) {
      const a = (j / SEG_R) * Math.PI * 2;
      pos.push(r * Math.cos(a), y, rz * Math.sin(a));
    }
  }
  for (let i = 0; i < SEG_Y; i++) {
    for (let j = 0; j < SEG_R; j++) {
      const a = i * (SEG_R + 1) + j;
      const b = a + SEG_R + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Domed shoulder surface spanning the torso rim → the neck opening. */
function buildYoke(spec: GarmentSpec, collar: string): THREE.BufferGeometry {
  const SEG = 96;
  const rimR = spec.chest * profileAt(spec.profile, 0);
  const rimZ = rimR * spec.flat;
  const pos: number[] = [], idx: number[] = [];

  for (let j = 0; j <= SEG; j++) {
    const a = (j / SEG) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    // outer rim — sits on the torso top, shoulders dropping slightly at the sides
    const shoulderDrop = Math.abs(ca) * 0.06;
    pos.push(rimR * ca, -shoulderDrop, rimZ * sa);
    // inner rim — the neck opening, raised into a dome and cut by the collar
    pos.push(spec.neckX * ca, 0.13 - necklineDip(a, collar), spec.neckZ * sa);
  }
  for (let j = 0; j < SEG; j++) {
    const o0 = j * 2, i0 = j * 2 + 1, o1 = (j + 1) * 2, i1 = (j + 1) * 2 + 1;
    idx.push(o0, i0, i1, o0, i1, o1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** A collar band that follows the neck opening (rib / mandarin stand). */
function buildCollarBand(spec: GarmentSpec, collar: string, height: number): THREE.BufferGeometry {
  const SEG = 96;
  const pos: number[] = [], idx: number[] = [];
  const grow = 1.06;
  for (let j = 0; j <= SEG; j++) {
    const a = (j / SEG) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const base = 0.13 - necklineDip(a, collar);
    pos.push(spec.neckX * ca, base, spec.neckZ * sa);                      // bottom
    pos.push(spec.neckX * grow * ca, base + height, spec.neckZ * grow * sa); // top
  }
  for (let j = 0; j < SEG; j++) {
    const b0 = j * 2, t0 = j * 2 + 1, b1 = (j + 1) * 2, t1 = (j + 1) * 2 + 1;
    idx.push(b0, t0, t1, b0, t1, b1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────── garment ─────────────────────────── */

function Garment({ product, collar, color }: { product: string; collar: string; color: string }) {
  const spec = GARMENTS[product] ?? GARMENTS["T-Shirt"];
  const trim = useMemo(() => shade(color, -0.15), [color]);

  const torso = useMemo(() => buildTorso(spec), [spec]);
  const yoke = useMemo(() => buildYoke(spec, collar), [spec, collar]);
  const ribBand = useMemo(
    () => (collar === "Rib Collar" || collar === "Round Neck" || collar === "Mandarin Collar" || collar === "Polo Collar")
      ? buildCollarBand(spec, collar, collar === "Mandarin Collar" ? 0.15 : collar === "Rib Collar" ? 0.075 : 0.045)
      : null,
    [spec, collar]
  );

  // Sleeve placement: the tube starts INSIDE the torso so the shoulder join is
  // seamless (no floating gap), then reaches out and angles down.
  const anchorX = 0; // tube passes through the body — guarantees a seamless join
  const sleeveY = -0.22;
  const th = spec.sleeveAngle;
  const sleeveLen = spec.sleeveLen + spec.chest;      // add the buried part

  const fabricProps = { roughness: 0.86, metalness: 0.0 } as const;

  return (
    <group position={[0, spec.len / 2 - 0.1, 0]}>
      {/* Body */}
      <mesh geometry={torso} castShadow receiveShadow>
        <meshStandardMaterial color={color} {...fabricProps} side={THREE.DoubleSide} />
      </mesh>
      {/* Shoulders + neck opening */}
      <mesh geometry={yoke} castShadow receiveShadow>
        <meshStandardMaterial color={color} {...fabricProps} side={THREE.DoubleSide} />
      </mesh>

      {/* Sleeves — tapered tubes, one per side */}
      {spec.sleeveLen > 0 && [-1, 1].map((dir) => {
        const cx = dir * (anchorX + Math.cos(th) * sleeveLen * 0.5);
        const cy = sleeveY - Math.sin(th) * sleeveLen * 0.5;
        return (
          <group key={dir}>
            <mesh position={[cx, cy, 0]} rotation={[0, 0, -dir * (Math.PI / 2 + th)]} castShadow receiveShadow>
              <cylinderGeometry args={[spec.rCuff, spec.rArm, sleeveLen, 28, 1, true]} />
              <meshStandardMaterial color={color} {...fabricProps} side={THREE.DoubleSide} />
            </mesh>
            {/* cuff band closes the tube end */}
            <mesh
              position={[
                dir * (anchorX + Math.cos(th) * sleeveLen),
                sleeveY - Math.sin(th) * sleeveLen,
                0,
              ]}
              rotation={[0, 0, -dir * (Math.PI / 2 + th)]}
              castShadow
            >
              <cylinderGeometry args={[spec.rCuff * 1.04, spec.rCuff * 1.04, 0.07, 28]} />
              <meshStandardMaterial color={trim} roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Collar band hugging the neck opening */}
      {ribBand && (
        <mesh geometry={ribBand} castShadow>
          <meshStandardMaterial color={trim} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Polo collar flaps folding out over the band */}
      {collar === "Polo Collar" && [-1, 1].map((dir) => (
        <mesh key={dir} position={[dir * spec.neckX * 0.55, 0.10, spec.neckZ * 0.86]}
              rotation={[0.85, dir * 0.15, dir * 0.5]} castShadow>
          <boxGeometry args={[0.26, 0.015, 0.15]} />
          <meshStandardMaterial color={trim} roughness={0.75} />
        </mesh>
      ))}

      {/* V-neck trim — drawn on the CHEST SURFACE (not at the neck radius, which
          sits inside the torso) so the V is actually visible from the front. */}
      {collar === "V-Neck" && [-1, 1].map((dir) => (
        <mesh
          key={dir}
          position={[dir * spec.neckX * 0.52, -0.13, spec.chest * spec.flat * 1.01]}
          rotation={[0, 0, dir * 0.46]}
          castShadow
        >
          <boxGeometry args={[0.055, 0.56, 0.035]} />
          <meshStandardMaterial color={trim} roughness={0.8} />
        </mesh>
      ))}

      {/* Hood — a rounded shell sitting behind the neck */}
      {(spec.hood || collar === "Hoodie") && (
        <mesh position={[0, 0.08, -spec.neckZ * 1.5]} rotation={[0.75, 0, 0]}
              scale={[1.45, 1.0, 0.95]} castShadow receiveShadow>
          <sphereGeometry args={[spec.neckX + 0.2, 40, 26, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={shade(color, -0.05)} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Button placket / zip down the front */}
      {spec.placket && (
        <mesh
          position={[0, spec.placket === "full" ? -spec.len * 0.46 : -0.32, spec.chest * spec.flat * 0.99]}
          castShadow
        >
          <boxGeometry args={[0.075, spec.placket === "full" ? spec.len * 0.86 : 0.5, 0.02]} />
          <meshStandardMaterial color={trim} roughness={0.7} />
        </mesh>
      )}

      {/* Hem band */}
      <mesh position={[0, -spec.len + 0.03, 0]} castShadow>
        <cylinderGeometry
          args={[
            spec.chest * profileAt(spec.profile, 1) * 1.005,
            spec.chest * profileAt(spec.profile, 1) * 1.005,
            0.06, 64, 1, true,
          ]}
          onUpdate={(g) => g.scale(1, 1, spec.flat)}
        />
        <meshStandardMaterial color={trim} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ───────────────────── non-garment products ───────────────────── */

function OtherProduct({ product, color }: { product: string; color: string }) {
  const trim = useMemo(() => shade(color, -0.18), [color]);
  const mat = <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />;

  switch (product) {
    case "Cap":
      return (
        <group>
          <mesh castShadow receiveShadow scale={[1, 0.82, 1]}>
            <sphereGeometry args={[0.72, 44, 28, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.02, 0.44]} rotation={[-0.16, 0, 0]} scale={[1, 0.1, 0.66]} castShadow>
            <cylinderGeometry args={[0.74, 0.74, 0.5, 44, 1, false, Math.PI * 0.15, Math.PI * 0.7]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.055, 16, 12]} />
            <meshStandardMaterial color={trim} roughness={0.5} />
          </mesh>
        </group>
      );

    case "Mug":
      return (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.52, 0.46, 1.05, 56, 1, true]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.46, 56]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.47, 0.52, 56]} />
            <meshStandardMaterial color={trim} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.72, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.28, 0.075, 20, 44, Math.PI * 1.25]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
          </mesh>
        </group>
      );

    case "Lanyard":
      return (
        <group>
          <mesh scale={[0.62, 1, 1]} castShadow>
            <torusGeometry args={[0.78, 0.05, 16, 72]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.82, 0]} castShadow>
            <boxGeometry args={[0.34, 0.5, 0.04]} />
            <meshStandardMaterial color={trim} roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      );

    case "Banner":
    case "Bunting":
      return (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.25, 1.85, 0.035]} />
            {mat}
          </mesh>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[0, d * 0.96, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.42, 24]} />
              <meshStandardMaterial color={trim} roughness={0.35} metalness={0.5} />
            </mesh>
          ))}
        </group>
      );

    case "Sticker":
      return (
        <mesh rotation={[-0.4, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.035, 64]} />
          {mat}
        </mesh>
      );

    default: // Premium Gift
      return (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.9, 1.15]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[1.19, 0.94, 0.15]} />
            <meshStandardMaterial color={trim} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.15, 0.94, 1.19]} />
            <meshStandardMaterial color={trim} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.17, 0.05, 14, 32]} />
            <meshStandardMaterial color={trim} roughness={0.45} />
          </mesh>
        </group>
      );
  }
}

/* ─────────────────────────── scene ─────────────────────────── */

function Model({ product, collar, color, size }: Product3DPreviewProps) {
  const group = useRef<THREE.Group>(null);
  const isGarment = product in GARMENTS;
  // Size only scales things people wear — a mug or banner shouldn't shrink.
  const sizes = isGarment || product === "Cap";
  const scale = sizes ? (SIZE_SCALE[size] ?? 1) : 1;

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), Math.min(1, dt * 6));
  });

  return (
    <group ref={group} scale={[scale, scale, scale]}>
      {isGarment
        ? <Garment product={product} collar={collar} color={color} />
        : <OtherProduct product={product} color={color} />}
    </group>
  );
}

export default function Product3DPreview({ product, collar, color, size }: Product3DPreviewProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.2, 0.35, 4.3], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#f4f5f2"]} />

      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#ffffff", "#c9cfc6", 0.55]} />
      <directionalLight
        position={[3.4, 5, 4.2]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight position={[-4, 2.4, -3]} intensity={0.55} color="#cfe3ff" />
      <directionalLight position={[0, -2, 3]} intensity={0.25} />

      <Model product={product} collar={collar} color={color} size={size} />

      <ContactShadows position={[0, -1.15, 0]} opacity={0.34} scale={6} blur={2.6} far={3.5} />

      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.0}
        minDistance={2.6}
        maxDistance={6.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.8}
      />
    </Canvas>
  );
}

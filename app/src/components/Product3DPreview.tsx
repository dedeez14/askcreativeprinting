import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import GarmentModel from "./GarmentModel";
import { GARMENTS, SIZE_SCALE, fabricSurface, shade, useArtwork } from "../lib/garment";

/**
 * Interactive 3D product preview for the Online Design studio.
 *
 * Garments come from draped meshes built in Blender's cloth solver and are rendered by
 * GarmentModel; everything else on this page — mugs, caps, banners, lanyards — is rigid in
 * real life too, so those are still generated here.
 *
 * Selections drive the model live: product → which mesh, sleeve → which cut, collar →
 * neckline, colour → fabric tint, fabric → the weave it is lit as, size → overall scale.
 */

export interface Product3DPreviewProps {
  product: string;
  collar: string;
  color: string;
  size: string;
  /**
   * Everything below is optional so the preview can be shown the moment a product is picked and
   * then sharpen as the customer fills the form in (user, 31-Oct-2026: "untuk main color / collar
   * type dan input input lain yang bisa merubah model harusnya model disesuaikan pada form input
   * yang di pilih"). Each one changes what is rendered, not just a label:
   */
  /** Trim colour: collar band, cuffs, hem and placket. Empty = a shade of the main colour. */
  secondaryColor?: string;
  /** Sleeveless / short / long / three-quarter — changes the sleeve geometry, not its colour. */
  sleeve?: string;
  /** Cotton is matte, dry-fit and satin catch the light — the material, not the shape. */
  fabric?: string;
  /** The customer's uploaded artwork, shown on the chest (or the print face of a non-garment). */
  artworkUrl?: string;
  /** Turn the idle spin off while someone is dragging the artwork into place. */
  autoRotate?: boolean;
}

/* ─────────────────────────── helpers ─────────────────────────── */

/** Shade a hex colour by `amt` (-1 darkens, +1 lightens) for trims/accents. */
/* ───────────────────── non-garment products ───────────────────── */

function OtherProduct({ product, color, secondaryColor, fabric, artworkUrl }: {
  product: string; color: string; secondaryColor?: string; fabric?: string; artworkUrl?: string;
}) {
  const trim = useMemo(
    () => (/^#[0-9a-fA-F]{6}$/.test(secondaryColor ?? "") ? (secondaryColor as string) : shade(color, -0.18)),
    [secondaryColor, color],
  );
  const fp = fabricSurface(fabric);
  const mat = <meshStandardMaterial color={color} roughness={Math.min(0.9, fp.roughness * 0.75)} metalness={0.05} />;
  const art = useArtwork(artworkUrl);
  /*
   * Where the print goes on each of these, so a customer who uploads a logo sees it on the thing
   * they are buying: around the mug, on the face of a banner, on the front panel of a cap.
   */
  const print = (() => {
    if (!art) return null;
    const m = (
      <meshStandardMaterial map={art} transparent alphaTest={0.02} roughness={0.5}
        polygonOffset polygonOffsetFactor={-2} side={THREE.FrontSide} />
    );
    switch (product) {
      case "Mug":
        return (
          <mesh position={[0, 0.02, 0]} renderOrder={2}>
            <cylinderGeometry args={[0.527, 0.472, 0.62, 56, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
            {m}
          </mesh>
        );
      case "Cap":
        return (
          <mesh position={[0, 0.3, 0.57]} rotation={[-0.22, 0, 0]} renderOrder={2}>
            <planeGeometry args={[0.62, 0.4]} />
            {m}
          </mesh>
        );
      case "Banner":
      case "Bunting":
        return (
          <mesh position={[0, 0, 0.022]} renderOrder={2}>
            <planeGeometry args={[1.1, 1.6]} />
            {m}
          </mesh>
        );
      case "Sticker":
        return (
          <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
            <planeGeometry args={[1.3, 1.3]} />
            {m}
          </mesh>
        );
      case "Lanyard":
        return (
          <mesh position={[0, -0.82, 0.025]} renderOrder={2}>
            <planeGeometry args={[0.3, 0.44]} />
            {m}
          </mesh>
        );
      default:
        return (
          <mesh position={[0, 0.02, 0.582]} renderOrder={2}>
            <planeGeometry args={[0.8, 0.62]} />
            {m}
          </mesh>
        );
    }
  })();

  const body = (() => {
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
  })();

  return <group>{body}{print}</group>;
}

/* ─────────────────────────── scene ─────────────────────────── */

/**
 * Studio lighting from an image-based environment rather than lamps alone.
 *
 * Three directional lights give a surface one highlight and a flat wash; what makes fabric
 * look like fabric is light arriving from every direction at different strengths. This is
 * three.js's own room, generated in memory — nothing is downloaded for it.
 */
function StudioLight() {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    // At full strength the room washes a dark club colour out to a pale tint — the customer
    // has to recognise the colour they picked, so the environment shapes the surface and the
    // lamps carry the exposure.
    scene.environmentIntensity = 0.5;
    return () => { env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

function Model({ product, collar, color, size, secondaryColor, sleeve, fabric, artworkUrl }: Product3DPreviewProps) {
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
        ? (
          // The mesh is fetched per cut, so a sleeve change loads a different file.
          <Suspense fallback={null}>
            <GarmentModel product={product} collar={collar} color={color}
              secondaryColor={secondaryColor} sleeve={sleeve} fabric={fabric} artworkUrl={artworkUrl} />
          </Suspense>
        )
        : <OtherProduct product={product} color={color}
            secondaryColor={secondaryColor} fabric={fabric} artworkUrl={artworkUrl} />}
    </group>
  );
}

export default function Product3DPreview({
  product, collar, color, size, secondaryColor, sleeve, fabric, artworkUrl, autoRotate = true,
}: Product3DPreviewProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.2, 0.35, 4.3], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#f4f5f2"]} />

      <StudioLight />
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#ffffff", "#c9cfc6", 0.28]} />
      <directionalLight
        position={[3.4, 5, 4.2]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight position={[-4, 2.4, -3]} intensity={0.55} color="#cfe3ff" />
      <directionalLight position={[0, -2, 3]} intensity={0.25} />

      <Model product={product} collar={collar} color={color} size={size}
        secondaryColor={secondaryColor} sleeve={sleeve} fabric={fabric} artworkUrl={artworkUrl} />

      <ContactShadows position={[0, -1.15, 0]} opacity={0.34} scale={6} blur={2.6} far={3.5} />

      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.0}
        minDistance={2.6}
        maxDistance={6.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.8}
      />
    </Canvas>
  );
}

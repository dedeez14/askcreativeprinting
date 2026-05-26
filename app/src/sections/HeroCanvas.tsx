import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D texture1;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_scale;
  uniform vec2 u_textureFactor;
  uniform vec2 u_imageRes;
  varying vec2 vUv;

  vec2 preserveAspectRatio(vec2 uv, vec2 resolution, vec2 imageRes) {
    vec2 ratio = vec2(
      min((resolution.x / resolution.y) / (imageRes.x / imageRes.y), 1.0),
      min((resolution.y / resolution.x) / (imageRes.y / imageRes.x), 1.0)
    );
    return vec2(
      uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
  }

  void main() {
    vec2 uv = vUv;
    float time = u_time * 0.2 * u_speed;
    uv = preserveAspectRatio(uv, u_resolution, u_imageRes);
    uv.x *= u_scale;
    float t = mod(time, 1.0);
    uv.x += t;
    vec4 color = texture2D(texture1, uv);
    gl_FragColor = color;
  }
`;

class CarouselScene {
  el: HTMLElement;
  scene: THREE.Scene;
  factor: number;
  scroll: number;
  scrollTarget: number;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  direction: string;
  speed: number;
  images: string[];
  materials: THREE.ShaderMaterial[];
  material1!: THREE.ShaderMaterial;
  material2!: THREE.ShaderMaterial;
  planeGeometry!: THREE.PlaneGeometry;
  plane1!: THREE.Mesh;
  plane2!: THREE.Mesh;
  private animId: number | null = null;

  constructor(el: HTMLElement, images: string[], direction = 'left', speed = 1) {
    this.el = el;
    this.scene = new THREE.Scene();
    this.factor = 30;
    this.scroll = 0;
    this.scrollTarget = 0;

    this.camera = new THREE.OrthographicCamera(
      this.el.offsetWidth / -2,
      this.el.offsetWidth / 2,
      this.el.offsetHeight / 2,
      this.el.offsetHeight / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight);
    this.el.appendChild(this.renderer.domElement);

    this.direction = direction;
    this.speed = speed;
    this.images = images;
    this.materials = [];

    this.addObjects();
    this.render();
  }

  addObjects() {
    this.materials = this.images.map((image) => {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(image);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0 },
          u_speed: { value: this.speed },
          u_scale: { value: 3 },
          u_resolution: { value: new THREE.Vector2(this.el.offsetWidth, this.el.offsetHeight) },
          u_textureFactor: { value: new THREE.Vector2(1, 1) },
          u_imageRes: { value: new THREE.Vector2(1920, 1080) },
          texture1: { value: texture },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
      });
    });

    this.material1 = this.materials[0];
    this.material2 = this.materials[1] || this.materials[0];

    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 32, 32);

    this.plane1 = new THREE.Mesh(this.planeGeometry, this.material1);
    this.plane2 = new THREE.Mesh(this.planeGeometry, this.material2);

    [this.plane1, this.plane2].forEach((mesh, index) => {
      mesh.scale.set(this.factor, this.factor * 0.66, 1);
      mesh.position.y = (index === 0 ? 1 : -1) * this.factor * 0.35;
      this.scene.add(mesh);
    });
  }

  render() {
    this.scroll = lerp(this.scroll, this.scrollTarget, 0.085);
    this.material1.uniforms.u_time.value = this.scroll;
    this.material2.uniforms.u_time.value = -this.scroll;
    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    const w = this.el.offsetWidth;
    const h = this.el.offsetHeight;
    this.camera.left = w / -2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = h / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.material1.uniforms.u_resolution.value.set(w, h);
    this.material2.uniforms.u_resolution.value.set(w, h);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.planeGeometry.dispose();
    this.materials.forEach((m) => m.dispose());
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const upperRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef<CarouselScene[]>([]);

  useEffect(() => {
    if (!upperRef.current || !lowerRef.current) return;

    const heroImages = [
      '/images/hero-1.jpg',
      '/images/hero-2.jpg',
      '/images/hero-3.jpg',
      '/images/hero-4.jpg',
      '/images/hero-5.jpg',
    ];

    const upperScene = new CarouselScene(upperRef.current, heroImages, 'left', 0.75);
    const lowerScene = new CarouselScene(lowerRef.current, heroImages.slice().reverse(), 'right', 1.0);

    scenesRef.current = [upperScene, lowerScene];

    // Continuous scrolling
    const scrollInterval = setInterval(() => {
      upperScene.scrollTarget += 0.003;
      lowerScene.scrollTarget += 0.003;
    }, 16);

    const handleResize = () => {
      scenesRef.current.forEach((s) => s.resize());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(scrollInterval);
      window.removeEventListener('resize', handleResize);
      scenesRef.current.forEach((s) => s.destroy());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-0 w-[60vw] h-full overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div ref={upperRef} className="absolute inset-x-0 top-0 h-1/2" />
      <div ref={lowerRef} className="absolute inset-x-0 bottom-0 h-1/2" />
      {/* Gradient overlay blending left edge into content */}
      <div
        className="absolute left-0 top-0 h-full w-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #062d2e 0%, transparent 100%)',
          zIndex: 2,
        }}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import BalloonComposition from '@/components/interactive/BalloonComposition';
import {
  BALLOON_CLUSTER_BLUEPRINTS,
  DEFAULT_HERO_BALLOON_CONFIG,
  type DispersionLimits,
  type HeroBalloonClusterConfig,
} from '@/components/interactive/heroBalloonConfig';

export {
  CTA_BALLOON_CLUSTER_CONFIG,
  DEFAULT_HERO_BALLOON_CONFIG,
  type HeroBalloonClusterConfig,
} from '@/components/interactive/heroBalloonConfig';

type ViewportTier = 'desktop' | 'tablet' | 'mobile';

interface BalloonBody {
  id: number;
  radius: number;
  aspectY: number;
  mass: number;
  massPushFactor: number;
  massSpringFactor: number;
  position: THREE.Vector3;
  restPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
  restQuat: THREE.Quaternion;
  currentTilt: THREE.Vector2;
  floatFreq: THREE.Vector3;
  floatPhase: THREE.Vector3;
  normSize: number;
}

interface GeometryVariant {
  geometry: THREE.BufferGeometry;
  aspectY: number;
}

export interface HeroBalloonCluster3DProps {
  config?: Partial<HeroBalloonClusterConfig>;
  className?: string;
  smallFallback?: boolean;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function getViewportTier(width: number): ViewportTier {
  if (width <= 600) return 'mobile';
  if (width <= 899) return 'tablet';
  return 'desktop';
}

function mergeConfig(partial?: Partial<HeroBalloonClusterConfig>): HeroBalloonClusterConfig {
  if (!partial) return DEFAULT_HERO_BALLOON_CONFIG;
  return {
    ...DEFAULT_HERO_BALLOON_CONFIG,
    ...partial,
    balloonCount: {
      ...DEFAULT_HERO_BALLOON_CONFIG.balloonCount,
      ...partial.balloonCount,
    },
    dispersionLimits: {
      ...DEFAULT_HERO_BALLOON_CONFIG.dispersionLimits,
      ...(partial.dispersionLimits as Partial<DispersionLimits> | undefined),
    },
    clusterOffset: {
      ...DEFAULT_HERO_BALLOON_CONFIG.clusterOffset,
      ...partial.clusterOffset,
    },
    compositionScale: {
      ...DEFAULT_HERO_BALLOON_CONFIG.compositionScale,
      ...partial.compositionScale,
    },
    maxPixelRatio: {
      ...DEFAULT_HERO_BALLOON_CONFIG.maxPixelRatio,
      ...partial.maxPixelRatio,
    },
  };
}

function canRunWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 1) return false;
  if (nav.connection?.saveData && (navigator.hardwareConcurrency ?? 4) <= 2) return false;

  try {
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      testCanvas.getContext('webgl', { failIfMajorPerformanceCaveat: false });
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Builds 3 smooth, organic inflated-balloon geometries (pyriform/ovoid profiles)
 * shared across all balloon meshes so they read as inflated latex rather than rigid spheres.
 */
function createBalloonGeometries(isMobile: boolean): GeometryVariant[] {
  const widthSegs = isMobile ? 38 : 52;
  const heightSegs = isMobile ? 32 : 44;

  const profiles = [
    { aspectY: 1.082, crownFullness: 0.082, neckTaper: 0.056 },
    { aspectY: 1.048, crownFullness: 0.054, neckTaper: 0.036 },
    { aspectY: 1.112, crownFullness: 0.102, neckTaper: 0.072 },
  ];

  return profiles.map(({ aspectY, crownFullness, neckTaper }) => {
    const geometry = new THREE.SphereGeometry(1, widthSegs, heightSegs);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // C-infinity smooth balloon profile: fuller upper belly, gentle lower taper toward tie point
      const lowerFactor = vy < 0 ? Math.pow(-vy, 2.35) : 0;
      const radialScale = 1 + crownFullness * vy * (1 - vy * vy) - neckTaper * lowerFactor;

      pos.setXYZ(i, vx * radialScale, vy * aspectY, vz * radialScale);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    return { geometry, aspectY };
  });
}

/**
 * Generates a soft studio environment texture (softboxes + warm ivory bounce)
 * once on initialization so satin MeshPhysicalMaterial highlights feel photographic.
 */
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#6f655b');

  // Sculptural editorial studio cyclorama: deeper contrast for dramatic satin highlights, warm bounce
  const domeGeo = new THREE.SphereGeometry(20, 24, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    color: '#766b60',
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(domeGeo, domeMat));

  const panelGeo = new THREE.PlaneGeometry(1, 1);
  const panels: Array<{
    color: string;
    pos: [number, number, number];
    scale: [number, number];
  }> = [
    // Large diffused key softbox at upper-left-front
    { color: '#ffffff', pos: [-6.5, 8.5, 7.5], scale: [11, 9] },
    // Secondary overhead warm silk diffuser
    { color: '#fffbf2', pos: [-1.0, 12.5, 2.5], scale: [10.5, 8] },
    // Dramatic warm back-right contour strip softbox
    { color: '#fff1dd', pos: [8.5, 5.5, -5.2], scale: [8.5, 9] },
    // Soft daylight fill bounce card on right
    { color: '#dce6f0', pos: [10, -1, 5.5], scale: [7.5, 7] },
    // Warm terracotta-champagne floor bounce for rich atelier shadows
    { color: '#c4ab92', pos: [0, -11, 1], scale: [18, 18] },
  ];

  const panelMats: THREE.MeshBasicMaterial[] = [];
  for (const p of panels) {
    const mat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide });
    panelMats.push(mat);
    const mesh = new THREE.Mesh(panelGeo, mat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.scale.set(p.scale[0], p.scale[1], 1);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  }

  const envRT = pmrem.fromScene(envScene, 0.055);

  domeGeo.dispose();
  domeMat.dispose();
  panelGeo.dispose();
  panelMats.forEach((m) => m.dispose());
  pmrem.dispose();

  return envRT;
}

/**
 * Creates a reusable pool of satin inflated-latex MeshPhysicalMaterials
 * (2 subtle finish variations per palette color), calibrated from Arte-Bolas.
 */
function createBalloonMaterials(palette: readonly string[]): THREE.MeshPhysicalMaterial[] {
  const materials: THREE.MeshPhysicalMaterial[] = [];
  const white = new THREE.Color('#ffffff');

  for (let cIdx = 0; cIdx < palette.length; cIdx++) {
    const hex = palette[cIdx];
    const baseColor = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    const isLightCream = hsl.l > 0.9;

    // Preserve rich atelier pigment & sculptural volume under ACES Filmic tone mapping
    const albedo = isLightCream
      ? new THREE.Color('#faf5ea')
      : baseColor.clone().offsetHSL(0, 0.06, -0.015);

    const sheenColor = albedo.clone().lerp(white, 0.52);
    const emissiveColor = isLightCream
      ? new THREE.Color('#e8dcc6')
      : albedo.clone().offsetHSL(-0.005, 0.06, -0.04);

    // Finish A: Sculptural satin atelier latex
    materials.push(
      new THREE.MeshPhysicalMaterial({
        color: albedo,
        roughness: 0.37,
        metalness: 0.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.25,
        sheen: 0.4,
        sheenRoughness: 0.5,
        sheenColor,
        ior: 1.46,
        specularIntensity: 0.74,
        envMapIntensity: 0.44,
        emissive: emissiveColor,
        emissiveIntensity: isLightCream ? 0.026 : 0.048,
      })
    );

    // Finish B: Deep velvet-matte cenography latex
    materials.push(
      new THREE.MeshPhysicalMaterial({
        color: albedo.clone().offsetHSL(0.004, 0.025, -0.018),
        roughness: 0.45,
        metalness: 0.0,
        clearcoat: 0.18,
        clearcoatRoughness: 0.34,
        sheen: 0.46,
        sheenRoughness: 0.56,
        sheenColor,
        ior: 1.45,
        specularIntensity: 0.62,
        envMapIntensity: 0.36,
        emissive: emissiveColor,
        emissiveIntensity: isLightCream ? 0.022 : 0.042,
      })
    );
  }

  return materials;
}

export default function HeroBalloonCluster3D({
  config: configOverride,
  className,
  smallFallback = false,
}: HeroBalloonCluster3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    delete container.dataset.clusterFallback;
    delete container.dataset.clusterReady;

    if (!canRunWebGL()) {
      container.dataset.clusterFallback = 'true';
      return;
    }

    const cfg = mergeConfig(configOverride);
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-balloon-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      canvas.remove();
      container.dataset.clusterFallback = 'true';
      return;
    }

    let disposed = false;
    let animationFrameId = 0;
    let loopRunning = false;

    const initialTier = getViewportTier(window.innerWidth);
    let currentTier: ViewportTier = initialTier;

    const getMaxDpr = (tier: ViewportTier) => cfg.maxPixelRatio[tier];

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getMaxDpr(currentTier)));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const envRT = createStudioEnvironment(renderer);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(
      36,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      60
    );
    const baseCameraZ = 10.4;
    camera.position.set(0, 0, baseCameraZ);

    // Dramatic sculptural studio lighting: bold key-to-fill ratio, warm amber rim contour
    const hemiLight = new THREE.HemisphereLight(0xfffcf6, 0xb89e84, 0.74);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff9f0, 1.92);
    keyLight.position.set(-5.6, 8.2, 7.2);
    keyLight.castShadow = true;
    const shadowRes = initialTier === 'mobile' ? 512 : 1024;
    keyLight.shadow.mapSize.set(shadowRes, shadowRes);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.camera.left = -4.4;
    keyLight.shadow.camera.right = 4.4;
    keyLight.shadow.camera.top = 4.4;
    keyLight.shadow.camera.bottom = -4.4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.028;
    keyLight.shadow.radius = 5.5;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xeef4fb, 0.3);
    fillLight.position.set(6.8, -1.8, 6.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeacc, 1.32);
    rimLight.position.set(6.5, 5.8, -6.0);
    scene.add(rimLight);

    const lowerBounceLight = new THREE.DirectionalLight(0xf3d7be, 0.28);
    lowerBounceLight.position.set(-6.0, -5.2, 3.8);
    scene.add(lowerBounceLight);

    let viewportWidth = 6.2;
    let viewportHeight = 6.8;

    const updateFrustumBounds = () => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewportWidth = viewportHeight * (w / h);
    };

    let geometryVariants = createBalloonGeometries(currentTier === 'mobile');
    const materials = createBalloonMaterials(cfg.palette);
    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    let balls: BalloonBody[] = [];

    const clearBalls = () => {
      for (const b of balls) {
        clusterGroup.remove(b.mesh);
      }
      balls = [];
    };

    const buildClusterForTier = (tier: ViewportTier, applyEntranceSpread: boolean) => {
      clearBalls();

      const rng = createSeededRandom(cfg.seed);
      const count = Math.max(1, cfg.balloonCount[tier]);
      const scale = cfg.compositionScale[tier];
      const offset = cfg.clusterOffset[tier];
      const paletteLen = Math.max(1, cfg.palette.length);
      const activeBlueprints = cfg.blueprints ?? BALLOON_CLUSTER_BLUEPRINTS;

      const upVec = new THREE.Vector3(0, 1, 0);
      const stemOrigin = new THREE.Vector3(offset.x - 0.1, offset.y - 2.6 * scale, offset.z - 0.25);
      const tempDir = new THREE.Vector3();

      for (let i = 0; i < count; i++) {
        const bp = activeBlueprints[i];
        let ax: number;
        let ay: number;
        let az: number;
        let sizeT: number;
        let colorIndex: number;

        if (bp) {
          ax = bp.x + (rng() - 0.5) * 0.05;
          ay = bp.y + (rng() - 0.5) * 0.05;
          az = bp.z + (rng() - 0.5) * 0.04;
          sizeT = clamp01(bp.sizeT + (rng() - 0.5) * 0.04);
          colorIndex = bp.colorIndex % paletteLen;
        } else {
          // Deterministic golden-angle fallback if balloonCount exceeds blueprint list
          const golden = i * 2.39996323;
          const rDist = 0.35 + Math.sqrt((i % 16) / 16) * 0.95;
          ax = Math.cos(golden) * rDist;
          ay = Math.sin(golden) * rDist * 1.1;
          az = (rng() - 0.5) * 0.9;
          sizeT = 0.2 + rng() * 0.7;
          colorIndex = i % paletteLen;
        }

        const radius = lerp(cfg.minRadius, cfg.maxRadius, sizeT) * scale;
        const mass = Math.pow(radius, 3);
        const minMass = Math.pow(cfg.minRadius * scale, 3);
        const maxMass = Math.pow(cfg.maxRadius * scale, 3);
        const normMass = clamp01((mass - minMass) / Math.max(maxMass - minMass, 0.0001));

        const variantIdx = i % geometryVariants.length;
        const { geometry, aspectY } = geometryVariants[variantIdx];

        const finishVariant = rng() < 0.52 ? 0 : 1;
        const material = materials[(colorIndex * 2 + finishVariant) % materials.length];

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.setScalar(radius);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const restPos = new THREE.Vector3(
          ax * 1.36 * scale + offset.x,
          ay * 1.36 * scale + offset.y,
          az * 1.08 * scale + offset.z
        );

        clusterGroup.add(mesh);

        balls.push({
          id: i,
          radius,
          aspectY,
          mass,
          massPushFactor: lerp(1.06, 0.74, normMass),
          massSpringFactor: lerp(1.08, 0.86, normMass),
          position: restPos.clone(),
          restPosition: restPos,
          velocity: new THREE.Vector3(),
          mesh,
          restQuat: new THREE.Quaternion(),
          currentTilt: new THREE.Vector2(0, 0),
          floatFreq: new THREE.Vector3(
            (0.36 + rng() * 0.24) * (cfg.floatSpeed / 0.46),
            (0.42 + rng() * 0.26) * (cfg.floatSpeed / 0.46),
            (0.28 + rng() * 0.2) * (cfg.floatSpeed / 0.46)
          ),
          floatPhase: new THREE.Vector3(
            rng() * Math.PI * 2,
            rng() * Math.PI * 2,
            rng() * Math.PI * 2
          ),
          normSize: sizeT,
        });
      }

      // Deterministic static relaxation so restPositions sit in snug, jitter-free contact equilibrium
      const sepVec = new THREE.Vector3();
      const anchorTargets = balls.map((b) => b.restPosition.clone());
      for (let iter = 0; iter < 44; iter++) {
        for (let i = 0; i < balls.length; i++) {
          balls[i].restPosition.lerp(anchorTargets[i], 0.14);
        }
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            sepVec.subVectors(b2.restPosition, b1.restPosition);
            const meanAspect = (b1.aspectY + b2.aspectY) * 0.5;
            const scaledDy = sepVec.y / meanAspect;
            const effDist = Math.sqrt(sepVec.x * sepVec.x + scaledDy * scaledDy + sepVec.z * sepVec.z);
            const minSep = (b1.radius + b2.radius) * 1.012;
            if (effDist < minSep && effDist > 0.0001) {
              const overlap = (minSep - effDist) * 0.52;
              sepVec.x /= effDist;
              sepVec.y = scaledDy / effDist;
              sepVec.z /= effDist;
              const totalMass = b1.mass + b2.mass;
              const r1 = b2.mass / totalMass;
              const r2 = b1.mass / totalMass;
              b1.restPosition.addScaledVector(sepVec, -overlap * r1);
              b2.restPosition.addScaledVector(sepVec, overlap * r2);
            }
          }
        }
      }

      // Compute natural bouquet orientation and initial placement
      const clusterCenter = new THREE.Vector3(offset.x, offset.y, offset.z);
      for (const b of balls) {
        tempDir.subVectors(b.restPosition, stemOrigin).normalize();
        // Blend upright with subtle outward bouquet fan (max ~14 deg tilt)
        tempDir.lerp(upVec, 0.72).normalize();
        b.restQuat.setFromUnitVectors(upVec, tempDir);

        if (applyEntranceSpread) {
          b.position
            .subVectors(b.restPosition, clusterCenter)
            .multiplyScalar(cfg.entranceSpread)
            .add(clusterCenter);
        } else {
          b.position.copy(b.restPosition);
        }

        b.velocity.set(0, 0, 0);
        b.mesh.position.copy(b.position);
        b.mesh.quaternion.copy(b.restQuat);
      }
    };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    const isPreloaderBlocking = (): boolean => {
      const preloader = document.querySelector<HTMLElement>('.door-preloader');
      return !!preloader && !preloader.hidden;
    };

    let entranceStarted = !isPreloaderBlocking();
    let simTime = 0;
    let entranceStartTime = 0;
    let lastNow = performance.now();
    let isInViewport = true;
    let isDocumentVisible = !document.hidden;

    buildClusterForTier(currentTier, !prefersReducedMotion);

    const syncSize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const nextTier = getViewportTier(window.innerWidth);

      if (nextTier !== currentTier) {
        const wasMobile = currentTier === 'mobile';
        const nowMobile = nextTier === 'mobile';
        currentTier = nextTier;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getMaxDpr(currentTier)));

        if (wasMobile !== nowMobile) {
          const oldGeos = geometryVariants;
          geometryVariants = createBalloonGeometries(nowMobile);
          buildClusterForTier(currentTier, false);
          oldGeos.forEach((g) => g.geometry.dispose());
        } else {
          buildClusterForTier(currentTier, false);
        }
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      updateFrustumBounds();

      if (prefersReducedMotion || !loopRunning) {
        renderer.render(scene, camera);
      }
    };

    syncSize();
    renderer.render(scene, camera);
    container.dataset.clusterReady = 'true';

    // Pointer state (adapted from Arte-Bolas for localized Hero container)
    const pointerState = {
      ndcX: 99,
      ndcY: 99,
      active: false,
      isDown: false,
    };

    // Discrete mobile tap ripple state (non-blocking to scroll)
    const touchTap = {
      startX: 0,
      startY: 0,
      startTime: 0,
      validTarget: false,
      pulseTimer: 0,
      ndcX: 0,
      ndcY: 0,
    };

    const stageSection = container.closest<HTMLElement>('section') ?? container.parentElement ?? container;

    const updateNdcFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointerState.ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerState.ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      return true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || prefersReducedMotion) return;
      if (updateNdcFromClient(e.clientX, e.clientY)) {
        pointerState.active =
          pointerState.ndcX > -1.45 &&
          pointerState.ndcX < 1.35 &&
          pointerState.ndcY > -1.35 &&
          pointerState.ndcY < 1.35;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      if (e.pointerType === 'touch') {
        const target = e.target as HTMLElement | null;
        touchTap.startX = e.clientX;
        touchTap.startY = e.clientY;
        touchTap.startTime = performance.now();
        touchTap.validTarget = !target?.closest('a, button, input, textarea, select');
        return;
      }
      if (e.button === 0) {
        updateNdcFromClient(e.clientX, e.clientY);
        pointerState.isDown = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (!prefersReducedMotion && touchTap.validTarget) {
          const dt = performance.now() - touchTap.startTime;
          const dist = Math.hypot(e.clientX - touchTap.startX, e.clientY - touchTap.startY);
          if (dt < 260 && dist < 12) {
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              if (Math.abs(nx) <= 1.05 && Math.abs(ny) <= 1.05) {
                touchTap.ndcX = nx;
                touchTap.ndcY = ny;
                touchTap.pulseTimer = 0.22;
              }
            }
          }
        }
        touchTap.validTarget = false;
        return;
      }
      pointerState.isDown = false;
    };

    const onPointerLeave = () => {
      pointerState.active = false;
      pointerState.isDown = false;
      pointerState.ndcX = 99;
      pointerState.ndcY = 99;
    };

    // Subtle scroll parallax tracking within host section
    let targetScrollProgress = 0;
    let smoothedScrollProgress = 0;
    const updateScrollProgress = () => {
      if (stageSection.classList.contains('hero')) {
        const heroHeight = Math.max(stageSection.offsetHeight, 1);
        targetScrollProgress = clamp01(window.scrollY / heroHeight);
      } else {
        const rect = stageSection.getBoundingClientRect();
        const viewH = Math.max(window.innerHeight, 1);
        const raw = (viewH - rect.top) / Math.max(viewH + rect.height, 1);
        targetScrollProgress = clamp01(raw) - 0.5;
      }
    };
    updateScrollProgress();

    // Scratch vectors for zero-allocation physics loop (following Arte-Bolas)
    const mouseProjVec = new THREE.Vector3();
    const pointerWorld3D = new THREE.Vector3();
    const prevPointerWorld3D = new THREE.Vector3();
    let hasPrevPointer = false;
    let mouseSpeed = 0;

    const diffVec = new THREE.Vector3();
    const collideDiff = new THREE.Vector3();
    const relVel = new THREE.Vector3();
    const tetherVec = new THREE.Vector3();
    const swayQuat = new THREE.Quaternion();
    const swayEuler = new THREE.Euler(0, 0, 0, 'XYZ');

    const projectNdcToWorld = (ndcX: number, ndcY: number, out: THREE.Vector3) => {
      mouseProjVec.set(ndcX, ndcY, 0.5);
      mouseProjVec.unproject(camera);
      const dir = mouseProjVec.sub(camera.position).normalize();
      const distance = (0 - camera.position.z) / dir.z;
      out.copy(camera.position).addScaledVector(dir, distance);
    };

    const simulateAndRender = () => {
      if (disposed || prefersReducedMotion || !isInViewport || !isDocumentVisible) {
        loopRunning = false;
        return;
      }

      animationFrameId = requestAnimationFrame(simulateAndRender);
      loopRunning = true;

      const now = performance.now();
      const rawDelta = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;

      // Hold simulation quietly until preloader opens, keeping Frame 1 ready
      if (!entranceStarted) {
        if (!isPreloaderBlocking()) {
          entranceStarted = true;
          entranceStartTime = simTime;
        } else {
          return;
        }
      }

      simTime += rawDelta;
      const dtStep = rawDelta * 60; // 1.0 at 60Hz, 0.5 at 120Hz

      // Coordinated subtle scroll parallax via camera Y (keeps unprojection 100% aligned)
      smoothedScrollProgress = lerp(
        smoothedScrollProgress,
        targetScrollProgress,
        1 - Math.pow(0.88, dtStep)
      );
      camera.position.y = -smoothedScrollProgress * cfg.scrollParallaxY;
      camera.updateMatrixWorld();

      // Entrance settling boost (inspired by Arte-Bolas entranceT / attractionBoost)
      const entranceT = easeOutCubic(
        clamp01((simTime - entranceStartTime) / Math.max(cfg.entranceDuration, 0.01))
      );
      const attractionBoost = lerp(2.6, 1.0, entranceT);

      // Active pointer or isolated touch tap projection
      let repelActive = false;
      let repelRadius = cfg.mouseRepelRadius * cfg.compositionScale[currentTier];
      let repelForce = cfg.mouseRepelForce;

      if (pointerState.active) {
        projectNdcToWorld(pointerState.ndcX, pointerState.ndcY, pointerWorld3D);
        repelActive = true;
        if (pointerState.isDown) {
          repelRadius *= cfg.pointerDownRadiusMultiplier;
          repelForce *= cfg.pointerDownForceMultiplier;
        }
        const instantSpeed = hasPrevPointer
          ? pointerWorld3D.distanceTo(prevPointerWorld3D) / Math.max(dtStep, 0.25)
          : 0;
        mouseSpeed = lerp(mouseSpeed, Math.min(instantSpeed, 2.2), 0.38);
        prevPointerWorld3D.copy(pointerWorld3D);
        hasPrevPointer = true;
      } else if (touchTap.pulseTimer > 0) {
        touchTap.pulseTimer = Math.max(0, touchTap.pulseTimer - rawDelta);
        projectNdcToWorld(touchTap.ndcX, touchTap.ndcY, pointerWorld3D);
        repelActive = true;
        const pulseFade = touchTap.pulseTimer / 0.22;
        repelRadius *= 1.05;
        repelForce *= 1.15 * pulseFade;
        mouseSpeed = 0.45 * pulseFade;
        hasPrevPointer = false;
      } else {
        mouseSpeed = lerp(mouseSpeed, 0, 0.25);
        hasPrevPointer = false;
      }

      const frameDamping = Math.pow(cfg.damping, dtStep);
      const scale = cfg.compositionScale[currentTier];
      const floatAmp = cfg.floatIntensity * scale;
      const floatSpeedRatio = cfg.floatSpeed / 0.46;

      // 1. ACCELERATIONS: Continuous float + elastic rest return + cursor repulsion
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        const fx =
          Math.sin(simTime * b.floatFreq.x + b.floatPhase.x) * floatAmp * (0.78 + 0.3 * b.normSize);
        const fy =
          Math.cos(simTime * b.floatFreq.y + b.floatPhase.y) * floatAmp * (0.88 + 0.28 * b.normSize);
        const fz = Math.sin(simTime * b.floatFreq.z + b.floatPhase.z) * floatAmp * 0.45;

        // Micro harmonic drift from Arte-Bolas
        b.velocity.x +=
          Math.sin(simTime * 0.4 * floatSpeedRatio + b.id * 1.5) * 0.00024 * b.radius * dtStep;
        b.velocity.y +=
          Math.cos(simTime * 0.5 * floatSpeedRatio + b.id * 1.2) * 0.00024 * b.radius * dtStep;
        b.velocity.z += Math.sin(simTime * 0.35 * floatSpeedRatio + b.id) * 0.00009 * dtStep;

        // Elastic attraction toward individual rest position in the ornamental cluster
        const targetX = b.restPosition.x + fx;
        const targetY = b.restPosition.y + fy;
        const targetZ = b.restPosition.z + fz;
        const attract = cfg.restAttractForce * attractionBoost * b.massSpringFactor * dtStep;

        b.velocity.x += (targetX - b.position.x) * attract;
        b.velocity.y += (targetY - b.position.y) * attract;
        b.velocity.z += (targetZ - b.position.z) * attract * 1.25;

        // Hover / tap repulsion (Arte-Bolas cubic Hermite falloff + speedBoost)
        if (repelActive) {
          diffVec.subVectors(b.position, pointerWorld3D);
          const rawDist = diffVec.length();
          if (rawDist < repelRadius && rawDist > 0.0001) {
            const ratio = rawDist / repelRadius;
            const smoothFactor = 1.0 - ratio * ratio * (3.0 - 2.0 * ratio);
            const speedBoost = 1 + mouseSpeed * cfg.mouseSpeedBoost;
            const push = smoothFactor * repelForce * speedBoost * b.massPushFactor * dtStep;

            if (Math.hypot(diffVec.x, diffVec.y) < 0.025) {
              diffVec.x = b.restPosition.x >= 0 ? 0.035 : -0.035;
              diffVec.y = b.restPosition.y >= 0 ? 0.035 : -0.035;
            }
            diffVec.z *= 0.14;
            diffVec.normalize();
            b.velocity.addScaledVector(diffVec, push);
          }
        }

        b.velocity.multiplyScalar(frameDamping);

        const speedSq = b.velocity.lengthSq();
        if (speedSq > cfg.maxVelocity * cfg.maxVelocity) {
          b.velocity.multiplyScalar(cfg.maxVelocity / Math.sqrt(speedSq));
        }

        b.position.addScaledVector(b.velocity, dtStep);
      }

      // 2. PAIRWISE COLLISIONS (mass-weighted separation + impulse from Arte-Bolas)
      const collideScale = cfg.collisionStrength;
      const subSteps = cfg.collisionSubSteps;
      for (let step = 0; step < subSteps; step++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            collideDiff.subVectors(b2.position, b1.position);

            // Account for slight ovoid vertical stretch so top/bottom poles collide cleanly
            const meanAspect = (b1.aspectY + b2.aspectY) * 0.5;
            const effDy = collideDiff.y / meanAspect;
            const dist = Math.sqrt(
              collideDiff.x * collideDiff.x + effDy * effDy + collideDiff.z * collideDiff.z
            );
            const minDist = b1.radius + b2.radius;

            if (dist < minDist && dist > 0.001) {
              const overlap = minDist - dist;
              collideDiff.x /= dist;
              collideDiff.y = effDy / dist;
              collideDiff.z /= dist;
              collideDiff.normalize();

              const totalMass = b1.mass + b2.mass;
              const ratio1 = b2.mass / totalMass;
              const ratio2 = b1.mass / totalMass;

              b1.position.addScaledVector(collideDiff, -overlap * ratio1 * collideScale);
              b2.position.addScaledVector(collideDiff, overlap * ratio2 * collideScale);

              relVel.subVectors(b2.velocity, b1.velocity);
              const velAlongNormal = relVel.dot(collideDiff);
              if (velAlongNormal < -0.0001) {
                const impulse =
                  (-(1 + cfg.collisionBounciness) * velAlongNormal) /
                  (1 / b1.mass + 1 / b2.mass);
                b1.velocity.addScaledVector(collideDiff, -impulse / b1.mass);
                b2.velocity.addScaledVector(collideDiff, impulse / b2.mass);
              }
            }
          }
        }
      }

      // 3. SOFT TETHER & HERO-SAFE SPATIAL CONTAINMENT + BOUQUET SWAY
      const limits = cfg.dispersionLimits;
      const softDisp = limits.softRadius * scale;
      const maxDisp = limits.maxRadius * scale;
      const canvasPad = 0.14;
      const halfW = viewportWidth * 0.5 - canvasPad;
      const halfH = viewportHeight * 0.5 - canvasPad;

      const xMinBase = Math.max(limits.leftGuard * scale, -halfW);
      const xMaxBase = Math.min(limits.rightGuard * scale, halfW);
      const yMaxBase = Math.min(limits.topGuard * scale, halfH - camera.position.y);
      const yMinBase = Math.max(limits.bottomGuard * scale, -halfH + Math.abs(camera.position.y) * 0.25);
      const zBound = limits.zBound;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const r = b.radius;
        const ry = r * b.aspectY;

        // Progressive elastic tether to prevent excessive straying
        tetherVec.subVectors(b.position, b.restPosition);
        const disp = tetherVec.length();
        if (disp > softDisp && disp > 0.0001) {
          const excess = disp - softDisp;
          b.velocity.addScaledVector(tetherVec, (-excess / disp) * 0.011 * dtStep);
          if (disp > maxDisp) {
            tetherVec.multiplyScalar(maxDisp / disp);
            b.position.copy(b.restPosition).add(tetherVec);
            b.velocity.multiplyScalar(0.86);
          }
        }

        // Container & Hero-headline safety walls
        const minX = xMinBase + r;
        const maxX = xMaxBase - r;
        const minY = yMinBase + ry;
        const maxY = yMaxBase - ry;

        if (minX < maxX) {
          if (b.position.x < minX) {
            b.position.x = minX;
            if (b.velocity.x < 0) b.velocity.x *= limits.rebound;
          } else if (b.position.x > maxX) {
            b.position.x = maxX;
            if (b.velocity.x > 0) b.velocity.x *= limits.rebound;
          }
        }

        if (minY < maxY) {
          if (b.position.y < minY) {
            b.position.y = minY;
            if (b.velocity.y < 0) b.velocity.y *= limits.rebound;
          } else if (b.position.y > maxY) {
            b.position.y = maxY;
            if (b.velocity.y > 0) b.velocity.y *= limits.rebound;
          }
        }

        if (b.position.z < -zBound) {
          b.position.z = -zBound;
          if (b.velocity.z < 0) b.velocity.z *= limits.rebound;
        } else if (b.position.z > zBound) {
          b.position.z = zBound;
          if (b.velocity.z > 0) b.velocity.z *= limits.rebound;
        }

        // Subtle physical sway rotation that preserves upright balloon orientation
        const targetTiltZ = THREE.MathUtils.clamp(
          -(b.velocity.x * 2.2 + (b.position.x - b.restPosition.x) * 0.16),
          -0.38,
          0.38
        );
        const targetTiltX = THREE.MathUtils.clamp(
          b.velocity.z * 1.8 + (b.position.y - b.restPosition.y) * 0.08,
          -0.28,
          0.28
        );
        const tiltFollow = 1 - Math.pow(0.84, dtStep);
        b.currentTilt.x = lerp(b.currentTilt.x, targetTiltX, tiltFollow);
        b.currentTilt.y = lerp(b.currentTilt.y, targetTiltZ, tiltFollow);

        swayEuler.set(b.currentTilt.x, 0, b.currentTilt.y);
        swayQuat.setFromEuler(swayEuler);
        b.mesh.quaternion.copy(b.restQuat).multiply(swayQuat);
        b.mesh.position.copy(b.position);
      }

      renderer.render(scene, camera);
    };

    const startOrStopLoop = () => {
      const shouldRun = !disposed && !prefersReducedMotion && isInViewport && isDocumentVisible;
      if (shouldRun && !loopRunning) {
        lastNow = performance.now();
        loopRunning = true;
        animationFrameId = requestAnimationFrame(simulateAndRender);
      } else if (!shouldRun && loopRunning) {
        cancelAnimationFrame(animationFrameId);
        loopRunning = false;
      }
    };

    const triggerHeroEntrance = () => {
      if (!entranceStarted) {
        entranceStarted = true;
        entranceStartTime = simTime;
        lastNow = performance.now();
        startOrStopLoop();
      }
    };

    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
        loopRunning = false;
        camera.position.y = 0;
        for (const b of balls) {
          b.position.copy(b.restPosition);
          b.velocity.set(0, 0, 0);
          b.mesh.position.copy(b.restPosition);
          b.mesh.quaternion.copy(b.restQuat);
        }
        renderer.render(scene, camera);
      } else {
        entranceStarted = true;
        startOrStopLoop();
      }
    };

    const onVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      startOrStopLoop();
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
      loopRunning = false;
      canvas.style.display = 'none';
      container.dataset.clusterFallback = 'true';
    };

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isInViewport = entries.some((entry) => entry.isIntersecting);
        startOrStopLoop();
      },
      { rootMargin: '120px' }
    );
    intersectionObserver.observe(stageSection);

    stageSection.addEventListener('pointermove', onPointerMove, { passive: true });
    stageSection.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerLeave, { passive: true });
    stageSection.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('blur', onPointerLeave);
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('cris:ready', triggerHeroEntrance);
    window.addEventListener('cris:animate', triggerHeroEntrance);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);
    canvas.addEventListener('webglcontextlost', onContextLost);

    startOrStopLoop();

    return () => {
      disposed = true;
      delete container.dataset.clusterReady;
      cancelAnimationFrame(animationFrameId);
      loopRunning = false;

      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      stageSection.removeEventListener('pointermove', onPointerMove);
      stageSection.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerLeave);
      stageSection.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('cris:ready', triggerHeroEntrance);
      window.removeEventListener('cris:animate', triggerHeroEntrance);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);

      clearBalls();
      scene.environment = null;
      envRT.dispose();
      geometryVariants.forEach((g) => g.geometry.dispose());
      materials.forEach((m) => m.dispose());
      keyLight.shadow.map?.dispose();
      renderer.dispose();
      canvas.remove();
      delete container.dataset.clusterFallback;
    };
  }, [configOverride]);

  return (
    <div
      ref={hostRef}
      className={['hero-balloon-cluster', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <div className="hero-balloon-fallback">
        <BalloonComposition small={smallFallback} />
      </div>
    </div>
  );
}

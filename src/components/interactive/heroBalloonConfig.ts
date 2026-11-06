export interface DispersionLimits {
  /** Distance from rest position where progressive elastic containment starts */
  softRadius: number;
  /** Maximum distance a balloon may move away from its rest position */
  maxRadius: number;
  /** World-space X minimum to keep balloons clear of the Hero headline and CTAs */
  leftGuard: number;
  /** World-space X maximum */
  rightGuard: number;
  /** World-space Y maximum */
  topGuard: number;
  /** World-space Y minimum */
  bottomGuard: number;
  /** World-space Z depth half-extent */
  zBound: number;
  /** Velocity rebound coefficient when touching containment walls */
  rebound: number;
}

export interface Vec3Offset {
  x: number;
  y: number;
  z: number;
}

export interface ResponsiveValue<T> {
  desktop: T;
  tablet: T;
  mobile: T;
}

export interface HeroBalloonClusterConfig {
  /** Number of 3D balloons per viewport tier */
  balloonCount: ResponsiveValue<number>;
  /** Minimum balloon radius in 3D world units */
  minRadius: number;
  /** Maximum balloon radius in 3D world units */
  maxRadius: number;
  /** Amplitude of continuous idle floating motion */
  floatIntensity: number;
  /** Base speed of desynchronized idle floating motion */
  floatSpeed: number;
  /** World-space radius of cursor repulsion influence */
  mouseRepelRadius: number;
  /** Base cursor repulsion acceleration (recalibrated from Arte-Bolas) */
  mouseRepelForce: number;
  /** Velocity multiplier applied to cursor speed during hover repulsion */
  mouseSpeedBoost: number;
  /** Radius multiplier while pointer is pressed */
  pointerDownRadiusMultiplier: number;
  /** Force multiplier while pointer is pressed */
  pointerDownForceMultiplier: number;
  /** Maximum velocity magnitude per 60fps step to prevent erratic spikes */
  maxVelocity: number;
  /** Elastic spring return strength toward each balloon's rest position */
  restAttractForce: number;
  /** Per-frame velocity damping (60fps normalized, matching Arte-Bolas feel) */
  damping: number;
  /** Positional separation factor across pairwise collision substeps */
  collisionStrength: number;
  /** Coefficient of restitution for balloon-to-balloon collision impulses */
  collisionBounciness: number;
  /** Number of pairwise collision solver substeps per frame */
  collisionSubSteps: number;
  /** Spatial containment and Hero safety boundaries */
  dispersionLimits: DispersionLimits;
  /** Overall 3D cluster position offset inside the Hero right-hand stage */
  clusterOffset: ResponsiveValue<Vec3Offset>;
  /** Global scale multiplier for the balloon cluster per viewport tier */
  compositionScale: ResponsiveValue<number>;
  /** Maximum devicePixelRatio for WebGL rendering */
  maxPixelRatio: ResponsiveValue<number>;
  /** Duration (seconds) of the subtle initial settling animation */
  entranceDuration: number;
  /** Subtle initial expansion factor before converging to rest positions */
  entranceSpread: number;
  /** Subtle vertical scroll parallax (world units across Hero height) */
  scrollParallaxY: number;
  /** Deterministic PRNG seed for organic micro-variations */
  seed: number;
  /** Editorial pastel color palette */
  palette: readonly string[];
  /** Optional custom anchor layout blueprint list (defaults to BALLOON_CLUSTER_BLUEPRINTS) */
  blueprints?: readonly BalloonAnchorBlueprint[];
}

export const HERO_BALLOON_PALETTE = [
  '#E07E68', // 0: Terracota coral vivo
  '#FAF6EC', // 1: Pérola alabastro
  '#B489CA', // 2: Lavanda botânica profunda
  '#7EB0C4', // 3: Azul atelier cerúleo
  '#EAB949', // 4: Ocre manteiga dourado
] as const;

/**
 * Dedicated palette for FinalCTA: replaces terracotta/coral with cerulean & sky blue tones
 * so all balloons stand out vividly against the terracotta section background.
 */
export const CTA_BALLOON_PALETTE = [
  '#7EB0C4', // 0: Azul atelier cerúleo (contraste complementar elegante com o fundo terracota)
  '#FAF6EC', // 1: Pérola alabastro champanhe (acetinado luminoso)
  '#B489CA', // 2: Lavanda botânica profunda (violeta aveludado)
  '#CF1F2E', // 3: Vermelho rubi festivo (substitui o azul claro com energia vibrante)
  '#EAB949', // 4: Ocre manteiga dourado (toque festivo solar)
] as const;

export const DEFAULT_HERO_BALLOON_CONFIG: HeroBalloonClusterConfig = {
  balloonCount: {
    desktop: 24,
    tablet: 19,
    mobile: 15,
  },
  minRadius: 0.30,
  maxRadius: 0.95,
  floatIntensity: 0.078,
  floatSpeed: 0.48,
  mouseRepelRadius: 2.65,
  mouseRepelForce: 0.042,
  mouseSpeedBoost: 2.45,
  pointerDownRadiusMultiplier: 1.28,
  pointerDownForceMultiplier: 1.45,
  maxVelocity: 0.28,
  restAttractForce: 0.0055,
  damping: 0.908,
  collisionStrength: 0.33,
  collisionBounciness: 0.032,
  collisionSubSteps: 4,
  dispersionLimits: {
    softRadius: 1.56,
    maxRadius: 2.3,
    leftGuard: -2.46,
    rightGuard: 2.65,
    topGuard: 2.58,
    bottomGuard: -2.84,
    zBound: 1.48,
    rebound: -0.28,
  },
  clusterOffset: {
    desktop: { x: 0.12, y: -0.08, z: 0 },
    tablet: { x: 0.08, y: -0.12, z: 0 },
    mobile: { x: 0.0, y: -0.03, z: 0 },
  },
  compositionScale: {
    desktop: 1.02,
    tablet: 0.92,
    mobile: 0.9,
  },
  maxPixelRatio: {
    desktop: 2,
    tablet: 1.75,
    mobile: 1.5,
  },
  entranceDuration: 1.55,
  entranceSpread: 1.2,
  scrollParallaxY: 0.44,
  seed: 199705,
  palette: HERO_BALLOON_PALETTE,
};

export interface BalloonAnchorBlueprint {
  /** Normalized X in cluster space (~ -1.35 to +1.35) */
  x: number;
  /** Normalized Y in cluster space (~ -1.55 to +1.45) */
  y: number;
  /** Depth layer Z (~ -0.95 back to +0.82 front) */
  z: number;
  /** Normalized radius factor [0..1] mapped between minRadius and maxRadius */
  sizeT: number;
  /** Index into palette */
  colorIndex: number;
}

/**
 * Curated asymmetric ornamental bouquet ordered so desktop (22), tablet (18),
 * and mobile (15) slices each preserve balanced colors, Z layering, and silhouette.
 * Inspired by the diagonal flow of the original Cris Balões Hero composition:
 * rising toward upper-right, lush overlapping core, tapering organically toward lower-left.
 */
export const BALLOON_CLUSTER_BLUEPRINTS: readonly BalloonAnchorBlueprint[] = [
  // Core focal & statement balloons (indices 0..14 — present on all viewports)
  // Asymmetric diagonal cenography flow: airy upper-right lobe (below art-note) -> lush central heart -> sweeping lower-left tail
  { x: 0.16, y: -0.22, z: 0.58, sizeT: 1.0, colorIndex: 0 },   // 0: Hero Coral center-front
  { x: -0.68, y: -0.02, z: 0.36, sizeT: 0.88, colorIndex: 1 }, // 1: Large Cream mid-left
  { x: -0.14, y: 0.42, z: 0.32, sizeT: 0.86, colorIndex: 2 },  // 2: Large Lavender upper-center-front
  { x: 0.66, y: 0.14, z: 0.24, sizeT: 0.80, colorIndex: 3 },   // 3: Soft Blue mid-right-upper
  { x: 0.48, y: 0.72, z: -0.26, sizeT: 0.78, colorIndex: 1 },  // 4: Cream upper-right (tucked cleanly below art-note)
  { x: 1.04, y: 0.42, z: -0.18, sizeT: 0.70, colorIndex: 4 },  // 5: Butter Yellow far-right wing
  { x: -0.58, y: 0.66, z: -0.14, sizeT: 0.68, colorIndex: 0 }, // 6: Coral upper-left
  { x: -0.62, y: -0.74, z: 0.44, sizeT: 0.66, colorIndex: 4 }, // 7: Butter Yellow lower-left cascade
  { x: 0.56, y: -0.78, z: 0.18, sizeT: 0.62, colorIndex: 2 },  // 8: Lavender lower-right (near seal)
  { x: -0.08, y: -0.98, z: 0.48, sizeT: 0.42, colorIndex: 3 }, // 9: Soft Blue lower-center
  { x: -1.16, y: -0.54, z: 0.22, sizeT: 0.34, colorIndex: 0 }, // 10: Coral sweeping left-tail accent
  { x: 0.18, y: 0.78, z: 0.14, sizeT: 0.48, colorIndex: 4 },   // 11: Butter Yellow upper-crest accent
  { x: 0.12, y: -0.16, z: -0.58, sizeT: 0.74, colorIndex: 1 }, // 12: Cream deep center-back volume
  { x: -0.96, y: -1.02, z: 0.08, sizeT: 0.22, colorIndex: 2 }, // 13: Lavender petite lower-left tip
  { x: 0.92, y: -0.34, z: 0.38, sizeT: 0.30, colorIndex: 0 },  // 14: Coral right-pocket accent

  // Tablet + Desktop additions (indices 15..17)
  { x: -0.98, y: 0.28, z: -0.28, sizeT: 0.50, colorIndex: 3 }, // 15: Soft Blue left-back wing
  { x: 0.88, y: 0.82, z: 0.08, sizeT: 0.26, colorIndex: 2 },   // 16: Lavender petite upper-right bud
  { x: -0.34, y: -0.26, z: 0.72, sizeT: 0.20, colorIndex: 4 }, // 17: Butter Yellow front-pocket "calibrado"

  // Desktop-only lush cenography accents (indices 18..23)
  { x: 0.54, y: -0.34, z: -0.58, sizeT: 0.64, colorIndex: 3 }, // 18: Soft Blue back-right depth
  { x: -0.44, y: -1.24, z: 0.16, sizeT: 0.24, colorIndex: 1 }, // 19: Cream lower-left drop
  { x: 1.24, y: -0.02, z: -0.06, sizeT: 0.38, colorIndex: 1 }, // 20: Cream far-right organic extension
  { x: 0.26, y: 0.22, z: 0.72, sizeT: 0.12, colorIndex: 0 },   // 21: Coral tiny central jewel accent
  { x: -1.26, y: -0.12, z: -0.08, sizeT: 0.22, colorIndex: 4 },// 22: Ochre petite far-left organic bud
  { x: 0.28, y: -1.32, z: 0.22, sizeT: 0.16, colorIndex: 0 },  // 23: Terracotta delicate lower drop
];

/**
 * Corner-anchored bouquet blueprint for FinalCTA (bottom-right stage):
 * arches diagonally from ~68-70% X at the bottom edge up toward ~33% Y along the right edge,
 * keeping rich 3D volume clearly visible and inviting cursor hover interaction.
 */
export const CTA_BALLOON_CLUSTER_BLUEPRINTS: readonly BalloonAnchorBlueprint[] = [
  // Core diagonal arch & statement balloons (indices 0..13 — present on all viewports)
  { x: -0.38, y: 0.02, z: 0.54, sizeT: 0.98, colorIndex: 0 },   // 0: Statement Coral diagonal heart
  { x: -0.94, y: -0.68, z: 0.48, sizeT: 0.90, colorIndex: 1 },  // 1: Large Pearl Cream lower-left diagonal
  { x: 0.18, y: 0.68, z: 0.34, sizeT: 0.88, colorIndex: 2 },    // 2: Lavender upper-central heart
  { x: 0.56, y: 1.20, z: 0.10, sizeT: 0.86, colorIndex: 1 },    // 3: Pearl Cream upper-shoulder arch
  { x: 1.16, y: 1.52, z: -0.10, sizeT: 0.84, colorIndex: 4 },   // 4: Butter Yellow high right-edge crest
  { x: 0.36, y: -0.42, z: 0.56, sizeT: 0.94, colorIndex: 0 },   // 5: Coral lower-center-right statement
  { x: 0.92, y: 0.34, z: 0.22, sizeT: 0.82, colorIndex: 3 },    // 6: Cerulean Blue mid-right pocket
  { x: -0.32, y: -1.16, z: 0.44, sizeT: 0.72, colorIndex: 4 },  // 7: Butter Yellow bottom-mid cascade
  { x: -1.46, y: -1.28, z: 0.26, sizeT: 0.56, colorIndex: 1 },  // 8: Pearl Cream bottom-left frontier
  { x: 0.98, y: -0.46, z: 0.30, sizeT: 0.78, colorIndex: 2 },   // 9: Lavender lower-right volume
  { x: 1.38, y: 0.92, z: 0.14, sizeT: 0.72, colorIndex: 0 },    // 10: Coral upper-right wing
  { x: 0.28, y: -1.18, z: 0.36, sizeT: 0.66, colorIndex: 1 },   // 11: Pearl Cream bottom-right base
  { x: -0.58, y: -0.22, z: -0.34, sizeT: 0.70, colorIndex: 3 }, // 12: Cerulean Blue mid-left depth
  { x: 0.94, y: -1.14, z: 0.24, sizeT: 0.64, colorIndex: 4 },   // 13: Butter Yellow corner anchor

  // Tablet + Desktop additions (indices 14..17)
  { x: -1.76, y: -1.44, z: 0.34, sizeT: 0.36, colorIndex: 0 },  // 14: Coral petite bottom-left tip
  { x: -1.22, y: -0.96, z: 0.16, sizeT: 0.50, colorIndex: 2 },  // 15: Lavender lower-left organic step
  { x: 1.50, y: 1.68, z: 0.16, sizeT: 0.48, colorIndex: 0 },    // 16: Coral high right-edge bud
  { x: 0.08, y: 0.16, z: -0.52, sizeT: 0.74, colorIndex: 1 },   // 17: Pearl Cream deep central volume

  // Desktop-only lush cenography accents (indices 18..21)
  { x: -0.06, y: 0.98, z: -0.24, sizeT: 0.52, colorIndex: 3 },  // 18: Soft Blue upper-shoulder accent
  { x: 0.84, y: 0.96, z: -0.38, sizeT: 0.64, colorIndex: 2 },   // 19: Lavender upper-right back depth
  { x: -0.78, y: -1.36, z: 0.38, sizeT: 0.40, colorIndex: 3 },  // 20: Cerulean Blue lower-left jewel
  { x: -0.06, y: -0.54, z: 0.68, sizeT: 0.26, colorIndex: 4 },  // 21: Butter Yellow front-pocket jewel
];

export const CTA_BALLOON_CLUSTER_CONFIG: Partial<HeroBalloonClusterConfig> = {
  balloonCount: {
    desktop: 22,
    tablet: 18,
    mobile: 14,
  },
  palette: CTA_BALLOON_PALETTE,
  dispersionLimits: {
    softRadius: 1.65,
    maxRadius: 2.45,
    leftGuard: -3.35,
    rightGuard: 3.65,
    topGuard: 2.85,
    bottomGuard: -3.35,
    zBound: 1.48,
    rebound: -0.28,
  },
  clusterOffset: {
    desktop: { x: 0.52, y: -1.25, z: 0 },
    tablet: { x: 0.46, y: -1.28, z: 0 },
    mobile: { x: 0.40, y: -0.38, z: 0 },
  },
  compositionScale: {
    desktop: 0.95,
    tablet: 0.86,
    mobile: 0.78,
  },
  scrollParallaxY: 0.28,
  seed: 199711,
  blueprints: CTA_BALLOON_CLUSTER_BLUEPRINTS,
};

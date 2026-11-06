export interface BalloonCordPalette {
  base: string;
  highlight: string;
  deep: string;
  glow: string;
}

export interface FooterLogoLetterConfig {
  index: number;
  id: string;
  char: string;
  /** Knot attachment X in 1491x586 source artwork coordinates */
  knotX: number;
  /** Knot attachment Y (bottom edge of balloon letter) in 1491x586 coordinates */
  knotY: number;
  /** Fixed lower tether anchor X in stage coordinates */
  anchorX: number;
  /** Fixed lower tether anchor Y in stage coordinates */
  anchorY: number;
  /** Progressive wave phase offset in normalized cycles [0..2) */
  phaseOffset: number;
  /** Vertical helium travel range (from spring pull-back trough to upper cord limit) in stage px */
  liftRange: number;
  /** Preferred lateral slack bow direction (-1 or +1) */
  swayDirection: 1 | -1;
  /** Cord and balloon knot color palette */
  palette: BalloonCordPalette;
}

export interface FooterLogoDecorConfig {
  id: 'decorLeft' | 'decorMid' | 'decorRight';
  /** Center X for subtle rotational pivot */
  pivotX: number;
  pivotY: number;
  phaseOffset: number;
  liftScale: number;
  swayDirection: 1 | -1;
}

export interface SegmentedSpriteBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}

export interface HeliumTetherSample {
  /** Normalized upward height in [0, 1], where 1 is the imaginary upper tether limit */
  lift: number;
  /** Normalized vertical derivative dlift/du */
  velocity: number;
  /** Elastic cord tension in [0, 1], peaking as the letter reaches the upper limit */
  tension: number;
  /** Cord slack in [0, 1], relaxing into an S-curve when the spring pulls the letter down */
  slack: number;
  /** Transverse ripple triggered along the cord during spring recoil */
  recoilRipple: number;
}

export interface LetterFrameKinematics {
  /** Translation offset applied to the letter sprite in stage coordinates */
  translateX: number;
  translateY: number;
  /** Rotation in radians around the balloon knot */
  rotation: number;
  /** Subtle volume-preserving stretch when the taut cord tugs at the upper limit */
  scaleX: number;
  scaleY: number;
  /** Live knot world position in stage coordinates */
  knotX: number;
  knotY: number;
  /** Cord emergence tip just below the balloon knot */
  cordStartX: number;
  cordStartY: number;
  /** Cubic Bezier control points from cordStart -> anchor */
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  anchorX: number;
  anchorY: number;
  lift: number;
  tension: number;
  slack: number;
}

export const FOOTER_LOGO_STAGE = {
  sourceWidth: 1491,
  sourceHeight: 586,
  viewX: 0,
  viewY: 104,
  viewWidth: 1491,
  viewHeight: 492,
  /** Full period (seconds) of one helium-ascent + taut-cord spring pull-back cycle */
  wavePeriodSec: 3.25,
  /** Downward rest offset at lift=0 so lift=1 rises well above original baseline */
  troughOffsetY: 8,
} as const;

const SKY_BLUE_CORD: BalloonCordPalette = {
  base: '#2BB9F4',
  highlight: '#E0F2FE',
  deep: '#0284C7',
  glow: 'rgba(56, 189, 248, 0.24)',
};

const ROSE_PINK_CORD: BalloonCordPalette = {
  base: '#FF6FAE',
  highlight: '#FCE7F3',
  deep: '#DB2777',
  glow: 'rgba(255, 111, 174, 0.24)',
};

const SUNLIT_GOLD_CORD: BalloonCordPalette = {
  base: '#FACC15',
  highlight: '#FEF9C3',
  deep: '#CA8A04',
  glow: 'rgba(250, 204, 21, 0.22)',
};

const ORCHID_VIOLET_CORD: BalloonCordPalette = {
  base: '#D257F6',
  highlight: '#FAE8FF',
  deep: '#9333EA',
  glow: 'rgba(210, 87, 246, 0.24)',
};

/**
 * Pixel-verified attachment coordinates and asynchronous wave phases
 * for each of the 10 balloon letters in "Cris Balões".
 */
export const FOOTER_LOGO_LETTERS: readonly FooterLogoLetterConfig[] = [
  {
    index: 0,
    id: 'C',
    char: 'C',
    knotX: 243,
    knotY: 409,
    anchorX: 240,
    anchorY: 568,
    phaseOffset: 0.0,
    liftRange: 47,
    swayDirection: 1,
    palette: SKY_BLUE_CORD,
  },
  {
    index: 1,
    id: 'r',
    char: 'r',
    knotX: 355,
    knotY: 404,
    anchorX: 354,
    anchorY: 565,
    phaseOffset: 0.13,
    liftRange: 45,
    swayDirection: -1,
    palette: ROSE_PINK_CORD,
  },
  {
    index: 2,
    id: 'i',
    char: 'i',
    knotX: 471,
    knotY: 404,
    anchorX: 471,
    anchorY: 570,
    phaseOffset: 0.26,
    liftRange: 48,
    swayDirection: 1,
    palette: SUNLIT_GOLD_CORD,
  },
  {
    index: 3,
    id: 's-1',
    char: 's',
    knotX: 558,
    knotY: 405,
    anchorX: 560,
    anchorY: 566,
    phaseOffset: 0.39,
    liftRange: 45,
    swayDirection: -1,
    palette: SKY_BLUE_CORD,
  },
  {
    index: 4,
    id: 'B',
    char: 'B',
    knotX: 725,
    knotY: 403,
    anchorX: 724,
    anchorY: 570,
    phaseOffset: 0.56,
    liftRange: 47,
    swayDirection: 1,
    palette: ROSE_PINK_CORD,
  },
  {
    index: 5,
    id: 'a',
    char: 'a',
    knotX: 857,
    knotY: 405,
    anchorX: 858,
    anchorY: 565,
    phaseOffset: 0.69,
    liftRange: 45,
    swayDirection: -1,
    palette: SUNLIT_GOLD_CORD,
  },
  {
    index: 6,
    id: 'l',
    char: 'l',
    knotX: 968,
    knotY: 404,
    anchorX: 968,
    anchorY: 569,
    phaseOffset: 0.82,
    liftRange: 48,
    swayDirection: 1,
    palette: ORCHID_VIOLET_CORD,
  },
  {
    index: 7,
    id: 'o-tilde',
    char: 'õ',
    knotX: 1061,
    knotY: 405,
    anchorX: 1061,
    anchorY: 565,
    phaseOffset: 0.95,
    liftRange: 46,
    swayDirection: -1,
    palette: ORCHID_VIOLET_CORD,
  },
  {
    index: 8,
    id: 'e',
    char: 'e',
    knotX: 1193,
    knotY: 404,
    anchorX: 1194,
    anchorY: 569,
    phaseOffset: 1.08,
    liftRange: 45,
    swayDirection: 1,
    palette: SKY_BLUE_CORD,
  },
  {
    index: 9,
    id: 's-2',
    char: 's',
    knotX: 1298,
    knotY: 404,
    anchorX: 1300,
    anchorY: 566,
    phaseOffset: 1.21,
    liftRange: 47,
    swayDirection: -1,
    palette: SUNLIT_GOLD_CORD,
  },
] as const;

export const FOOTER_LOGO_DECOR: readonly FooterLogoDecorConfig[] = [
  {
    id: 'decorLeft',
    pivotX: 108,
    pivotY: 320,
    phaseOffset: -0.08,
    liftScale: 0.52,
    swayDirection: -1,
  },
  {
    id: 'decorMid',
    pivotX: 636,
    pivotY: 260,
    phaseOffset: 0.48,
    liftScale: 0.62,
    swayDirection: 1,
  },
  {
    id: 'decorRight',
    pivotX: 1385,
    pivotY: 280,
    phaseOffset: 1.31,
    liftScale: 0.54,
    swayDirection: 1,
  },
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

interface HermiteKnot {
  u: number;
  p: number;
  v: number;
  a: number;
}

/**
 * C2-continuous Quintic Hermite cycle:
 * - u in [0.00, 0.58]: Buoyant helium ascent up to the imaginary tether limit (p = 1.0)
 * - u in [0.58, 0.84]: Taut cord stretches and springs the balloon smoothly downward (p -> 0.0)
 * - u in [0.84, 1.00]: Soft air-cushioned spring settle transitioning back into helium lift
 */
const HELIUM_CYCLE_KNOTS: readonly HermiteKnot[] = [
  { u: 0.0, p: 0.12, v: 0.85, a: 3.5 },
  { u: 0.58, p: 1.0, v: 0.0, a: -26.0 },
  { u: 0.84, p: 0.0, v: 0.0, a: 16.0 },
  { u: 1.0, p: 0.12, v: 0.85, a: 3.5 },
];

function evalQuinticSegment(
  localU: number,
  k0: HermiteKnot,
  k1: HermiteKnot
): { p: number; v: number } {
  const du = k1.u - k0.u;
  const s = clamp(localU / du, 0, 1);
  const s2 = s * s;
  const s3 = s2 * s;
  const s4 = s3 * s;
  const s5 = s4 * s;

  const mv0 = k0.v * du;
  const mv1 = k1.v * du;
  const ma0 = k0.a * du * du;
  const ma1 = k1.a * du * du;

  const h00 = 1 - 10 * s3 + 15 * s4 - 6 * s5;
  const h10 = s - 6 * s3 + 8 * s4 - 3 * s5;
  const h20 = 0.5 * (s2 - 3 * s3 + 3 * s4 - s5);
  const h01 = 10 * s3 - 15 * s4 + 6 * s5;
  const h11 = -4 * s3 + 7 * s4 - 3 * s5;
  const h21 = 0.5 * (s3 - 2 * s4 + s5);

  const p =
    h00 * k0.p +
    h10 * mv0 +
    h20 * ma0 +
    h01 * k1.p +
    h11 * mv1 +
    h21 * ma1;

  const dh00 = -30 * s2 + 60 * s3 - 30 * s4;
  const dh10 = 1 - 18 * s2 + 32 * s3 - 15 * s4;
  const dh20 = 0.5 * (2 * s - 9 * s2 + 12 * s3 - 5 * s4);
  const dh01 = 30 * s2 - 60 * s3 + 30 * s4;
  const dh11 = -12 * s2 + 28 * s3 - 15 * s4;
  const dh21 = 0.5 * (3 * s2 - 8 * s3 + 5 * s4);

  const v =
    (dh00 * k0.p +
      dh10 * mv0 +
      dh20 * ma0 +
      dh01 * k1.p +
      dh11 * mv1 +
      dh21 * ma1) /
    du;

  return { p: clamp(p, 0, 1), v };
}

export function evaluateHeliumTetherCycle(phase01: number): HeliumTetherSample {
  const u = ((phase01 % 1) + 1) % 1;
  let sample = { p: 0, v: 0 };

  for (let i = 0; i < HELIUM_CYCLE_KNOTS.length - 1; i++) {
    const k0 = HELIUM_CYCLE_KNOTS[i];
    const k1 = HELIUM_CYCLE_KNOTS[i + 1];
    if (u <= k1.u || i === HELIUM_CYCLE_KNOTS.length - 2) {
      sample = evalQuinticSegment(u - k0.u, k0, k1);
      break;
    }
  }

  const lift = sample.p;
  const tension = smoothstep(0.68, 0.99, lift);
  const slack = 1 - smoothstep(0.1, 0.84, lift);

  // Subtle transverse wave traveling down the relaxing cord right after the apex pull-back
  let recoilRipple = 0;
  if (u > 0.58 && u < 0.96) {
    const progress = (u - 0.58) / 0.38;
    const envelope = Math.sin(Math.PI * progress) * (1 - progress * 0.45);
    recoilRipple = Math.sin(progress * Math.PI * 2.2) * envelope;
  }

  return {
    lift,
    velocity: sample.v,
    tension,
    slack,
    recoilRipple,
  };
}

export function computeLetterKinematics(
  letter: FooterLogoLetterConfig,
  timeSec: number,
  interactionOffset: { x: number; y: number; pluck: number } = {
    x: 0,
    y: 0,
    pluck: 0,
  }
): LetterFrameKinematics {
  const rawPhase =
    timeSec / FOOTER_LOGO_STAGE.wavePeriodSec - letter.phaseOffset;
  const cycle = evaluateHeliumTetherCycle(rawPhase);

  const waveAngle = rawPhase * Math.PI * 2;
  const gentleBreezeX =
    Math.sin(waveAngle + letter.index * 0.55) * 3.4 * letter.swayDirection;

  // Vertical displacement: negative Y is UPWARD on screen
  const baseTranslateY =
    FOOTER_LOGO_STAGE.troughOffsetY - cycle.lift * letter.liftRange;
  // Soft tether clamp if pointer pushes the balloon upward past its cord limit
  const rawY = baseTranslateY + interactionOffset.y;
  const upperHardCap = -(letter.liftRange + 14);
  const translateY =
    rawY < upperHardCap
      ? upperHardCap + (rawY - upperHardCap) * 0.22
      : rawY;
  const translateX = gentleBreezeX + interactionOffset.x;

  // Extra tension if pointer pulls balloon upward
  const effectiveLift = clamp(
    (FOOTER_LOGO_STAGE.troughOffsetY - translateY) / letter.liftRange,
    0,
    1.25
  );
  const tension = smoothstep(0.68, 1.0, effectiveLift);
  const slack = 1 - smoothstep(0.08, 0.85, effectiveLift);

  const rotation =
    (Math.cos(waveAngle) * 0.024 * letter.swayDirection +
      translateX * 0.0022) *
    (1 - tension * 0.32);

  // Subtle volume-preserving elastic stretch right when the taut cord tugs downward
  const stretch = tension * 0.022;
  const scaleY = 1 + stretch;
  const scaleX = 1 - stretch * 0.62;

  const knotX = letter.knotX + translateX;
  const knotY = letter.knotY + translateY;
  const cordStartX = knotX - Math.sin(rotation) * 5.2;
  const cordStartY = knotY + Math.cos(rotation) * 5.2;

  const dx = letter.anchorX - cordStartX;
  const dy = letter.anchorY - cordStartY;

  // S-curve slack bow collapses smoothly to 0 (straight taut line) when tension -> 1
  const bowSign = letter.swayDirection;
  const dynamicSway = Math.sin(waveAngle) * 2.8 * bowSign;
  const ripple = cycle.recoilRipple * 4.5 * bowSign;
  const pluck = interactionOffset.pluck;

  const bow1 =
    slack * (15.5 * bowSign + dynamicSway) +
    slack * ripple * 0.5 +
    pluck * 0.72;
  const bow2 =
    slack * (-12.0 * bowSign - dynamicSway * 0.5) -
    slack * ripple * 0.35 +
    pluck * 0.48;

  const c1x = cordStartX + dx * 0.33 + bow1;
  const c1y = cordStartY + dy * 0.34;
  const c2x = cordStartX + dx * 0.68 + bow2;
  const c2y = cordStartY + dy * 0.68;

  return {
    translateX,
    translateY,
    rotation,
    scaleX,
    scaleY,
    knotX,
    knotY,
    cordStartX,
    cordStartY,
    c1x,
    c1y,
    c2x,
    c2y,
    anchorX: letter.anchorX,
    anchorY: letter.anchorY,
    lift: clamp(effectiveLift, 0, 1),
    tension,
    slack,
  };
}

export function computeStaticCordCurve(letter: FooterLogoLetterConfig) {
  const cordStartX = letter.knotX;
  const cordStartY = letter.knotY + 5;
  const dx = letter.anchorX - cordStartX;
  const dy = letter.anchorY - cordStartY;
  const bow = 10.5 * letter.swayDirection;
  return {
    cordStartX,
    cordStartY,
    c1x: cordStartX + dx * 0.34 + bow,
    c1y: cordStartY + dy * 0.34,
    c2x: cordStartX + dx * 0.68 - bow * 0.78,
    c2y: cordStartY + dy * 0.68,
    anchorX: letter.anchorX,
    anchorY: letter.anchorY,
  };
}

export function buildCordSvgPath(
  x0: number,
  y0: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x1: number,
  y1: number
): string {
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/**
 * Losslessly segments the 1491x586 brand PNG pixels into:
 * - indices 0..9: the 10 balloon letters C-r-i-s B-a-l-õ-e-s
 * - indices 10..12: decorLeft, decorMid, decorRight
 */
export function segmentFooterLogoPixels(
  width: number,
  height: number,
  rgba: Uint8ClampedArray
): SegmentedSpriteBounds[] {
  const sx = width / FOOTER_LOGO_STAGE.sourceWidth;
  const sy = height / FOOTER_LOGO_STAGE.sourceHeight;

  const inS2Zone = (px: number, py: number, g: number, b: number): boolean => {
    const x = px / sx;
    const y = py / sy;
    if (x < 1245 || x > 1358 || y < 258 || y > 410) return false;
    if (x <= 1347) return true;
    return g > b + 14;
  };

  const totalPixels = width * height;
  const compId = new Int32Array(totalPixels);
  const queue = new Int32Array(totalPixels);

  interface ComponentMeta {
    id: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    count: number;
    s2Zone: boolean;
  }

  const components: ComponentMeta[] = [];

  for (let start = 0; start < totalPixels; start++) {
    if (compId[start] !== 0 || rgba[start * 4 + 3] === 0) continue;

    const id = components.length + 1;
    const startX = start % width;
    const startY = (start - startX) / width;
    const s2Zone = inS2Zone(
      startX,
      startY,
      rgba[start * 4 + 1],
      rgba[start * 4 + 2]
    );

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    compId[start] = id;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let count = 0;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      count++;

      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
      ];

      for (let n = 0; n < 4; n++) {
        const next = neighbors[n];
        if (next < 0 || compId[next] !== 0 || rgba[next * 4 + 3] === 0) continue;
        const nx = next % width;
        const ny = (next - nx) / width;
        const nextZone = inS2Zone(
          nx,
          ny,
          rgba[next * 4 + 1],
          rgba[next * 4 + 2]
        );
        if (nextZone !== s2Zone) continue;
        compId[next] = id;
        queue[tail++] = next;
      }
    }

    components.push({ id, minX, maxX, minY, maxY, count, s2Zone });
  }

  const areaScale = sx * sy;
  const compToBucket = new Int32Array(components.length + 1);

  for (const c of components) {
    const minX = c.minX / sx;
    const maxX = c.maxX / sx;
    const minY = c.minY / sy;
    const cx = (minX + maxX) * 0.5;
    const normCount = c.count / areaScale;

    let bucket = 12;
    if (c.s2Zone && normCount > 5000) bucket = 9;
    else if (minX >= 145 && maxX <= 322 && normCount > 10000) bucket = 0;
    else if (minX >= 324 && maxX <= 435 && normCount > 5000) bucket = 1;
    else if (minX >= 434 && maxX <= 508 && normCount > 2000) bucket = 2;
    else if (minX >= 500 && maxX <= 620 && normCount > 8000) bucket = 3;
    else if (minX >= 662 && maxX <= 813 && minY >= 220) bucket = 4;
    else if (minX >= 813 && maxX <= 938 && normCount > 8000) bucket = 5;
    else if (minX >= 940 && maxX <= 997 && normCount > 5000) bucket = 6;
    else if (minX >= 997 && maxX <= 1125 && minY >= 215) bucket = 7;
    else if (minX >= 1126 && maxX <= 1245 && minY >= 260) bucket = 8;
    else if (cx < 300) bucket = 10;
    else if (cx < 900) bucket = 11;
    else bucket = 12;

    compToBucket[c.id] = bucket;
  }

  const bucketIds = [
    ...FOOTER_LOGO_LETTERS.map((l) => l.id),
    ...FOOTER_LOGO_DECOR.map((d) => d.id),
  ];

  const bounds = bucketIds.map((id) => ({
    id,
    minX: width,
    maxX: -1,
    minY: height,
    maxY: -1,
  }));

  for (const c of components) {
    const b = bounds[compToBucket[c.id]];
    if (c.minX < b.minX) b.minX = c.minX;
    if (c.maxX > b.maxX) b.maxX = c.maxX;
    if (c.minY < b.minY) b.minY = c.minY;
    if (c.maxY > b.maxY) b.maxY = c.maxY;
  }

  const sprites: SegmentedSpriteBounds[] = bounds.map((b) => {
    if (b.maxX < b.minX || b.maxY < b.minY) {
      return {
        id: b.id,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rgba: new Uint8ClampedArray(4),
      };
    }
    const w = b.maxX - b.minX + 1;
    const h = b.maxY - b.minY + 1;
    return {
      id: b.id,
      x: b.minX,
      y: b.minY,
      width: w,
      height: h,
      rgba: new Uint8ClampedArray(w * h * 4),
    };
  });

  for (let idx = 0; idx < totalPixels; idx++) {
    const cid = compId[idx];
    if (cid === 0) continue;
    const bucket = compToBucket[cid];
    const sprite = sprites[bucket];
    const b = bounds[bucket];
    if (b.maxX < b.minX) continue;
    const x = idx % width;
    const y = (idx - x) / width;
    const localIdx = ((y - b.minY) * sprite.width + (x - b.minX)) * 4;
    const srcIdx = idx * 4;
    sprite.rgba[localIdx] = rgba[srcIdx];
    sprite.rgba[localIdx + 1] = rgba[srcIdx + 1];
    sprite.rgba[localIdx + 2] = rgba[srcIdx + 2];
    sprite.rgba[localIdx + 3] = rgba[srcIdx + 3];
  }

  return sprites;
}


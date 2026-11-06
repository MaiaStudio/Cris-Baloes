'use client';

import { useEffect, useRef } from 'react';
import {
  buildCordSvgPath,
  computeLetterKinematics,
  computeStaticCordCurve,
  evaluateHeliumTetherCycle,
  FOOTER_LOGO_DECOR,
  FOOTER_LOGO_LETTERS,
  FOOTER_LOGO_STAGE,
  segmentFooterLogoPixels,
} from './footerLogoConfig';

const LOGO_SRC = '/assets/brand/logo-horizontal.png';

interface MaterializedSprite {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

interface LetterSpringState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pluck: number;
  pluckV: number;
}

let cachedSpritesPromise: Promise<MaterializedSprite[] | null> | null = null;

function loadSegmentedLogoSprites(): Promise<MaterializedSprite[] | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  if (cachedSpritesPromise) return cachedSpritesPromise;

  cachedSpritesPromise = new Promise<MaterializedSprite[] | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = LOGO_SRC;

    const handleLoaded = () => {
      try {
        const w = img.naturalWidth || FOOTER_LOGO_STAGE.sourceWidth;
        const h = img.naturalHeight || FOOTER_LOGO_STAGE.sourceHeight;
        const scratch = document.createElement('canvas');
        scratch.width = w;
        scratch.height = h;
        const sctx = scratch.getContext('2d', { willReadFrequently: true });
        if (!sctx) {
          resolve(null);
          return;
        }
        sctx.drawImage(img, 0, 0, w, h);
        const imageData = sctx.getImageData(0, 0, w, h);
        const rawSprites = segmentFooterLogoPixels(w, h, imageData.data);
        const sx = FOOTER_LOGO_STAGE.sourceWidth / w;
        const sy = FOOTER_LOGO_STAGE.sourceHeight / h;

        const materialized: MaterializedSprite[] = rawSprites.map((sp) => {
          const pieceCanvas = document.createElement('canvas');
          pieceCanvas.width = sp.width;
          pieceCanvas.height = sp.height;
          const pctx = pieceCanvas.getContext('2d');
          if (pctx) {
            const pieceData = pctx.createImageData(sp.width, sp.height);
            pieceData.data.set(sp.rgba);
            pctx.putImageData(pieceData, 0, 0);
          }
          return {
            id: sp.id,
            x: sp.x * sx,
            y: sp.y * sy,
            width: sp.width * sx,
            height: sp.height * sy,
            canvas: pieceCanvas,
          };
        });

        resolve(materialized);
      } catch {
        resolve(null);
      }
    };

    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(handleLoaded)
        .catch(() => {
          if (img.complete && img.naturalWidth > 0) handleLoaded();
          else {
            cachedSpritesPromise = null;
            resolve(null);
          }
        });
    } else {
      img.onload = handleLoaded;
      img.onerror = () => {
        cachedSpritesPromise = null;
        resolve(null);
      };
    }
  });

  return cachedSpritesPromise;
}

export default function ElasticFooterLogo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return undefined;

    const reducedMotionQuery = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    );
    let prefersReducedMotion = reducedMotionQuery?.matches ?? false;
    let isIntersecting = false;
    let alive = true;
    let rafId = 0;
    let lastTime = 0;
    let elapsedSec = 0;
    let sprites: MaterializedSprite[] | null = null;

    const layout = {
      width: 1,
      height: 1,
      dpr: 1,
      fit: 1,
      offsetX: 0,
      offsetY: 0,
    };

    const springs: LetterSpringState[] = FOOTER_LOGO_LETTERS.map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      pluck: 0,
      pluckV: 0,
    }));

    const pointer = {
      inside: false,
      stageX: 0,
      stageY: 0,
      prevStageX: 0,
      prevStageY: 0,
      vx: 0,
      vy: 0,
      draggedIndex: -1,
      dragStartStageX: 0,
      dragStartStageY: 0,
      dragOriginX: 0,
      dragOriginY: 0,
      pointerId: -1,
    };

    const updateLayout = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fit = Math.min(
        width / FOOTER_LOGO_STAGE.viewWidth,
        height / FOOTER_LOGO_STAGE.viewHeight
      );
      const offsetX =
        (width - FOOTER_LOGO_STAGE.viewWidth * fit) * 0.5 -
        FOOTER_LOGO_STAGE.viewX * fit;
      const offsetY =
        (height - FOOTER_LOGO_STAGE.viewHeight * fit) * 0.5 -
        FOOTER_LOGO_STAGE.viewY * fit;

      layout.width = width;
      layout.height = height;
      layout.dpr = dpr;
      layout.fit = Math.max(fit, 0.05);
      layout.offsetX = offsetX;
      layout.offsetY = offsetY;

      const targetW = Math.max(1, Math.round(width * dpr));
      const targetH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    const clientToStage = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      return {
        x: (localX - layout.offsetX) / layout.fit,
        y: (localY - layout.offsetY) / layout.fit,
        inside:
          localX >= 0 &&
          localY >= 0 &&
          localX <= rect.width &&
          localY <= rect.height,
      };
    };

    const drawCordAndKnot = (
      renderCtx: CanvasRenderingContext2D,
      letterIndex: number,
      k: ReturnType<typeof computeLetterKinematics>,
      minStrokeStage: number
    ) => {
      const letter = FOOTER_LOGO_LETTERS[letterIndex];
      const { palette } = letter;

      // 1. Soft colored halo behind cord
      renderCtx.save();
      renderCtx.lineCap = 'round';
      renderCtx.lineJoin = 'round';
      renderCtx.beginPath();
      renderCtx.moveTo(k.cordStartX, k.cordStartY);
      renderCtx.bezierCurveTo(
        k.c1x,
        k.c1y,
        k.c2x,
        k.c2y,
        k.anchorX,
        k.anchorY
      );
      renderCtx.strokeStyle = palette.glow;
      renderCtx.lineWidth = Math.max(
        minStrokeStage * 2.15,
        6.4 - k.tension * 1.1
      );
      renderCtx.stroke();

      // 2. Delicate relaxed tail below lower anchor pin
      renderCtx.globalAlpha = 0.52;
      renderCtx.beginPath();
      renderCtx.moveTo(k.anchorX, k.anchorY);
      renderCtx.quadraticCurveTo(
        k.anchorX + letter.swayDirection * 4.5,
        k.anchorY + 7.5,
        k.anchorX - letter.swayDirection * 2.2,
        k.anchorY + 14
      );
      renderCtx.strokeStyle = palette.base;
      renderCtx.lineWidth = Math.max(minStrokeStage * 0.78, 2.3);
      renderCtx.stroke();
      renderCtx.globalAlpha = 1;

      // 3. Main colored cord body
      const mainWidth = Math.max(minStrokeStage, 3.35 - k.tension * 0.42);
      renderCtx.beginPath();
      renderCtx.moveTo(k.cordStartX, k.cordStartY);
      renderCtx.bezierCurveTo(
        k.c1x,
        k.c1y,
        k.c2x,
        k.c2y,
        k.anchorX,
        k.anchorY
      );
      renderCtx.strokeStyle = palette.base;
      renderCtx.lineWidth = mainWidth;
      renderCtx.stroke();

      // 4. Specular satin highlight filament along cord
      renderCtx.globalAlpha = 0.42 + k.tension * 0.34;
      renderCtx.beginPath();
      renderCtx.moveTo(k.cordStartX - 0.55, k.cordStartY);
      renderCtx.bezierCurveTo(
        k.c1x - 0.55,
        k.c1y,
        k.c2x - 0.55,
        k.c2y,
        k.anchorX - 0.55,
        k.anchorY
      );
      renderCtx.strokeStyle = palette.highlight;
      renderCtx.lineWidth = Math.max(minStrokeStage * 0.36, 1.1);
      renderCtx.stroke();
      renderCtx.globalAlpha = 1;

      // 5. Lower anchor knot bead
      const pinRadius = Math.max(2.7, minStrokeStage * 0.92);
      renderCtx.beginPath();
      renderCtx.arc(k.anchorX, k.anchorY, pinRadius, 0, Math.PI * 2);
      renderCtx.fillStyle = palette.base;
      renderCtx.fill();
      renderCtx.beginPath();
      renderCtx.arc(
        k.anchorX - pinRadius * 0.28,
        k.anchorY - pinRadius * 0.28,
        pinRadius * 0.38,
        0,
        Math.PI * 2
      );
      renderCtx.fillStyle = palette.highlight;
      renderCtx.fill();

      // 6. Balloon tie-neck knot right under the letter base
      renderCtx.translate(k.knotX, k.knotY);
      renderCtx.rotate(k.rotation);

      renderCtx.beginPath();
      renderCtx.moveTo(-3.4, -3.5);
      renderCtx.lineTo(3.4, -3.5);
      renderCtx.quadraticCurveTo(6.3, 3.2, 4.8, 5.7);
      renderCtx.quadraticCurveTo(0, 7.2, -4.8, 5.7);
      renderCtx.quadraticCurveTo(-6.3, 3.2, -3.4, -3.5);
      renderCtx.closePath();
      renderCtx.fillStyle = palette.base;
      renderCtx.fill();

      // Subtle neck tie crease
      renderCtx.beginPath();
      renderCtx.moveTo(-4.1, 1.4);
      renderCtx.quadraticCurveTo(0, 2.7, 4.1, 1.4);
      renderCtx.strokeStyle = palette.deep;
      renderCtx.lineWidth = 1.35;
      renderCtx.stroke();

      // Tiny glossy knot highlight
      renderCtx.beginPath();
      renderCtx.ellipse(-1.5, 3.8, 1.5, 0.95, -0.25, 0, Math.PI * 2);
      renderCtx.fillStyle = palette.highlight;
      renderCtx.globalAlpha = 0.78;
      renderCtx.fill();

      renderCtx.restore();
    };

    const stepPhysicsAndRender = (dt: number) => {
      const renderCtx = ctx;
      const loadedSprites = sprites;
      if (!renderCtx || !loadedSprites) return;

      // Integrate interactive springs
      const springK = 118;
      const springDamp = 14.5;
      const pluckK = 195;
      const pluckDamp = 11.2;

      const kinematics = FOOTER_LOGO_LETTERS.map((letter, idx) => {
        const sp = springs[idx];

        if (pointer.draggedIndex === idx) {
          const rawDx = pointer.stageX - pointer.dragStartStageX;
          const rawDy = pointer.stageY - pointer.dragStartStageY;
          const maxPull = 44;
          const dist = Math.hypot(rawDx, rawDy);
          const scale =
            dist > 0 ? (maxPull * Math.tanh(dist / maxPull)) / dist : 0;
          const targetX = pointer.dragOriginX + rawDx * scale;
          const targetY = pointer.dragOriginY + rawDy * scale;
          sp.vx = (targetX - sp.x) / Math.max(dt, 0.008);
          sp.vy = (targetY - sp.y) / Math.max(dt, 0.008);
          sp.x = targetX;
          sp.y = targetY;
        } else {
          let fx = -springK * sp.x - springDamp * sp.vx;
          let fy = -springK * sp.y - springDamp * sp.vy;

          if (pointer.inside) {
            const sprMeta = loadedSprites[idx];
            const centerX = sprMeta
              ? sprMeta.x + sprMeta.width * 0.5 + sp.x
              : letter.knotX + sp.x;
            const centerY = sprMeta
              ? sprMeta.y + sprMeta.height * 0.52 + sp.y - 18
              : letter.knotY - 70 + sp.y;
            const dx = centerX - pointer.stageX;
            const dy = centerY - pointer.stageY;
            const distSq = dx * dx + dy * dy;
            const radius = 128;
            if (distSq < radius * radius) {
              const dist = Math.max(18, Math.sqrt(distSq));
              const falloff = (1 - dist / radius) ** 2;
              fx += ((dx / dist) * 920 + pointer.vx * 0.55) * falloff;
              fy += ((dy / dist) * 860 + pointer.vy * 0.5) * falloff;
            }
          }

          sp.vx += fx * dt;
          sp.vy += fy * dt;
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
        }

        const pluckAcc = -pluckK * sp.pluck - pluckDamp * sp.pluckV;
        sp.pluckV += pluckAcc * dt;
        sp.pluck = Math.max(-28, Math.min(28, sp.pluck + sp.pluckV * dt));

        return computeLetterKinematics(letter, elapsedSec, {
          x: sp.x,
          y: sp.y,
          pluck: sp.pluck,
        });
      });

      pointer.vx *= Math.exp(-dt * 18);
      pointer.vy *= Math.exp(-dt * 18);

      // Render frame
      renderCtx.setTransform(1, 0, 0, 1, 0, 0);
      renderCtx.clearRect(0, 0, canvas.width, canvas.height);

      renderCtx.setTransform(
        layout.dpr * layout.fit,
        0,
        0,
        layout.dpr * layout.fit,
        layout.dpr * layout.offsetX,
        layout.dpr * layout.offsetY
      );

      // 1. Ambient decorative mini-balloon clusters (back layer)
      for (let d = 0; d < FOOTER_LOGO_DECOR.length; d++) {
        const decor = FOOTER_LOGO_DECOR[d];
        const sprite = loadedSprites[10 + d];
        if (!sprite || sprite.width <= 1) continue;

        const rawPhase =
          elapsedSec / FOOTER_LOGO_STAGE.wavePeriodSec - decor.phaseOffset;
        const sample = evaluateHeliumTetherCycle(rawPhase);
        const angle = rawPhase * Math.PI * 2;
        const dy = (0.2 - sample.lift) * 44 * decor.liftScale;
        const dx = Math.sin(angle) * 2.4 * decor.swayDirection;
        const rot = Math.cos(angle) * 0.015 * decor.swayDirection;

        renderCtx.save();
        renderCtx.translate(decor.pivotX + dx, decor.pivotY + dy);
        renderCtx.rotate(rot);
        renderCtx.drawImage(
          sprite.canvas,
          sprite.x - decor.pivotX,
          sprite.y - decor.pivotY,
          sprite.width,
          sprite.height
        );
        renderCtx.restore();
      }

      // 2. Colored cords & knots for all 10 balloon letters
      const minStrokeStage = 1.65 / Math.max(layout.fit, 0.14);
      for (let i = 0; i < FOOTER_LOGO_LETTERS.length; i++) {
        drawCordAndKnot(renderCtx, i, kinematics[i], minStrokeStage);
      }

      // 3. Glossy 3D balloon letter sprites (front layer; dragged letter on top)
      const drawLetterSprite = (i: number) => {
        const letter = FOOTER_LOGO_LETTERS[i];
        const sprite = loadedSprites[i];
        const k = kinematics[i];
        if (!sprite || sprite.width <= 1) return;

        renderCtx.save();
        renderCtx.translate(k.knotX, k.knotY);
        renderCtx.rotate(k.rotation);
        renderCtx.scale(k.scaleX, k.scaleY);
        renderCtx.drawImage(
          sprite.canvas,
          sprite.x - letter.knotX,
          sprite.y - letter.knotY,
          sprite.width,
          sprite.height
        );
        renderCtx.restore();
      };

      for (let i = 0; i < FOOTER_LOGO_LETTERS.length; i++) {
        if (i === pointer.draggedIndex) continue;
        drawLetterSprite(i);
      }
      if (pointer.draggedIndex >= 0) {
        drawLetterSprite(pointer.draggedIndex);
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (
        !alive ||
        prefersReducedMotion ||
        !isIntersecting ||
        document.hidden ||
        !sprites
      ) {
        lastTime = 0;
        return;
      }

      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      elapsedSec += dt;

      stepPhysicsAndRender(dt);
      rafId = requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      if (prefersReducedMotion) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        lastTime = 0;
        delete host.dataset.logoReady;
        return;
      }

      if (sprites) {
        host.dataset.logoReady = 'true';
      }

      if (
        alive &&
        sprites &&
        isIntersecting &&
        !document.hidden &&
        !rafId
      ) {
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      }
    };

    let spritesLoading = false;
    const ensureSpritesLoaded = () => {
      if (sprites || spritesLoading) return;
      spritesLoading = true;
      loadSegmentedLogoSprites().then((loaded) => {
        if (!alive || !loaded) return;
        sprites = loaded;
        updateLayout();
        if (!prefersReducedMotion) {
          host.dataset.logoReady = 'true';
          stepPhysicsAndRender(1 / 60);
        }
        syncLoop();
      });
    };

    const hitTestLetter = (stageX: number, stageY: number): number => {
      if (!sprites) return -1;
      for (let i = FOOTER_LOGO_LETTERS.length - 1; i >= 0; i--) {
        const letter = FOOTER_LOGO_LETTERS[i];
        const sp = springs[i];
        const k = computeLetterKinematics(letter, elapsedSec, {
          x: sp.x,
          y: sp.y,
          pluck: sp.pluck,
        });
        const sprite = sprites[i];
        const left = sprite.x + k.translateX - 10;
        const right = sprite.x + sprite.width + k.translateX + 10;
        const top = sprite.y + k.translateY - 10;
        const bottom = sprite.y + sprite.height + k.translateY + 12;
        if (
          stageX >= left &&
          stageX <= right &&
          stageY >= top &&
          stageY <= bottom
        ) {
          return i;
        }
      }
      return -1;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (prefersReducedMotion || !sprites) return;
      const pt = clientToStage(event.clientX, event.clientY);
      const prevInside = pointer.inside;
      pointer.inside = pt.inside || pointer.draggedIndex >= 0;

      if (prevInside) {
        const dx = pt.x - pointer.prevStageX;
        const dy = pt.y - pointer.prevStageY;
        pointer.vx = pointer.vx * 0.45 + dx * 28;
        pointer.vy = pointer.vy * 0.45 + dy * 28;

        // Strum colored cords when pointer sweeps horizontally across them
        if (pointer.draggedIndex < 0 && Math.abs(dx) > 0.6) {
          for (let i = 0; i < FOOTER_LOGO_LETTERS.length; i++) {
            const letter = FOOTER_LOGO_LETTERS[i];
            if (pt.y >= letter.knotY - 25 && pt.y <= letter.anchorY + 12) {
              const prevSide = pointer.prevStageX - letter.knotX;
              const currSide = pt.x - letter.knotX;
              const crossed =
                prevSide * currSide <= 0 && Math.abs(currSide) < 48;
              const near = Math.abs(currSide) < 26;
              if (crossed || near) {
                springs[i].pluckV += Math.max(
                  -160,
                  Math.min(160, dx * (crossed ? 7.5 : 3.2))
                );
              }
            }
          }
        }
      }

      pointer.stageX = pt.x;
      pointer.stageY = pt.y;
      pointer.prevStageX = pt.x;
      pointer.prevStageY = pt.y;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (prefersReducedMotion || !sprites) return;
      const pt = clientToStage(event.clientX, event.clientY);
      pointer.inside = pt.inside;
      pointer.stageX = pt.x;
      pointer.stageY = pt.y;
      pointer.prevStageX = pt.x;
      pointer.prevStageY = pt.y;

      if (!pt.inside) return;

      const hitIndex = hitTestLetter(pt.x, pt.y);
      if (event.pointerType === 'mouse' && event.button === 0 && hitIndex >= 0) {
        pointer.draggedIndex = hitIndex;
        pointer.pointerId = event.pointerId;
        pointer.dragStartStageX = pt.x;
        pointer.dragStartStageY = pt.y;
        pointer.dragOriginX = springs[hitIndex].x;
        pointer.dragOriginY = springs[hitIndex].y;
        host.dataset.dragging = 'true';
        host.setPointerCapture?.(event.pointerId);
      } else if (hitIndex >= 0) {
        // Gentle touch tap impulse downward so helium & spring carry it back up
        springs[hitIndex].vy += 155;
        springs[hitIndex].pluckV +=
          FOOTER_LOGO_LETTERS[hitIndex].swayDirection * 85;
      }
    };

    const releaseDrag = () => {
      if (pointer.draggedIndex >= 0) {
        pointer.draggedIndex = -1;
        pointer.pointerId = -1;
        delete host.dataset.dragging;
      }
    };

    const onPointerLeave = () => {
      if (pointer.draggedIndex < 0) {
        pointer.inside = false;
      }
    };

    const onVisibilityChange = () => {
      lastTime = 0;
      syncLoop();
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      syncLoop();
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
          updateLayout();
          if (sprites && !prefersReducedMotion) {
            stepPhysicsAndRender(0);
          }
        })
        : null;
    resizeObserver?.observe(host);

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
          (entries) => {
            isIntersecting = entries.some((entry) => entry.isIntersecting);
            if (isIntersecting) {
              ensureSpritesLoaded();
            }
            syncLoop();
          },
          { rootMargin: '250px' }
        )
        : null;
    if (intersectionObserver) {
      intersectionObserver.observe(host);
    } else {
      isIntersecting = true;
      ensureSpritesLoaded();
    }

    updateLayout();
    host.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', releaseDrag);
    window.addEventListener('pointercancel', releaseDrag);
    host.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotionQuery?.addEventListener?.('change', onMotionPreferenceChange);

    return () => {
      alive = false;
      if (rafId) cancelAnimationFrame(rafId);
      delete host.dataset.logoReady;
      delete host.dataset.dragging;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseDrag);
      window.removeEventListener('pointercancel', releaseDrag);
      host.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery?.removeEventListener?.(
        'change',
        onMotionPreferenceChange
      );
    };
  }, []);

  const viewBox = `${FOOTER_LOGO_STAGE.viewX} ${FOOTER_LOGO_STAGE.viewY} ${FOOTER_LOGO_STAGE.viewWidth} ${FOOTER_LOGO_STAGE.viewHeight}`;

  return (
    <div
      ref={hostRef}
      className="elastic-logo"
      data-cursor="balloon"
      role="img"
      aria-label="Cris Balões"
    >
      <svg
        className="elastic-fallback"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <g className="footer-logo-cords">
          {FOOTER_LOGO_LETTERS.map((letter) => {
            const curve = computeStaticCordCurve(letter);
            const d = buildCordSvgPath(
              curve.cordStartX,
              curve.cordStartY,
              curve.c1x,
              curve.c1y,
              curve.c2x,
              curve.c2y,
              curve.anchorX,
              curve.anchorY
            );
            const tailD = `M ${curve.anchorX} ${curve.anchorY} Q ${curve.anchorX + letter.swayDirection * 4.5
              } ${curve.anchorY + 7.5} ${curve.anchorX - letter.swayDirection * 2.2
              } ${curve.anchorY + 14}`;

            return (
              <g
                key={letter.id}
                data-cord-id={letter.id}
                data-cord-letter={letter.char}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={letter.palette.glow}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <path
                  d={tailD}
                  fill="none"
                  stroke={letter.palette.base}
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  opacity={0.52}
                />
                <path
                  className="footer-logo-cord-main"
                  d={d}
                  fill="none"
                  stroke={letter.palette.base}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={letter.palette.highlight}
                  strokeWidth={1.1}
                  strokeLinecap="round"
                  opacity={0.5}
                  transform="translate(-0.55 0)"
                />
                <circle
                  cx={curve.anchorX}
                  cy={curve.anchorY}
                  r={2.9}
                  fill={letter.palette.base}
                />
                <path
                  d={`M ${letter.knotX - 3.4} ${letter.knotY - 3.5} L ${letter.knotX + 3.4
                    } ${letter.knotY - 3.5} Q ${letter.knotX + 6.3} ${letter.knotY + 3.2
                    } ${letter.knotX + 4.8} ${letter.knotY + 5.7} Q ${letter.knotX
                    } ${letter.knotY + 7.2} ${letter.knotX - 4.8} ${letter.knotY + 5.7
                    } Q ${letter.knotX - 6.3} ${letter.knotY + 3.2} ${letter.knotX - 3.4
                    } ${letter.knotY - 3.5} Z`}
                  fill={letter.palette.base}
                />
              </g>
            );
          })}
        </g>
        <image
          href={LOGO_SRC}
          x={0}
          y={0}
          width={FOOTER_LOGO_STAGE.sourceWidth}
          height={FOOTER_LOGO_STAGE.sourceHeight}
        />
      </svg>
      <canvas
        ref={canvasRef}
        className="footer-logo-canvas"
        aria-hidden="true"
      />
    </div>
  );
}

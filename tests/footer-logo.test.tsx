import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';
import ElasticFooterLogo from '@/components/interactive/ElasticFooterLogo';
import {
  computeLetterKinematics,
  evaluateHeliumTetherCycle,
  FOOTER_LOGO_LETTERS,
  FOOTER_LOGO_STAGE,
  segmentFooterLogoPixels,
} from '@/components/interactive/footerLogoConfig';

describe('Footer Helium Balloon Logo & Colored Cords', () => {
  it('renderiza as 10 letras de Cris Balões com cordões coloridos correspondentes no rodapé', () => {
    const { container } = render(<Footer />);

    const logoStage = screen.getByRole('img', { name: 'Cris Balões' });
    expect(logoStage).toBeTruthy();
    expect(logoStage.classList.contains('elastic-logo')).toBe(true);

    const spelled = FOOTER_LOGO_LETTERS.map((l) => l.char).join('');
    expect(spelled).toBe('CrisBalões');

    const cordGroups = container.querySelectorAll(
      '.footer-logo-cords [data-cord-id]'
    );
    expect(cordGroups).toHaveLength(10);

    const cordStrokes = Array.from(
      container.querySelectorAll<SVGPathElement>('.footer-logo-cord-main')
    ).map((el) => el.getAttribute('stroke'));
    expect(new Set(cordStrokes).size).toBe(4);
    expect(cordStrokes[0]).toBe('#2BB9F4'); // C (azul)
    expect(cordStrokes[1]).toBe('#FF6FAE'); // r (rosa)
    expect(cordStrokes[2]).toBe('#FACC15'); // i (amarelo)
    expect(cordStrokes[6]).toBe('#D257F6'); // l (lilás/violeta)
  });

  it('simula subida de gás hélio até o limite imaginário seguida de retorno suave de mola', () => {
    const start = evaluateHeliumTetherCycle(0.0);
    const midClimb = evaluateHeliumTetherCycle(0.3);
    const apexLimit = evaluateHeliumTetherCycle(0.58);
    const springPullbackMid = evaluateHeliumTetherCycle(0.71);
    const trough = evaluateHeliumTetherCycle(0.84);

    // Subida progressiva e contínua de hélio até o limite imaginário (58% do ciclo)
    expect(midClimb.lift).toBeGreaterThan(start.lift);
    expect(apexLimit.lift).toBeCloseTo(1.0, 4);
    expect(apexLimit.tension).toBeGreaterThan(0.98);
    expect(apexLimit.slack).toBeLessThan(0.02);

    // Retorno suave puxado pela mola do cordão (26% do ciclo, mais ágil que a subida)
    expect(springPullbackMid.lift).toBeLessThan(apexLimit.lift);
    expect(springPullbackMid.lift).toBeGreaterThan(trough.lift);
    expect(springPullbackMid.velocity).toBeLessThan(-1.5);
    expect(Math.abs(springPullbackMid.recoilRipple)).toBeGreaterThan(0);

    // Ponto inferior com cordão relaxado antes de voltar a subir
    expect(trough.lift).toBeCloseTo(0.0, 4);
    expect(trough.tension).toBe(0);
    expect(trough.slack).toBe(1);
  });

  it('estica o cordão ao atingir o limite superior e curva com folga ao descer, formando onda assíncrona', () => {
    const letterC = FOOTER_LOGO_LETTERS[0];
    const apexTime = 0.58 * FOOTER_LOGO_STAGE.wavePeriodSec;
    const troughTime = 0.84 * FOOTER_LOGO_STAGE.wavePeriodSec;

    const atApex = computeLetterKinematics(letterC, apexTime);
    const atTrough = computeLetterKinematics(letterC, troughTime);

    // No limite superior a letra está mais alta (translateY menor/mais negativo)
    expect(atApex.translateY).toBeLessThan(atTrough.translateY - 40);

    // Desvio lateral do ponto de controle Bezier em relação à reta cordStart -> anchor:
    const deviationFromStraight = (
      k: ReturnType<typeof computeLetterKinematics>
    ) => {
      const straightXAt33 = k.cordStartX + (k.anchorX - k.cordStartX) * 0.33;
      return Math.abs(k.c1x - straightXAt33);
    };

    expect(deviationFromStraight(atApex)).toBeLessThan(1.5);
    expect(deviationFromStraight(atTrough)).toBeGreaterThan(8);

    // Efeito de onda assíncrono entre as 10 letras no mesmo instante t
    for (let i = 1; i < FOOTER_LOGO_LETTERS.length; i++) {
      expect(FOOTER_LOGO_LETTERS[i].phaseOffset).toBeGreaterThan(
        FOOTER_LOGO_LETTERS[i - 1].phaseOffset
      );
    }

    const snapshotY = FOOTER_LOGO_LETTERS.map(
      (letter) => computeLetterKinematics(letter, 1.2).translateY
    );
    const spreadY = Math.max(...snapshotY) - Math.min(...snapshotY);
    expect(spreadY).toBeGreaterThan(35);
  });

  it('segmenta pixels sem perda e separa a costura entre o segundo "s" amarelo e o balão rosa lateral', () => {
    const w = 1491;
    const h = 586;
    const rgba = new Uint8ClampedArray(w * h * 4);

    // Bloco sintético na região do segundo "s" amarelo (x=1255..1350, y=275..375 -> 96x101 = 9696 px)
    let sourceNonZero = 0;
    for (let y = 275; y <= 375; y++) {
      for (let x = 1255; x <= 1350; x++) {
        const idx = (y * w + x) * 4;
        rgba[idx] = 250;
        rgba[idx + 1] = 195;
        rgba[idx + 2] = 25;
        rgba[idx + 3] = 255;
        sourceNonZero++;
      }
    }
    // Bloco rosa encostado à direita (x=1351..1380, y=275..320 -> decorRight)
    for (let y = 275; y <= 320; y++) {
      for (let x = 1351; x <= 1380; x++) {
        const idx = (y * w + x) * 4;
        rgba[idx] = 250;
        rgba[idx + 1] = 95;
        rgba[idx + 2] = 150;
        rgba[idx + 3] = 255;
        sourceNonZero++;
      }
    }

    const sprites = segmentFooterLogoPixels(w, h, rgba);
    expect(sprites).toHaveLength(13);

    const countOpaque = (buf: Uint8ClampedArray) => {
      let c = 0;
      for (let i = 3; i < buf.length; i += 4) if (buf[i] > 0) c++;
      return c;
    };

    const s2Pixels = countOpaque(sprites[9].rgba);
    const decorRightPixels = countOpaque(sprites[12].rgba);
    const totalSegmented = sprites.reduce(
      (acc, sp) => acc + countOpaque(sp.rgba),
      0
    );

    expect(s2Pixels).toBe(96 * 101);
    expect(decorRightPixels).toBe(30 * 46);
    expect(totalSegmented).toBe(sourceNonZero);
  });

  it('respeita prefers-reduced-motion mantendo fallback estático com cordões coloridos', () => {
    const matchSpy = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation(
        (query: string) =>
          ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }) as unknown as MediaQueryList
      );

    const { container, unmount } = render(<ElasticFooterLogo />);
    const host = container.querySelector<HTMLElement>('.elastic-logo');

    expect(host).toBeTruthy();
    expect(host?.dataset.logoReady).toBeUndefined();
    expect(
      host?.querySelectorAll('.footer-logo-cords [data-cord-id]').length
    ).toBe(10);

    unmount();
    matchSpy.mockRestore();
  });
});


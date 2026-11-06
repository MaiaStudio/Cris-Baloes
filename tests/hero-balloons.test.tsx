import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/sections/Hero';
import FinalCTA from '@/components/sections/FinalCTA';
import HeroBalloonCluster3D, {
  CTA_BALLOON_CLUSTER_CONFIG,
  DEFAULT_HERO_BALLOON_CONFIG,
} from '@/components/interactive/HeroBalloonCluster3D';
import {
  CTA_BALLOON_CLUSTER_BLUEPRINTS,
  CTA_BALLOON_PALETTE,
  HERO_BALLOON_PALETTE,
} from '@/components/interactive/heroBalloonConfig';

describe('Hero 3D Balloon Cluster', () => {
  it('preserva integralmente a estrutura editorial, microcopy e CTAs da Hero', () => {
    const { container } = render(<Hero />);

    const headingText = screen.getByRole('heading', { level: 1 }).textContent;
    expect(headingText).toContain('Um pouco de arte.');
    expect(headingText).toContain('Um mundo de');
    expect(headingText).toContain('possibilidades.');
    expect(screen.getByRole('link', { name: /Conheça nossas criações/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Vamos criar juntos/ })).toBeTruthy();
    expect(container.querySelector('.orbital-ring')).toBeTruthy();
    expect(container.querySelector('.art-note')).toBeNull();
    const sealWrapper = container.querySelector('.hero-seal-parallax');
    const seal = container.querySelector('.hero-seal');
    expect(sealWrapper).toBeTruthy();
    expect(seal).toBeTruthy();
    expect(seal?.textContent?.trim()).toBe('Feito para Encantar');
    expect(container.querySelector('.art-star')).toBeTruthy();
    expect(container.querySelector('.hero-balloon-cluster')).toBeTruthy();
  });

  it('ativa fallback estático quando WebGL não está disponível e limpa atributos no unmount', () => {
    const { container, unmount } = render(<HeroBalloonCluster3D />);
    const root = container.querySelector<HTMLElement>('.hero-balloon-cluster');

    expect(root).toBeTruthy();
    expect(root?.dataset.clusterFallback).toBe('true');
    expect(root?.querySelector('.hero-balloon-fallback svg.balloon-composition')).toBeTruthy();

    unmount();
    expect(container.querySelector('.hero-balloon-cluster')).toBeNull();
  });

  it('expõe configuração centralizada com a paleta pastel editorial e parâmetros físicos', () => {
    expect(HERO_BALLOON_PALETTE).toEqual([
      '#E07E68',
      '#FAF6EC',
      '#B489CA',
      '#7EB0C4',
      '#EAB949',
    ]);
    expect(DEFAULT_HERO_BALLOON_CONFIG.balloonCount.desktop).toBeGreaterThanOrEqual(18);
    expect(DEFAULT_HERO_BALLOON_CONFIG.balloonCount.desktop).toBeLessThanOrEqual(24);
    expect(DEFAULT_HERO_BALLOON_CONFIG.minRadius).toBeLessThan(
      DEFAULT_HERO_BALLOON_CONFIG.maxRadius
    );
    expect(DEFAULT_HERO_BALLOON_CONFIG.damping).toBeGreaterThan(0.8);
    expect(DEFAULT_HERO_BALLOON_CONFIG.damping).toBeLessThan(1);
    expect(DEFAULT_HERO_BALLOON_CONFIG.mouseRepelForce).toBeGreaterThan(0);
    expect(DEFAULT_HERO_BALLOON_CONFIG.mouseRepelRadius).toBeGreaterThan(0);
    expect(DEFAULT_HERO_BALLOON_CONFIG.restAttractForce).toBeGreaterThan(0);
  });

  it('aplica o cluster 3D interativo com fallback dedicado na seção FinalCTA', () => {
    const { container } = render(<FinalCTA />);
    const ctaCluster = container.querySelector<HTMLElement>('.final-cta .cta-balloon-cluster');

    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain(
      'Vamos criar algo'
    );
    expect(screen.getByRole('link', { name: /Quero transformar meu evento/ })).toBeTruthy();
    expect(ctaCluster).toBeTruthy();
    expect(ctaCluster?.dataset.clusterFallback).toBe('true');
    expect(
      ctaCluster?.querySelector('.hero-balloon-fallback svg.balloon-composition.balloon-small')
    ).toBeTruthy();
    expect(CTA_BALLOON_CLUSTER_CONFIG.balloonCount?.desktop).toBe(22);
    expect(CTA_BALLOON_CLUSTER_BLUEPRINTS.length).toBeGreaterThanOrEqual(22);
    expect(CTA_BALLOON_CLUSTER_CONFIG.compositionScale?.desktop).toBeCloseTo(0.95, 2);
    expect(CTA_BALLOON_PALETTE).not.toContain('#E07E68');
    expect(CTA_BALLOON_PALETTE).toContain('#CF1F2E');
    expect(CTA_BALLOON_CLUSTER_CONFIG.palette).toEqual(CTA_BALLOON_PALETTE);
  });
});


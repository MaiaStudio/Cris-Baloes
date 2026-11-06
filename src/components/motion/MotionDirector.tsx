'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function MotionDirector() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    let ready = false;
    const introduction = () => {
      if (ready) return;
      ready = true;
      window.dispatchEvent(new Event('cris:animate'));
    };
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let intro: gsap.core.Timeline | undefined;
      const animate = () => {
        intro = gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .fromTo('.hero h1 .line > span', { yPercent: 115, rotate: 1.5 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.1 })
          .fromTo('.hero-description,.hero-actions', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, stagger: 0.1 }, 0.3)
          .fromTo('.hero-art', { scale: 0.92, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 1.35 }, 0.04)
          .fromTo('.hero-seal', { scale: 0.75, rotate: -8, opacity: 0 }, { scale: 1, rotate: 12, opacity: 1, duration: 1.1 }, 0.42);
      };
      window.addEventListener('cris:animate', animate);
      if (ready) animate();
      if (document.querySelector('.hero-art > .balloon-composition')) {
        gsap.to('.hero-art > .balloon-composition', { y: -45, rotate: 3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.balloon-front', { y: -9, duration: 3.6, ease: 'sine.inOut', repeat: -1, yoyo: true });
        gsap.to('.balloon-back', { y: 7, duration: 4.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      }
      if (document.querySelector('.hero-seal-parallax')) {
        gsap.fromTo('.hero-seal-parallax', { y: 0, rotate: 0 }, { y: -96, rotate: 11, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.65 } });
      }
      const heroEl = document.querySelector<HTMLElement>('.hero');
      const sealEl = document.querySelector<HTMLElement>('.hero-seal');
      let cleanupSealPointer: (() => void) | undefined;
      if (heroEl && sealEl && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const sealX = gsap.quickTo(sealEl, 'x', { duration: 0.55, ease: 'power3.out' });
        const sealY = gsap.quickTo(sealEl, 'y', { duration: 0.55, ease: 'power3.out' });
        const onMove = (e: PointerEvent) => {
          const r = heroEl.getBoundingClientRect();
          sealX(((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 24);
          sealY(((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 18);
        };
        const onLeave = () => {
          sealX(0);
          sealY(0);
        };
        heroEl.addEventListener('pointermove', onMove, { passive: true });
        heroEl.addEventListener('pointerleave', onLeave);
        cleanupSealPointer = () => {
          sealX.tween.kill();
          sealY.tween.kill();
          heroEl.removeEventListener('pointermove', onMove);
          heroEl.removeEventListener('pointerleave', onLeave);
        };
      }
      gsap.to('.section-flower', { rotate: 95, ease: 'none', scrollTrigger: { trigger: '.services', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      gsap.fromTo(
        '.manifesto-title > span, .manifesto-title > em',
        { opacity: 0.18, y: 34 },
        { opacity: 1, y: 0, stagger: 0.3, ease: 'none', scrollTrigger: { trigger: '.manifesto-title', start: 'top 85%', end: 'bottom 42%', scrub: 1 } }
      );

      const manifestoShowcase = document.querySelector<HTMLElement>('.manifesto-showcase');
      const manifestoTrack = document.querySelector<HTMLElement>('.manifesto-track');
      const manifestoFirstSlide = document.querySelector<HTMLElement>('.manifesto-slide-first');
      const manifestoLastSlide = document.querySelector<HTMLElement>('.manifesto-slide-last');

      if (manifestoShowcase && manifestoTrack && manifestoFirstSlide && manifestoLastSlide) {
        const getStartX = () => (window.innerWidth - manifestoFirstSlide.offsetWidth) / 2;
        const getEndX = () => (window.innerWidth - manifestoLastSlide.offsetWidth) / 2 - manifestoLastSlide.offsetLeft;
        const getScrollDistance = () => Math.max(1400, Math.abs(getStartX() - getEndX()));

        gsap.set(manifestoTrack, { x: () => getStartX() });

        gsap.fromTo(
          manifestoFirstSlide,
          { scale: 0.9, opacity: 0.5 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: manifestoShowcase,
              start: 'top 85%',
              end: 'top top',
              scrub: 1,
            },
          }
        );

        const carouselTl = gsap.timeline({
          scrollTrigger: {
            trigger: manifestoShowcase,
            start: 'top top',
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        carouselTl.to({}, { duration: 0.08 });
        carouselTl.fromTo(
          manifestoTrack,
          { x: () => getStartX() },
          {
            x: () => getEndX(),
            ease: 'none',
            duration: 1.92,
          }
        );
      }
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) =>
        gsap.fromTo(el, { y: 42 }, { y: 0, duration: 0.95, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } })
      );
      gsap.utils.toArray<HTMLElement>('.process-step').forEach((el, i) =>
        gsap.fromTo(
          el.querySelector('.process-shape'),
          { rotate: -35, scale: 0.72 },
          { rotate: 0, scale: 1, duration: 0.95, delay: i * 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
        )
      );
      return () => {
        intro?.kill();
        cleanupSealPointer?.();
        window.removeEventListener('cris:animate', animate);
      };
    });
    window.addEventListener('cris:ready', introduction);
    const fallback = setTimeout(() => {
      if (document.querySelector<HTMLElement>('.door-preloader')?.hidden) introduction();
    }, 100);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts.ready.then(refresh);
    return () => {
      clearTimeout(fallback);
      window.removeEventListener('cris:ready', introduction);
      window.removeEventListener('load', refresh);
      mm.revert();
    };
  }, []);
  return null;
}

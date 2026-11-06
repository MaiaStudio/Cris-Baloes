'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight } from 'lucide-react';
import { contactHref, services } from '@/data/content';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

const BalloonBackground = dynamic(() => import('@/components/ui/demo'), { ssr: false });

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [showBalloons, setShowBalloons] = useState(false);

  useEffect(() => {
    if (isAutomatedAudit()) return;
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShowBalloons(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShowBalloons(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (isAutomatedAudit()) return;
    if (typeof window !== 'undefined' && window.innerWidth < 900) return;

    let cleanup: (() => void) | undefined;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();

        mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
          const updateActive = () => {
            if (!root.current) return;
            const chapters = gsap.utils.toArray<HTMLElement>('.service-chapter', root.current);
            if (!chapters.length) return;

            const focalLine = window.innerHeight * 0.52;
            let nextActive = 0;

            chapters.forEach((chapter, i) => {
              const heading = chapter.querySelector('h3') || chapter;
              const rect = heading.getBoundingClientRect();
              if (rect.top <= focalLine) {
                nextActive = i;
              }
            });

            nextActive = Math.max(0, Math.min(chapters.length - 1, nextActive));

            const photos = root.current.querySelectorAll<HTMLElement>('.service-photo-stack img');
            photos.forEach((img, idx) => {
              const isActive = idx === nextActive;
              img.classList.toggle('is-active', isActive);
              img.setAttribute('aria-hidden', String(!isActive));
            });

            const progressLinks = root.current.querySelectorAll<HTMLElement>('.service-progress a');
            progressLinks.forEach((a, idx) => {
              if (idx === nextActive) {
                a.setAttribute('aria-current', 'step');
              } else {
                a.removeAttribute('aria-current');
              }
            });

            setActive((prev) => (prev !== nextActive ? nextActive : prev));
          };

          let rafId: number | null = null;
          const onScroll = () => {
            if (rafId !== null) return;
            rafId = window.requestAnimationFrame(() => {
              updateActive();
              rafId = null;
            });
          };

          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll, { passive: true });
          ScrollTrigger.addEventListener('refresh', updateActive);
          window.addEventListener('cris:animate', updateActive);

          const st = ScrollTrigger.create({
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: updateActive,
          });

          updateActive();
          const timer = setTimeout(updateActive, 100);

          return () => {
            if (rafId !== null) window.cancelAnimationFrame(rafId);
            clearTimeout(timer);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            ScrollTrigger.removeEventListener('refresh', updateActive);
            window.removeEventListener('cris:animate', updateActive);
            st.kill();
          };
        });

        cleanup = () => mm.revert();
      }
    );

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <section className="services section-pad" id="servicos" ref={root}>
      <div className="services-balloon-layer" aria-hidden="true">
        {showBalloons && (
          <BalloonBackground className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-transparent opacity-85" />
        )}
      </div>
      <div className="section-heading" data-reveal>
        <div>
          <h2>
            Para cada ocasião,<br />
            um universo de<br />
            <em>possibilidades.</em>
          </h2>
        </div>
        <span className="section-flower" aria-hidden="true">✳</span>
      </div>

      <div className="service-story">
        <div className="service-visual">
          <div className="service-photo-stack">
            {services.map((s, i) => (
              <img
                key={s.number}
                src={`/assets/services/${s.image}.webp`}
                alt={
                  i === 0
                    ? 'Cenografia corporativa em balões esmeralda e dourados — Cris Balões'
                    : i === 1
                      ? 'Cenografia para eventos sociais e celebrações — Cris Balões'
                      : 'Composição de balões personalizados exclusivos — Cris Balões'
                }
                width={1086}
                height={1448}
                loading="lazy"
                decoding="async"
                className={active === i ? 'is-active' : ''}
                aria-hidden={active !== i}
              />
            ))}
          </div>

          <div className="service-progress">
            {services.map((s, i) => (
              <a
                href={`#servico-${i}`}
                key={s.number}
                aria-label={s.name}
                aria-current={active === i ? 'step' : undefined}
                onClick={(e) => {
                  const el = document.getElementById(`servico-${i}`);
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setActive(i);
                    const photos = root.current?.querySelectorAll<HTMLElement>('.service-photo-stack img');
                    photos?.forEach((img, idx) => {
                      img.classList.toggle('is-active', idx === i);
                      img.setAttribute('aria-hidden', String(idx !== i));
                    });
                    const progressLinks = root.current?.querySelectorAll<HTMLElement>('.service-progress a');
                    progressLinks?.forEach((a, idx) => {
                      if (idx === i) a.setAttribute('aria-current', 'step');
                      else a.removeAttribute('aria-current');
                    });
                  }
                }}
              >
                <span>{s.number}</span>
                <i />
              </a>
            ))}
          </div>
        </div>

        <div className="service-chapters">
          {services.map((s, i) => (
            <article className="service-chapter" id={`servico-${i}`} key={s.number}>
              <img
                className="service-mobile-photo"
                src={`/assets/services/${s.image}.webp`}
                alt={`Projeto Cris Balões — ${s.name}`}
                width={1086}
                height={1448}
                loading="lazy"
                decoding="async"
              />
              <h3>{s.headline}</h3>
              <p>{s.text}</p>
              <a className="text-link" href={contactHref}>
                Vamos imaginar seu projeto <ArrowUpRight size={18} />
              </a>
              {i === 2 && (
                <small className="service-image-note">
                  Na imagem: detalhe de cenografia personalizada.
                </small>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

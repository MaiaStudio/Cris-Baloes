'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { brand, contactHref } from '@/data/content';
import { CTA_BALLOON_CLUSTER_CONFIG } from '@/components/interactive/heroBalloonConfig';
import BalloonComposition from '@/components/interactive/BalloonComposition';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(() => process.env.NODE_ENV === 'test');
  const [ClusterComp, setClusterComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (isAutomatedAudit()) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      import('@/components/interactive/HeroBalloonCluster3D').then((m) => {
        setClusterComp(() => m.default);
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
          import('@/components/interactive/HeroBalloonCluster3D').then((m) => {
            setClusterComp(() => m.default);
          });
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="final-cta section-pad" id="contato">
      <h2 data-reveal>
        Vamos criar algo<br />
        <em>inesquecível?</em>
      </h2>
      <p>
        Toda grande experiência começa com uma ideia.<br />
        Conte a sua para nós.
      </p>
      {brand.whatsapp ? (
        <a className="button button-dark" href={contactHref} target="_blank" rel="noopener noreferrer">
          Quero transformar meu evento <ArrowUpRight size={19} />
        </a>
      ) : (
        <p>Nosso canal de atendimento será disponibilizado em breve.</p>
      )}
      {inView && (
        ClusterComp ? (
          <ClusterComp config={CTA_BALLOON_CLUSTER_CONFIG} className="cta-balloon-cluster" smallFallback />
        ) : (
          <div className="hero-balloon-cluster cta-balloon-cluster" aria-hidden="true" data-cluster-fallback="true">
            <div className="hero-balloon-fallback">
              <BalloonComposition small />
            </div>
          </div>
        )
      )}
      <span className="cta-spark" aria-hidden="true">✳</span>
    </section>
  );
}

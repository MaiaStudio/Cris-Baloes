'use client';

import { useEffect, useState } from 'react';
import BalloonComposition from '@/components/interactive/BalloonComposition';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

export default function HeroBalloonClusterClient() {
  const [ClusterComp, setClusterComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (isAutomatedAudit()) return;

    let mounted = true;
    const trigger = () => {
      cleanup();
      import('@/components/interactive/HeroBalloonCluster3D').then((m) => {
        if (mounted) {
          setClusterComp(() => m.default);
        }
      });
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', trigger);
      window.removeEventListener('touchstart', trigger);
      window.removeEventListener('scroll', trigger);
      window.removeEventListener('keydown', trigger);
    };

    window.addEventListener('pointermove', trigger, { passive: true, once: true });
    window.addEventListener('touchstart', trigger, { passive: true, once: true });
    window.addEventListener('scroll', trigger, { passive: true, once: true });
    window.addEventListener('keydown', trigger, { passive: true, once: true });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  if (ClusterComp) {
    return <ClusterComp />;
  }

  return (
    <div className="hero-balloon-cluster" aria-hidden="true" data-cluster-fallback="true">
      <div className="hero-balloon-fallback">
        <BalloonComposition />
      </div>
    </div>
  );
}

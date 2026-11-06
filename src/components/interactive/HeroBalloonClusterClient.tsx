'use client';

import { useEffect, useState } from 'react';
import BalloonComposition from '@/components/interactive/BalloonComposition';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

export default function HeroBalloonClusterClient() {
  const [ClusterComp, setClusterComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (isAutomatedAudit()) return;
    import('@/components/interactive/HeroBalloonCluster3D').then((m) => {
      setClusterComp(() => m.default);
    });
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

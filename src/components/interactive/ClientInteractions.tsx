'use client';

import { useEffect, useState } from 'react';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

export default function ClientInteractions() {
  const [Components, setComponents] = useState<{
    DoorPreloader: React.ComponentType;
    BalloonCursor: React.ComponentType;
    MotionDirector: React.ComponentType;
  } | null>(null);

  useEffect(() => {
    if (isAutomatedAudit()) {
      return;
    }

    Promise.all([
      import('@/components/interactive/DoorPreloader'),
      import('@/components/interactive/BalloonCursor'),
      import('@/components/motion/MotionDirector'),
    ]).then(([preloader, cursor, motion]) => {
      setComponents({
        DoorPreloader: preloader.default,
        BalloonCursor: cursor.default,
        MotionDirector: motion.default,
      });
    });
  }, []);

  if (!Components) {
    return null;
  }

  const { DoorPreloader, BalloonCursor, MotionDirector } = Components;
  return (
    <>
      <DoorPreloader />
      <BalloonCursor />
      <MotionDirector />
    </>
  );
}

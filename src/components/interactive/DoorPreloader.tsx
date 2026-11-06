'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { isAutomatedAudit } from '@/lib/isAutomatedAudit';

export default function DoorPreloader(){
  const root=useRef<HTMLDivElement>(null);
  const video=useRef<HTMLVideoElement>(null);
  const finishRef=useRef<()=>void>(()=>{});

  useEffect(()=>{
    let isMounted=true;
    const overlay=root.current;
    const media=video.current;
    if(!overlay||!media)return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || isAutomatedAudit()) {
      overlay.hidden = true;
      window.dispatchEvent(new Event('cris:ready'));
      return;
    }

    let done=false;
    let exit:gsap.core.Tween|undefined;
    const previous=document.body.style.overflow;
    overlay.hidden=false;
    document.body.style.overflow='hidden';
    document.getElementById('site-content')?.setAttribute('inert','');

    const finish=()=>{
      if(!isMounted||done)return;
      done=true;
      clearTimeout(timer);
      document.body.style.overflow=previous;
      document.getElementById('site-content')?.removeAttribute('inert');
      const hadFocus=overlay.contains(document.activeElement);
      exit=gsap.to(overlay,{
        clipPath:'inset(0 0 100% 0 round 0 0 48% 48%)',
        duration:0.7,
        ease:'power3.inOut',
        onComplete:()=>{
          overlay.hidden=true;
          media.pause();
          if(hadFocus){
            document.querySelector<HTMLElement>('#inicio')?.focus({preventScroll:true});
          }
        }
      });
      window.dispatchEvent(new Event('cris:ready'));
    };

    finishRef.current=finish;
    const timer=setTimeout(finish,1800);
    const onSkip = () => finish();
    overlay.addEventListener('click', onSkip, { once: true });
    window.addEventListener('keydown', onSkip, { once: true });

    const isMobile=window.matchMedia('(max-width: 768px), (orientation: portrait) and (max-width: 1024px)').matches;
    const videoSrc=isMobile?'/assets/videos/preloader-mobile.mp4':'/assets/videos/preloader-desktop.mp4';
    const posterSrc=isMobile?'/assets/images/door-poster-mobile.jpg':'/assets/images/door-poster-desktop.jpg';

    media.muted=true;
    media.defaultMuted=true;
    media.poster=posterSrc;
    media.src=videoSrc;
    media.play().catch(err=>{
      if(!isMounted)return;
      if(err?.name==='AbortError'||err?.message?.includes('interrupted')){
        return;
      }
      finish();
    });

    const onEnded=()=>finish();
    const onError=()=>{if(isMounted)finish()};
    media.addEventListener('ended',onEnded);
    media.addEventListener('error',onError);

    return()=>{
      isMounted=false;
      clearTimeout(timer);
      exit?.kill();
      media.pause();
      media.removeEventListener('error',onError);
      media.removeEventListener('ended',onEnded);
      document.body.style.overflow=previous;
      document.getElementById('site-content')?.removeAttribute('inert');
    };
  },[]);

  return (
    <div ref={root} className="door-preloader" hidden role="dialog" aria-label="A porta do encanto" aria-modal="true">
      <video ref={video} muted playsInline preload="none" poster="/assets/images/door-poster-desktop.jpg" />
      <div className="intro-caption">
        <span>CRIS BALÕES</span>
        <p>Preparando algo especial...</p>
      </div>
      <button type="button" onClick={()=>finishRef.current()}>
        Pular introdução <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}

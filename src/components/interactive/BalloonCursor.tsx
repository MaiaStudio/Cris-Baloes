'use client';
import {useEffect,useRef} from 'react';
import gsap from 'gsap';
export default function BalloonCursor(){const root=useRef<HTMLDivElement>(null);useEffect(()=>{
  const el=root.current;if(!el)return;const mm=gsap.matchMedia();mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
    const x=gsap.quickTo(el,'x',{duration:.35,ease:'power3.out'}),y=gsap.quickTo(el,'y',{duration:.35,ease:'power3.out'});
    const move=(e:PointerEvent)=>{x(e.clientX+15);y(e.clientY+15);el.style.opacity='1';const target=e.target as HTMLElement;el.dataset.interactive=String(!!target.closest('a,button,[data-cursor]'));el.style.visibility=target.closest('input,textarea,select')?'hidden':'visible'};
    const down=()=>gsap.to(el,{scale:.86,duration:.12,ease:'power2.out'});const up=()=>gsap.to(el,{scale:1,duration:.32,ease:'expo.out'});const leave=()=>{el.style.opacity='0'};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);document.addEventListener('pointerleave',leave);
    return()=>{x.tween.kill();y.tween.kill();gsap.killTweensOf(el);el.style.opacity='0';window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);document.removeEventListener('pointerleave',leave)};
  });return()=>mm.revert();},[]);return <div className="balloon-cursor" ref={root} aria-hidden="true"><svg viewBox="0 0 40 50"><path d="M12 25q13 6 8 22M29 23q-12 9-9 24" fill="none" stroke="#111f2f" strokeWidth=".95"/><ellipse cx="12" cy="18" rx="8" ry="10" fill="#E07E68"/><ellipse cx="28" cy="18" rx="8" ry="10" fill="#B489CA"/><ellipse cx="20" cy="10" rx="8" ry="10" fill="#EAB949"/><path d="M16 5l2-2M8 14l2-2M25 13l2-2" stroke="#faf6ec" strokeWidth="2" strokeLinecap="round"/></svg></div>}

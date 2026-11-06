'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { contactHref, navigation } from '@/data/content';
export default function Header(){
  const [open,setOpen]=useState(false); const [active,setActive]=useState('#inicio'); const [hidden,setHidden]=useState(false);
  const nav=useRef<HTMLElement>(null); const toggle=useRef<HTMLButtonElement>(null); const hiddenRef=useRef(false);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)setActive(`#${e.target.id}`)},{rootMargin:'-15% 0px -55% 0px'});navigation.forEach(([,href])=>{const el=document.querySelector(href);if(el)observer.observe(el)});return()=>observer.disconnect()},[]);
  useEffect(()=>{
    let lastY=window.scrollY;
    const set=(next:boolean)=>{if(hiddenRef.current!==next){hiddenRef.current=next;setHidden(next)}};
    const onScroll=()=>{const y=Math.max(0,window.scrollY),d=y-lastY;if(y<=64){set(false);lastY=y}else if(d>8&&y>96){set(true);lastY=y}else if(d<-6){set(false);lastY=y}};
    window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll);
  },[]);
  useEffect(()=>{
    if(!open)return; const previous=document.body.style.overflow; document.body.style.overflow='hidden';
    nav.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus()} if(e.key==='Tab') {const links=[toggle.current,...Array.from(nav.current?.querySelectorAll<HTMLElement>('a')??[])].filter(Boolean) as HTMLElement[];const first=links[0],last=links.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
    window.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',key)};
  },[open]);
  return <header className="site-header" data-hidden={hidden&&!open?'true':undefined}><a href="#inicio" className="brand-link" aria-label="Cris Balões — início"><img src="/assets/brand/logo-horizontal.webp" width="1491" height="586" alt="Cris Balões" fetchPriority="high"/></a><button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" aria-label={open?'Fechar menu':'Abrir menu'} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav ref={nav} id="main-navigation" aria-label="Navegação principal" className={open?'is-open':''}>{navigation.slice(1).map(([label,href])=><a key={href} href={href} aria-current={active===href?'location':undefined} onClick={()=>setOpen(false)}>{label}</a>)}<a href={contactHref} className="header-cta" onClick={()=>setOpen(false)}>Solicitar orçamento <ArrowUpRight size={16}/></a></nav></header>
}

'use client';
import { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import PixelSwap from '@/components/vendor/PixelSwap';
import type { Project } from '@/data/projects';
export default function ProjectRevealCard({project,index}:{project:Project;index:number}){
  const [active,setActive]=useState(false);
  const photo=(src:string,alt:string)=><img src={src} alt={alt} width={1120} height={1400} loading="lazy" decoding="async" style={{objectPosition:project.objectPosition}}/>;
  return <article className={`project-card project-${index+1}`} data-revealed={active?'true':'false'} data-reveal>
    <div className="project-media" data-cursor="reveal">
      {project.withoutBalloons?<PixelSwap firstContent={photo(project.withoutBalloons,`Ambiente antes da ornamentação — ${project.name}`)} secondContent={photo(project.original,project.alt)} pattern="pointer" pixelSize={32} duration={600} pixelDuration={320} randomness={0.12} bounce={0.15} intro={false} active={active} onActiveChange={setActive} trigger="hover" aspectRatio={project.aspectRatio}/>:photo(project.original,project.alt)}
      {project.withoutBalloons&&<button className="reveal-control" onClick={()=>setActive(v=>!v)} aria-pressed={active} aria-label={`${active?'Ver antes':'Revelar transformação'}: ${project.name}`}><Sparkles size={15}/><span>{active?'Ver antes':'Revelar transformação'}</span><span aria-hidden="true">{active?'−':'+'}</span></button>}
      <span className="project-state" aria-hidden="true">{active?'O encanto acontece':'Tudo começa com um espaço'}</span>
    </div>
    <div className="project-caption"><div><h3>{project.name}</h3></div><span className="project-number">0{index+1} <ArrowUpRight size={20}/></span></div>
  </article>
}

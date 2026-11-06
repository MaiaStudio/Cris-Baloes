import { ArrowUpRight } from 'lucide-react';
import HeroBalloonCluster3D from '@/components/interactive/HeroBalloonCluster3D';
import {contactHref} from '@/data/content';
export default function Hero(){return <section className="hero section-pad" id="inicio" tabIndex={-1}>
  <div className="hero-content"><div className="hero-copy"><h1><span className="line"><span>Um pouco de arte. </span></span><span className="line"><span>Um mundo de </span></span><span className="line"><span><em>possibilidades.</em></span></span></h1><p className="hero-description">Transformamos ideias em cenários extraordinários. Com criatividade, técnica e atenção a cada detalhe, criamos decorações com balões que surpreendem, emocionam e dão vida a eventos e celebrações.</p><div className="hero-actions"><a className="button button-dark" href="#projetos">Conheça nossas criações <ArrowUpRight size={18}/></a><a className="text-link" href={contactHref}>Vamos criar juntos <ArrowUpRight size={17}/></a></div></div>
  <div className="hero-art"><div className="orbital-ring"/><HeroBalloonCluster3D/><div className="hero-seal-parallax"><div className="hero-seal"><span>Feito para </span><em>Encantar</em></div></div><span className="art-star" aria-hidden="true">✳</span></div></div>
</section>}

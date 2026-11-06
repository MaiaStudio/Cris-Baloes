import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectRevealCard from '@/components/interactive/ProjectRevealCard';
import Hero from '@/components/sections/Hero';
import Manifesto from '@/components/sections/Manifesto';
import Projects from '@/components/sections/Projects';
import Services from '@/components/sections/Services';
import About from '@/components/sections/About';
import Process from '@/components/sections/Process';
import FinalCTA from '@/components/sections/FinalCTA';
import DoorPreloader from '@/components/interactive/DoorPreloader';
import Header from '@/components/layout/Header';
import {projects} from '@/data/projects';
import {brand,contactHref} from '@/data/content';
vi.mock('gsap',()=>({default:{registerPlugin:vi.fn(),matchMedia:vi.fn(()=>({add:vi.fn(),revert:vi.fn()})),utils:{toArray:vi.fn(()=>[])},to:vi.fn((_target:unknown,config:{onComplete?:()=>void})=>{config.onComplete?.();return{kill:vi.fn()}})}}));
describe('Portfólio e contatos',()=>{
 it('começa no ambiente sem balões e alterna pelos controles de teclado',async()=>{
  const user=userEvent.setup();const {container}=render(<ProjectRevealCard project={projects[0]} index={0}/>);
  const layers=container.querySelectorAll('[data-visible]');expect(layers[0].getAttribute('data-visible')).toBe('true');expect(layers[1].getAttribute('data-visible')).toBe('false');
  const toggle=screen.getByRole('button',{name:/Revelar transformação/});toggle.focus();await user.keyboard('{Enter}');expect(toggle.getAttribute('aria-pressed')).toBe('true');expect(layers[1].getAttribute('data-visible')).toBe('true');
  await user.keyboard(' ');expect(toggle.getAttribute('aria-pressed')).toBe('false');expect(layers[0].getAttribute('data-visible')).toBe('true');
 });
 it('permite primeiro e segundo toque e reversões rápidas',()=>{render(<ProjectRevealCard project={projects[0]} index={0}/>);const button=screen.getByRole('button');for(let i=0;i<8;i++)fireEvent.click(button);expect(button.getAttribute('aria-pressed')).toBe('false');fireEvent.click(button);expect(button.getAttribute('aria-pressed')).toBe('true');fireEvent.click(button);expect(button.getAttribute('aria-pressed')).toBe('false')});
 it('filtra pelos projetos reais e permite voltar ao conjunto completo',async()=>{const user=userEvent.setup();render(<Projects/>);expect(screen.getAllByRole('article')).toHaveLength(4);await user.click(screen.getByRole('button',{name:'Eventos corporativos'}));expect(screen.getAllByRole('article')).toHaveLength(1);expect(screen.getByText('Imaginação em grande escala')).toBeTruthy();await user.click(screen.getByRole('button',{name:/Todos/}));expect(screen.getAllByRole('article')).toHaveLength(4)});
 it('mantém enquadramento compartilhado e caminhos únicos em todos os pares',()=>{expect(new Set(projects.map(p=>p.id)).size).toBe(4);projects.forEach(p=>{expect(p.pairStatus).toBe('available');expect(p.original).toContain(`/original/${p.id}.webp`);expect(p.withoutBalloons).toContain(`/without-balloons/${p.id}.webp`);expect(p.objectPosition).toBe('50% 50%')})});
 it('utiliza o WhatsApp e Instagram fornecidos pelo responsável',()=>{expect(contactHref).toContain('https://wa.me/5541991126565?text=');expect(brand.instagram).toBe('https://www.instagram.com/crisbaloes')});
});
describe('Navegação',()=>{
 it('abre menu com foco, fecha por Escape e restaura a rolagem',async()=>{const user=userEvent.setup();render(<Header/>);const toggle=screen.getByRole('button',{name:'Abrir menu'});await user.click(toggle);expect(toggle.getAttribute('aria-expanded')).toBe('true');expect(document.body.style.overflow).toBe('hidden');expect(document.activeElement?.tagName).toBe('A');await user.keyboard('{Escape}');expect(toggle.getAttribute('aria-expanded')).toBe('false');expect(document.body.style.overflow).toBe('');expect(document.activeElement).toBe(toggle)});
 it('recolhe o header ao rolar para baixo e exibe novamente ao rolar para cima',()=>{
  const {container}=render(<Header/>);const header=container.querySelector('.site-header');
  Object.defineProperty(window,'scrollY',{value:0,writable:true,configurable:true});
  expect(header?.getAttribute('data-hidden')).toBeNull();
  Object.defineProperty(window,'scrollY',{value:180,writable:true,configurable:true});
  fireEvent.scroll(window);
  expect(header?.getAttribute('data-hidden')).toBe('true');
  Object.defineProperty(window,'scrollY',{value:140,writable:true,configurable:true});
  fireEvent.scroll(window);
  expect(header?.getAttribute('data-hidden')).toBeNull();
  Object.defineProperty(window,'scrollY',{value:0,writable:true,configurable:true});
 });
});
describe('Introdução',()=>{
 beforeEach(()=>{vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();});
 const motion=(reduced:boolean)=>vi.spyOn(window,'matchMedia').mockImplementation(query=>({matches:reduced,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList));
 it('respeita redução de movimento sem reproduzir o vídeo',()=>{motion(true);const {container}=render(<DoorPreloader/>);expect(container.querySelector<HTMLElement>('.door-preloader')?.hidden).toBe(true);expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()});
 it('sempre exibe a introdução ao carregar ou recarregar a página',()=>{motion(false);sessionStorage.setItem('cris-intro','seen');const {container}=render(<DoorPreloader/>);expect(container.querySelector<HTMLElement>('.door-preloader')?.hidden).toBe(false);expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()});
 it('pular libera o conteúdo imediatamente',()=>{motion(false);const {container}=render(<><div id="site-content"/><DoorPreloader/></>);expect(document.getElementById('site-content')?.hasAttribute('inert')).toBe(true);fireEvent.click(screen.getByRole('button',{name:/Pular introdução/}));expect(container.querySelector<HTMLElement>('.door-preloader')?.hidden).toBe(true);expect(document.getElementById('site-content')?.hasAttribute('inert')).toBe(false);expect(document.body.style.overflow).toBe('')});
 it('falha de reprodução não bloqueia a página',async()=>{motion(false);vi.spyOn(HTMLMediaElement.prototype,'play').mockRejectedValue(new Error('autoplay unavailable'));const {container}=render(<DoorPreloader/>);await waitFor(()=>expect(container.querySelector<HTMLElement>('.door-preloader')?.hidden).toBe(true));expect(document.body.style.overflow).toBe('')});
});
describe('Apresentação limpa e barra de rolagem',()=>{
 it('remove todos os eyebrows das seções do site',()=>{
  const {container}=render(<><Hero/><Manifesto/><Projects/><Services/><About/><Process/><FinalCTA/></>);
  expect(container.querySelectorAll('.eyebrow')).toHaveLength(0);
  expect(container.textContent).not.toContain('01 / Nossa essência');
  expect(container.textContent).not.toContain('02 / Projetos selecionados');
  expect(container.textContent).not.toContain('03 / O que criamos');
  expect(container.textContent).not.toContain('04 / Nossa história');
  expect(container.textContent).not.toContain('05 / Nosso processo');
  expect(container.textContent).not.toContain('Seu próximo momento começa aqui');
  expect(container.querySelector('.hero-bottom')).toBeNull();
  expect(container.textContent).not.toContain('Role para descobrir');
  expect(container.textContent).not.toContain('Arte que transforma. Emoção que fica.');
  expect(container.querySelector('.portfolio-end')).toBeNull();
  expect(container.textContent).not.toContain('Um universo de possibilidades');
   expect(container.querySelector('.art-note')).toBeNull();
   expect(container.textContent).not.toContain('O encanto começa');
   expect(container.textContent).not.toContain('antes mesmo da festa');
 });
 it('mantém a barra de rolagem visível e estilizada com a cor solicitada',()=>{
  const css=readFileSync(resolve(process.cwd(),'src/app/globals.css'),'utf8');
  expect(css).not.toContain('scrollbar-width: none;');
  expect(css).toContain('#b8482e');
  expect(css).not.toContain('.eyebrow');
 });
});

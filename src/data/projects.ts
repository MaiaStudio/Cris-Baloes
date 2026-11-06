export type Project = {
  id: string; name: string; category: 'Eventos sociais' | 'Eventos corporativos';
  original: string; withoutBalloons: string | null; alt: string;
  aspectRatio: string; objectPosition: string; pairStatus: 'available' | 'missing';
  note: string;
};
export const projects: Project[] = [
  {id:'02',name:'Uma noite dourada',category:'Eventos sociais',alt:'Salão com instalações suspensas de balões dourados e mesas preparadas para uma celebração.',aspectRatio:'3 / 4',note:'1086×1448 normalizados; sem recorte.'},
  {id:'01',name:'O céu também celebra',category:'Eventos sociais',alt:'Celebração com uma jovem em vestido lilás sob uma composição de balões brancos e metálicos.',aspectRatio:'4 / 5',note:'1440×1800 e 1121×1403 normalizados para 1120×1400; sem recorte.'},
  {id:'03',name:'Imaginação em grande escala',category:'Eventos corporativos',alt:'Instalação de balões vermelhos, pretos e brancos suspensa no átrio de um shopping.',aspectRatio:'1122 / 1402',note:'Mesmo tamanho nativo, 1122×1402.'},
  {id:'04',name:'Histórias que merecem festa',category:'Eventos sociais',alt:'Composição de balões verdes e dourados em torno do painel Medicina UFPR, 40 anos.',aspectRatio:'1122 / 1402',note:'Mesmo tamanho nativo, 1122×1402; diferenças de reconstrução no fundo fornecido.'},
].map(p=>({...p,category:p.category as Project['category'],original:`/assets/projects/original/${p.id}.webp`,withoutBalloons:`/assets/projects/without-balloons/${p.id}.webp`,objectPosition:'50% 50%',pairStatus:'available' as const}));

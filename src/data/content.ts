export const brand = {
  name: 'Cris Balões', since: '1997', city: 'Curitiba, PR',
  // Set only confirmed commercial destinations. No placeholder numbers or fabricated profiles.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '5541991126565',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com/crisbaloes',
  facebook: 'https://www.facebook.com/crisbaloes',
  tiktok: 'https://www.tiktok.com/@crisbaloes',
};
export const contactHref = brand.whatsapp ? `https://wa.me/${brand.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Olá! Quero transformar meu evento com a Cris Balões.')}` : '#contato';
export const navigation = [ ['Início','#inicio'], ['Projetos','#projetos'], ['Serviços','#servicos'], ['Nossa história','#historia'], ['Contato','#contato'] ] as const;
export const services = [
  {number:'01',name:'Eventos corporativos',headline:'Sua marca merece surpreender.',text:'Cenografia, ativações e instalações que dão vida à identidade da sua empresa e transformam espaços em experiências marcantes.',image:'01'},
  {number:'02',name:'Eventos sociais',headline:'Momentos especiais ganham novas cores.',text:'Criamos composições para celebrar histórias, encontros e ocasiões que merecem uma atmosfera única.',image:'02'},
  {number:'03',name:'Balões personalizados',headline:'Pequenos detalhes. Grandes emoções.',text:'Arranjos, presentes e criações personalizadas para tornar cada gesto ainda mais especial.',image:'03'},
];
export const processSteps = [
  {title:'Você imagina.',text:'Ouvimos suas ideias e descobrimos o que torna sua ocasião especial.'},
  {title:'Nós criamos.',text:'Combinamos cores, proporções e possibilidades para desenvolver uma composição com identidade própria.'},
  {title:'A magia acontece.',text:'Transformamos o espaço para surpreender desde o primeiro olhar.'},
];

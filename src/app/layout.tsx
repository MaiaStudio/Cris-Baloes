import type { Metadata } from 'next';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/standard-italic.css';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://crisbaloes.com.br'),
  title:'Cris Balões · Arte & cenografia desde 1997',
  description:'Arte, decoração e cenografia com balões para eventos corporativos e celebrações em Curitiba.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph:{title:'Cris Balões · O encanto começa aqui',description:'Arte, cor e criatividade para transformar espaços em experiências.',locale:'pt_BR',type:'website',images:[{url:'/assets/projects/original/02.webp',width:1086,height:1448,alt:'Cenografia dourada da Cris Balões'}]},
  robots:{index:true,follow:true},
};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}

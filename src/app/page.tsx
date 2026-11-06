import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Manifesto from '@/components/sections/Manifesto';
import Projects from '@/components/sections/Projects';
import Services from '@/components/sections/Services';
import About from '@/components/sections/About';
import Process from '@/components/sections/Process';
import FinalCTA from '@/components/sections/FinalCTA';
import ClientInteractions from '@/components/interactive/ClientInteractions';

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#inicio">Pular para o conteúdo</a>
      <div id="site-content">
        <Header />
        <main>
          <Hero />
          <Manifesto />
          <Projects />
          <Services />
          <About />
          <Process />
          <FinalCTA />
        </main>
        <Footer />
      </div>
      <ClientInteractions />
    </>
  );
}

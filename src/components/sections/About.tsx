import { ArrowUpRight } from 'lucide-react';

export default function About() {
  return (
    <section className="about section-pad" id="historia">
      <div className="about-copy" data-reveal>
        <h2>
          A experiência<br />
          aperfeiçoa a técnica.<br />
          A paixão mantém<br />
          <em>a magia.</em>
        </h2>
        <p className="about-lead">
          Desde 1997, damos vida a ideias por meio da arte com balões.
        </p>
        <p>
          Nossa trajetória é construída com criatividade, dedicação e um olhar atento a cada detalhe.
          Dos pequenos arranjos às grandes produções, acreditamos que cada projeto merece personalidade,
          cuidado e excelência.
        </p>
        <p>
          Porque, para nós, criar é também uma forma de emocionar.
        </p>
        <a className="text-link" href="#processo">
          Conheça nosso jeito de criar <ArrowUpRight size={18} />
        </a>
      </div>

      <div className="about-image" data-reveal>
        <img
          src="/assets/images/cris.webp"
          alt="Cris comemorando à frente de um majestoso painel de balões azuis, dourados e prateados com a logo Cris Balões"
          width={1800}
          height={1344}
          loading="lazy"
        />
        <div className="since-badge">
          <span>Desde</span>
          <strong>1997</strong>
          <span>criando memórias</span>
        </div>
      </div>
    </section>
  );
}

export default function Manifesto() {
  return (
    <section className="manifesto" id="manifesto">
      <div className="manifesto-header section-pad">
        <div className="section-meta">
          <span className="manifesto-star" aria-hidden="true">✳</span>
        </div>
        <h2 className="manifesto-title">
          <span>Não são apenas balões.</span><br/>
          <span>É tudo o que eles</span><br/>
          <em>fazem sentir.</em>
        </h2>
        <div className="manifesto-bottom">
          <p className="manifesto-intro">
            O olhar de surpresa.<br/>
            O sorriso espontâneo.<br/>
            A vontade de registrar aquele instante.
          </p>
          <div>
            <p>Acreditamos que os ambientes têm o poder de despertar emoções. Por isso, cada composição nasce de uma ideia e ganha vida no encontro entre cores, formas e criatividade.</p>
            <p>Não criamos apenas decorações. Criamos a atmosfera de momentos que merecem ser lembrados.</p>
          </div>
        </div>
      </div>

      <div className="manifesto-showcase" aria-label="Galeria escultural de composições">
        <div className="manifesto-stage">
          <div className="manifesto-track">
            {/* Slide 0: Champagne */}
            <div className="manifesto-slide manifesto-slide-card manifesto-slide-first" data-carousel-slide="0">
              <div className="manifesto-card-inner">
                <img
                  src="/assets/images/champagne.webp"
                  alt="Garrafa de champagne cenográfica derramando uma cascata de balões dourados e transparentes com confete"
                  width={1100}
                  height={1430}
                  loading="lazy"
                />
                <div className="manifesto-card-caption">
                  <span className="manifesto-card-tag">Cenografia de Luxo</span>
                  <h3>Brinde &amp; Celebração</h3>
                </div>
              </div>
            </div>

            {/* Slide 1: Carro de corrida Fórmula 1 */}
            <div className="manifesto-slide manifesto-slide-card" data-carousel-slide="1">
              <div className="manifesto-card-inner">
                <img
                  src="/assets/images/carousel/01.webp"
                  alt="Escultura monumental em balões de carro de corrida Fórmula 1"
                  width={1280}
                  height={1600}
                  loading="lazy"
                />
                <div className="manifesto-card-caption">
                  <span className="manifesto-card-tag">Escultura Monumental</span>
                  <h3>Velocidade &amp; Precisão</h3>
                </div>
              </div>
            </div>

            {/* Slide 2: Minion Escultórico */}
            <div className="manifesto-slide manifesto-slide-card" data-carousel-slide="2">
              <div className="manifesto-card-inner">
                <img
                  src="/assets/images/carousel/02.webp"
                  alt="Escultura cenográfica gigante do personagem Minion em balões"
                  width={1086}
                  height={1448}
                  loading="lazy"
                />
                <div className="manifesto-card-caption">
                  <span className="manifesto-card-tag">Arte Cenográfica</span>
                  <h3>Expressão &amp; Magia</h3>
                </div>
              </div>
            </div>

            {/* Slide 3: Árvore dos Corações */}
            <div className="manifesto-slide manifesto-slide-card" data-carousel-slide="3">
              <div className="manifesto-card-inner">
                <img
                  src="/assets/images/carousel/03.webp"
                  alt="Árvore cenográfica com copa formada por balões vermelhos em formato de coração"
                  width={1080}
                  height={1350}
                  loading="lazy"
                />
                <div className="manifesto-card-caption">
                  <span className="manifesto-card-tag">Instalação Imersiva</span>
                  <h3>Afeto em Grandes Formas</h3>
                </div>
              </div>
            </div>

            {/* Slide 4: Passadeira de Casamento Elegante */}
            <div className="manifesto-slide manifesto-slide-card manifesto-slide-last" data-carousel-slide="4">
              <div className="manifesto-card-inner">
                <img
                  src="/assets/images/carousel/04.webp"
                  alt="Cenografia de casamento com passadeira vermelha e arcos esculturais de balões"
                  width={1086}
                  height={1448}
                  loading="lazy"
                />
                <div className="manifesto-card-caption">
                  <span className="manifesto-card-tag">Celebração Exclusiva</span>
                  <h3>Cenários Inesquecíveis</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const Testimonials = (props) => {
  const [publishedMessages, setPublishedMessages] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(false);
  const [expandedPublishedId, setExpandedPublishedId] = useState(null);

  const loadPublishedMessages = async () => {
    try {
      setPublishedLoading(true);
      const resp = await fetch(`${API_BASE}/api/trust-box/published`);
      const data = await resp.json();
      if (!resp.ok) {
        return;
      }
      setPublishedMessages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishedLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedMessages();
  }, []);

  return (
    <div id="testimonials">
      <div className="container">
        <div className="section-title text-center">
          <h2>Schránka dôvery</h2>
          <p>Schránka dôvery je priestor, kde môžu naši študenti, rodičia aj zamestnanci anonymne alebo verejne vyjadriť svoje postrehy, pocity, návrhy či obavy.
          Veríme, že otvorená komunikácia je základom príjemného a bezpečného školského prostredia. Ak aj vy chcete prispieť, neváhajte využiť našu <strong>Schránku dôvery</strong>  – či už anonymne alebo pod svojím menom.
          </p>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <div className="testimonial">
                    <div className="testimonial-image">
                      {" "}
                      <img src={d.img} alt="" />{" "}
                    </div>
                    <div className="testimonial-content">
                      <p>"{d.text}"</p>
                      <div className="testimonial-meta"> - {d.name} </div>
                    </div>
                  </div>
                </div>
              ))
            : "loading"}

          {publishedLoading && (
            <div className="col-md-12">
              <p>Načítavam publikované príspevky...</p>
            </div>
          )}

          {publishedMessages.map((m, i) => {
            const publishedId = m.id_prispevku ?? i;
            const isExpanded = expandedPublishedId === publishedId;
            const textValue = String(m.obsah_prispevku || '');
            const hasAnswer = String(m.odpoved || '').trim().length > 0;
            const previewLimit = 180;
            const previewText = textValue.length > previewLimit ? `${textValue.slice(0, previewLimit)}…` : textValue;

            return (
              <div
                key={`published-${m.id_prispevku || i}`}
                className="col-md-4"
                style={{ position: 'relative', overflow: 'visible' }}
              >
                <div
                  className="testimonial"
                  style={{ position: 'relative', overflow: 'visible', zIndex: isExpanded ? 3000 : 1 }}
                >
                  <div className="testimonial-image">
                    <img src="/img/testimonials/anonym.png" alt="Profil bez fotky" />
                  </div>

                  <div className="testimonial-content" style={{ position: 'relative' }}>
                    {hasAnswer && (
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Zbaliť odpoveď' : 'Rozbaliť odpoveď'}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedPublishedId(isExpanded ? null : publishedId)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          border: '1px solid rgba(0,0,0,0.10)',
                          background: '#fff',
                          padding: 0,
                          cursor: 'pointer',
                          lineHeight: 1,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    )}

                    <div
                      style={{
                        whiteSpace: 'pre-line',
                        color: '#334155',
                        lineHeight: 1.7,
                        paddingRight: hasAnswer ? 26 : 0
                      }}
                    >
                      “{hasAnswer ? previewText : textValue}”
                    </div>

                    <small className="text-muted">Téma: {m.kategoria}</small>
                    <div className="testimonial-meta">
                      - {m.anonymne ? "Anonym" : (m.uzivatel_meno || "Študent")}
                    </div>
                  </div>

                  {hasAnswer && isExpanded && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        marginTop: 10,
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.10)',
                        borderRadius: 12,
                        boxShadow: '0 18px 45px rgba(0,0,0,0.18)',
                        padding: 14,
                        zIndex: 2000
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                        Odpoveď psychologičky:
                      </div>
                      <div style={{ whiteSpace: 'pre-line', color: '#0f172a', lineHeight: 1.7 }}>
                        {m.odpoved}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <small>
          *Ak vidíte malú šípku vpravo hore, príspevok obsahuje aj odpoveď psychologičky. Kliknutím šípky ju zobrazíte. <><br/></>
        </small>
 
         <small>
            * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli poskytnuté 
            so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli podeliť o svoj názor, 
            skúsenosť alebo podnet.
          </small>
      </div>
    </div>
  );
};

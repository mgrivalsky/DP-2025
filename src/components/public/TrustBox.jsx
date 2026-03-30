import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const TrustBox = (props) => {
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
    <div id="trustbox">
      <div className="container">
        <div className="section-title text-center">
          <h2>Schránka dôvery</h2>
          <p>
            Schránka dôvery je priestor, kde môžu naši študenti a zamestnanci anonymne alebo verejne vyjadriť svoje postrehy, pocity, návrhy či obavy.
            Veríme, že otvorená komunikácia je základom príjemného a bezpečného školského prostredia. Ak aj vy chcete prispieť, neváhajte využiť našu <strong>Schránku dôvery</strong> – či už anonymne alebo pod svojím menom.
          </p>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <div className="trustbox-card">
                    <div className="trustbox-image">
                      {" "}
                      <img src={d.img} alt="" />{" "}
                    </div>
                    <div className="trustbox-content">
                      <p>"{d.text}"</p>
                      <div className="trustbox-meta"> - {d.name} </div>
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
            const textValue = String(m.obsah_prispevku || "");
            const hasAnswer = String(m.odpoved || "").trim().length > 0;
            const previewLimit = 180;
            const previewText = textValue.length > previewLimit ? `${textValue.slice(0, previewLimit)}…` : textValue;

            return (
              <div
                key={`published-${m.id_prispevku || i}`}
                className="col-md-4 trustbox-published-col"
              >
                <div
                  className={`trustbox-card trustbox-published-card ${isExpanded ? "trustbox-published-card--expanded" : ""}`}
                >
                  <div className="trustbox-image">
                    <img src="/img/trustbox/anonym.png" alt="Profil bez fotky" />
                  </div>

                  <div className="trustbox-content trustbox-published-content">
                    {hasAnswer && (
                      <button
                        type="button"
                        aria-label={isExpanded ? "Zbaliť odpoveď" : "Rozbaliť odpoveď"}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedPublishedId(isExpanded ? null : publishedId)}
                        className="trustbox-expand-btn"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    )}

                    <div className={`trustbox-published-text ${hasAnswer ? "trustbox-published-text--hasAnswer" : ""}`}>
                      “{hasAnswer ? previewText : textValue}”
                    </div>

                    <small className="text-muted">Téma: {m.kategoria}</small>
                    <div className="trustbox-meta">
                      - {m.anonymne ? "Anonym" : m.uzivatel_meno || "Študent"}
                    </div>
                  </div>

                  {hasAnswer && isExpanded && (
                    <div className="trustbox-answer-overlay">
                      <div className="trustbox-answer-title">
                        Odpoveď psychologičky:
                      </div>
                      <div className="trustbox-answer-text">
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
          *Ak vidíte malú šípku vpravo hore, príspevok obsahuje aj odpoveď psychologičky. Kliknutím šípky ju zobrazíte. <>
            <br />
          </>
        </small>

        <small>
          * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli poskytnuté so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli podeliť o svoj názor, skúsenosť alebo podnet.
        </small>
      </div>
    </div>
  );
};

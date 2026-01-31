import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const Testimonials = (props) => {
  const [publishedMessages, setPublishedMessages] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(false);

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

          {publishedMessages.map((m, i) => (
            <div key={`published-${m.id_prispevku || i}`} className="col-md-4">
              <div className="testimonial">
                <div className="testimonial-image">
                  <img src="/img/testimonials/anonym.png" alt="Profil bez fotky" />
                </div>
                <div className="testimonial-content">
                  <p>"{m.obsah_prispevku}"</p>
                  <small className="text-muted">Téma: {m.kategoria}</small>
                  <div className="testimonial-meta">
                    - {m.anonymne ? "Anonym" : (m.uzivatel_meno || "Študent")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
 
         <small>
            * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli poskytnuté 
            so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli podeliť o svoj názor, 
            skúsenosť alebo podnet.
          </small>
      </div>
    </div>
  );
};

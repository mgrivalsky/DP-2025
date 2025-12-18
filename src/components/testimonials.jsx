import React from "react";

export const Testimonials = (props) => {
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

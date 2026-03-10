import React from "react";

export const News = (props) => {
  return (
    <div id="news">
      <div className="container">
        <div className="section-title text-center">
          <h2>Novinky zo školy</h2>
          <p>
            V tejto sekcii nájdete aktuálne informácie, udalosti, zaujímavosti a témy, ktoré sa týkajú života našej školy. 
            Príspevky môžu obsahovať novinky z výučby, aktivity školského podporného tímu, podujatia či praktické rady pre študentov aj rodičov.
          </p>
        </div>
        
        {/* Tu môžeš neskôr doplniť jednotlivé príspevky ako komponenty */}
        <div className="news-post">
  <h3>Prečo je duševné zdravie dôležité?</h3>
  <img 
    src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80" 
    alt="Ilustrácia duševného zdravia" 
    style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "15px 0" }}
  />
  <p>
    Duševné zdravie ovplyvňuje spôsob, akým myslíme, cítime, komunikujeme a zvládame každodenný stres.
    V školskom prostredí hrá zásadnú úlohu v tom, ako sa študenti učia, ako budujú vzťahy a ako zvládajú náročné situácie.
    Podpora duševného zdravia môže zlepšiť nielen pohodu jednotlivcov, ale aj celkovú klímu v škole.
  </p>
  <a 
    href="https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ color: "#007bff", textDecoration: "underline" }}
  >
    Viac o duševnom zdraví na stránke WHO →
  </a>
</div>

      </div>
    </div>
  );
};

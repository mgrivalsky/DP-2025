import { Image } from "./image";
import React from "react";

export const Gallery = (props) => {
  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Galéria</h2>
          <p>
            Objavte, ako naša aplikácia funguje v praxi. Prezrite si ukážky jednotlivých funkcií, ktoré sme navrhli tak, aby študentom a školským psychológom uľahčili každodennú prácu. Od jednoduchého plánovania sedení cez anonymnú schránku dôvery až po interaktívny chat – všetko pre lepšiu podporu študentov a efektívnejšiu komunikáciu v školskom prostredí.
          </p>
        </div>
        <div className="row">
          <div className="portfolio-items">
            {props.data
              ? props.data.map((d, i) => (
                  <div
                    key={`${d.title}-${i}`}
                    className="col-sm-6 col-md-4 col-lg-4"
                  >
                    <Image
                      title={d.title}
                      largeImage={d.largeImage}
                      smallImage={d.smallImage}
                    />
                  </div>
                ))
              : "Loading..."}
          </div>
        </div>
      </div>
    </div>
  );
};

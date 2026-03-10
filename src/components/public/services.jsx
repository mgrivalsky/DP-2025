import React from "react";

export const Services = (props) => {
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Naše služby</h2>
          <p>
            V školskom prostredí je psychická pohoda študentov kľúčová pre ich úspech a zdravý vývoj. Naša aplikácia ponúka jednoduché a efektívne riešenia, ktoré pomáhajú školským psychológom poskytovať kvalitnú podporu presne tam, kde je potrebná.
          </p>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  {" "}
                  <i className={d.icon}></i>
                  <div className="service-desc">
                    <h3>{d.name}</h3>
                    <p>{d.text}</p>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};

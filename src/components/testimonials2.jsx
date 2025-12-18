import React, { useState } from "react";

export const Testimonials2 = (props) => {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState("");
  const [submittedMessages, setSubmittedMessages] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newMessage = {
      name: isAnonymous ? "Anonym" : name || "Anonym",
      text,
      category,
    };

    setSubmittedMessages([newMessage, ...submittedMessages]);
    setName("");
    setText("");
    setCategory("");
    setIsAnonymous(false);
  };

  return (
    <div id="testimonials2">
      <div className="container">
        <div className="section-title text-center">
          <h2 style={{ marginTop: "110px" }}>Schránka dôvery</h2>
          <p>
            Schránka dôvery je priestor, kde môžu naši študenti, rodičia aj
            zamestnanci anonymne alebo verejne vyjadriť svoje postrehy, pocity,
            návrhy či obavy. Veríme, že otvorená komunikácia je základom
            príjemného a bezpečného školského prostredia. Ak aj vy chcete
            prispieť, neváhajte využiť našu{" "}
            <strong>Schránku dôvery</strong> – či už anonymne alebo pod svojím
            menom.
          </p>
        </div>

        {/* Formulár na odoslanie správy */}
        <div className="trust-box-form">
          <h3>Pridať novú správu</h3>
          <form onSubmit={handleSubmit}>

            <div className="form-group mb-3">
              <label>Kategória problému</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">-- Vyberte tému --</option>
                <option value="Štúdium">Štúdium</option>
                <option value="Vzťahy">Vzťahy</option>
                <option value="Šikana">Šikana</option>
                <option value="Psychická pohoda">Psychická pohoda</option>
                <option value="Iné">Iné</option>
              </select>
            </div>

            <div className="form-group mb-3">
              <label>Vaša správa</label>
              <textarea
                className="form-control"
                rows="6"
                placeholder="Napíšte svoju správu..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>



            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "-15px",
                marginBottom: "50px",
              }}
            >
              <div className="form-check mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(!isAnonymous)}
                />
                <label
                  className="form-check-label"
                  htmlFor="anonCheck"
                  style={{ marginRight: "10px" }} 
                >
                  Odoslať anonymne
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary px-4 rounded-pill"
              >
                Odoslať novú správu
              </button>
            </div>


          </form>
        </div>

        <hr />

        {/* Zobrazenie pridaných správ */}
        <h3 className="text-secondary" style={{ marginBottom: "20px" }}>
          📬 Správy zo schránky dôvery:
        </h3>
        <div className="row">
          {props.data &&
            props.data.map((d, i) => (
              <div key={`${d.name}-${i}`} className="col-md-4">
                <div className="testimonial">
                  <div className="testimonial-image">
                    <img src={d.img} alt="" />
                  </div>
                  <div className="testimonial-content">
                    <p>"{d.text}"</p>
                    <div className="testimonial-meta">- {d.name}</div>
                  </div>
                </div>
              </div>
            ))}

          {submittedMessages.map((m, i) => (
            <div key={`new-${i}`} className="col-md-4">
              <div className="testimonial">
                <div className="testimonial-content">
                  <p>"{m.text}"</p>
                  <small className="text-muted">
                    Téma: {m.category}
                  </small>
                  <div className="testimonial-meta">- {m.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      <small style={{ display: "block", marginBottom: "100px" }}>
        * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli
        poskytnuté so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli
        podeliť o svoj názor, skúsenosť alebo podnet.
      </small>
      </div>
    </div>
  );
};

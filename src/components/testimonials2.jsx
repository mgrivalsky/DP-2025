import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const Testimonials2 = (props) => {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublishable, setIsPublishable] = useState(false);
  const [category, setCategory] = useState("");
  const [submittedMessages, setSubmittedMessages] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user?.id) {
      setSubmitStatus({ type: "error", message: "Najprv sa prihláste, aby ste mohli odoslať správu." });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const payload = {
        kategoria: category,
        obsah_prispevku: text,
        anonymne: isAnonymous,
        publikovatelne: isPublishable,
        id_uzivatela: user.id,
      };

      const resp = await fetch(`${API_BASE}/api/trust-box`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Nepodarilo sa odoslať správu.");
      }

      const displayName = isAnonymous ? "Anonym" : user?.name || "Anonym";
      const newMessage = {
        id: data?.id_prispevku,
        name: displayName,
        text,
        category,
      };

      setSubmittedMessages([newMessage, ...submittedMessages]);
      setSubmitStatus({ type: "success", message: "Správa bola úspešne odoslaná do schránky dôvery." });

      // Reset form
      setText("");
      setCategory("");
      setIsAnonymous(false);
      setIsPublishable(false);
    } catch (err) {
      setSubmitStatus({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
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
          {submitStatus && (
            <div
              style={{
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "12px",
                background: submitStatus.type === "success" ? "#d4edda" : "#f8d7da",
                color: submitStatus.type === "success" ? "#155724" : "#721c24",
                border: submitStatus.type === "success" ? "1px solid #c3e6cb" : "1px solid #f5c6cb",
              }}
            >
              {submitStatus.message}
            </div>
          )}

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
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "-10px",
                marginBottom: "40px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <label
                  className="form-check d-flex align-items-center mb-0"
                  style={{ padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "10px", background: "#f9fafb" }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    id="anonCheck"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(!isAnonymous)}
                    style={{ marginTop: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: "#333" }}> Odoslať anonymne</span>
                </label>

                <label
                  className="form-check d-flex align-items-center mb-0"
                  style={{ padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "10px", background: "#f9fafb" }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    id="publishCheck"
                    checked={isPublishable}
                    onChange={() => setIsPublishable(!isPublishable)}
                    style={{ marginTop: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: "#333" }}> Môže byť publikované</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary px-4 rounded-pill"
                disabled={isSubmitting}
                style={{ minWidth: "180px", fontWeight: 700 }}
              >
                {isSubmitting ? "Odosielam..." : "Odoslať novú správu"}
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

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const Testimonials2 = (props) => {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublishable, setIsPublishable] = useState(false);
  const [category, setCategory] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedMessages, setPublishedMessages] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(false);
  const [expandedPublishedId, setExpandedPublishedId] = useState(null);

  const { user, isAuthenticated, fetchWithAuth } = useAuth();

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

      const resp = await fetchWithAuth(`${API_BASE}/api/trust-box`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Nepodarilo sa odoslať správu.");
      }

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
          <h2 style={{ marginTop: "110px", fontSize: "2.8em", color: "#2c3e50", fontWeight: "700" }}>
            💭 Schránka dôvery
          </h2>
          <p style={{ fontSize: "1.1em", color: "#555", lineHeight: "1.8", maxWidth: "700px", margin: "20px auto" }}>
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
        <div className="trust-box-form" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%)", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize: "1.8em", color: "#2c3e50", marginBottom: "25px", fontWeight: "600" }}>✍️ Podeľ sa s nami</h3>
          {submitStatus && (
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                marginBottom: "20px",
                background: submitStatus.type === "success" ? "#d4edda" : "#f8d7da",
                color: submitStatus.type === "success" ? "#155724" : "#721c24",
                border: submitStatus.type === "success" ? "2px solid #28a745" : "2px solid #dc3545",
                fontWeight: "500",
                fontSize: "1em",
              }}
            >
              {submitStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-group mb-4">
              <label style={{ fontWeight: "600", fontSize: "1.05em", color: "#2c3e50", display: "block", marginBottom: "10px" }}>
                📌 Kategória problému
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{ 
                  padding: "12px 16px", 
                  fontSize: "1.05em", 
                  borderRadius: "8px", 
                  border: "2px solid #e0e6f0", 
                  cursor: "pointer", 
                  backgroundColor: "#fff",
                  color: "#000",
                  width: "100%",
                  fontFamily: "inherit"
                }}
              >
                <option value="">-- Vyberte tému --</option>
                <option value="Štúdium">📚 Štúdium</option>
                <option value="Vzťahy">💙 Vzťahy</option>
                <option value="Šikana">⚠️ Šikana</option>
                <option value="Psychická pohoda">🧠 Psychická pohoda</option>
                <option value="Iné">✨ Iné</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label style={{ fontWeight: "600", fontSize: "1.05em", color: "#2c3e50", display: "block", marginBottom: "10px" }}>
                💬 Tvoja správa
              </label>
              <textarea
                className="form-control"
                rows="6"
                placeholder="Napíšte, čo vás trápi alebo čo chcete zdieľať. Nikto vás nebude súdiť."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                style={{ padding: "14px", fontSize: "1em", borderRadius: "8px", border: "2px solid #e0e6f0", fontFamily: "inherit", minHeight: "150px", transition: "all 0.3s" }}
              />
            </div>



            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "40px",
              }}
            >
              {/* Odoslať anonymne */}
              <div
                style={{
                  padding: "16px",
                  border: "2px solid",
                  borderColor: isAnonymous ? "#5e72e4" : "#dae3ef",
                  borderRadius: "12px",
                  background: isAnonymous ? "#f0f3ff" : "#fafbfc",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={() => {}}
                  style={{ 
                    width: "24px", 
                    height: "24px", 
                    cursor: "pointer",
                    flexShrink: 0,
                    accentColor: "#5e72e4"
                  }}
                />
                <label style={{ cursor: "pointer", marginBottom: 0, flex: 1 }}>
                  <span style={{ fontWeight: "600", color: "#2c3e50", fontSize: "0.95em" }}>🔒 Anonymne</span>
                </label>
              </div>

              {/* Môže byť publikované */}
              <div
                style={{
                  padding: "16px",
                  border: "2px solid",
                  borderColor: isPublishable ? "#5e72e4" : "#dae3ef",
                  borderRadius: "12px",
                  background: isPublishable ? "#f0f3ff" : "#fafbfc",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
                onClick={() => setIsPublishable(!isPublishable)}
              >
                <input
                  type="checkbox"
                  id="publishCheck"
                  checked={isPublishable}
                  onChange={() => {}}
                  style={{ 
                    width: "24px", 
                    height: "24px", 
                    cursor: "pointer",
                    flexShrink: 0,
                    accentColor: "#5e72e4"
                  }}
                />
                <label style={{ cursor: "pointer", marginBottom: 0, flex: 1 }}>
                  <span style={{ fontWeight: "600", color: "#2c3e50", fontSize: "0.95em" }}>📢 Zverejniteľné</span>
                </label>
              </div>
            </div>

            <div>
              {/* Odosielací button */}
              <button
                type="submit"
                className="btn btn-primary px-5 rounded-pill"
                disabled={isSubmitting}
                style={{
                  minWidth: "220px",
                  fontWeight: "700",
                  alignSelf: "flex-start",
                  fontSize: "1.1em",
                  padding: "14px 40px",
                  background: "linear-gradient(135deg, #5e72e4 0%, #3d5fd3 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(94, 114, 228, 0.3)",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(94, 114, 228, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(94, 114, 228, 0.3)";
                }}
              >
                {isSubmitting ? "⏳ Odosielam..." : "Odoslať správu"}
              </button>
            </div>

            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "10px", fontSize: "0.95em", color: "#555", lineHeight: "1.6" }}>
              <p style={{ marginBottom: "10px" }}>
                <strong>💡 Ako to funguje:</strong>
              </p>
              <ul style={{ marginBottom: "0", paddingLeft: "20px" }}>
                <li><strong>🔒 Anonymne</strong> – Tvoja správa bude odoslaná bez tvojho mena a priezviska</li>
                <li><strong>📢 Zverejniteľné</strong> – Tvoj príspevok možno zverejníme na našich stránkach (bez mena priezviska, ak je anonymný)</li>
              </ul>
            </div>

          </form>
        </div>

        <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: "3px solid #e9ecf1" }}>
          <h3 className="text-secondary" style={{ marginBottom: "30px", fontSize: "1.8em", color: "#2c3e50", fontWeight: "600" }}>
            📬 Inšpirácia od našich študentov:
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
                  style={{
                    position: 'relative',
                    overflow: 'visible',
                    zIndex: isExpanded ? 3000 : 1
                  }}
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

                    <small className="text-muted">
                      Téma: {m.kategoria}
                    </small>
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
          * Ak vidíte malú šípku vpravo hore, príspevok obsahuje aj odpoveď psychologičky. Kliknutím šípky ju zobrazíte.
        </small>

      <small style={{ display: "block", marginBottom: "100px" }}>
        * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli
        poskytnuté so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli
        podeliť o svoj názor, skúsenosť alebo podnet.
      </small>
        </div>
      </div>
    </div>
  );
};

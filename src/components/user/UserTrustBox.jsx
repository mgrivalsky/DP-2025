import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../styles/UserTrustBox.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const UserTrustBox = (props) => {
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

  const syncCategoryFromEvent = (e) => {
    const nextValue = e?.target?.value;
    if (typeof nextValue === "string") {
      setCategory(nextValue);
    }
  };

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
        ...(isAnonymous ? {} : { id_uzivatela: user.id }),
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
    <div id="usertrustbox">
      <div className="container">
        <div className="section-title text-center">
          <h2 className="user-trustbox__title">
            💭 Schránka dôvery
          </h2>
          <p className="user-trustbox__intro">
            Schránka dôvery je priestor, kde môžu naši študenti a zamestnanci anonymne alebo verejne vyjadriť svoje postrehy, pocity, návrhy či obavy. Veríme, že otvorená komunikácia je základom príjemného a bezpečného školského prostredia. Ak aj vy chcete prispieť, neváhajte využiť našu {" "}
            <strong>Schránku dôvery</strong> – či už anonymne alebo pod svojím menom.
          </p>
        </div>

        <div
          className="trust-box-form user-trustbox__formCard"
        >
          <h3 className="user-trustbox__formTitle">
            ✍️ Podeľ sa s nami
          </h3>
          {submitStatus && (
            <div
              className={`user-trustbox__alert ${submitStatus.type === "success" ? "user-trustbox__alert--success" : "user-trustbox__alert--error"}`}
            >
              {submitStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="user-trustbox__label">
                📌 Kategória problému
              </label>
              <select
                value={category}
                onChange={syncCategoryFromEvent}
                onInput={syncCategoryFromEvent}
                onBlur={syncCategoryFromEvent}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                required
                className="user-trustbox__select"
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
              <label className="user-trustbox__label">
                💬 Tvoja správa
              </label>
              <textarea
                rows="6"
                placeholder="Napíšte, čo vás trápi alebo čo chcete zdieľať. Nikto vás nebude súdiť."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                className="form-control user-trustbox__textarea"
              />
            </div>

            <div className="user-trustbox__toggles">
              <div
                className={`user-trustbox__toggle ${isAnonymous ? "user-trustbox__toggle--active" : ""}`}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={() => {}}
                  className="user-trustbox__checkbox"
                />
                <label className="user-trustbox__toggleLabel">
                  <span className="user-trustbox__toggleLabelText">🔒 Anonymne</span>
                </label>
              </div>

              <div
                className={`user-trustbox__toggle ${isPublishable ? "user-trustbox__toggle--active" : ""}`}
                onClick={() => setIsPublishable(!isPublishable)}
              >
                <input
                  type="checkbox"
                  id="publishCheck"
                  checked={isPublishable}
                  onChange={() => {}}
                  className="user-trustbox__checkbox"
                />
                <label className="user-trustbox__toggleLabel">
                  <span className="user-trustbox__toggleLabelText">📢 Zverejniteľné</span>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary px-5 rounded-pill user-trustbox__submitBtn"
              >
                {isSubmitting ? "⏳ Odosielam..." : "Odoslať správu"}
              </button>
            </div>

            <div className="user-trustbox__howItWorks">
              <p className="user-trustbox__howItWorksTitle">
                <strong>💡 Ako to funguje:</strong>
              </p>
              <ul className="user-trustbox__howItWorksList">
                <li>
                  <strong>🔒 Anonymne</strong> – Tvoja správa bude odoslaná bez tvojho mena a priezviska
                </li>
                <li>
                  <strong>📢 Zverejniteľné</strong> – Tvoj príspevok možno zverejníme na našich stránkach (bez mena priezviska, ak je anonymný)
                </li>
              </ul>
            </div>
          </form>
        </div>

        <div className="user-trustbox__publishedSection">
          <h3 className="text-secondary user-trustbox__publishedTitle">
            📬 Inšpirácia od našich študentov:
          </h3>
          <div className="row">
            {props.data &&
              props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <div className="trustbox-card">
                    <div className="trustbox-image">
                      <img src={d.img} alt="" />
                    </div>
                    <div className="trustbox-content">
                      <p>"{d.text}"</p>
                      <div className="trustbox-meta">- {d.name}</div>
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
              const textValue = String(m.obsah_prispevku || "");
              const hasAnswer = String(m.odpoved || "").trim().length > 0;
              const previewLimit = 180;
              const previewText = textValue.length > previewLimit ? `${textValue.slice(0, previewLimit)}…` : textValue;

              return (
                <div
                  key={`published-${m.id_prispevku || i}`}
                  className="col-md-4 user-trustbox__publishedCardWrap"
                >
                  <div
                    style={{ zIndex: isExpanded ? 3000 : 1 }}
                    className="trustbox-card user-trustbox__publishedCard"
                  >
                    <div className="trustbox-image">
                      <img src="/img/trustbox/anonym.png" alt="Profil bez fotky" />
                    </div>

                    <div className="trustbox-content user-trustbox__publishedContent">
                      {hasAnswer && (
                        <button
                          type="button"
                          aria-label={isExpanded ? "Zbaliť odpoveď" : "Rozbaliť odpoveď"}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedPublishedId(isExpanded ? null : publishedId)}
                          className="user-trustbox__expandBtn"
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      )}

                      <div
                        className={`user-trustbox__publishedText ${hasAnswer ? "user-trustbox__publishedText--hasAnswer" : ""}`}
                      >
                        “{hasAnswer ? previewText : textValue}”
                      </div>

                      <small className="text-muted">Téma: {m.kategoria}</small>
                      <div className="trustbox-meta">
                        - {m.anonymne ? "Anonym" : m.uzivatel_meno || "Študent"}
                      </div>
                    </div>

                    {hasAnswer && isExpanded && (
                      <div
                        className="user-trustbox__answerOverlay"
                      >
                        <div className="user-trustbox__answerTitle">
                          Odpoveď psychológa:
                        </div>
                        <div className="user-trustbox__answerText">
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
            * Ak vidíte malú šípku vpravo hore, príspevok obsahuje aj odpoveď psychológa. Kliknutím šípky ju zobrazíte.
          </small>

          <small className="user-trustbox__footnoteBlock">
            * Na tejto stránke zverejňujeme vybrané príspevky, ktoré nám boli poskytnuté so súhlasom autorov. Ďakujeme všetkým, ktorí sa rozhodli podeliť o svoj názor, skúsenosť alebo podnet.
          </small>
        </div>
      </div>
    </div>
  );
};

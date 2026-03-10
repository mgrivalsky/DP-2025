import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const TrustBoxPublishedPreview = () => {
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
    <div className="trustbox-published-preview">
      <div className="trustbox-published-preview-grid">
        {publishedLoading && (
          <div className="trustbox-published-preview-full">
            <p>Načítavam publikované príspevky...</p>
          </div>
        )}

        {!publishedLoading && publishedMessages.length === 0 && (
          <div className="trustbox-published-preview-full">
            <p>Nie sú žiadne zverejnené príspevky.</p>
          </div>
        )}

        {publishedMessages.map((m, i) => {
          const publishedId = m.id_prispevku ?? i;
          const isExpanded = expandedPublishedId === publishedId;
          const textValue = String(m.obsah_prispevku || "");
          const hasAnswer = String(m.odpoved || "").trim().length > 0;
          const previewLimit = 180;
          const previewText =
            textValue.length > previewLimit ? `${textValue.slice(0, previewLimit)}…` : textValue;

          return (
            <div
              key={`published-${m.id_prispevku || i}`}
              className="trustbox-published-preview-item"
            >
              <div
                className="trustbox-card"
                style={{ position: "relative" }}
              >
                <div className="trustbox-image">
                  <img src="/img/trustbox/anonym.png" alt="Profil bez fotky" />
                </div>

                <div className="trustbox-content" style={{ position: "relative" }}>
                  {hasAnswer && (
                    <button
                      type="button"
                      aria-label={isExpanded ? "Zbaliť odpoveď" : "Rozbaliť odpoveď"}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedPublishedId(isExpanded ? null : publishedId)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "#fff",
                        padding: 0,
                        cursor: "pointer",
                        lineHeight: 1,
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  )}

                  <div
                    style={{
                      whiteSpace: "pre-line",
                      color: "#334155",
                      lineHeight: 1.7,
                      paddingRight: hasAnswer ? 26 : 0,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    “{hasAnswer ? previewText : textValue}”
                  </div>

                  <small className="text-muted">Téma: {m.kategoria}</small>
                  <div className="trustbox-meta">
                    - {m.anonymne ? "Anonym" : m.uzivatel_meno || "Študent"}
                  </div>

                  {hasAnswer && isExpanded && (
                    <div className="trustbox-preview-answerBox">
                      <div className="trustbox-preview-answerTitle">
                        Odpoveď psychologičky:
                      </div>
                      <div
                        className="trustbox-preview-answerText"
                      >
                        {m.odpoved}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustBoxPublishedPreview;

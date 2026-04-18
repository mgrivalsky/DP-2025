import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE, formatSkDate } from '../../utils/adminHelpers';
import TrustBoxPublishedPreview from './TrustBoxPublishedPreview';
import '../styles/AdminComponents.css';
import { getSocket } from '../../utils/socket';

const AdminTrustBox = ({ onSeenChange }) => {
  const { token } = useAuth();
  const [trustEntries, setTrustEntries] = useState([]);
  const [trustLoading, setTrustLoading] = useState(false);
  const [trustMessage, setTrustMessage] = useState('');
  const [trustEditId, setTrustEditId] = useState(null);
  const [trustCategoryFilter, setTrustCategoryFilter] = useState('all');
  const [trustPublishFilter, setTrustPublishFilter] = useState('all');
  const [showPublishedPreview, setShowPublishedPreview] = useState(false);
  const [answerDraft, setAnswerDraft] = useState({});
  const [contentDraft, setContentDraft] = useState({});

  useEffect(() => {
    loadTrustEntries();
  }, []);

  // Realtime refresh when TrustBox changes (no polling)
  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    if (!sock) return;

    let timer = null;
    const onTrustBoxUpdated = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        loadTrustEntries({ silent: true });
        if (typeof onSeenChange === 'function') onSeenChange();
      }, 200);
    };

    sock.on('trustBoxUpdated', onTrustBoxUpdated);
    return () => {
      sock.off('trustBoxUpdated', onTrustBoxUpdated);
      if (timer) clearTimeout(timer);
    };
  }, [token, onSeenChange]);

  useEffect(() => {
    if (!trustMessage) return;
    const timer = setTimeout(() => setTrustMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [trustMessage]);

  const loadTrustEntries = async ({ silent = false } = {}) => {
    try {
      if (!silent) setTrustLoading(true);
      const resp = await fetchWithToken(`${API_BASE}/api/trust-box`, token);
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        if (!silent) setTrustEntries([]);
      } else {
        setTrustEntries(data || []);
        // Keep success notifications visible even if a background refresh happens.
        // Clear only non-success messages after a successful reload.
        setTrustMessage((prev) => (prev && !String(prev).startsWith('✅') ? '' : prev));
      }
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri načítaní správ');
      if (!silent) setTrustEntries([]);
    } finally {
      if (!silent) setTrustLoading(false);
    }
  };

  const updateTrustAnswer = async (id) => {
    try {
      const current = (trustEntries || []).find((x) => Number(x?.id_prispevku) === Number(id));
      const currentAnswer = current?.odpoved ?? '';
      const currentContent = current?.obsah_prispevku ?? '';

      const draftAnswer = answerDraft[id];
      const draftContent = contentDraft[id];

      const payload = {};
      if (typeof draftContent !== 'undefined' && draftContent !== currentContent) {
        payload.obsah_prispevku = draftContent;
      }
      if (typeof draftAnswer !== 'undefined' && draftAnswer !== currentAnswer) {
        payload.odpoved = draftAnswer;
      }

      if (Object.keys(payload).length === 0) {
        setTrustMessage('✅ Bez zmien');
        setTrustEditId(null);
        return;
      }

      const resp = await fetchWithToken(`${API_BASE}/api/trust-box/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri uložení: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? { ...item, ...data } : item));
      setTrustMessage('✅ Odpoveď uložená');
      setTrustEditId(null);
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri ukladaní odpovede');
    }
  };

  const publishTrustEntry = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/trust-box/${id}/publish`, token, {
        method: 'PATCH'
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri publikovaní: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? { ...item, ...data } : item));
      setTrustMessage('✅ Príspevok publikovaný');
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri publikovaní príspevku');
    }
  };

  const unpublishTrustEntry = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/trust-box/${id}/unpublish`, token, {
        method: 'PATCH'
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri zrušení publikovania: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? { ...item, ...data } : item));
      setTrustMessage('✅ Príspevok bol skrytý z webu');
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri zrušení publikovania');
    }
  };

  const markTrustEntrySeen = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/trust-box/${id}/mark-seen`, token, {
        method: 'PUT'
      });
      const contentType = String(resp.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');

      let data = null;
      let text = '';
      try {
        if (isJson) {
          data = await resp.json();
        } else {
          text = await resp.text();
        }
      } catch {
        // ignore parse errors
      }

      if (!resp.ok) {
        const fallback = text ? text.slice(0, 140) : '';
        const reason = data?.error || fallback || `HTTP ${resp.status}`;
        const hint = resp.status === 404 ? ' (reštartni backend — endpoint ešte nemusí bežať)' : '';
        setTrustMessage(`Chyba pri označení ako videné: ${reason}${hint}`);
        return;
      }

      if (!data) {
        setTrustMessage('Chyba pri označení ako videné: neplatná odpoveď zo servera');
        return;
      }

      setTrustEntries((prev) => prev.map((item) => (item.id_prispevku === id ? { ...item, ...data } : item)));
      if (typeof onSeenChange === 'function') {
        onSeenChange();
      }
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri označení ako videné');
    }
  };

  const trustCategories = Array.from(new Set((trustEntries || []).map(entry => entry.kategoria).filter(Boolean)));

  const filteredByCategory =
    trustCategoryFilter === 'all'
      ? (trustEntries || [])
      : (trustEntries || []).filter(entry => entry.kategoria === trustCategoryFilter);

  const filteredTrustEntries = filteredByCategory.filter((entry) => {
    if (trustPublishFilter === 'published') return entry.zverejnene === true;
    if (trustPublishFilter === 'unpublished') return entry.zverejnene === false;
    return true;
  });

  const publishedTrustEntries = (trustEntries || []).filter((entry) => entry.zverejnene && entry.publikovatelne);

  return (
    <div className="admin-section full-width trustbox-section">
      <div className="trust-page-header">
        <h2>📮 Schránka dôvery</h2>
        <div className="trust-stats-inline" aria-label="Štatistiky schránky dôvery">
          <span>
            <strong>{publishedTrustEntries.length}</strong> zverejnené
          </span>
          <span>
            <strong>{(trustEntries || []).length}</strong> spolu
          </span>

          <button
            type="button"
            onClick={() => setShowPublishedPreview((v) => !v)}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            aria-expanded={showPublishedPreview}
          >
            {showPublishedPreview ? 'Späť do správy' : 'Náhľad zverejnených'}
          </button>
        </div>
      </div>

      {showPublishedPreview && (
        <div className="trust-preview-note">
          Toto je zoznam viditeľných príspevkov, ktoré sa zobrazujú na hlavnej stránke.
        </div>
      )}

      {trustMessage && (
        <div className={`admin-alert ${trustMessage.startsWith('✅') ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {trustMessage}
        </div>
      )}

      {showPublishedPreview ? (
        <TrustBoxPublishedPreview />
      ) : (
        <>

      <div className="trust-toolbar">
        <label className="trust-toolbar-label">Filtrovať podľa kategórie:</label>
        <select
          value={trustCategoryFilter}
          onChange={e => setTrustCategoryFilter(e.target.value)}
          className="admin-select admin-select-inline"
        >
          <option value="all">Všetky</option>
          {trustCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="trust-toolbar-label">Filtrovať podľa publikovania:</label>
        <select
          value={trustPublishFilter}
          onChange={e => setTrustPublishFilter(e.target.value)}
          className="admin-select admin-select-inline"
        >
          <option value="all">Všetky</option>
          <option value="published">Zverejnené</option>
          <option value="unpublished">Nezverejnené</option>
        </select>
      </div>

      {trustLoading ? (
        <p>Načítavam schránku dôvery...</p>
      ) : filteredTrustEntries.length === 0 ? (
        <p>Žiadne príspevky v tejto kategórii/filtre</p>
      ) : (
        filteredTrustEntries.map((entry) => {
          const id = entry.id_prispevku;
          const isEditing = trustEditId === id;
          const isPublishable = entry.publikovatelne === true;
          const publishDisabledReason = !isPublishable
            ? 'Užívateľ nepovolil zverejnenie (publikovateľné = nie)'
            : '';

          const authorName = entry.anonymne
            ? 'Anonym'
            : (entry.uzivatel_meno || entry.meno || '—');
          return (
            <div key={id} className={`trust-entry${entry.zverejnene ? ' is-published' : ''}`}>
              <div className="trust-entry-header">
                <div>
                  <strong className="trust-author">{authorName}</strong>
                  <span className="trust-category">{entry.kategoria}</span>
                  {entry.zverejnene ? (
                    <span className="trust-badge trust-badge-published">Zverejnené</span>
                  ) : (
                    <span className="trust-badge trust-badge-unpublished">Nezverejnené</span>
                  )}
                </div>
                <div className="trust-entry-meta">
                  {!(entry.videne_psychologom === true) && (
                    <button
                      onClick={() => markTrustEntrySeen(id)}
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      title="Označí tento príspevok ako videný"
                      type="button"
                    >
                      👁️ Videné
                    </button>
                  )}
                  <div className="trust-date-header">{formatSkDate(entry.datum_pridania)}</div>
                </div>
              </div>

              {isEditing ? (
                <div className="trust-content">
                  <div className="trust-section-title">Správa používateľa</div>
                  <textarea
                    className="admin-textarea"
                    value={contentDraft[id] ?? entry.obsah_prispevku ?? ''}
                    onChange={(e) => setContentDraft({ ...contentDraft, [id]: e.target.value })}
                    rows={4}
                  />
                </div>
              ) : (
                <div className="trust-content">
                  <div className="trust-section-title">Správa používateľa</div>
                  <p>{entry.obsah_prispevku || '(žiadny text)'}</p>
                </div>
              )}

              <div className="trust-answer">
                <div className="trust-section-title">Odpoveď psychológa</div>
                {isEditing ? (
                  <textarea
                    className="admin-textarea"
                    value={answerDraft[id] ?? entry.odpoved ?? ''}
                    onChange={(e) => setAnswerDraft({ ...answerDraft, [id]: e.target.value })}
                    rows={4}
                    placeholder="Napíšte odpoveď..."
                  />
                ) : (
                  <p>{entry.odpoved || '(žiadna odpoveď)'}</p>
                )}
              </div>

              <div className="trust-actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateTrustAnswer(id)}
                      className="admin-btn admin-btn-sm admin-btn-success"
                    >
                      💾 Uložiť
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTrustEditId(null); setAnswerDraft({}); setContentDraft({}); }}
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                    >
                      ❌ Zrušiť
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTrustEditId(id);
                        setAnswerDraft({ [id]: entry.odpoved || '' });
                        setContentDraft({ [id]: entry.obsah_prispevku || '' });
                      }}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                    >
                      ✏️ Upraviť
                    </button>

                    {entry.zverejnene ? (
                      <button
                        type="button"
                        onClick={() => unpublishTrustEntry(id)}
                        className="admin-btn admin-btn-sm admin-btn-warning"
                      >
                        👁️‍🗨️ Skryť z webu
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => publishTrustEntry(id)}
                        disabled={!isPublishable}
                        title={publishDisabledReason}
                        className="admin-btn admin-btn-sm admin-btn-success"
                      >
                        ✅ Zverejniť
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
        </>
      )}
    </div>
  );
};

export default AdminTrustBox;

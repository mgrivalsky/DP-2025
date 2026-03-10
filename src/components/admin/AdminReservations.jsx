import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE, toYmd, formatSkDate } from '../../utils/adminHelpers';
import ConfirmDialog from './ConfirmDialog';
import '../styles/AdminComponents.css';

const statusLabel = (stav) => {
  if (stav === 'pending') return 'Čakajúca';
  if (stav === 'potvrdena') return 'Potvrdená';
  if (stav === 'zrusena') return 'Zrušená';
  return 'Dokončená';
};

const statusClass = (stav) => {
  if (stav === 'potvrdena') return 'status-badge status-confirmed';
  if (stav === 'zrusena') return 'status-badge status-cancelled';
  if (stav === 'dokoncena') return 'status-badge status-done';
  return 'status-badge status-pending';
};

const AdminReservations = () => {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [reservationMessage, setReservationMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationFilter, setReservationFilter] = useState('');
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  const [newReservationForm, setNewReservationForm] = useState({
    email: '',
    datum: '',
    cas_od: '',
    cas_do: '',
    poznamka: '',
    stav: 'pending'
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    if (!reservationMessage) return;
    const timer = setTimeout(() => setReservationMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [reservationMessage]);

  const loadReservations = async () => {
    try {
      setReservationLoading(true);
      const resp = await fetchWithToken(`${API_BASE}/api/reservations`, token);
      const data = await resp.json();
      if (!resp.ok) {
        setReservationMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        setReservations([]);
      } else {
        setReservations(data || []);
        // Preserve success messages while reloading; clear only previous non-success messages.
        setReservationMessage((prev) => (prev && !prev.startsWith('✅') ? '' : prev));
      }
    } catch (err) {
      console.error(err);
      setReservationMessage('Chyba pri načítaní rezervácií');
      setReservations([]);
    } finally {
      setReservationLoading(false);
    }
  };

  const addNewReservation = async (e) => {
    e.preventDefault();
    setReservationMessage('');
    const { email, datum, cas_od, cas_do, poznamka, stav } = newReservationForm;
    
    if (!email || !datum || !cas_od || !cas_do) {
      setReservationMessage('Vyplňte všetky povinné polia (email, dátum, čas od, čas do).');
      return;
    }
    
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/reservations`, token, {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          datum, 
          cas_od, 
          cas_do, 
          poznamka, 
          stav, 
          id_psychologicky: 1 
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setReservationMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setReservationMessage('✅ Rezervácia vytvorená');
        setNewReservationForm({
          email: '',
          datum: '',
          cas_od: '',
          cas_do: '',
          poznamka: '',
          stav: 'pending'
        });
        setShowNewReservationForm(false);
        loadReservations();
      }
    } catch (err) {
      console.error(err);
      setReservationMessage('Chyba pri vytváraní rezervácie');
    }
  };

  const updateReservation = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/reservations/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setReservationMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setReservationMessage('✅ Rezervácia upravená');
        setEditingId(null);
        loadReservations();
      }
    } catch (err) {
      console.error(err);
      setReservationMessage('Chyba pri úprave rezervácie');
    }
  };

  const performDeleteReservation = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/reservations/${id}`, token, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) {
        setReservationMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setReservationMessage('✅ Rezervácia vymazaná');
        loadReservations();
      }
    } catch (err) {
      console.error(err);
      setReservationMessage('Chyba pri mazaní rezervácie');
    }
  };

  const deleteReservation = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Potvrdenie vymazania',
      message: 'Naozaj chcete zmazať túto rezerváciu? Táto akcia je nezvratná.',
      danger: true,
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        performDeleteReservation(id);
      }
    });
  };

  const filteredReservations = reservations.filter((r) => !reservationFilter || r.stav === reservationFilter);

  return (
    <div className="admin-section full-width reservations-section">
      <h2>📅 Správa rezervácií</h2>

      {reservationMessage && (
        <div className={`admin-alert ${reservationMessage.startsWith('✅') ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {reservationMessage}
        </div>
      )}

      <div className="admin-toolbar">
        <button
          onClick={() => setShowNewReservationForm(!showNewReservationForm)}
          className="admin-btn admin-btn-success"
        >
          {showNewReservationForm ? '❌ Zrušiť' : '➕ Pridať novú rezerváciu'}
        </button>
      </div>

      {showNewReservationForm && (
        <form onSubmit={addNewReservation} className="admin-form-card success-border">
          <h3>Pridať novú rezerváciu</h3>
          <div className="admin-form-grid-2">
            <div>
              <label className="admin-label">Email užívateľa *</label>
              <input
                type="email"
                value={newReservationForm.email}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, email: e.target.value })}
                className="admin-input"
                placeholder="uzivatel@example.com"
                required
              />
            </div>
            <div>
              <label className="admin-label">Dátum *</label>
              <input
                type="date"
                value={newReservationForm.datum}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, datum: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Čas od *</label>
              <input
                type="time"
                value={newReservationForm.cas_od}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, cas_od: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Čas do *</label>
              <input
                type="time"
                value={newReservationForm.cas_do}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, cas_do: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Stav</label>
              <select
                value={newReservationForm.stav}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, stav: e.target.value })}
                className="admin-select"
              >
                <option value="pending">Čakajúca</option>
                <option value="potvrdena">Potvrdená</option>
                <option value="zrusena">Zrušená</option>
                <option value="dokoncena">Dokončená</option>
              </select>
            </div>
            <div className="admin-form-col-full">
              <label className="admin-label">Poznámka</label>
              <textarea
                value={newReservationForm.poznamka}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, poznamka: e.target.value })}
                rows={4}
                className="admin-textarea"
                placeholder="Voliteľný popis rezervácie"
              />
            </div>
          </div>

          <div className="admin-toolbar">
            <button type="submit" className="admin-btn admin-btn-success">💾 Uložiť rezerváciu</button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowNewReservationForm(false);
                setNewReservationForm({
                  email: '',
                  datum: '',
                  cas_od: '',
                  cas_do: '',
                  poznamka: '',
                  stav: 'pending'
                });
              }}
            >
              Zrušiť
            </button>
          </div>
        </form>
      )}

      <div className="admin-toolbar">
        <label className="admin-toolbar-label">Filtrovať podľa stavu:</label>
        <select
          value={reservationFilter}
          onChange={e => setReservationFilter(e.target.value)}
          className="admin-select admin-select-inline"
        >
          <option value="">Všetky</option>
          <option value="pending">Čakajúca</option>
          <option value="potvrdena">Potvrdená</option>
          <option value="zrusena">Zrušená</option>
          <option value="dokoncena">Dokončená</option>
        </select>
      </div>

      {reservationLoading ? (
        <p>Načítavam rezervácie...</p>
      ) : filteredReservations.length === 0 ? (
        <p>Žiadne rezervácie s vybraným stavom</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Užívateľ</th>
                <th>Email</th>
                <th>Dátum</th>
                <th>Čas od</th>
                <th>Čas do</th>
                <th>Stav</th>
                <th className="cell-note">Poznámka</th>
                <th className="cell-center">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res) => (
                <tr key={res.id_sedenia}>
                  {editingId === res.id_sedenia ? (
                    <>
                      <td>{res.uzivatel_meno} {res.uzivatel_priezvisko}</td>
                      <td>{res.uzivatel_email}</td>
                      <td>
                        <input
                          type="date"
                          value={editForm.datum || ''}
                          onChange={e => setEditForm({ ...editForm, datum: e.target.value })}
                          className="admin-input"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={editForm.cas_od || ''}
                          onChange={e => setEditForm({ ...editForm, cas_od: e.target.value })}
                          className="admin-input"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={editForm.cas_do || ''}
                          onChange={e => setEditForm({ ...editForm, cas_do: e.target.value })}
                          className="admin-input"
                        />
                      </td>
                      <td>
                        <select
                          value={editForm.stav || ''}
                          onChange={e => setEditForm({ ...editForm, stav: e.target.value })}
                          className="admin-select"
                        >
                          <option value="pending">Čakajúca</option>
                          <option value="potvrdena">Potvrdená</option>
                          <option value="zrusena">Zrušená</option>
                          <option value="dokoncena">Dokončená</option>
                        </select>
                      </td>
                      <td className="cell-note">
                        <textarea
                          value={editForm.poznamka || ''}
                          onChange={e => setEditForm({ ...editForm, poznamka: e.target.value })}
                          rows={3}
                          className="admin-textarea"
                          placeholder="Popis..."
                        />
                      </td>
                      <td className="cell-center">
                        <div className="admin-actions">
                          <button onClick={() => updateReservation(res.id_sedenia)} className="admin-btn admin-btn-sm admin-btn-success">✅</button>
                          <button onClick={() => setEditingId(null)} className="admin-btn admin-btn-sm admin-btn-secondary">❌</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{res.uzivatel_meno} {res.uzivatel_priezvisko}</td>
                      <td>{res.uzivatel_email}</td>
                      <td>{formatSkDate(res.datum)}</td>
                      <td>{res.cas_od?.slice(0, 5)}</td>
                      <td>{res.cas_do?.slice(0, 5)}</td>
                      <td><span className={statusClass(res.stav)}>{statusLabel(res.stav)}</span></td>
                      <td className="cell-note">{res.poznamka || '-'}</td>
                      <td className="cell-center">
                        <div className="admin-actions">
                          <button
                            onClick={() => {
                              setEditingId(res.id_sedenia);
                              setEditForm({
                                datum: toYmd(res.datum),
                                cas_od: res.cas_od,
                                cas_do: res.cas_do,
                                stav: res.stav,
                                poznamka: res.poznamka || ''
                              });
                            }}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            ✏️
                          </button>
                          <button onClick={() => deleteReservation(res.id_sedenia)} className="admin-btn admin-btn-sm admin-btn-danger">🗑️</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Vymazať"
        cancelText="Zrušiť"
        confirmDanger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};

export default AdminReservations;

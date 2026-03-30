import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE } from '../../utils/adminHelpers';
import ConfirmDialog from './ConfirmDialog';
import '../styles/AdminComponents.css';

const AdminSlots = () => {
  const { token } = useAuth();
  const [slots, setSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({ datum: '', cas_od: '', cas_do: '', volny: true });
  const [slotMessage, setSlotMessage] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editForm, setEditForm] = useState({ datum: '', cas_od: '', cas_do: '', volny: true });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    if (!slotMessage) return;
    const timer = setTimeout(() => setSlotMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [slotMessage]);

  const loadSlots = async () => {
    try {
      setSlotLoading(true);
      const resp = await fetchWithToken(`${API_BASE}/api/cas-slots?psycholog_id=1`, token);
      const data = await resp.json();
      if (!resp.ok) {
        setSlotMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        setSlots([]);
      } else {
        const freeSlots = (data || []).filter((s) => s?.volny === true);
        setSlots(freeSlots);
        // Preserve success messages while reloading; clear only previous non-success messages.
        setSlotMessage((prev) => (prev && !prev.startsWith('✅') ? '' : prev));
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri načítaní slotov');
      setSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  const addSlot = async (e) => {
    e.preventDefault();
    setSlotMessage('');
    const { datum, cas_od, cas_do, volny } = slotForm;
    if (!datum || !cas_od || !cas_do) {
      setSlotMessage('Vyplňte dátum a časy.');
      return;
    }
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/cas-slots`, token, {
        method: 'POST',
        body: JSON.stringify({ id_psychologa: 1, datum, cas_od, cas_do, volny })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSlotMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setSlotMessage('✅ Nový termín pridaný');
        setSlotForm({ datum: '', cas_od: '', cas_do: '', volny: true });
        loadSlots();
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri ukladaní termínu');
    }
  };

  const updateSlot = async (id, form) => {
    try {
      const payload = {
        datum: form?.datum,
        cas_od: form?.cas_od,
        cas_do: form?.cas_do,
        volny: form?.volny ?? true
      };

      if (!payload.datum || !payload.cas_od || !payload.cas_do) {
        setSlotMessage('Vyplňte dátum a časy.');
        return false;
      }

      const resp = await fetchWithToken(`${API_BASE}/api/cas-slots/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSlotMessage(`Chyba: ${data?.error || 'neznáma'}`);
        return false;
      }

      setSlotMessage('✅ Termín upravený');
      await loadSlots();
      return true;
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri úprave slotu');
      return false;
    }
  };

  const performRemoveSlot = async (id) => {
    try {
      const resp = await fetchWithToken(`${API_BASE}/api/cas-slots/${id}`, token, { method: 'DELETE' });
      if (!resp.ok) {
        const data = await resp.json();
        setSlotMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setSlotMessage('✅ Termín zmazaný');
        setSlots((prev) => prev.filter((s) => s.id_casu !== id));
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri mazaní termínu');
    }
  };

  const removeSlot = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Potvrdenie vymazania',
      message: 'Naozaj chcete zmazať tento termín? Táto akcia je nezvratná.',
      danger: true,
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        performRemoveSlot(id);
      }
    });
  };

  const performTruncateSlots = async () => {
    try {
      await fetchWithToken(`${API_BASE}/api/cas-slots`, token, { method: 'DELETE' });
      setSlots([]);
      setSlotMessage('✅ Všetky termíny zmazané');
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri mazaní všetkých termínov');
    }
  };

  const truncateSlots = () => {
    setConfirmDialog({
      open: true,
      title: 'Zmazať všetky termíny',
      message: 'Naozaj chcete zmazať všetky dostupné termíny? Táto akcia je nezvratná.',
      danger: true,
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        performTruncateSlots();
      }
    });
  };

  const startEditSlot = (slot) => {
    const slotId = slot.id_casu || slot.id_cas;
    setEditingSlotId(slotId);
    setEditForm({
      datum: slot.datum || '',
      cas_od: slot.cas_od || '',
      cas_do: slot.cas_do || '',
      volny: slot.volny !== false
    });
  };

  const cancelEditSlot = () => {
    setEditingSlotId(null);
    setEditForm({ datum: '', cas_od: '', cas_do: '', volny: true });
  };

  const saveEditSlot = async (slotId) => {
    const ok = await updateSlot(slotId, editForm);
    if (ok) cancelEditSlot();
  };

  return (
    <div className="admin-section full-width cas-section">
      <h2>🕒 Správa dostupných termínov (CAS)</h2>
      
      {slotMessage && (
        <div className={`admin-alert ${slotMessage.startsWith('✅') ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {slotMessage}
        </div>
      )}

      <form onSubmit={addSlot} className="admin-form-card">
        <h3>Pridať nový termín</h3>
        <div className="admin-form-grid-3">
          <div>
            <label className="admin-label">Dátum *</label>
            <input
              type="date"
              value={slotForm.datum}
              onChange={e => setSlotForm({ ...slotForm, datum: e.target.value })}
              className="admin-input"
              required
            />
          </div>
          <div>
            <label className="admin-label">Čas od *</label>
            <input
              type="time"
              value={slotForm.cas_od}
              onChange={e => setSlotForm({ ...slotForm, cas_od: e.target.value })}
              className="admin-input"
              required
            />
          </div>
          <div>
            <label className="admin-label">Čas do *</label>
            <input
              type="time"
              value={slotForm.cas_do}
              onChange={e => setSlotForm({ ...slotForm, cas_do: e.target.value })}
              className="admin-input"
              required
            />
          </div>
        </div>
        <div className="slot-form-actions">
          <button type="submit" className="admin-btn admin-btn-success"> 
            ➕ Pridať termín
          </button>
          <button type="button" onClick={truncateSlots} className="admin-btn admin-btn-danger">
            🗑️ Zmazať všetky termíny
          </button>
        </div>
      </form>

      <h3>Dostupné termíny ({slots.length})</h3>
      {slotLoading ? (
        <p>Načítavam termíny...</p>
      ) : slots.length === 0 ? (
        <p>Žiadne dostupné termíny</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Čas od</th>
                <th>Čas do</th>
                <th className="cell-center" style={{ width: "50px" }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const slotId = slot.id_casu || slot.id_cas;
                const isEditing = editingSlotId === slotId;

                return (
                  <tr key={slotId}>
                    <td>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.datum}
                          onChange={e => setEditForm({ ...editForm, datum: e.target.value })}
                          className="admin-input"
                        />
                      ) : (
                        new Date(`${slot.datum}T00:00:00`).toLocaleDateString('sk-SK')
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editForm.cas_od}
                          onChange={e => setEditForm({ ...editForm, cas_od: e.target.value })}
                          className="admin-input"
                        />
                      ) : (
                        slot.cas_od?.slice(0, 5)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editForm.cas_do}
                          onChange={e => setEditForm({ ...editForm, cas_do: e.target.value })}
                          className="admin-input"
                        />
                      ) : (
                        slot.cas_do?.slice(0, 5)
                      )}
                    </td>
                    <td className="cell-center">
                      {isEditing ? (
                        <div className="admin-actions">
                          <button
                            onClick={() => saveEditSlot(slotId)}
                            className="admin-btn admin-btn-sm admin-btn-success"
                          >
                            💾 Uložiť
                          </button>
                          <button
                            onClick={cancelEditSlot}
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                          >
                            ❌ Zrušiť
                          </button>
                        </div>
                      ) : (
                        <div className="admin-actions">
                          <button
                            onClick={() => startEditSlot(slot)}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            ✏️ Upraviť
                          </button>
                          <button
                            onClick={() => removeSlot(slotId)}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                          >
                            🗑️ Odstrániť
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Potvrdiť"
        cancelText="Zrušiť"
        confirmDanger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};

export default AdminSlots;

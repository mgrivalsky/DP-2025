import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { useEffect } from 'react';
import JsonData from '../data/data.json';
import { NavigationMain } from './navigationMain.jsx';
import { HeaderMain } from './headerMain';
import { News } from './news';
import { Testimonials2 } from './testimonials2';
import QuickHelp from './QuickHelp';
import ReservationSystem from './ReservationSystem';
import Expert from './Expert.js';
import { Contact } from './contact';
import ChatIconButton from './ChatIconButton';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [slots, setSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({ datum: '', cas_od: '', cas_do: '', volny: true });
  const [slotMessage, setSlotMessage] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [trustEntries, setTrustEntries] = useState([]);
  const [trustLoading, setTrustLoading] = useState(false);
  const [trustMessage, setTrustMessage] = useState('');
  const [answerDraft, setAnswerDraft] = useState({});
  const [contentDraft, setContentDraft] = useState({});
  const [trustEditId, setTrustEditId] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationMessage, setReservationMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reservationFilter, setReservationFilter] = useState('pending');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadSlots = async () => {
    try {
      setSlotLoading(true);
      const resp = await fetch(`${API_BASE}/api/cas-slots?psycholog_id=1`);
      const data = await resp.json();
      if (!resp.ok) {
        setSlotMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        setSlots([]);
      } else {
        setSlots(data || []);
        setSlotMessage('');
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri načítaní slotov');
      setSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  // Načítaj rezervácie pri prvom otvorení
  useEffect(() => {
    loadReservations();
    loadSlots();
    loadTrustEntries();
  }, []);

  useEffect(() => {
    if (activeTab === 'slots') {
      loadSlots();
    }
    if (activeTab === 'reservations') {
      loadReservations();
    }
    if (activeTab === 'overview') {
      loadReservations();
      loadSlots();
    }
    if (activeTab === 'trust') {
      loadTrustEntries();
    }
  }, [activeTab]);

  const loadTrustEntries = async () => {
    try {
      setTrustLoading(true);
      const resp = await fetch(`${API_BASE}/api/trust-box`);
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        setTrustEntries([]);
      } else {
        setTrustEntries(data || []);
        setTrustMessage('');
      }
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri načítaní správ');
      setTrustEntries([]);
    } finally {
      setTrustLoading(false);
    }
  };

  const updateTrustAnswer = async (id) => {
    try {
      const payload = {
        odpoved: answerDraft[id] ?? '',
        obsah_prispevku: contentDraft[id],
      };
      const resp = await fetch(`${API_BASE}/api/trust-box/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri uložení: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? data : item));
      setTrustMessage('✅ Odpoveď uložená');
      setTrustEditId(null);
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri ukladaní odpovede');
    }
  };

  const loadReservations = async () => {
    try {
      setReservationLoading(true);
      const resp = await fetch(`${API_BASE}/api/reservations`);
      const data = await resp.json();
      if (!resp.ok) {
        setReservationMessage(`Chyba pri načítaní: ${data?.error || 'neznáma'}`);
        setReservations([]);
      } else {
        setReservations(data || []);
        setReservationMessage('');
      }
    } catch (err) {
      console.error(err);
      setReservationMessage('Chyba pri načítaní rezervácií');
      setReservations([]);
    } finally {
      setReservationLoading(false);
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
      const resp = await fetch(`${API_BASE}/api/cas-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_psychologicky: 1, datum, cas_od, cas_do, volny })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSlotMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setSlotMessage('✅ Slot pridaný');
        setSlotForm({ datum: '', cas_od: '', cas_do: '', volny: true });
        loadSlots();
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri ukladaní slotu');
    }
  };

  const removeSlot = async (id) => {
    if (!window.confirm('Zmazať tento slot?')) return;
    try {
      const resp = await fetch(`${API_BASE}/api/cas-slots/${id}`, { method: 'DELETE' });
      if (!resp.ok) {
        const data = await resp.json();
        setSlotMessage(`Chyba: ${data?.error || 'neznáma'}`);
      } else {
        setSlotMessage('Slot zmazaný');
        setSlots((prev) => prev.filter((s) => s.id_casu !== id));
      }
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri mazaní slotu');
    }
  };

  const truncateSlots = async () => {
    if (!window.confirm('Naozaj zmazať všetky sloty?')) return;
    try {
      await fetch(`${API_BASE}/api/cas-slots`, { method: 'DELETE' });
      setSlots([]);
      setSlotMessage('Všetky sloty zmazané');
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri mazaní všetkých slotov');
    }
  };

  const updateReservation = async (id) => {
    try {
      const resp = await fetch(`${API_BASE}/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  const deleteReservation = async (id) => {
    if (!window.confirm('Zmazať túto rezerváciu?')) return;
    try {
      const resp = await fetch(`${API_BASE}/api/reservations/${id}`, { method: 'DELETE' });
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

  // Simulované dáta - v reálnej aplikácii by to bolo z API
  const stats = {
    totalUsers: 862,
    activeReservations: reservations.filter(r => r.stav === 'pending' || r.stav === 'potvrdena').length,
    pendingRequests: slots.filter(s => s.volny).length,
    completedSessions: reservations.filter(r => r.stav === 'dokoncena').length
  };

  const recentActivities = [
    { id: 1, user: 'Ján Kovač', action: 'Vytvoril rezerváciu', time: 'pred 10 min' },
    { id: 2, user: 'Peter Malý', action: 'Použil expert systém', time: 'pred 25 min' },
    { id: 3, user: 'Mária Veselá', action: 'Zrušil rezerváciu', time: 'pred 1 hodinou' },
    { id: 4, user: 'Zuzana Nová', action: 'Pridala príspevok do schránky dôvery', time: 'pred 2 hodinami' }
  ];

  // 3 najbližšie sedenia z databázy
  const upcomingReservations = reservations
    .filter(r => r.stav === 'pending' || r.stav === 'potvrdena')
    .sort((a, b) => {
      const dateA = new Date(a.datum);
      const dateB = new Date(b.datum);
      if (dateA !== dateB) return dateA - dateB;
      return a.cas_od.localeCompare(b.cas_od);
    })
    .slice(0, 3)
    .map(r => ({
      id: r.id_sedenia,
      student: `${r.uzivatel_meno} ${r.uzivatel_priezvisko}`,
      date: new Date(r.datum).toLocaleDateString('sk-SK', {day:'2-digit', month:'2-digit', year:'numeric'}),
      timeRange: `${r.cas_od?.slice(0, 5) || ''} - ${r.cas_do?.slice(0, 5) || ''}`,
      type: r.poznamka || 'Konzultácia'
    }));

  return (
    <div className="admin-dashboard-container">
      <nav id="menu" className="navbar navbar-default navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#bs-admin-navbar-collapse"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" style={{whiteSpace: 'nowrap'}}>
              🧑‍⚕️ Admin Panel
            </a>
          </div>

          <div className="collapse navbar-collapse" id="bs-admin-navbar-collapse">
            <ul className="nav navbar-nav navbar-right">
              <li>
                <a 
                  onClick={() => setActiveTab('overview')} 
                  className={activeTab === 'overview' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Prehľad
                </a>
              </li>
              <li>
                <a 
                  onClick={() => setActiveTab('reservations')} 
                  className={activeTab === 'reservations' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Rezervácie
                </a>
              </li>
              <li>
                <a 
                  onClick={() => setActiveTab('slots')} 
                  className={activeTab === 'slots' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Dostupné termíny
                </a>
              </li>
              <li>
                <a 
                  onClick={() => setActiveTab('trust')} 
                  className={activeTab === 'trust' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Schránka dôvery
                </a>
              </li>
              <li>
                <a 
                  onClick={() => setActiveTab('reports')} 
                  className={activeTab === 'reports' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Reporty
                </a>
              </li>
              <li>
                <a 
                  onClick={() => setActiveTab('preview')} 
                  className={activeTab === 'preview' ? 'page-scroll active' : 'page-scroll'}
                  style={{cursor: 'pointer'}}
                >
                  Náhľad stránky
                </a>
              </li>
              <li>
                <a onClick={handleLogout} className="page-scroll logout-link" style={{cursor: 'pointer'}}>
                  Odhlásiť sa
                </a>
              </li>
              <li>
                <span className="user-name" style={{position: 'relative', top: '4px'}}>👤 {user?.name}</span>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="admin-content" style={{marginTop: '80px'}}>

        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Celkom užívateľov</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>{stats.activeReservations}</h3>
                  <p>Rezervované sedenia</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pendingRequests}</h3>
                  <p>Voľné termíny</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.completedSessions}</h3>
                  <p>Dokončené sedenia</p>
                </div>
              </div>
            </div>

            <div className="admin-sections">
              <div className="admin-section">
                <h2>📋 Nadchádzajúce rezervácie</h2>
                <div className="reservations-list">
                  {upcomingReservations.map(res => (
                    <div key={res.id} className="reservation-item">
                      <div className="reservation-info">
                        <strong>{res.student}</strong>
                      </div>
                      <div className="reservation-time" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>{res.date}</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>{res.timeRange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-section">
                <h2>🔔 Posledné aktivity</h2>
                <div className="activities-list">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div>
                        <strong>{activity.user}</strong>
                        <p>{activity.action}</p>
                      </div>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reservations' && (
          <div className="admin-section full-width">
            <h2>📅 Správa rezervácií</h2>
            
            {reservationMessage && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: reservationMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
                color: reservationMessage.startsWith('✅') ? '#155724' : '#721c24'
              }}>
                {reservationMessage}
              </div>
            )}

            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Filtrovať podľa stavu:</label>
              <select 
                value={reservationFilter} 
                onChange={e => setReservationFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
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
            ) : reservations.filter(r => !reservationFilter || r.stav === reservationFilter).length === 0 ? (
              <p>Žiadne rezervácie s vybraným stavu</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Užívateľ</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Dátum</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Čas od</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Čas do</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Stav</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Popis</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.filter(r => !reservationFilter || r.stav === reservationFilter).map(res => (
                      <tr key={res.id_sedenia}>
                        {editingId === res.id_sedenia ? (
                          <>
                            <td style={{ padding: '12px' }}>{res.uzivatel_meno} {res.uzivatel_priezvisko}</td>
                            <td style={{ padding: '12px' }}>{res.uzivatel_email}</td>
                            <td style={{ padding: '12px' }}>
                              <input 
                                type="date" 
                                value={editForm.datum || ''} 
                                onChange={e => setEditForm({...editForm, datum: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                              />
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input 
                                type="time" 
                                value={editForm.cas_od || ''} 
                                onChange={e => setEditForm({...editForm, cas_od: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                              />
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input 
                                type="time" 
                                value={editForm.cas_do || ''} 
                                onChange={e => setEditForm({...editForm, cas_do: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                              />
                            </td>
                            <td style={{ padding: '12px' }}>
                              <select 
                                value={editForm.stav || ''} 
                                onChange={e => setEditForm({...editForm, stav: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                              >
                                <option value="pending">Čakajúca</option>
                                <option value="potvrdena">Potvrdená</option>
                                <option value="zrusena">Zrušená</option>
                                <option value="dokoncena">Dokončená</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input 
                                type="text" 
                                value={editForm.poznamka || ''} 
                                onChange={e => setEditForm({...editForm, poznamka: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                                placeholder="Popis..."
                              />
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => updateReservation(res.id_sedenia)}
                                style={{
                                  padding: '5px 10px',
                                  marginRight: '5px',
                                  background: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✅
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                style={{
                                  padding: '5px 10px',
                                  background: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ❌
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '12px' }}>{res.uzivatel_meno} {res.uzivatel_priezvisko}</td>
                            <td style={{ padding: '12px' }}>{res.uzivatel_email}</td>
                            <td style={{ padding: '12px' }}>
                              {new Date(res.datum).toLocaleDateString('sk-SK', {day:'2-digit', month:'2-digit', year:'numeric'})}
                            </td>
                            <td style={{ padding: '12px' }}>{res.cas_od?.slice(0,5)}</td>
                            <td style={{ padding: '12px' }}>{res.cas_do?.slice(0,5)}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                background: 
                                  res.stav === 'potvrdena' ? '#d4edda' :
                                  res.stav === 'zrusena' ? '#f8d7da' :
                                  res.stav === 'dokoncena' ? '#d1ecf1' : '#fff3cd',
                                color: 
                                  res.stav === 'potvrdena' ? '#155724' :
                                  res.stav === 'zrusena' ? '#721c24' :
                                  res.stav === 'dokoncena' ? '#0c5460' : '#856404'
                              }}>
                                {res.stav === 'pending' ? 'Čakajúca' :
                                 res.stav === 'potvrdena' ? 'Potvrdená' :
                                 res.stav === 'zrusena' ? 'Zrušená' : 'Dokončená'}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>{res.poznamka || '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => {
                                  setEditingId(res.id_sedenia);
                                  setEditForm({
                                    datum: res.datum.split('T')[0],
                                    cas_od: res.cas_od,
                                    cas_do: res.cas_do,
                                    stav: res.stav,
                                    poznamka: res.poznamka || ''
                                  });
                                }}
                                style={{
                                  padding: '5px 10px',
                                  marginRight: '5px',
                                  background: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => deleteReservation(res.id_sedenia)}
                                style={{
                                  padding: '5px 10px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'slots' && (
          <div className="admin-section full-width">
            <h2>🕐 Správa dostupných termínov</h2>
            <p>Pridávaj a spravuj dostupné termíny pre rezervácie.</p>
            
            {slotMessage && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: slotMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
                color: slotMessage.startsWith('✅') ? '#155724' : '#721c24'
              }}>
                {slotMessage}
              </div>
            )}

            <form onSubmit={addSlot} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3>Pridať nový termín</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dátum</label>
                  <input
                    type="date"
                    value={slotForm.datum}
                    onChange={(e) => setSlotForm({ ...slotForm, datum: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Čas od</label>
                  <input
                    type="time"
                    value={slotForm.cas_od}
                    onChange={(e) => setSlotForm({ ...slotForm, cas_od: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Čas do</label>
                  <input
                    type="time"
                    value={slotForm.cas_do}
                    onChange={(e) => setSlotForm({ ...slotForm, cas_do: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
                <button type="submit" className="primary-btn" style={{ padding: '13px 20px' }}>Pridať</button>
              </div>
            </form>

            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Existujúce termíny ({slots.length})</h3>
              <button onClick={truncateSlots} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Zmazať všetky
              </button>
            </div>

            {slotLoading && <p>Načítavam sloty...</p>}
            {!slotLoading && slots.length === 0 && <p>Zatiaľ žiadne sloty.</p>}
            {!slotLoading && slots.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Dátum</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Čas od</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Čas do</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Stav</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, idx) => (
                    <tr key={slot.id_casu}>
                      <td style={{ padding: '10px' }}>{slot.id_casu}</td>
                      <td style={{ padding: '10px' }}>{new Date(slot.datum).toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td style={{ padding: '10px' }}>{slot.cas_od?.slice(0,5)}</td>
                      <td style={{ padding: '10px' }}>{slot.cas_do?.slice(0,5)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: slot.volny ? '#d4edda' : '#f8d7da',
                          color: slot.volny ? '#155724' : '#721c24'
                        }}>
                          {slot.volny ? 'Voľný' : 'Obsadený'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeSlot(slot.id_casu)}
                          style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Zmazať
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="admin-section full-width">
            <h2>📊 Reporty a štatistiky</h2>
            <p>Prehľad štatistík, návštevnosť, frekvencia konzultácií.</p>
            <button className="primary-btn">Generovať report</button>
          </div>
        )}

        {activeTab === 'trust' && (
          <div className="admin-section full-width">
            <h2>📬 Schránka dôvery</h2>
            <p>Všetky príspevky s možnosťou pridať odpoveď.</p>

            {trustMessage && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: trustMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
                color: trustMessage.startsWith('✅') ? '#155724' : '#721c24'
              }}>
                {trustMessage}
              </div>
            )}

            {trustLoading ? (
              <p>Načítavam správy...</p>
            ) : trustEntries.length === 0 ? (
              <p>Zatiaľ žiadne príspevky.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Kategória</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Obsah správy</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Anonymné</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Publikovateľné</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Stav</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Odpoveď</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trustEntries.map(entry => (
                      <tr key={entry.id_prispevku}>
                        <td style={{ padding: '12px' }}>{entry.kategoria}</td>
                        <td style={{ padding: '12px', maxWidth: '320px' }}>
                          {trustEditId === entry.id_prispevku ? (
                            <textarea
                              value={contentDraft[entry.id_prispevku] ?? entry.obsah_prispevku ?? ''}
                              onChange={e => setContentDraft(prev => ({ ...prev, [entry.id_prispevku]: e.target.value }))}
                              rows={4}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-line' }}>{entry.obsah_prispevku}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {entry.anonymne ? (
                            'Áno'
                          ) : (
                            <span title={entry.uzivatel_meno || 'Neznámy užívateľ'} style={{ textDecoration: 'underline dotted' }}>
                              Nie
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>{entry.publikovatelne ? 'Áno' : 'Nie'}</td>
                        <td style={{ padding: '12px' }}>{entry.stav}</td>
                        <td style={{ padding: '12px', minWidth: '240px' }}>
                          {trustEditId === entry.id_prispevku ? (
                            <textarea
                              value={answerDraft[entry.id_prispevku] ?? entry.odpoved ?? ''}
                              onChange={e => setAnswerDraft(prev => ({ ...prev, [entry.id_prispevku]: e.target.value }))}
                              rows={3}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                              placeholder="Napíšte odpoveď psychologičky"
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-line', color: entry.odpoved ? '#333' : '#777' }}>
                              {entry.odpoved && entry.odpoved.trim().length > 0 ? entry.odpoved : '— bez odpovede —'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {trustEditId === entry.id_prispevku ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                onClick={() => updateTrustAnswer(entry.id_prispevku)}
                                style={{ padding: '8px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Uložiť
                              </button>
                              <button
                                onClick={() => setTrustEditId(null)}
                                style={{ padding: '8px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Zrušiť
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setTrustEditId(entry.id_prispevku);
                                  setContentDraft(prev => ({ ...prev, [entry.id_prispevku]: entry.obsah_prispevku }));
                                  setAnswerDraft(prev => ({ ...prev, [entry.id_prispevku]: entry.odpoved || '' }));
                                }}
                                style={{ padding: '8px 14px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Editovať
                              </button>
                              <button
                                style={{ padding: '8px 14px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Publikovať
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="admin-section full-width">
            <h2>Náhľad stránky - Pohľad užívateľa</h2>
            <p>Takto vidí užívateľ celú stránku:</p>
            <button 
              onClick={() => setActiveTab('overview')} 
              style={{
                marginBottom: '20px',
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Späť na prehľad
            </button>
            <div style={{ marginTop: '20px' }}>
              <NavigationMain />
              <HeaderMain data={JsonData.HeaderMain} />
              <News data={JsonData.News} />
              <Testimonials2 data={JsonData.Testimonials2} />
              <QuickHelp data={JsonData.QuickHelp} />
              <ReservationSystem data={JsonData.ReservationSystem} />
              <Expert data={JsonData.expert} />
              <Contact data={JsonData.Contact} />
              <ChatIconButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

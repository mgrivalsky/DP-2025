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
import PsychologChatFloating from './PsychologChatFloating';
import PsychologChat from './PsychologChat';

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
  const [trustCategoryFilter, setTrustCategoryFilter] = useState('all');
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [reservationMessage, setReservationMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reservationFilter, setReservationFilter] = useState('pending');
  const [newReservationForm, setNewReservationForm] = useState({
    email: '',
    datum: '',
    cas_od: '',
    cas_do: '',
    poznamka: '',
    stav: 'pending'
  });
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Potvrdiť',
    cancelText: 'Zrušiť',
    confirmStyle: {},
    onConfirm: null
  });

  const trustCategories = Array.from(
    new Set((trustEntries || []).map(entry => entry.kategoria).filter(Boolean))
  );
  const filteredTrustEntries =
    trustCategoryFilter === 'all'
      ? trustEntries
      : trustEntries.filter(entry => entry.kategoria === trustCategoryFilter);
  const publishedTrustEntries = (trustEntries || []).filter(
    (entry) => entry.zverejnene && entry.publikovatelne
  );

  const showConfirm = (options) => {
    setConfirmDialog({
      open: true,
      title: options.title || 'Potvrdenie',
      message: options.message || '',
      confirmText: options.confirmText || 'Potvrdiť',
      cancelText: options.cancelText || 'Zrušiť',
      confirmStyle: options.confirmStyle || {},
      onConfirm: options.onConfirm || null
    });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

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

  const loadChatUnreadTotal = async () => {
    try {
      if (!user?.id) return;
      const resp = await fetch(`${API_BASE}/api/chat/psycholog/${user.id}`);
      if (!resp.ok) return;
      const chatsData = (await resp.json()) || [];
      if (chatsData.length === 0) {
        setChatUnreadTotal(0);
        return;
      }

      const hasUnreadCount = chatsData.every((chat) => typeof chat.unread_count !== 'undefined');
      if (hasUnreadCount) {
        const total = chatsData.reduce(
          (sum, chat) => sum + (Number(chat.unread_count) || 0),
          0
        );
        setChatUnreadTotal(total);
        return;
      }

      const counts = await Promise.all(
        chatsData.map(async (chat) => {
          try {
            const response = await fetch(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
            if (!response.ok) return 0;
            const msgs = await response.json();
            return (msgs || []).filter(
              (msg) => !msg.videne && msg.odesilatel_typ === 'uzivatel'
            ).length;
          } catch {
            return 0;
          }
        })
      );

      setChatUnreadTotal(counts.reduce((sum, count) => sum + count, 0));
    } catch (err) {
      console.error(err);
    }
  };

  // Načítaj rezervácie pri prvom otvorení
  useEffect(() => {
    loadReservations();
    loadSlots();
    loadTrustEntries();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadChatUnreadTotal();
    const interval = setInterval(loadChatUnreadTotal, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

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

  const publishTrustEntry = async (id) => {
    try {
      const resp = await fetch(`${API_BASE}/api/trust-box/${id}/publish`, {
        method: 'PATCH'
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri publikovaní: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? data : item));
      setTrustMessage('✅ Príspevok publikovaný');
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri publikovaní príspevku');
    }
  };

  const unpublishTrustEntry = async (id) => {
    try {
      const resp = await fetch(`${API_BASE}/api/trust-box/${id}/unpublish`, {
        method: 'PATCH'
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTrustMessage(`Chyba pri zrušení publikovania: ${data?.error || 'neznáma'}`);
        return;
      }
      setTrustEntries(prev => prev.map(item => item.id_prispevku === id ? data : item));
      setTrustMessage('✅ Príspevok bol skrytý z webu');
    } catch (err) {
      console.error(err);
      setTrustMessage('Chyba pri zrušení publikovania');
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

  const performRemoveSlot = async (id) => {
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

  const removeSlot = (id) => {
    showConfirm({
      title: 'Potvrdenie vymazania',
      message: 'Naozaj chcete zmazať tento termín? Táto akcia je nezvratná.',
      confirmText: 'Vymazať',
      cancelText: 'Zrušiť',
      confirmStyle: { background: '#dc3545' },
      onConfirm: () => { closeConfirm(); performRemoveSlot(id); }
    });
  };

  const performTruncateSlots = async () => {
    try {
      await fetch(`${API_BASE}/api/cas-slots`, { method: 'DELETE' });
      setSlots([]);
      setSlotMessage('Všetky sloty zmazané');
    } catch (err) {
      console.error(err);
      setSlotMessage('Chyba pri mazaní všetkých slotov');
    }
  };

  const truncateSlots = () => {
    showConfirm({
      title: 'Zmazať všetky termíny',
      message: 'Naozaj chcete zmazať všetky dostupné termíny? Táto akcia je nezvratná.',
      confirmText: 'Zmazať všetky',
      cancelText: 'Zrušiť',
      confirmStyle: { background: '#dc3545' },
      onConfirm: () => { closeConfirm(); performTruncateSlots(); }
    });
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

  const performDeleteReservation = async (id) => {
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

  const deleteReservation = (id) => {
    showConfirm({
      title: 'Potvrdenie vymazania',
      message: 'Naozaj chcete zmazať túto rezerváciu? Táto akcia je nezvratná.',
      confirmText: 'Vymazať',
      cancelText: 'Zrušiť',
      confirmStyle: { background: '#dc3545' },
      onConfirm: () => { closeConfirm(); performDeleteReservation(id); }
    });
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
      const resp = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Nadchádzajúce sedenia od dneška (vrátane) zoradené chronologicky
  const upcomingReservations = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations
      .filter(r => (r.stav === 'pending' || r.stav === 'potvrdena') && new Date(r.datum) >= today)
      .sort((a, b) => {
        const dateA = new Date(a.datum);
        const dateB = new Date(b.datum);
        if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
        return (a.cas_od || '').localeCompare(b.cas_od || '');
      })
      .map(r => ({
        id: r.id_sedenia,
        student: `${r.uzivatel_meno} ${r.uzivatel_priezvisko}`,
        date: new Date(r.datum).toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        timeRange: `${r.cas_od?.slice(0, 5) || ''} - ${r.cas_do?.slice(0, 5) || ''}`,
        type: r.poznamka || 'Konzultácia'
      }));
  })();

  return (
    <div className="admin-dashboard-container">
      {confirmDialog.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '460px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{confirmDialog.title}</h3>
            </div>
            <div style={{ padding: '18px' }}>
              <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>{confirmDialog.message}</p>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8f9fa' }}>
              <button
                onClick={closeConfirm}
                style={{
                  padding: '10px 16px', background: '#6c757d', color: 'white', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {confirmDialog.cancelText || 'Zrušiť'}
              </button>
              <button
                onClick={() => {
                  const fn = confirmDialog.onConfirm;
                  if (typeof fn === 'function') {
                    Promise.resolve(fn())
                      .finally(() => closeConfirm());
                  } else {
                    closeConfirm();
                  }
                }}
                style={{
                  padding: '10px 16px',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                  background: (confirmDialog.confirmStyle && confirmDialog.confirmStyle.background) || '#28a745'
                }}
              >
                {confirmDialog.confirmText || 'Potvrdiť'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            <a
              className="navbar-brand"
              onClick={() => setActiveTab('overview')}
              style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
              aria-label="Prehľad"
            >
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
                  onClick={() => setActiveTab('chat')} 
                  className={activeTab === 'chat' ? 'page-scroll active' : 'page-scroll'}
                  style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                >
                  Chaty s užívateľmi
                  {chatUnreadTotal > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-14px',
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        lineHeight: '20px',
                        textAlign: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                      }}
                    >
                      {chatUnreadTotal}
                    </span>
                  )}
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

            {/* Tlačidlo na zobrazenie formulára */}
            <div style={{ marginBottom: '15px' }}>
              <button 
                onClick={() => setShowNewReservationForm(!showNewReservationForm)}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {showNewReservationForm ? '❌ Zrušiť' : '➕ Pridať novú rezerváciu'}
              </button>
            </div>

            {/* Formulár na pridanie novej rezervácie */}
            {showNewReservationForm && (
              <form onSubmit={addNewReservation} style={{ 
                marginBottom: '20px', 
                padding: '20px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px solid #28a745'
              }}>
                <h3>Pridať novú rezerváciu</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Email užívateľa *
                    </label>
                    <input
                      type="email"
                      value={newReservationForm.email}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      placeholder="uzivatel@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Dátum *
                    </label>
                    <input
                      type="date"
                      value={newReservationForm.datum}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, datum: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Čas od *
                    </label>
                    <input
                      type="time"
                      value={newReservationForm.cas_od}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, cas_od: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Čas do *
                    </label>
                    <input
                      type="time"
                      value={newReservationForm.cas_do}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, cas_do: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Stav
                    </label>
                    <select
                      value={newReservationForm.stav}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, stav: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="pending">Čakajúca</option>
                      <option value="potvrdena">Potvrdená</option>
                      <option value="zrusena">Zrušená</option>
                      <option value="dokoncena">Dokončená</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Poznámka
                    </label>
                    <textarea
                      value={newReservationForm.poznamka}
                      onChange={(e) => setNewReservationForm({ ...newReservationForm, poznamka: e.target.value })}
                      rows={4}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                      placeholder="Voliteľný popis rezervácie"
                    />
                  </div>
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button 
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💾 Uložiť rezerváciu
                  </button>
                  <button 
                    type="button"
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
                    style={{
                      padding: '10px 20px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Zrušiť
                  </button>
                </div>
              </form>
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
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Užívateľ</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Dátum</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Čas od</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Čas do</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Stav</th>
                      <th style={{ padding: '12px', textAlign: 'left', minWidth: '300px' }}>Poznámka</th>
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
                            <td style={{ padding: '12px', minWidth: '300px' }}>
                              <textarea
                                value={editForm.poznamka || ''}
                                onChange={e => setEditForm({...editForm, poznamka: e.target.value})}
                                rows={3}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' }}
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
                            <td style={{ padding: '12px', minWidth: '300px', wordWrap: 'break-word', whiteSpace: 'normal' }}>{res.poznamka || '-'}</td>
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
              <h3>Existujúce voľné termíny ({slots.filter(s => s.volny).length})</h3>
              <button onClick={truncateSlots} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Zmazať všetky
              </button>
            </div>

            {slotLoading && <p>Načítavam sloty...</p>}
            {!slotLoading && slots.filter(s => s.volny).length === 0 && <p>Zatiaľ žiadne voľné termíny.</p>}
            {!slotLoading && slots.filter(s => s.volny).length > 0 && (
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
                  {slots.filter(s => s.volny).map((slot, idx) => (
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

        {activeTab === 'chat' && (
          <div className="admin-section full-width">
            <PsychologChat />
          </div>
        )}

        {activeTab === 'trust' && (
          <div className="admin-section full-width">
            <h2>📬 Schránka dôvery</h2>
            <p>Všetky príspevky s možnosťou pridať odpoveď.</p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0 15px' }}>
              <label htmlFor="trust-category-filter" style={{ fontWeight: 600 }}>
                Filter kategórie:
              </label>
              <select
                id="trust-category-filter"
                value={trustCategoryFilter}
                onChange={(e) => setTrustCategoryFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="all">Všetky</option>
                {trustCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

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
            ) : filteredTrustEntries.length === 0 ? (
              <p>Žiadne príspevky pre zvolenú kategóriu.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Kategória</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Dátum</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Obsah správy</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Anonymné</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Publikovateľné</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Publikované</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Stav</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Odpoveď</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrustEntries.map(entry => (
                      <tr key={entry.id_prispevku}>
                        <td style={{ padding: '8px' }}>{entry.kategoria}</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                          {entry.datum_pridania
                            ? new Date(entry.datum_pridania).toLocaleString('sk-SK', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                        <td style={{ padding: '8px', maxWidth: '320px' }}>
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
                        <td style={{ padding: '8px' }}>
                          {entry.anonymne ? (
                            'Áno'
                          ) : (
                            <span title={entry.uzivatel_meno || 'Neznámy užívateľ'} style={{ textDecoration: 'underline dotted' }}>
                              Nie
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px' }}>{entry.publikovatelne ? 'Áno' : 'Nie'}</td>
                        <td style={{ padding: '8px' }}>{entry.zverejnene ? 'Áno' : 'Nie'}</td>
                        <td style={{ padding: '8px' }}>{entry.stav}</td>
                        <td style={{ padding: '8px', minWidth: '240px' }}>
                          {trustEditId === entry.id_prispevku ? (
                            <textarea
                              value={answerDraft[entry.id_prispevku] ?? entry.odpoved ?? ''}
                              onChange={e => setAnswerDraft(prev => ({ ...prev, [entry.id_prispevku]: e.target.value }))}
                              rows={3}
                              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1.05rem', fontFamily: 'inherit', lineHeight: '1.6' }}
                              placeholder="Napíšte odpoveď psychologičky"
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-line', color: entry.odpoved ? '#333' : '#777', fontSize: '1.05rem', lineHeight: '1.6' }}>
                              {entry.odpoved && entry.odpoved.trim().length > 0 ? entry.odpoved : '— bez odpovede —'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {trustEditId === entry.id_prispevku ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                onClick={() => updateTrustAnswer(entry.id_prispevku)}
                                style={{ padding: '8px 14px', fontSize: '13px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', lineHeight: 1.2, fontWeight: 600 }}
                              >
                                Uložiť
                              </button>
                              <button
                                onClick={() => setTrustEditId(null)}
                                style={{ padding: '8px 14px', fontSize: '13px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', lineHeight: 1.2, fontWeight: 600 }}
                              >
                                Zrušiť
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setTrustEditId(entry.id_prispevku);
                                  setContentDraft(prev => ({ ...prev, [entry.id_prispevku]: entry.obsah_prispevku }));
                                  setAnswerDraft(prev => ({ ...prev, [entry.id_prispevku]: entry.odpoved || '' }));
                                }}
                                style={{ padding: '8px 14px', fontSize: '13px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', lineHeight: 1.2, fontWeight: 600 }}
                              >
                                Editovať
                              </button>
                              <button
                                onClick={() => publishTrustEntry(entry.id_prispevku)}
                                disabled={!entry.publikovatelne || entry.zverejnene}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  background: entry.zverejnene ? '#28a745' : '#ffc107',
                                  color: entry.zverejnene ? 'white' : '#333',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: (!entry.publikovatelne || entry.zverejnene) ? 'not-allowed' : 'pointer',
                                  lineHeight: 1.2,
                                  opacity: (!entry.publikovatelne || entry.zverejnene) ? 0.6 : 1
                                }}
                              >
                                {entry.zverejnene ? 'Publikované' : 'Publikovať'}
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

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0' }}>
              <h3 style={{ marginBottom: '12px' }}>🔎 Prehľad publikovaných príspevkov (čo vidia užívatelia)</h3>
              {publishedTrustEntries.length === 0 ? (
                <p>Zatiaľ nie sú publikované žiadne príspevky.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {publishedTrustEntries.map((entry) => (
                    <div
                      key={`pub-${entry.id_prispevku}`}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        minHeight: '180px'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{entry.kategoria}</div>
                      <div style={{ whiteSpace: 'pre-line', color: '#0f172a', lineHeight: 1.5 }}>
                        {entry.obsah_prispevku}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {entry.anonymne ? 'Anonym' : (entry.uzivatel_meno || 'Študent')}
                      </div>
                      <button
                        onClick={() => showConfirm({
                          title: 'Skryť príspevok',
                          message: 'Chcete tento príspevok skryť z webu? Zostane uložený v databáze.',
                          confirmText: 'Skryť',
                          confirmStyle: { background: '#dc3545', color: 'white' },
                          onConfirm: () => unpublishTrustEntry(entry.id_prispevku)
                        })}
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginTop: 'auto',
                          alignSelf: 'flex-start'
                        }}
                      >
                        Skryť z webu
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <div className="admin-preview-window">
              <div className="admin-preview-content">
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
          </div>
        )}

        {/* Floating chat bubble for psychologička on all tabs */}
        <PsychologChatFloating />
      </div>
    </div>
  );
};

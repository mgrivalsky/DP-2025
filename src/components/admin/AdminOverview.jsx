import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE, formatSkDate, parseLocalDate } from '../../utils/adminHelpers';
import '../styles/AdminComponents.css';

const AdminOverview = () => {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resResp, slotsResp] = await Promise.all([
        fetchWithToken(`${API_BASE}/api/reservations`, token),
        fetchWithToken(`${API_BASE}/api/cas-slots?psycholog_id=1`, token)
      ]);
      
      const resData = await resResp.json();
      const slotsData = await slotsResp.json();
      
      if (resResp.ok) setReservations(resData || []);
      if (slotsResp.ok) setSlots(slotsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const upcomingReservations = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations
      .filter(r => {
        const d = parseLocalDate(r.datum);
        return (r.stav === 'pending' || r.stav === 'potvrdena') && d && d >= today;
      })
      .sort((a, b) => {
        const dateA = parseLocalDate(a.datum) || new Date(0);
        const dateB = parseLocalDate(b.datum) || new Date(0);
        if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
        return (a.cas_od || '').localeCompare(b.cas_od || '');
      })
      .map(r => ({
        id: r.id_sedenia,
        student: `${r.uzivatel_meno} ${r.uzivatel_priezvisko}`,
        date: formatSkDate(r.datum),
        timeRange: `${r.cas_od?.slice(0, 5) || ''} - ${r.cas_do?.slice(0, 5) || ''}`,
        type: r.poznamka || 'Konzultácia'
      }));
  })();

  if (loading) {
    return <div className="admin-section"><p>Načítavam prehľad...</p></div>;
  }

  return (
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
            {upcomingReservations.length === 0 ? (
              <p>Žiadne nadchádzajúce rezervácie</p>
            ) : (
              upcomingReservations.map(res => (
                <div key={res.id} className="reservation-item">
                  <div className="reservation-info">
                    <strong>{res.student}</strong>
                  </div>
                  <div className="reservation-time overview-reservation-time">
                    <span className="overview-reservation-date">{res.date}</span>
                    <span className="overview-reservation-range">{res.timeRange}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-section">
          <h2>🔔 Posledné aktivity</h2>
          <div className="activities-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div>
                  <strong>{activity.user}</strong>
                  <span> - {activity.action}</span>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOverview;

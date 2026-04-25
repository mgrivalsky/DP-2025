import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, API_BASE, formatSkDate, parseLocalDate } from '../../utils/adminHelpers';
import '../styles/AdminComponents.css';

const AdminOverview = () => {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activityLimit, setActivityLimit] = useState('10');
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadActivities(activityLimit);
  }, [activityLimit]);

  const loadData = async () => {
    try {
      setLoading(true);
      const activityUrl =
        String(activityLimit) === 'all'
          ? `${API_BASE}/api/reports/recent-activities?limit=all`
          : `${API_BASE}/api/reports/recent-activities?limit=${Number(activityLimit) || 10}`;
      const [resResp, slotsResp, actResp, usersCountResp] = await Promise.all([
        fetchWithToken(`${API_BASE}/api/reservations`, token),
        fetchWithToken(`${API_BASE}/api/cas-slots?psycholog_id=1`, token),
        fetchWithToken(activityUrl, token),
        fetchWithToken(`${API_BASE}/api/reports/users-count`, token)
      ]);
      
      const resData = await resResp.json();
      const slotsData = await slotsResp.json();
      const actData = await actResp.json();
      const usersCountData = await usersCountResp.json();
      
      if (resResp.ok) setReservations(resData || []);
      if (slotsResp.ok) setSlots(slotsData || []);
      if (actResp.ok) setRecentActivities(actData?.items || []);
      if (usersCountResp.ok) setTotalUsers(Number(usersCountData?.count) || 0);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (limit) => {
    try {
      const activityUrl =
        String(limit) === 'all'
          ? `${API_BASE}/api/reports/recent-activities?limit=all`
          : `${API_BASE}/api/reports/recent-activities?limit=${Number(limit) || 10}`;
      const actResp = await fetchWithToken(
        activityUrl,
        token
      );
      const actData = await actResp.json();
      if (actResp.ok) setRecentActivities(actData?.items || []);
    } catch (err) {
      // ignore
    }
  };

  const stats = {
    totalUsers,
    activeReservations: reservations.filter(r => r.stav === 'vytvorena' || r.stav === 'potvrdena').length,
    pendingRequests: slots.filter(s => s.volny).length,
    completedSessions: reservations.filter(r => r.stav === 'dokoncena').length
  };

  const formatRelativeTime = (ts) => {
    const d = ts ? new Date(ts) : null;
    if (!d || isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'pred chvíľou';
    if (diffMin < 60) return `pred ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH === 1 ? 'pred 1 hodinou' : `pred ${diffH} hodinami`;
    return d.toLocaleDateString('sk-SK') + ' ' + d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  };

  const activityAction = (type) => {
    switch (String(type || '')) {
      case 'expert':
        return 'Použil expert systém';
      case 'reservation':
        return 'Vytvoril rezerváciu';
      case 'trustbox':
        return 'Pridal príspevok do schránky dôvery';
      default:
        return 'Aktivita';
    }
  };

  const upcomingReservations = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations
      .filter(r => {
        const d = parseLocalDate(r.datum);
        return r.stav === 'potvrdena' && d && d >= today;
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
          <div className="activities-header">
            <h2>🔔 Posledné aktivity</h2>
            <div className="activities-controls">
              <span className="admin-toolbar-label">Zobraziť:</span>
              <select
                className="admin-select admin-select-inline"
                value={activityLimit}
                onChange={(e) => setActivityLimit(e.target.value)}
                aria-label="Počet zobrazených aktivít"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="all">Všetky</option>
              </select>
            </div>
          </div>
          <div className="activities-list">
            {recentActivities.length === 0 ? (
              <p>Žiadne aktivity</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div>
                    <strong>{activity.user_name || 'Neznámy užívateľ'}</strong>
                    <span> - {activityAction(activity.activity_type)}</span>
                  </div>
                  <span className="activity-time">{formatRelativeTime(activity.ts)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOverview;

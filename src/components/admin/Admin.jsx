import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithToken, API_BASE } from '../../utils/adminHelpers';
import AdminHeader from './AdminHeader';
import AdminOverview from './AdminOverview';
import AdminReservations from './AdminReservations';
import AdminSlots from './AdminSlots';
import AdminTrustBox from './AdminTrustBox';
import AdminReports from './AdminReports';
import AdminPreview from './AdminPreview';
import PsychologChat from './PsychologChat';
import PsychologChatFloating from './PsychologChatFloating';
import '../styles/AdminDashboard.css';

export const Admin = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const [reservationUnreadTotal, setReservationUnreadTotal] = useState(0);
  const [trustBoxUnreadTotal, setTrustBoxUnreadTotal] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadChatUnreadTotal = async () => {
    try {
      if (!user?.id) return;
      const resp = await fetchWithToken(`${API_BASE}/api/chat/psycholog/${user.id}`, token);
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
            const response = await fetchWithToken(`${API_BASE}/api/chat/${chat.id_chatu}/messages`, token);
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

  const loadReservationUnreadTotal = async () => {
    try {
      if (!user?.id) return;
      const resp = await fetchWithToken(`${API_BASE}/api/reservations/psycholog/${user.id}/unseen-count`, token);
      if (!resp.ok) return;
      const data = await resp.json();
      setReservationUnreadTotal(Number(data?.count) || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const markReservationsSeen = async () => {
    try {
      if (!user?.id) return;
      const resp = await fetchWithToken(`${API_BASE}/api/reservations/psycholog/${user.id}/mark-seen`, token, { method: 'PUT' });
      if (!resp.ok) {
        let body = null;
        try {
          body = await resp.json();
        } catch {
          // ignore
        }
        console.warn('Reservations mark-seen failed:', resp.status, body);
        return;
      }
      await loadReservationUnreadTotal();
    } catch (err) {
      console.error(err);
    }
  };


  const loadTrustBoxUnreadTotal = async () => {
    try {
      if (!user?.id) return;
      const resp = await fetchWithToken(`${API_BASE}/api/trust-box/unseen-count`, token);
      if (!resp.ok) {
        let body = null;
        try {
          body = await resp.json();
        } catch {
          // ignore
        }
        console.warn('TrustBox unseen-count failed:', resp.status, body);
        return;
      }
      const data = await resp.json();
      setTrustBoxUnreadTotal(Number(data?.count) || 0);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    if (!user?.id) return;
    loadChatUnreadTotal();
    loadReservationUnreadTotal();
    loadTrustBoxUnreadTotal();
    const chatInterval = setInterval(loadChatUnreadTotal, 3000);
    const resInterval = setInterval(loadReservationUnreadTotal, 50000);
    const trustInterval = setInterval(loadTrustBoxUnreadTotal, 50000);
    return () => {
      clearInterval(chatInterval);
      clearInterval(resInterval);
      clearInterval(trustInterval);
    };
  }, [user?.id]);

  // Reservations: option A — opening the tab marks all as seen.
  // TrustBox: stays per-item (no auto mark on tab open).
  useEffect(() => {
    if (activeTab === 'reservations') {
      markReservationsSeen();
    }
  }, [activeTab]);

  return (
    <div className="admin-dashboard-container">
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        user={user}
        chatUnreadTotal={chatUnreadTotal}
        reservationUnreadTotal={reservationUnreadTotal}
        trustBoxUnreadTotal={trustBoxUnreadTotal}
      />

      <div className="admin-content admin-content-offset">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'reservations' && <AdminReservations />}
        {activeTab === 'slots' && <AdminSlots />}
        {activeTab === 'trust' && <AdminTrustBox onSeenChange={loadTrustBoxUnreadTotal} />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'preview' && <AdminPreview />}
        {activeTab === 'chat' && <PsychologChat />}

        <PsychologChatFloating />
      </div>
    </div>
  );
};

export default Admin;

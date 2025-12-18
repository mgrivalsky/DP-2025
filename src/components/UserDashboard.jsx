import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

export const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Užívateľské rozhranie</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Odhlásiť sa</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Vitajte, {user?.name}!</h2>
          <p>Toto je vaše užívateľské rozhranie.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📅 Rezervácie</h3>
            <p>Rezervujte si termín s psychológom</p>
            <button onClick={() => navigate('/reservations')} className="card-btn">
              Prejsť na rezervácie
            </button>
          </div>

          <div className="dashboard-card">
            <h3>💬 Rýchla pomoc</h3>
            <p>Chatbot pre rýchle otázky</p>
            <button onClick={() => navigate('/quick-help')} className="card-btn">
              Spustiť chat
            </button>
          </div>

          <div className="dashboard-card">
            <h3>🧠 Expert systém</h3>
            <p>Diagnostický nástroj</p>
            <button onClick={() => navigate('/expert')} className="card-btn">
              Otvoriť expert systém
            </button>
          </div>

          <div className="dashboard-card">
            <h3>📰 Aktuality</h3>
            <p>Novinky a oznamy</p>
            <button onClick={() => navigate('/news')} className="card-btn">
              Zobraziť aktuality
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>ℹ️ Informácie o účte</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rola:</strong> {user?.role === 'user' ? 'Užívateľ' : user?.role}</p>
        </div>
      </div>
    </div>
  );
};

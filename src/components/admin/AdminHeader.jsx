import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const AdminHeader = ({ 
  activeTab, 
  setActiveTab, 
  handleLogout, 
  user, 
  chatUnreadTotal, 
  reservationUnreadTotal,
  trustBoxUnreadTotal
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
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
            className="navbar-brand admin-brand-link"
            onClick={() => setActiveTab('overview')}
            aria-label="Prehľad"
          >
            🧑‍⚕️ Admin Panel
          </a>
        </div>

        <div className="collapse navbar-collapse" id="bs-admin-navbar-collapse">
          <ul className="nav navbar-nav navbar-right dp-navbar-right">
            <li>
              <a 
                onClick={() => setActiveTab('overview')} 
                className={activeTab === 'overview' ? 'page-scroll active admin-nav-link' : 'page-scroll admin-nav-link'}
              >
                Prehľad
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('reservations')} 
                className={activeTab === 'reservations' ? 'page-scroll active admin-nav-link admin-nav-link-badge' : 'page-scroll admin-nav-link admin-nav-link-badge'}
              >
                Rezervácie
                {reservationUnreadTotal > 0 && (
                  <span className="admin-nav-unread-badge">
                    {reservationUnreadTotal}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('slots')} 
                className={activeTab === 'slots' ? 'page-scroll active admin-nav-link' : 'page-scroll admin-nav-link'}
              >
                Dostupné termíny
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('trust')} 
                className={activeTab === 'trust' ? 'page-scroll active admin-nav-link admin-nav-link-badge' : 'page-scroll admin-nav-link admin-nav-link-badge'}
              >
                Schránka dôvery
                {trustBoxUnreadTotal > 0 && (
                  <span className="admin-nav-unread-badge">
                    {trustBoxUnreadTotal}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('chat')} 
                className={activeTab === 'chat' ? 'page-scroll active admin-nav-link admin-nav-link-badge' : 'page-scroll admin-nav-link admin-nav-link-badge'}
              >
                Chaty
                {chatUnreadTotal > 0 && (
                  <span className="admin-nav-unread-badge">
                    {chatUnreadTotal}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('reports')} 
                className={activeTab === 'reports' ? 'page-scroll active admin-nav-link' : 'page-scroll admin-nav-link'}
              >
                Reporty
              </a>
            </li>
            <li>
              <a 
                onClick={() => setActiveTab('preview')} 
                className={activeTab === 'preview' ? 'page-scroll active admin-nav-link' : 'page-scroll admin-nav-link'}
              >
                Náhľad
              </a>
            </li>
            <li>
              <a onClick={handleLogout} className="page-scroll logout-link admin-nav-link">
                Odhlásiť sa
              </a>
            </li>
            <li>
              <span className="user-name admin-user-name">👤 {user?.name}</span>
            </li>
            <li className="dp-navbar-theme-toggle">
              <button
                type="button"
                className="theme-toggle-btn theme-toggle-btn--nav"
                onClick={toggleTheme}
                aria-label={isDark ? "Prepnúť na svetlý režim" : "Prepnúť na tmavý režim"}
                title={isDark ? "Svetlý režim" : "Tmavý režim"}
              >
                <i className={`fa ${isDark ? "fa-sun-o" : "fa-moon-o"}`} aria-hidden="true" />
                <span className="sr-only">{isDark ? "Svetlý režim" : "Tmavý režim"}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LoginPage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function LoginPage() {
  const [error, setError] = useState('');

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    setError('');
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-box">
          <h2>Prihlásenie</h2>
          
          {error && <div className="error-message">{error}</div>}

          <div className="login-info">
            <div className="login-info__title">Bezpečné prihlásenie cez Google</div>
            <div className="login-info__text">
              Overenie prebieha priamo cez Google a aplikácia neukladá vaše heslo.
            </div>
            <div className="login-info__note">
              Prístup je určený pre používateľov Strednej priemyselnej školy v Košiciach.
            </div>
          </div>

          <div className="login-actions">
            <button className="btn-google" onClick={handleGoogleLogin}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" fill="#4285F4"/>
                <path d="M13.46 15.13c-.83.69-2.05 1.23-3.46 1.23-2.64 0-4.84-1.74-5.64-4.05H1.07v2.52C2.72 19.17 6.17 20 10 20c2.7 0 4.96-.89 6.62-2.64l-3.16-2.23z" fill="#34A853"/>
                <path d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.25-2.52c-.2-.62-.32-1.28-.32-1.97z" fill="#FBBC05"/>
                <path d="M10 3.88c1.88 0 3.13.98 3.77 1.8l2.75-2.74C14.96 1.08 12.7 0 10 0 6.17 0 2.72.83 1.07 2.49l3.25 2.52c.8-2.31 3-4.13 5.68-4.13z" fill="#EA4335"/>
              </svg>
              <span>Prihlásiť sa cez Google</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <Link to="/" className="back-to-home">
            ← Späť na hlavnú stránku
          </Link>
        </div>
      </div>
    </div>
  );
}

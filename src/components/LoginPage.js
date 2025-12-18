import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      
      // Presmerovanie podľa role
      if (user.role === 'admin' || user.role === 'psycholog') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Nesprávne prihlasovacie údaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button onClick={() => navigate('/')} className="back-to-home">
        ← Späť na hlavnú stránku
      </button>
      <div className="login-box">
        <h2>Prihlásenie</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={loading}
          />
          
          <label>Heslo</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={loading}
          />
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
          </button>
        </form>

        <div className="divider">alebo</div>

        <button className="btn-google" onClick={(e) => e.preventDefault()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" fill="#4285F4"/>
            <path d="M13.46 15.13c-.83.69-2.05 1.23-3.46 1.23-2.64 0-4.84-1.74-5.64-4.05H1.07v2.52C2.72 19.17 6.17 20 10 20c2.7 0 4.96-.89 6.62-2.64l-3.16-2.23z" fill="#34A853"/>
            <path d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.25-2.52c-.2-.62-.32-1.28-.32-1.97z" fill="#FBBC05"/>
            <path d="M10 3.88c1.88 0 3.13.98 3.77 1.8l2.75-2.74C14.96 1.08 12.7 0 10 0 6.17 0 2.72.83 1.07 2.49l3.25 2.52c.8-2.31 3-4.13 5.68-4.13z" fill="#EA4335"/>
          </svg>
          <span>Prihlásiť sa cez Google</span>
        </button>

        <div className="test-credentials">
          <p><strong>Testovacie účty:</strong></p>
          <p>Psycholog: psycholog@skolka.sk / admin123</p>
          <p>Učiteľ: ucitel@skolka.sk / user123</p>
          <p>Učiteľka: ucitelka@skolka.sk / user123</p>
          <p>Študent: ziak@skolka.sk / user123</p>
          <p>Študent 2: student2@skolka.sk / user123</p>
        </div>
      </div>
    </div>
  );
}

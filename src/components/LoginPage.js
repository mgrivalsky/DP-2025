import React from 'react';
import { useNavigate } from 'react-router-dom'; // import navigácie
import './LoginPage.css';
import googleLogo from './google-logo.svg';

export default function LoginPage() {
  const navigate = useNavigate(); // získaj funkciu na presmerovanie

  const handleGoogleLogin = () => {
    navigate('/home');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Prihlásenie</h2>
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input type="email" required />
          <label>Heslo</label>
          <input type="password" required />
          <button type="submit" className="btn-primary">Prihlásiť sa</button>
        </form>

        <div className="divider">alebo</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <img src={googleLogo} alt="Google logo" className="google-logo" />
          <span>Prihlásiť sa cez Google</span>
        </button>
      </div>
    </div>
  );
}

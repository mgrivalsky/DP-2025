import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      setError('Chýba token z Google prihlásenia.');
      return;
    }

    (async () => {
      try {
        const user = await completeOAuthLogin(token);
        const role = String(user?.role || '').toLowerCase();
        navigate(role === 'admin' || role === 'psycholog' ? '/admin' : '/home', { replace: true });
      } catch (e) {
        setError(e?.message || 'Nepodarilo sa dokončiť prihlásenie.');
      }
    })();
  }, [params, completeOAuthLogin, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <h2>Dokončujem prihlásenie…</h2>
        {error ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#2a0b0b', color: 'white' }}>
            {error}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => navigate('/login')} style={{ padding: '10px 14px', cursor: 'pointer' }}>
                Späť na prihlásenie
              </button>
            </div>
          </div>
        ) : (
          <p>Prosím počkaj, načítavam profil.</p>
        )}
      </div>
    </div>
  );
}

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Backend API base URL
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minút v milisekundách

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [confirmedSessionsCount, setConfirmedSessionsCount] = useState(0);

  // Načítanie užívateľa z localStorage pri načítaní
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedLastActivity = localStorage.getItem('lastActivity');
    
    if (savedUser && savedToken && savedLastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(savedLastActivity);
      
      // Ak prešlo viac ako 5 minút, odhlásiť
      if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        setLastActivity(Date.now());

        // Načítať počet potvrdených sedení 1x po obnovení relácie (užívateľ)
        try {
          const role = String(parsedUser?.role || '').toLowerCase();
          if (role !== 'psycholog' && role !== 'admin' && parsedUser?.id) {
            fetch(`${API_BASE}/api/reservations/user/${parsedUser.id}/confirmed-count`, {
              headers: { Authorization: `Bearer ${savedToken}`, Accept: 'application/json' }
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (d) setConfirmedSessionsCount(Number(d?.count) || 0);
              })
              .catch(() => {});
          }
        } catch {
          // ignore
        }
      } else {
        // Vypršal čas, vyčistiť
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('lastActivity');
      }
    }
    setLoading(false);
  }, []);

  // Funkcia na resetovanie timeout-u pri aktivite
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    if (user && token) {
      localStorage.setItem('lastActivity', now.toString());
    }
  }, [user, token]);

  // Sledovanie aktivity užívateľa
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Pridať event listenery
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      // Odstrániť event listenery
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetInactivityTimer]);

  // Kontrola nečinnosti každých 10 sekúnd
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        // Automatické odhlásenie
        logout();
        alert('Boli ste odhlásení z důvodu nečinnosti (5 minút).');
      }
    }, 10000); // Kontrola každých 10 sekúnd

    return () => clearInterval(interval);
  }, [user, lastActivity]);

  // Prihlásenie cez backend API (vracia JWT token)
  const login = async (email, password) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Nesprávne prihlasovacie údaje');
      }

      const userPayload = data.user;
      const tokenPayload = data.token;

      if (!userPayload || !tokenPayload) {
        console.error('Login error - missing data:', { user: userPayload, token: tokenPayload });
        throw new Error('Neplatná odpoveď zo servera');
      }

      // Uložiť užívateľa a token
      setUser(userPayload);
      setToken(tokenPayload);
      setConfirmedSessionsCount(0);
      const now = Date.now();
      setLastActivity(now);
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('token', tokenPayload);
      localStorage.setItem('lastActivity', now.toString());

      // Načítať počet potvrdených sedení 1x (užívateľ)
      try {
        const role = String(userPayload?.role || '').toLowerCase();
        if (role !== 'psycholog' && role !== 'admin' && userPayload?.id) {
          const countResp = await fetch(`${API_BASE}/api/reservations/user/${userPayload.id}/confirmed-count`, {
            headers: { Authorization: `Bearer ${tokenPayload}`, Accept: 'application/json' }
          });
          if (countResp.ok) {
            const countData = await countResp.json();
            setConfirmedSessionsCount(Number(countData?.count) || 0);
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
      return userPayload;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Odhlásenie
  const logout = () => {
    setUser(null);
    setToken(null);
    setLastActivity(Date.now());
    setConfirmedSessionsCount(0);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
  };

  // Kontrola, či užívateľ má určitú rolu
  const hasRole = (role) => {
    return user?.role === role;
  };

  const fetchWithAuth = useCallback(
    (url, options = {}) => {
      const headers = new Headers(options.headers || {});

      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);

      return fetch(url, { ...options, headers });
    },
    [token]
  );

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
    // Psycholog je na účely administrácie považovaný za admina
    isAdmin: user?.role === 'psycholog' || user?.role === 'admin',
    isUser: user && user.role !== 'psycholog',
    hasRole,
    lastActivity,
    fetchWithAuth,
    confirmedSessionsCount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook pre použitie auth contextu
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí byť použitý v rámci AuthProvider');
  }
  return context;
};

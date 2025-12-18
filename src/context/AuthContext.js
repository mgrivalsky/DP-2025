import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Backend API base URL
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minút v milisekundách

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Načítanie užívateľa z localStorage pri načítaní
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedLastActivity = localStorage.getItem('lastActivity');
    
    if (savedUser && savedLastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(savedLastActivity);
      
      // Ak prešlo viac ako 5 minút, odhlásiť
      if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
        setUser(JSON.parse(savedUser));
        setLastActivity(Date.now());
      } else {
        // Vypršal čas, vyčistiť
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
      }
    }
    setLoading(false);
  }, []);

  // Funkcia na resetovanie timeout-u pri aktivite
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    if (user) {
      localStorage.setItem('lastActivity', now.toString());
    }
  }, [user]);

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
    if (!user) return;

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

      if (!userPayload) {
        throw new Error('Neplatná odpoveď zo servera');
      }

      // Uložiť užívateľa (token už nepoužívame)
      setUser(userPayload);
      const now = Date.now();
      setLastActivity(now);
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('lastActivity', now.toString());

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
    setLastActivity(Date.now());
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  };

  // Kontrola, či užívateľ má určitú rolu
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    // Psycholog je na účely administrácie považovaný za admina
    isAdmin: user?.role === 'psycholog' || user?.role === 'admin',
    isUser: user && user.role !== 'psycholog',
    hasRole,
    lastActivity
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

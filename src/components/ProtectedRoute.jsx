import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Komponent pre ochranu ciest, ktoré vyžadujú prihlásenie
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const role = user?.role;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Načítavam...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Rola a presmerovania
  if (requiredRole === 'admin') {
    // Za admina považujeme aj psychologičku
    if (role === 'admin' || role === 'psycholog') {
      return children;
    }
    return <Navigate to="/home" replace />;
  }

  if (requiredRole === 'user') {
    // Bežní používatelia: ucitel, student, user
    if (role === 'ucitel' || role === 'student' || role === 'user') {
      return children;
    }
    // Psycholog ide na admin, ostatní na home
    return <Navigate to={role === 'psycholog' ? '/admin' : '/home'} replace />;
  }

  return children;
};

// Komponent pre cesty, ktoré sú dostupné len pre prihlásených
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const role = user?.role;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Načítavam...
      </div>
    );
  }

  // Ak je užívateľ prihlásený, presmerovať ho na domovskú stránku
  if (isAuthenticated) {
    return <Navigate to={role === 'admin' || role === 'psycholog' ? '/admin' : '/home'} replace />;
  }

  return children;
};

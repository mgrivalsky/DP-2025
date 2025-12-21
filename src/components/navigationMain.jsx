import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const NavigationMain = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSectionClick = (id) => (e) => {
    e.preventDefault();
    if (location.pathname !== "/home") {
      navigate(`/home#${id}`);
      setTimeout(() => scrollToId(id), 100);
    } else {
      scrollToId(id);
      window.history.replaceState(null, "", `/home#${id}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <a className="navbar-brand page-scroll" href="#page-top" style={{whiteSpace: 'nowrap'}}>
            E-psycholog
          </a>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="/home#news" onClick={handleSectionClick("news")} className="page-scroll">
                Čo je nové
              </a>
            </li>
            <li>
              <a href="/home#testimonials2" onClick={handleSectionClick("testimonials2")} className="page-scroll">
                Schránka dôvery
              </a>
            </li>
            <li>
              <a href="/home#quickhelp" onClick={handleSectionClick("quickhelp")} className="page-scroll">
                Rýchla pomoc
              </a>
            </li>
            <li>
              <a href="/home#ReservationSystem" onClick={handleSectionClick("ReservationSystem")} className="page-scroll">
                Rezervácia sedení
              </a>
            </li>
            <li>
              <a href="/home#expert" onClick={handleSectionClick("expert")} className="page-scroll">
                Expertný systém
              </a>
            </li>
            <li>
              <a href="/home#contact" onClick={handleSectionClick("contact")} className="page-scroll">
                Kontakt
              </a>
            </li>
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin" className="page-scroll">
                  Admin Panel
                </Link>
              </li>
            )}
            <li>
              <a onClick={handleLogout} className="page-scroll logout-link" style={{cursor: 'pointer'}}>
                Odhlásiť sa
              </a>
            </li>
            <li>
              <Link
                to="/history"
                className="page-scroll"
                style={{
                  position: 'relative',
                  top: '0px',
                  color: '#fff',
                  background: '#608dfd',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                onFocus={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                👤 {user?.name}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

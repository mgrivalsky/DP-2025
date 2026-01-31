import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const NavigationMain = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const chatsRes = await fetch(`${API_BASE}/api/chat/user/${user.id}`);
      if (!chatsRes.ok) throw new Error("Failed to load chats");
      const chats = await chatsRes.json();

      const counts = await Promise.all(
        (chats || []).map(async (chat) => {
          try {
            const res = await fetch(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
            if (!res.ok) return 0;
            const messages = await res.json();
            return (messages || []).filter(
              (msg) => !msg.videne && msg.odesilatel_typ === "psycholog"
            ).length;
          } catch (err) {
            return 0;
          }
        })
      );

      const total = counts.reduce((sum, count) => sum + count, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSectionClick = (id) => async (e) => {
    e.preventDefault();
    if (id === "quickhelp" && user?.id) {
      try {
        await fetch(`${API_BASE}/api/chat/user/${user.id}/mark-seen-psycholog`, {
          method: "PUT"
        });
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    }
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
              <a href="/home#quickhelp" onClick={handleSectionClick("quickhelp")} className="page-scroll" style={{ position: 'relative', display: 'inline-block', paddingRight: '18px' }}>
                Rýchla pomoc
                {unreadCount > 0 && (
                  <span className="chat-unread-badge" style={{ position: 'absolute', top: '-6px', right: '0px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
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
            {/* <li>
              <a href="/home#contact" onClick={handleSectionClick("contact")} className="page-scroll">
                Kontakt
              </a>
            </li> */}
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

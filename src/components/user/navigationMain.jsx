import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const NavigationMain = () => {
  const { logout, user, fetchWithAuth, confirmedSessionsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [trustUnreadCount, setTrustUnreadCount] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const trustReqSeq = useRef(0);
  const chatReqSeq = useRef(0);
  const scrollSpyRaf = useRef(null);

  const homeSectionIds = useRef([
    "news",
    "usertrustbox",
    "quickhelp",
    "ReservationSystem",
    "expert",
  ]);

  useEffect(() => {
    if (location.pathname !== "/home") {
      setActiveSection(null);
      return;
    }

    const syncFromHash = () => {
      const hash = String(window.location.hash || "").replace(/^#/, "");
      if (hash && homeSectionIds.current.includes(hash)) {
        setActiveSection(hash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/home") return;

    const computeActive = () => {
      const menuEl = document.getElementById("menu");
      const headerOffset = (menuEl?.getBoundingClientRect?.().height || 0) + 12;

      let current = null;
      let bestTop = -Infinity;

      for (const id of homeSectionIds.current) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        // Prefer the section crossing the probe line under the navbar.
        if (rect.top <= headerOffset && rect.bottom > headerOffset) {
          current = id;
          break;
        }

        // Otherwise, track the nearest section above the probe line.
        if (rect.top <= headerOffset && rect.top > bestTop) {
          bestTop = rect.top;
          current = id;
        }
      }

      if (!current) {
        // If we're above the first section, highlight the first one.
        const first = homeSectionIds.current[0];
        if (first && document.getElementById(first)) current = first;
      }

      setActiveSection((prev) => (prev === current ? prev : current));
    };

    const schedule = () => {
      if (scrollSpyRaf.current != null) return;
      scrollSpyRaf.current = window.requestAnimationFrame(() => {
        scrollSpyRaf.current = null;
        computeActive();
      });
    };

    computeActive();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Some layouts scroll on body; scroll doesn't bubble, so capture on document too.
    document.addEventListener("scroll", schedule, { passive: true, capture: true });
    document.body?.addEventListener?.("scroll", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("scroll", schedule, { capture: true });
      document.body?.removeEventListener?.("scroll", schedule);

      if (scrollSpyRaf.current != null) {
        window.cancelAnimationFrame(scrollSpyRaf.current);
        scrollSpyRaf.current = null;
      }
    };
  }, [location.pathname]);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    if (String(user?.role || '').toLowerCase() === 'psycholog' || String(user?.role || '').toLowerCase() === 'admin') return;

    const seq = ++chatReqSeq.current;

    try {
      const chatsRes = await fetchWithAuth(`${API_BASE}/api/chat/user/${user.id}`);
      if (!chatsRes.ok) throw new Error("Failed to load chats");
      const chats = await chatsRes.json();

      const counts = await Promise.all(
        (chats || []).map(async (chat) => {
          try {
            const res = await fetchWithAuth(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
            if (!res.ok) return 0;
            const messages = await res.json();
            return (messages || []).filter(
              (msg) => !msg.videne && msg.odesilatel_typ === "psycholog"
            ).length;
          } catch (_err) {
            return 0;
          }
        })
      );

      if (seq !== chatReqSeq.current) return;
      const total = counts.reduce((sum, count) => sum + count, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id, user?.role, fetchWithAuth]);

  useEffect(() => {
    if (!user?.id) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user?.id, loadUnreadCount]);

  const loadTrustUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    if (String(user?.role || '').toLowerCase() === 'psycholog' || String(user?.role || '').toLowerCase() === 'admin') return;

    const seq = ++trustReqSeq.current;

    try {
      const res = await fetchWithAuth(`${API_BASE}/api/trust-box/user/${user.id}/unseen-count`);
      if (!res.ok) return;
      const data = await res.json();
      if (seq !== trustReqSeq.current) return;
      setTrustUnreadCount(Number(data?.count) || 0);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id, user?.role, fetchWithAuth]);

  useEffect(() => {
    if (!user?.id) return;
    loadTrustUnreadCount();
    const interval = setInterval(loadTrustUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user?.id, loadTrustUnreadCount]);

  useEffect(() => {
    const handler = () => {
      loadTrustUnreadCount();
    };
    window.addEventListener("trustbox:refresh-unseen", handler);
    return () => window.removeEventListener("trustbox:refresh-unseen", handler);
  }, [loadTrustUnreadCount]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSectionClick = (id) => async (e) => {
    e.preventDefault();

    setActiveSection(id);

    if (id === "quickhelp" && user?.id && String(user?.role || '').toLowerCase() !== 'psycholog' && String(user?.role || '').toLowerCase() !== 'admin') {
      try {
        await fetchWithAuth(`${API_BASE}/api/chat/user/${user.id}/mark-seen-psycholog`, { method: "PUT" });
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

  const scrollToTop = () => {
    const scrollEl = document.scrollingElement || document.documentElement;
    try {
      scrollEl.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (_err) {
      scrollEl.scrollTop = 0;
      scrollEl.scrollLeft = 0;
    }

    try {
      document.body?.scrollTo?.({ top: 0, left: 0, behavior: "smooth" });
    } catch (_err) {
      if (document.body) document.body.scrollTop = 0;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleTopClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveSection(null);

    if (location.pathname !== "/home") {
      navigate("/home");
      setTimeout(scrollToTop, 50);
      return;
    }

    scrollToTop();
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
          <a
            className="navbar-brand page-scroll navbar-brand--nowrap"
            href="/home"
            onClick={handleTopClick}
            data-scroll-ignore="true"
          >
            E-psycholog
          </a>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li className={activeSection === "news" ? "active" : ""}>
              <a href="/home#news" onClick={handleSectionClick("news")} className="page-scroll">
                Čo je nové
              </a>
            </li>
            <li className={activeSection === "usertrustbox" ? "active" : ""}>
              <a href="/home#usertrustbox" onClick={handleSectionClick("usertrustbox")} className="page-scroll">
                Schránka dôvery
              </a>
            </li>
            <li className={activeSection === "quickhelp" ? "active" : ""}>
              <a href="/home#quickhelp" onClick={handleSectionClick("quickhelp")} className="page-scroll nav-quickhelp-link">
                Rýchla pomoc
                {unreadCount > 0 && (
                  <span className="nav-unread-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
            </li>
            <li className={activeSection === "ReservationSystem" ? "active" : ""}>
              <a href="/home#ReservationSystem" onClick={handleSectionClick("ReservationSystem")} className="page-scroll">
                Rezervácia sedení
              </a>
            </li>
            <li className={activeSection === "expert" ? "active" : ""}>
              <a href="/home#expert" onClick={handleSectionClick("expert")} className="page-scroll">
                Expertný systém
              </a>
            </li>
            <li>
              <a onClick={handleLogout} className="page-scroll logout-link">
                Odhlásiť sa
              </a>
            </li>
            <li>
              <Link
                to="/history"
                className="page-scroll nav-user-pill"
              >
                👤 {user?.name}
                {(() => {
                  const isNonAdmin = String(user?.role || '').toLowerCase() !== 'psycholog' && String(user?.role || '').toLowerCase() !== 'admin';
                  const trust = trustUnreadCount == null ? null : (Number(trustUnreadCount) || 0);
                  const total = (Number(confirmedSessionsCount) || 0) + (trust ?? 0);
                  if (!isNonAdmin || trust == null || total <= 0) return null;
                  return (
                  <span
                    title="Notifikácie (potvrdené sedenia + nové odpovede)"
                    className="nav-user-pill-badge"
                  >
                    {total > 99 ? '99+' : total}
                  </span>
                  );
                })()}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

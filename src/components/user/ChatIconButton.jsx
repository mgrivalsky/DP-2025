import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../utils/socket";
import "../styles/QuickHelp.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const ChatIconButton = () => {
  const { user, token, fetchWithAuth } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshTimerRef = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    if (String(user?.role || '').toLowerCase() === 'psycholog' || String(user?.role || '').toLowerCase() === 'admin') return;
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/chat/user/${user.id}/unread-count`);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return;
      setUnreadCount(Number(data?.count) || 0);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id, user?.role, fetchWithAuth]);

  useEffect(() => {
    if (!user?.id) return;
    loadUnreadCount();
  }, [user?.id, loadUnreadCount]);

  // Socket-driven unread refresh (no polling)
  useEffect(() => {
    if (!token || !user?.id) return;
    if (String(user?.role || '').toLowerCase() === 'psycholog' || String(user?.role || '').toLowerCase() === 'admin') return;

    const sock = getSocket(token);
    if (!sock) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) return;
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        loadUnreadCount();
      }, 200);
    };

    const onMessage = (payload) => {
      const sender = String(payload?.odesilatel_typ || '').toLowerCase();
      if (sender === 'psycholog') scheduleRefresh();
    };
    const onChatUpdated = () => scheduleRefresh();
    const onConnect = () => scheduleRefresh();

    sock.on('message', onMessage);
    sock.on('chatUpdated', onChatUpdated);
    sock.on('connect', onConnect);
    return () => {
      sock.off('message', onMessage);
      sock.off('chatUpdated', onChatUpdated);
      sock.off('connect', onConnect);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [token, user?.id, user?.role, loadUnreadCount]);
  const handleScroll = async () => {
    if (user?.id) {
      try {
        await fetchWithAuth(`${API_BASE}/api/chat/user/${user.id}/mark-seen-psycholog`, { method: "PUT" });
        setUnreadCount(0);
        loadUnreadCount();
      } catch (err) {
        console.error(err);
      }
    }
    const target =
      document.getElementById("quickhelp") ||
      document.querySelector("#quickhelp") ||
      document.getElementById("QuickHelp") ||
      document.querySelector("#QuickHelp");
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}#quickhelp`);
  };

  return (
    <button
      className="chat-icon-btn"
      title="Napísať psychologovi"
      onClick={handleScroll}
    >
      <MessageCircle size={28} />
      {unreadCount > 0 && (
        <span className="chat-unread-badge">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatIconButton;

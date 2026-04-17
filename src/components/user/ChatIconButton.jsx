import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../styles/QuickHelp.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const POLL_INTERVAL = 3000;


const ChatIconButton = () => {
  const { user, fetchWithAuth } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    if (String(user?.role || '').toLowerCase() === 'psycholog' || String(user?.role || '').toLowerCase() === 'admin') return;
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
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user?.id, fetchWithAuth]);
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

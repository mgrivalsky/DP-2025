import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './PsychologChatFloating.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const POLL_INTERVAL = 2000;

const PsychologChatFloating = () => {
<<<<<<< HEAD
  const { user, fetchWithAuth } = useAuth();
=======
  const { user } = useAuth();
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const loadChats = async () => {
    if (!user?.id) return;
    try {
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/psycholog/${user.id}`);
=======
      const response = await fetch(`${API_BASE}/api/chat/psycholog/${user.id}`);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      setChats(data || []);
      if (data && data.length > 0) {
        setSelectedChat((prev) => prev || data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Chyba pri načítaní chatov');
    }
  };

  const loadMessages = async (chatIdOverride) => {
    const chatIdToLoad = chatIdOverride || selectedChat?.id_chatu;
    if (!chatIdToLoad) return;
    try {
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${chatIdToLoad}/messages`);
=======
      const response = await fetch(`${API_BASE}/api/chat/${chatIdToLoad}/messages`);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data || []);

      // No seen tracking
    } catch (err) {
      console.error(err);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
<<<<<<< HEAD
      const chatsRes = await fetchWithAuth(`${API_BASE}/api/chat/psycholog/${user.id}`);
=======
      const chatsRes = await fetch(`${API_BASE}/api/chat/psycholog/${user.id}`);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
      if (!chatsRes.ok) throw new Error('Failed to load chats');
      const chatList = await chatsRes.json();

      const counts = await Promise.all(
        (chatList || []).map(async (chat) => {
          try {
<<<<<<< HEAD
            const res = await fetchWithAuth(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
=======
            const res = await fetch(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
            if (!res.ok) return 0;
            const messagesData = await res.json();
            return (messagesData || []).filter(
              (msg) => !msg.videne && msg.odesilatel_typ === 'uzivatel'
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
    if (!user?.id || !isOpen) return;
    loadChats();
    const interval = setInterval(loadChats, POLL_INTERVAL);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [user?.id, isOpen, fetchWithAuth]);
=======
  }, [user?.id, isOpen]);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1

  useEffect(() => {
    if (!user?.id) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 3000);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [user?.id, fetchWithAuth]);
=======
  }, [user?.id]);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1

  useEffect(() => {
    if (!isOpen || !selectedChat?.id_chatu) return;
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [isOpen, selectedChat?.id_chatu, fetchWithAuth]);
=======
  }, [isOpen, selectedChat?.id_chatu]);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1

  useEffect(() => {
    if (messagesRef.current && messages.length > lastMessageCountRef.current) {
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      }, 50);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    lastMessageCountRef.current = 0;
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 50);
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat?.id_chatu) return;

    const msgToSend = messageText;
    setMessageText('');

    try {
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/message`, {
        method: 'POST',
        body: JSON.stringify({
          obsah: msgToSend
=======
      const response = await fetch(`${API_BASE}/api/chat/${selectedChat.id_chatu}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obsah: msgToSend,
          odesilatel_typ: 'psycholog'
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      const message = await response.json();
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      console.error(err);
      setError('Chyba pri odoslaní správy');
      setMessageText(msgToSend);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        className="psycholog-chat-icon-btn"
        title={isOpen ? 'Zavrieť chat' : 'Napísať užívateľovi'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="chat-unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="psycholog-floating-window">
          <div className="pfw-header">
            <div>
              <strong>Chaty s užívateľmi</strong>
              {selectedChat && (
                <div className="pfw-subtitle">
                  {selectedChat.uzivatel_meno} {selectedChat.uzivatel_priezvisko}
                </div>
              )}
            </div>
            <button className="pfw-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {error && <div className="pfw-error">{error}</div>}

          <div className="pfw-select-row">
            <label htmlFor="pfw-select">Vyber chat:</label>
            <select
              id="pfw-select"
              value={selectedChat?.id_chatu || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = chats.find((c) => c.id_chatu === id);
                setSelectedChat(found || null);
                if (found?.id_chatu) {
                  loadMessages(found.id_chatu);
                }
              }}
            >
              <option value="" disabled>Vyber chat</option>
              {chats.map((chat) => (
                <option key={chat.id_chatu} value={chat.id_chatu}>
                  {chat.uzivatel_meno} {chat.uzivatel_priezvisko}
                </option>
              ))}
            </select>
          </div>

          {selectedChat ? (
            <>
              <div className="pfw-messages" ref={messagesRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`pfw-message ${msg.odesilatel_typ === 'uzivatel' ? 'user' : 'psycholog'}`}
                  >
                    <div className="pfw-message-content">{msg.obsah}</div>
                    <small className="pfw-message-time">
                      {new Date(msg.cas_odoslania).toLocaleTimeString('sk-SK', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                ))}
              </div>

              <form className="pfw-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Napíš odpoveď..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button type="submit" disabled={!messageText.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="pfw-empty">Vyber chat zo zoznamu.</div>
          )}
        </div>
      )}
    </>
  );
};

export default PsychologChatFloating;

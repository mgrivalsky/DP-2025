import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../styles/PsychologChat.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const POLL_INTERVAL = 2000;

export const PsychologChat = () => {
  const { user, fetchWithAuth } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef(null);
  const lastMessageLengthRef = useRef(0);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setChats((prev) =>
      prev.map((item) =>
        item.id_chatu === chat.id_chatu ? { ...item, unread_count: 0 } : item
      )
    );

    try {
      await fetchWithAuth(`${API_BASE}/api/chat/${chat.id_chatu}/mark-seen-user`, { method: 'PUT' });
      loadChats();
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-scroll to latest message only when new message arrives
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > lastMessageLengthRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
    lastMessageLengthRef.current = messages.length;
  }, [messages.length]);

  // Load chats for psychologist
  useEffect(() => {
    if (!user?.id) return;
    loadChats();
    const interval = setInterval(loadChats, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user?.id, fetchWithAuth]);

  const loadChats = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/chat/psycholog/${user.id}`);
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      const chatsData = data || [];
      const hasUnreadCount = chatsData.every((chat) => typeof chat.unread_count !== 'undefined');

      if (!hasUnreadCount && chatsData.length > 0) {
        const counts = await Promise.all(
          chatsData.map(async (chat) => {
            try {
              const resp = await fetchWithAuth(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
              if (!resp.ok) return 0;
              const msgs = await resp.json();
              return (msgs || []).filter(
                (msg) => !msg.videne && msg.odesilatel_typ === 'uzivatel'
              ).length;
            } catch {
              return 0;
            }
          })
        );

        setChats(chatsData.map((chat, idx) => ({
          ...chat,
          unread_count: counts[idx]
        })));
      } else {
        setChats(chatsData);
      }
    } catch (err) {
      console.error(err);
      setError('Chyba pri načítaní chatov');
    }
  };

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat?.id_chatu) return;

    const loadMessages = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/messages`);
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data || []);

        // No seen tracking
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedChat?.id_chatu, fetchWithAuth]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat?.id_chatu) return;

    try {
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/message`, {
        method: 'POST',
        body: JSON.stringify({ obsah: messageText })
      });
      if (!response.ok) throw new Error('Failed to send message');
      const message = await response.json();
      setMessages([...messages, message]);
      setMessageText('');
    } catch (err) {
      console.error(err);
      setError('Chyba pri odoslaní správy');
    }
  };

  if (!user) return null;

  return (
    <div className="admin-section full-width psycholog-chat-container">
      <h2>💬 Chaty s užívateľmi</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="psycholog-chat-main">
        <div className="psycholog-chats-list">
          {chats.length === 0 ? (
            <p className="no-chats">Nemáš žiadne chaty.</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id_chatu}
                className={`psycholog-chat-item ${
                  selectedChat?.id_chatu === chat.id_chatu ? 'active' : ''
                }`}
                onClick={() => handleSelectChat(chat)}
              >
                <div>
                  <strong>
                    {chat.uzivatel_meno} {chat.uzivatel_priezvisko}
                  </strong>
                  <div className="psycholog-chat-email">
                    {chat.uzivatel_email}
                  </div>
                </div>
                <div className="psycholog-chat-meta">
                  {chat.posledna_zprava && (
                    <>
                      <small className="psycholog-chat-date">
                        {new Date(chat.posledna_zprava).toLocaleDateString('sk-SK')}
                      </small>
                      <small className="psycholog-chat-time">
                        {new Date(chat.posledna_zprava).toLocaleTimeString('sk-SK', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </>
                  )}
                  {Number(chat.unread_count) > 0 && (
                    <span className="psycholog-unread-badge">{chat.unread_count}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="psycholog-chat-content">
          {selectedChat ? (
            <>
              <div className="psycholog-chat-header">
                <h3>
                  {selectedChat.uzivatel_meno} {selectedChat.uzivatel_priezvisko}
                </h3>
                <small>{selectedChat.uzivatel_email}</small>
              </div>

              <div className="psycholog-messages" ref={messagesContainerRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`psycholog-message ${
                      msg.odesilatel_typ === 'uzivatel' ? 'user' : 'psycholog'
                    }`}
                  >
                    <div className="psycholog-message-content">{msg.obsah}</div>
                    <small className="psycholog-message-time">
                      {new Date(msg.cas_odoslania).toLocaleTimeString('sk-SK', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                ))}
              </div>

              <form className="psycholog-message-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Napíš odpoveď..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="psycholog-message-input"
                />
                <button type="submit" className="psycholog-send-btn" disabled={!messageText.trim()}>
                  Poslať
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Vyber chat pre komunikáciu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PsychologChat;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavigationMain } from './navigationMain';
import '../styles/Chat.css';
import { getSocket } from '../../utils/socket';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const Chat = () => {
  const { user, token, fetchWithAuth } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  const lastMessageLengthRef = useRef(0);
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());

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

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (response.ok) {
          // ok
        }
      } catch (err) {
        setError('Backend servisu nie je dostupný. Skontroluj či beží server na http://localhost:5000');
      }
    };
    testConnection();
  }, []);

  // Load chats for current user
  useEffect(() => {
    if (!user?.id) return;
    setInitialLoading(true);
    loadChats().finally(() => setInitialLoading(false));
  }, [user?.id, fetchWithAuth]);

  const loadChats = async () => {
    try {
      if (!user?.id) {
        return;
      }
      const userId = parseInt(user.id);
      const response = await fetchWithAuth(`${API_BASE}/api/chat/user/${userId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load chats');
      }
      const data = await response.json();
      setChats(data || []);
      setError('');
    } catch (err) {
      setError('Chyba pri načítaní chatov: ' + err.message);
    }
  };

  // Keep ref in sync for socket handlers
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Socket.io connection + listeners (no polling)
  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    if (!sock) return;
    socketRef.current = sock;

    const onMessage = (payload) => {
      const currentChatId = selectedChatRef.current?.id_chatu;
      if (!currentChatId) return;
      if (!payload) return;
      if (Number(payload.id_chatu) !== Number(currentChatId)) return;

      const msgId = payload.id_spravy;
      if (msgId) {
        if (seenMessageIdsRef.current.has(msgId)) return;
        seenMessageIdsRef.current.add(msgId);
      }

      setMessages((prev) => [...prev, payload]);
      // Refresh sidebar timestamps (no polling)
      loadChats();
    };

    const onChatUpdated = (data) => {
      const currentChatId = selectedChatRef.current?.id_chatu;
      if (!currentChatId) return;
      if (Number(data?.chatId) !== Number(currentChatId)) return;
      loadChats();
    };

    const onPsychologStatus = (data) => {
      const psychId = Number(data?.id);
      if (!psychId) return;
      setChats((prev) =>
        (prev || []).map((c) =>
          Number(c?.id_psychologa) === psychId
            ? { ...c, psycholog_online: Boolean(data?.online) }
            : c
        )
      );
    };

    sock.on('message', onMessage);
    sock.on('chatUpdated', onChatUpdated);
    sock.on('psychologStatus', onPsychologStatus);

    return () => {
      sock.off('message', onMessage);
      sock.off('chatUpdated', onChatUpdated);
      sock.off('psychologStatus', onPsychologStatus);
    };
  }, [token]);

  // Load messages for selected chat (one-time) + join room
  useEffect(() => {
    if (!selectedChat?.id_chatu) return;

    const loadMessages = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/messages`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load messages');
        }
        const data = await response.json();
        const initial = data || [];
        const nextSet = new Set();
        for (const m of initial) {
          if (m?.id_spravy) nextSet.add(m.id_spravy);
        }
        seenMessageIdsRef.current = nextSet;
        setMessages(initial);

        // Do not mark messages as seen from user view
      } catch (err) {
      }
    };

    loadMessages();
  }, [selectedChat?.id_chatu, fetchWithAuth]);

  useEffect(() => {
    if (!selectedChat?.id_chatu) return;
    const sock = socketRef.current;
    if (!sock) return;
    sock.emit('joinChat', { chatId: selectedChat.id_chatu });
  }, [selectedChat?.id_chatu]);

  const handleStartChat = async (psychologId) => {
    try {
      setLoading(true);
      setError('');
      if (!user?.id) {
        throw new Error('Užívateľský ID nie je dostupný');
      }
      const response = await fetchWithAuth(`${API_BASE}/api/chat/create`, {
        method: 'POST',
        body: JSON.stringify({ 
          userId: parseInt(user.id), 
          psychologId: parseInt(psychologId) 
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create chat');
      }
      const chat = await response.json();
      setSelectedChat(chat);
      setMessages([]);
      // Reload chats to show the new one
      loadChats();
    } catch (err) {
      setError('Chyba pri vytváraní chatu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat?.id_chatu) return;

    const msgToSend = messageText;
    setMessageText('');
    setError('');

    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit('sendMessage', { chatId: selectedChat.id_chatu, obsah: msgToSend });
        return;
      }

      // Fallback to REST if socket is not connected.
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/message`, {
        method: 'POST',
        body: JSON.stringify({ obsah: msgToSend })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }
      const message = await response.json();
      if (message?.id_spravy) seenMessageIdsRef.current.add(message.id_spravy);
      setMessages((prev) => [...prev, message]);
      loadChats();
    } catch (err) {
      setError('Chyba pri odoslaní správy: ' + err.message);
      setMessageText(msgToSend);
    }
  };

  if (!user) {
    return (
      <>
        <NavigationMain />
        <div className="chat-container">
          <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
            <h2>Prihlásenie potrebné</h2>
            <p>Musíš byť prihlásený aby si mohol používať chat.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationMain />
      <div className="chat-container">
        <header className="chat-header">
          <h1>💬 Priamy chat s psychológom</h1>
          <p>Komunikujte v reálnom čase</p>
        </header>

        {error && (
          <div className="error-message">
            {error}
            <button 
              onClick={() => setError('')} 
              style={{ marginLeft: '10px', padding: '4px 8px', background: '#a02721', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕ Zavrieť
            </button>
          </div>
        )}

        <div className="chat-main">
          <div className="chat-sidebar">
            <h2>Chaty</h2>
            {initialLoading ? (
              <p className="no-chats">Načítavam...</p>
            ) : chats.length === 0 ? (
              <p className="no-chats">Nemáš žiadne chaty. Spusti nový chat!</p>
            ) : (
              <div className="chats-list">
                {chats.map((chat) => (
                  <div
                    key={chat.id_chatu}
                    className={`chat-item ${
                      selectedChat?.id_chatu === chat.id_chatu ? 'active' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="chat-item-header">
                      <strong>
                        {chat.psycholog_meno} {chat.psycholog_priezvisko}
                      </strong>
                      <small style={{ marginLeft: 8, opacity: 0.85 }}>
                        {chat.psycholog_online ? 'online' : 'offline'}
                      </small>
                    </div>
                    <small>{chat.posledna_sprava ? new Date(chat.posledna_sprava).toLocaleString('sk-SK') : 'Bez správ'}</small>
                  </div>
                ))}
              </div>
            )}
            <button
              className="new-chat-btn"
              onClick={() => handleStartChat(1)}
              disabled={loading}
            >
              {loading ? 'Vytváram chat...' : '+ Nový chat'}
            </button>
          </div>

          <div className="chat-content">
            {selectedChat ? (
              <>
                <div className="chat-messages" ref={messagesContainerRef}>
                  {messages.map((msg, idx) => (
                    <div
                      key={msg?.id_spravy || idx}
                      className={`message ${
                        msg.odesilatel_typ === 'uzivatel' ? 'user' : 'psycholog'
                      }`}
                    >
                      <div className="message-content">{msg.obsah}</div>
                      <small className="message-time">
                        {new Date(msg.cas_odoslania).toLocaleTimeString('sk-SK', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                  ))}
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Napíš správu..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="message-input"
                  />
                  <button type="submit" className="send-btn" disabled={!messageText.trim()}>
                    Odoslať
                  </button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Vyber chat alebo spusti nový</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NavigationMain } from './navigationMain';
import './Chat.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const POLL_INTERVAL = 2000; // Poll for new messages every 2 seconds

export const Chat = () => {
<<<<<<< HEAD
  const { user, fetchWithAuth } = useAuth();
=======
  const { user } = useAuth();
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  const lastMessageLengthRef = useRef(0);

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
          console.log('✅ Backend is accessible');
        }
      } catch (err) {
        console.error('❌ Backend not accessible:', err);
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
    const interval = setInterval(loadChats, POLL_INTERVAL);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [user?.id, fetchWithAuth]);
=======
  }, [user?.id]);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1

  const loadChats = async () => {
    try {
      if (!user?.id) {
        console.warn('No user ID available');
        return;
      }
      const userId = parseInt(user.id);
      console.log('Loading chats for user ID:', userId);
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/user/${userId}`);
=======
      const response = await fetch(`${API_BASE}/api/chat/user/${userId}`);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load chats');
      }
      const data = await response.json();
      setChats(data || []);
      setError('');
    } catch (err) {
      console.error('loadChats error:', err);
      setError('Chyba pri načítaní chatov: ' + err.message);
    }
  };

  // Load messages for selected chat with polling
  useEffect(() => {
    if (!selectedChat?.id_chatu) return;

    const loadMessages = async () => {
      try {
<<<<<<< HEAD
        const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/messages`);
=======
        const response = await fetch(
          `${API_BASE}/api/chat/${selectedChat.id_chatu}/messages`
        );
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load messages');
        }
        const data = await response.json();
        setMessages(data || []);

        // Do not mark messages as seen from user view
      } catch (err) {
        console.error('loadMessages error:', err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [selectedChat?.id_chatu, fetchWithAuth]);
=======
  }, [selectedChat?.id_chatu]);
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1

  const handleStartChat = async (psychologId) => {
    try {
      setLoading(true);
      setError('');
      if (!user?.id) {
        throw new Error('Užívateľský ID nie je dostupný');
      }
      console.log('Starting chat with user ID:', user.id, 'psychologId:', psychologId);
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/create`, {
        method: 'POST',
=======
      const response = await fetch(`${API_BASE}/api/chat/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
        body: JSON.stringify({ 
          userId: parseInt(user.id), 
          psychologId: parseInt(psychologId) 
        }),
      });
      console.log('Chat create response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create chat');
      }
      const chat = await response.json();
      console.log('Chat created:', chat);
      setSelectedChat(chat);
      setMessages([]);
      // Reload chats to show the new one
      loadChats();
    } catch (err) {
      console.error('handleStartChat error:', err);
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
<<<<<<< HEAD
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${selectedChat.id_chatu}/message`, {
        method: 'POST',
        body: JSON.stringify({ obsah: msgToSend })
      });
=======
      const response = await fetch(
        `${API_BASE}/api/chat/${selectedChat.id_chatu}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            obsah: msgToSend,
            odesilatel_typ: 'uzivatel',
          }),
        }
      );
>>>>>>> aca37c7c0dac3ac28dac205f0742e140ac7dc8c1
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }
      const message = await response.json();
      setMessages([...messages, message]);
    } catch (err) {
      console.error(err);
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
          <h1>💬 Priamy chat s psychologičkou</h1>
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
                    </div>
                    <small>{chat.posledna_zprava ? new Date(chat.posledna_zprava).toLocaleString('sk-SK') : 'Bez správ'}</small>
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
                      key={idx}
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

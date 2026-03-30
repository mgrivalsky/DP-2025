import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../styles/PsychologChat.css';
import { getSocket } from '../../utils/socket';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const PsychologChat = () => {
  const { user, token, fetchWithAuth } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef(null);
  const lastMessageLengthRef = useRef(0);
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const joinedChatsRef = useRef(new Set());
  const seenMessageIdsRef = useRef(new Set());

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
      window.dispatchEvent(new Event('admin:refresh-chat-unread'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

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
  }, [user?.id, fetchWithAuth]);

  // Socket.io connection + listeners (no polling)
  useEffect(() => {
    if (!token) return;

    const sock = getSocket(token);
    if (!sock) return;
    socketRef.current = sock;

    const onMessage = (payload) => {
      if (!payload) return;
      const chatId = Number(payload.id_chatu);
      if (!chatId) return;

      const msgId = payload.id_spravy;
      if (msgId) {
        if (seenMessageIdsRef.current.has(msgId)) return;
        seenMessageIdsRef.current.add(msgId);
      }

      const currentChatId = Number(selectedChatRef.current?.id_chatu);
      const isCurrent = currentChatId && chatId === currentChatId;

      if (isCurrent) {
        setMessages((prev) => [...prev, payload]);
        // If user wrote while psychologist is in the chat, mark as seen (best-effort)
        if (String(payload.odesilatel_typ || '').toLowerCase() !== 'psycholog') {
          try {
            fetchWithAuth(`${API_BASE}/api/chat/${chatId}/mark-seen-user`, { method: 'PUT' }).catch(() => {});
          } catch {
            // ignore
          }
        }
      }

      setChats((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        let changed = false;
        const next = arr.map((c) => {
          if (Number(c?.id_chatu) !== chatId) return c;
          changed = true;

          const incomingFromUser = String(payload.odesilatel_typ || '').toLowerCase() !== 'psycholog';
          const bumpUnread = !isCurrent && incomingFromUser;
          return {
            ...c,
            posledna_sprava: payload.cas_odoslania || new Date().toISOString(),
            unread_count: bumpUnread ? Number(c.unread_count || 0) + 1 : (isCurrent ? 0 : c.unread_count)
          };
        });

        if (!changed) return prev;

        // Sort by last activity (newest first)
        next.sort((a, b) => {
          const ta = a?.posledna_sprava ? new Date(a.posledna_sprava).getTime() : 0;
          const tb = b?.posledna_sprava ? new Date(b.posledna_sprava).getTime() : 0;
          return tb - ta;
        });
        return next;
      });
    };

    sock.on('message', onMessage);

    return () => {
      sock.off('message', onMessage);
    };
  }, [token, fetchWithAuth]);

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

        const computed = chatsData.map((chat, idx) => ({
          ...chat,
          unread_count: counts[idx]
        }));
        setChats(computed);

        // Join all chat rooms so psychologist receives realtime updates for every chat.
        const sock = socketRef.current;
        if (sock) {
          for (const c of computed) {
            const id = Number(c?.id_chatu);
            if (!id || joinedChatsRef.current.has(id)) continue;
            joinedChatsRef.current.add(id);
            sock.emit('joinChat', { chatId: id });
          }
        }
      } else {
        setChats(chatsData);

        // Join all chat rooms so psychologist receives realtime updates for every chat.
        const sock = socketRef.current;
        if (sock) {
          for (const c of chatsData) {
            const id = Number(c?.id_chatu);
            if (!id || joinedChatsRef.current.has(id)) continue;
            joinedChatsRef.current.add(id);
            sock.emit('joinChat', { chatId: id });
          }
        }
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
        const initial = data || [];
        const nextSet = new Set();
        for (const m of initial) {
          if (m?.id_spravy) nextSet.add(m.id_spravy);
        }
        seenMessageIdsRef.current = nextSet;
        setMessages(initial);

        // No seen tracking
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();
  }, [selectedChat?.id_chatu, fetchWithAuth]);

  // Ensure selected chat room is joined (also joined via loadChats, but safe)
  useEffect(() => {
    if (!selectedChat?.id_chatu) return;
    const sock = socketRef.current;
    if (!sock) return;
    const id = Number(selectedChat.id_chatu);
    if (!id) return;
    if (!joinedChatsRef.current.has(id)) joinedChatsRef.current.add(id);
    sock.emit('joinChat', { chatId: id });
  }, [selectedChat?.id_chatu]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat?.id_chatu) return;

    const msgToSend = messageText;
    setMessageText('');

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
      if (!response.ok) throw new Error('Failed to send message');
      const message = await response.json();
      if (message?.id_spravy) seenMessageIdsRef.current.add(message.id_spravy);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      console.error(err);
      setError('Chyba pri odoslaní správy');
      setMessageText(msgToSend);
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
                  {chat.posledna_sprava && (
                    <>
                      <small className="psycholog-chat-date">
                        {new Date(chat.posledna_sprava).toLocaleDateString('sk-SK')}
                      </small>
                      <small className="psycholog-chat-time">
                        {new Date(chat.posledna_sprava).toLocaleTimeString('sk-SK', {
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
                    key={msg?.id_spravy || idx}
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

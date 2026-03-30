import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../styles/PsychologChatFloating.css';
import '../styles/QuickHelp.css';
import { getSocket } from '../../utils/socket';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const PsychologChatFloating = () => {
  const { user, token, fetchWithAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const joinedChatsRef = useRef(new Set());
  const seenMessageIdsRef = useRef(new Set());

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const loadChats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/chat/psycholog/${user.id}`);
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      const list = data || [];
      setChats(list);

      const currentId = Number(selectedChatRef.current?.id_chatu);
      if (currentId) {
        const stillExists = list.find((c) => Number(c?.id_chatu) === currentId);
        setSelectedChat(stillExists || null);
      }

      // Join all chat rooms so psychologist receives realtime updates for every chat.
      const sock = socketRef.current;
      if (sock) {
        for (const c of list) {
          const id = Number(c?.id_chatu);
          if (!id || joinedChatsRef.current.has(id)) continue;
          joinedChatsRef.current.add(id);
          sock.emit('joinChat', { chatId: id });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Chyba pri načítaní chatov');
    }
  }, [user?.id, fetchWithAuth]);

  const markChatSeen = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      await fetchWithAuth(`${API_BASE}/api/chat/${chatId}/mark-seen-user`, { method: 'PUT' });
    } catch {
      // ignore
    }

    setChats((prev) => (prev || []).map((c) => (Number(c?.id_chatu) === Number(chatId) ? { ...c, unread_count: 0 } : c)));
    window.dispatchEvent(new Event('admin:refresh-chat-unread'));
  }, [fetchWithAuth]);

  // Refresh unread counts when other admin components mark chats as seen.
  useEffect(() => {
    const handler = () => {
      loadChats();
    };
    window.addEventListener('admin:refresh-chat-unread', handler);
    return () => window.removeEventListener('admin:refresh-chat-unread', handler);
  }, [loadChats]);

  useEffect(() => {
    const totalUnread = (chats || []).reduce((sum, c) => sum + Number(c?.unread_count || 0), 0);
    setUnreadCount(totalUnread);
  }, [chats]);

  const loadMessages = async (chatIdOverride) => {
    const chatIdToLoad = chatIdOverride || selectedChat?.id_chatu;
    if (!chatIdToLoad) return;
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${chatIdToLoad}/messages`);
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

      if (isOpen && isCurrent) {
        setMessages((prev) => [...prev, payload]);
        if (String(payload.odesilatel_typ || '').toLowerCase() !== 'psycholog') {
          try {
            fetchWithAuth(`${API_BASE}/api/chat/${chatId}/mark-seen-user`, { method: 'PUT' })
              .then(() => window.dispatchEvent(new Event('admin:refresh-chat-unread')))
              .catch(() => {});
          } catch {
            // ignore
          }
        }
      }

      // Update chat list + unread badge
      setChats((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        let changed = false;
        const next = arr.map((c) => {
          if (Number(c?.id_chatu) !== chatId) return c;
          changed = true;
          const incomingFromUser = String(payload.odesilatel_typ || '').toLowerCase() !== 'psycholog';
          const bumpUnread = !(isOpen && isCurrent) && incomingFromUser;
          return {
            ...c,
            posledna_sprava: payload.cas_odoslania || new Date().toISOString(),
            unread_count: bumpUnread ? Number(c.unread_count || 0) + 1 : ((isOpen && isCurrent) ? 0 : c.unread_count)
          };
        });
        if (!changed) return prev;
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
  }, [token, fetchWithAuth, isOpen]);

  // Load chat list once on login (and join rooms)
  useEffect(() => {
    if (!user?.id) return;
    loadChats();
  }, [user?.id, loadChats]);

  // Load messages when opening or switching chats (one-time)
  useEffect(() => {
    if (!isOpen || !selectedChat?.id_chatu) return;
    loadMessages();
  }, [isOpen, selectedChat?.id_chatu, fetchWithAuth]);

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

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSelectedChat(null);
        setMessages([]);
        setError('');
      }
      return next;
    });
  };

  return (
    <>
      <button
        className="psycholog-chat-icon-btn"
        title={isOpen ? 'Zavrieť chat' : 'Napísať užívateľovi'}
        onClick={handleToggleOpen}
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
            <div className="pfw-header-left">
              {selectedChat && (
                <button
                  type="button"
                  className="pfw-back"
                  onClick={() => {
                    setSelectedChat(null);
                    setMessages([]);
                    setError('');
                  }}
                  title="Späť na zoznam"
                >
                  ←
                </button>
              )}
              <div>
                <div className="pfw-title"> Chaty s užívateľmi</div>
                {selectedChat && (
                  <div className="pfw-subtitle">
                    {selectedChat.uzivatel_meno} {selectedChat.uzivatel_priezvisko}
                  </div>
                )}
              </div>
            </div>
            <button className="pfw-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {error && <div className="pfw-error">{error}</div>}

          {selectedChat ? (
            <>
              <div className="pfw-messages" ref={messagesRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={msg?.id_spravy || idx}
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
            <div className="pfw-chat-list" role="list">
              {Array.isArray(chats) && chats.length > 0 ? (
                chats.map((chat) => {
                  const unread = Number(chat?.unread_count || 0);
                  return (
                    <button
                      key={chat.id_chatu}
                      type="button"
                      className="pfw-chat-item"
                      onClick={() => {
                        setSelectedChat(chat);
                        setMessages([]);
                        loadMessages(chat.id_chatu);
                        markChatSeen(chat.id_chatu);
                      }}
                      role="listitem"
                    >
                      <div className="pfw-chat-item-main">
                        <div className="pfw-chat-item-name">
                          {chat.uzivatel_meno} {chat.uzivatel_priezvisko}
                        </div>
                        {chat.uzivatel_email && (
                          <div className="pfw-chat-item-email">{chat.uzivatel_email}</div>
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="pfw-unread-badge">{unread > 9 ? '9+' : unread}</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="pfw-empty">Nemáš žiadne chaty.</div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PsychologChatFloating;

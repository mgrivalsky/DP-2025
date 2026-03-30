import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../utils/socket";
import "../styles/QuickHelp.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const QuickHelp = () => {
  const { user, token, fetchWithAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [psychologOnline, setPsychologOnline] = useState(false);
  const messagesContainerRef = useRef(null);
  const lastMessageLengthRef = useRef(0);
  const socketRef = useRef(null);
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

  // Initialize chat on component mount or when user changes
  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }
    initializeChat();
  }, [user?.id]);

  // Socket.io connection + listeners (no polling)
  useEffect(() => {
    if (!token || !isOpen) return;

    const sock = getSocket(token);
    if (!sock) return;
    socketRef.current = sock;

    const onMessage = (payload) => {
      if (!payload) return;
      if (!chatId) return;
      if (Number(payload.id_chatu) !== Number(chatId)) return;

      const msgId = payload.id_spravy;
      if (msgId) {
        if (seenMessageIdsRef.current.has(msgId)) return;
        seenMessageIdsRef.current.add(msgId);
      }

      setMessages((prev) => [...prev, payload]);
    };

    const onPsychologStatus = (data) => {
      if (Number(data?.id) === 1) setPsychologOnline(Boolean(data?.online));
    };

    sock.on('message', onMessage);
    sock.on('psychologStatus', onPsychologStatus);

    return () => {
      sock.off('message', onMessage);
      sock.off('psychologStatus', onPsychologStatus);
    };
  }, [token, isOpen, chatId]);

  // Join chat room when chatId is ready
  useEffect(() => {
    if (!isOpen || !chatId) return;
    const sock = socketRef.current;
    if (!sock) return;
    sock.emit('joinChat', { chatId });
  }, [isOpen, chatId]);

  // Load initial psychologist online status once (then realtime updates)
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    let cancelled = false;
    (async () => {
      try {
        const resp = await fetchWithAuth(`${API_BASE}/api/chat/psycholog/1/status`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!cancelled) setPsychologOnline(Boolean(data?.online));
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isOpen, fetchWithAuth]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError("");
      if (!user?.id) {
        throw new Error("Užívateľ nie je prihlásený");
      }

      // Create or get existing chat with psychologist (ID 1)
      const response = await fetchWithAuth(`${API_BASE}/api/chat/create`, {
        method: "POST",
        body: JSON.stringify({
          userId: parseInt(user.id),
          psychologId: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create chat");
      }

      const chat = await response.json();
      setChatId(chat.id_chatu);

      // Load existing messages
      const messagesResponse = await fetchWithAuth(`${API_BASE}/api/chat/${chat.id_chatu}/messages`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const initial = messagesData || [];
        const nextSet = new Set();
        for (const m of initial) {
          if (m?.id_spravy) nextSet.add(m.id_spravy);
        }
        seenMessageIdsRef.current = nextSet;
        setMessages(initial);
      }
    } catch (err) {
      console.error("Error initializing chat:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return;

    const msgToSend = newMessage;
    setNewMessage("");

    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit('sendMessage', { chatId, obsah: msgToSend });
        return;
      }

      // Fallback to REST if socket is not connected.
      const response = await fetchWithAuth(`${API_BASE}/api/chat/${chatId}/message`, {
        method: "POST",
        body: JSON.stringify({ obsah: msgToSend }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const message = await response.json();
      if (message?.id_spravy) seenMessageIdsRef.current.add(message.id_spravy);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Chyba pri odoslaní správy: " + err.message);
      setNewMessage(msgToSend);
    }
  };

  return (
    <section id="quickhelp">
      <div className="container">
        <div className="section-title text-center">
          <h2>Rýchla pomoc – Chat s pani psychologičkou</h2>
          <p>
            Ak sa necítite dobre, máte obavy, stres alebo si jednoducho potrebujete
            s niekým porozprávať, som tu pre vás. Môžeme spolu pokojne prebrať, čo
            vás trápi alebo čo vás znepokojuje. Napíšte mi, ako sa cítite — som tu,
            aby som vás vypočula a pomohla vám nájsť cestu k tomu, aby ste sa cítili
            lepšie.
          </p>
        </div>

        {!isOpen ? (
          <div className="text-center">
            <button className="chat-open-btn" onClick={() => setIsOpen(true)}>
              <MessageCircle size={20} /> Otvoriť chat
            </button>
          </div>
        ) : (
          <div className="chat-box">
            <div className="chat-header">
              <div className="chat-status">
                <div className={`quickhelp-status-dot ${psychologOnline ? 'online' : 'offline'}`}></div>
                <span>Pani psychologička – {loading ? "pripája sa..." : psychologOnline ? "online" : "offline"}</span>
              </div>
              <button className="chat-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            {error && (
              <div className="quickhelp-error">
                {error}
                <button
                  onClick={() => setError("")}
                  className="quickhelp-error__close"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="chat-messages" ref={messagesContainerRef}>
              {loading && messages.length === 0 ? (
                <div className="quickhelp-placeholder">
                  Inicializujem chat...
                </div>
              ) : (
                <>
                  {/* Introductory report from a psychologist - for display only */}
                  <div className="chat-message psych-msg">
                    <div>Dobrý deň, som tu pre vás. Ako vám môžem pomôcť? Opíšte, čo vás trápi.</div>
                  </div>
                  
                  {messages.length === 0 ? (
                    <div className="quickhelp-placeholder">
                      Napíšte správu aby ste začali konverzáciu.
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`chat-message ${
                          msg.odesilatel_typ === "uzivatel" ? "user-msg" : "psych-msg"
                        }`}
                      >
                        <div>{msg.obsah}</div>
                        <small className="quickhelp-msgTime">
                          {msg.cas_odoslania
                            ? new Date(msg.cas_odoslania).toLocaleTimeString("sk-SK", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </small>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder={
                  !user
                    ? "Musíš byť prihlásený..."
                    : "Napíšte správu..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={!user || loading || !chatId}
              />
              <button onClick={handleSend} disabled={!newMessage.trim() || !user || loading || !chatId}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickHelp;

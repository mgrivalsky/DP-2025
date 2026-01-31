import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const POLL_INTERVAL = 2000; // Poll for new messages every 2 seconds

const QuickHelp = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [psychologOnline, setPsychologOnline] = useState(true);
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

  // Initialize chat on component mount or when user changes
  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }
    initializeChat();
  }, [user?.id]);

  // Poll for new messages
  useEffect(() => {
    if (!chatId || !isOpen) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/chat/${chatId}/messages`);
        if (!response.ok) throw new Error("Failed to load messages");
        const data = await response.json();
        setMessages(data || []);

        // Do not mark messages as seen from user view
      } catch (err) {
        console.error("Error polling messages:", err);
      }
    };

    pollMessages();
    const interval = setInterval(pollMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [chatId, isOpen]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError("");
      if (!user?.id) {
        throw new Error("Užívateľ nie je prihlásený");
      }

      // Create or get existing chat with psychologist (ID 1)
      const response = await fetch(`${API_BASE}/api/chat/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const messagesResponse = await fetch(
        `${API_BASE}/api/chat/${chat.id_chatu}/messages`
      );
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData || []);
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
      const response = await fetch(`${API_BASE}/api/chat/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          obsah: msgToSend,
          odesilatel_typ: "uzivatel",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const message = await response.json();
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
                <div className="status-dot online"></div>
                <span>Pani psychologička – {loading ? "pripája sa..." : psychologOnline ? "online" : "offline"}</span>
              </div>
              <button className="chat-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            {error && (
              <div style={{
                background: "#fdecea",
                color: "#a02721",
                padding: "10px",
                margin: "10px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                border: "1px solid #f5c6cb"
              }}>
                {error}
                <button
                  onClick={() => setError("")}
                  style={{ marginLeft: "10px", background: "none", border: "none", color: "#a02721", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="chat-messages" ref={messagesContainerRef}>
              {loading && messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  Inicializujem chat...
                </div>
              ) : (
                <>
                  {/* Úvodná správa od psychologičky - len na zobrazenie */}
                  <div className="chat-message psych-msg">
                    <div>Dobrý deň, som tu pre vás. Ako vám môžem pomôcť? Opíšte, čo vás trápi.</div>
                  </div>
                  
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
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
                        <small style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "4px", display: "block" }}>
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

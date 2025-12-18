import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

const QuickHelp = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: "psychologist",
      text: "Dobrý deň, som tu pre vás. Ako vám môžem pomôcť? Opíšte, čo vás trápi.",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const userMsg = { sender: "user", text: newMessage.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");

    setTimeout(() => {
      const reply = {
        sender: "psychologist",
        text: "Rozumiem. To muselo byť ťažké. Môžete mi o tom povedať viac?",
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <section id="quickhelp">
      <div className="container">
        <div className="section-title text-center">
          <h2>Rýchla pomoc – Chat s pani psychologičkou</h2>
            <p>
            Ak sa necítite dobre, máte obavy, stres alebo si jednoducho potrebujete s niekým porozprávať, 
            som tu pre vás. Môžeme spolu pokojne prebrať, čo vás trápi alebo čo vás znepokojuje. 
            Napíšte mi, ako sa cítite — som tu, aby som vás vypočula a pomohla vám nájsť cestu k tomu, 
            aby ste sa cítili lepšie.
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
                <span>Pani psychologička – online</span>
              </div>
              <button className="chat-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${
                    msg.sender === "user" ? "user-msg" : "psych-msg"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Napíšte správu..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend}>
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

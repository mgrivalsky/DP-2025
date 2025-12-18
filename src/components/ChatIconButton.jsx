import React from "react";
import { MessageCircle } from "lucide-react";


const ChatIconButton = () => {
  const handleScroll = () => {
    const target = document.querySelector("#QuickHelp");
    if (!target) return;

    const startY = window.pageYOffset;
    const endY = target.getBoundingClientRect().top + window.pageYOffset;
    const duration = 1000; 
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2; 
      window.scrollTo(0, startY + (endY - startY) * ease);

      if (elapsed < duration) requestAnimationFrame(animateScroll);
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <button
      className="chat-icon-btn"
      title="Napísať psychologičke"
      onClick={handleScroll}
    >
      <MessageCircle size={28} />
    </button>
  );
};

export default ChatIconButton;

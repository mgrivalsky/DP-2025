import { io } from 'socket.io-client';

const FALLBACK_BASE =
  typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : 'http://localhost:5000';

const API_BASE = process.env.REACT_APP_API_BASE || FALLBACK_BASE;

let socket = null;
let socketToken = null;

export function getSocket(token) {
  const tok = String(token || '').trim();
  if (!tok) return null;

  if (socket && socket.connected && socketToken === tok) {
    return socket;
  }

  if (socket) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
  }

  socketToken = tok;
  socket = io(API_BASE, {
    // Allow fallback transports. Some production networks/proxies block WebSockets.
    auth: { token: tok }
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch {
    // ignore
  }
  socket = null;
  socketToken = null;
}

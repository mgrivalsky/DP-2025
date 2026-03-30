import { io } from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
    transports: ['websocket'],
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

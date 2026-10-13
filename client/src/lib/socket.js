import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
let socket = null;

export const connectSocket = (token) => {
  disconnectSocket();
  socket = io(URL, { auth: { token } });
  return socket;
};
export const getSocket = () => socket;
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
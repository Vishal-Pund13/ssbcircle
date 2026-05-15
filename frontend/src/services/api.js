import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error. Please try again.');
    return Promise.reject(new Error(message));
  }
);

// Auth
export const loginUser = async (username, password) => {
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
};

export const registerUser = async (username, displayName, password) => {
  const { data } = await api.post('/api/auth/register', { username, displayName, password });
  return data;
};

export const googleAuth = async (credential) => {
  const { data } = await api.post('/api/auth/google', { credential });
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/api/auth/me');
  return data.user;
};

// Rooms
export const createRoom = async (title, description) => {
  const { data } = await api.post('/api/rooms', { title, description });
  return data.room;
};

export const getRoom = async (code) => {
  const { data } = await api.get(`/api/rooms/${code}`);
  return data.room;
};

export const getActiveRooms = async () => {
  const { data } = await api.get('/api/rooms/active');
  return data.rooms;
};

export const closeRoom = async (code) => {
  const { data } = await api.delete(`/api/rooms/${code}`);
  return data;
};

export const getRoomToken = async (code) => {
  const { data } = await api.get(`/api/rooms/${code}/token`);
  return data; // { token, url }
};

export const kickParticipant = async (code, identity) => {
  const { data } = await api.post(`/api/rooms/${code}/kick`, { identity });
  return data;
};

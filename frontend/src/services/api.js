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
    if (err.response?.status === 401) {
      // Clear expired token silently — ProtectedRoute redirects protected pages,
      // public pages should never force a redirect just for browsing
      localStorage.removeItem('token');
    }
    const message =
      err.response?.data?.error ||
      (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error. Please try again.');
    const error = new Error(message);
    if (err.response?.data?.existing_room) error.existing_room = err.response.data.existing_room;
    if (err.response?.data?.full) error.full = true;
    if (err.response?.data?.platform_limit) error.platform_limit = true;
    if (err.response?.data?.session_limit) error.session_limit = true;
    return Promise.reject(error);
  }
);

// Auth
export const googleAuth = async (credential) => {
  const { data } = await api.post('/api/auth/google', { credential });
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/api/auth/me');
  return data.user;
};

// Rooms
export const createRoom = async (title, description, category, subcategory, max_participants) => {
  const { data } = await api.post('/api/rooms', { title, description, category, subcategory, max_participants });
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

// Sessions
export const getSessions = async () => {
  const { data } = await api.get('/api/sessions');
  return data.sessions;
};

export const createSession = async (payload) => {
  const { data } = await api.post('/api/sessions', payload);
  return data.session;
};

export const toggleInterest = async (id) => {
  const { data } = await api.post(`/api/sessions/${id}/interest`);
  return data;
};

export const cancelSession = async (id) => {
  const { data } = await api.delete(`/api/sessions/${id}`);
  return data;
};

export const startSession = async (id) => {
  const { data } = await api.post(`/api/sessions/${id}/start`);
  return data.room;
};

export const getPastSessions = async () => {
  const { data } = await api.get('/api/rooms/past');
  return data.sessions;
};

export const getFeatured = async () => {
  const { data } = await api.get('/api/featured');
  return data;
};

export const reportUser = async (payload) => {
  const { data } = await api.post('/api/reports', payload);
  return data;
};

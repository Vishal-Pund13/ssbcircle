import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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
export const createRoom = async (title, description, category, subcategory, max_participants, article_slug = null) => {
  const { data } = await api.post('/api/rooms', { title, description, category, subcategory, max_participants, article_slug });
  return data.room;
};

export const getRoom = async (code) => {
  const { data } = await api.get(`/api/rooms/${code}`);
  return data; // { room } | { pending_session }
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

// Articles
export const getArticles = async (category) => {
  const params = category ? `?category=${category}` : '';
  const { data } = await api.get(`/api/articles${params}`);
  return data.articles;
};

export const getArticle = async (id) => {
  const { data } = await api.get(`/api/articles/${id}`);
  return data.article;
};

export const voteArticle = async (slug, value) => {
  const { data } = await api.post(`/api/articles/${slug}/vote`, { value });
  return data;
};

export const getArticleVotes = async (slug) => {
  const { data } = await api.get(`/api/articles/${slug}/vote`);
  return data;
};

// Article likes and comments — reading works signed out, writing does not.
export const getArticleEngagement = async (slug) => {
  const { data } = await api.get(`/api/articles/${slug}/engagement`);
  return data;             // { likes, liked, comments }
};

export const likeArticle = async (slug) => {
  const { data } = await api.post(`/api/articles/${slug}/like`);
  return data;             // { likes, liked }
};

export const addArticleComment = async (slug, body) => {
  const { data } = await api.post(`/api/articles/${slug}/comments`, { body });
  return data.comments;
};

// Reading metrics. Fire-and-forget: a failed count must never break reading.
export const trackArticleView = (slug, visitorId) =>
  api.post(`/api/articles/${slug}/view`, { visitor_id: visitorId }).catch(() => {});

export const trackArticleRead = (slug, visitorId) =>
  api.post(`/api/articles/${slug}/read`, { visitor_id: visitorId }).catch(() => {});

export const deleteArticleComment = async (id) => {
  const { data } = await api.delete(`/api/articles/comments/${id}`);
  return data;
};

// Profile
export const saveOnboarding = async (payload) => {
  const { data } = await api.post('/api/auth/me/onboarding', payload);
  return data.user;
};

// One-field save used by the home page countdown. Separate from saveOnboarding
// on purpose — that endpoint requires an exam type and rewrites the phone field.
export const updateSsbDate = async (ssb_date) => {
  const { data } = await api.patch('/api/auth/me/ssb-date', { ssb_date });
  return data.user;
};

// PIQ — the aspirant's own form. Holds sensitive personal detail, so it is
// readable only by its owner and there is no endpoint that lists other people's.
export const getPiq = async () => {
  const { data } = await api.get('/api/piq');
  return data;              // { piq, updated_at }
};

export const savePiq = async (piq) => {
  const { data } = await api.put('/api/piq', { data: piq }, { timeout: 20000 });
  return data;              // { piq, updated_at }
};

export const deletePiq = async () => {
  const { data } = await api.delete('/api/piq');
  return data;
};

// The model takes a while to read a whole PIQ, so this waits far longer than
// the default 10s. Capped server-side at a few runs per day.
export const analyzePiq = async () => {
  const { data } = await api.post('/api/piq/analyze', {}, { timeout: 90000 });
  return data;             // { analysis, analysed_at, used_today, daily_limit }
};

// Moderator programme
export const getModeratorStatus = async () => (await api.get('/api/moderators/me')).data;
export const applyModerator = async (payload) => (await api.post('/api/moderators/apply', payload)).data;
export const withdrawModerator = async () => (await api.post('/api/moderators/withdraw')).data;

// "Report a problem or idea" — also counts towards the moderator score
export const sendPlatformFeedback = async (payload) => (await api.post('/api/moderators/platform-feedback', payload)).data;

// "Was this useful?" on AI reports
export const sendAiFeedback = async (payload) => {
  const { data } = await api.post('/api/track/feedback', payload);
  return data;
};

// Admin v2 dashboard: usage, features, AI calls and feedback for the last N days
export const getAdminAnalytics = async (days = 14) => {
  const token = localStorage.getItem('sa_token');
  const { data } = await api.get(`/api/admin/analytics?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

// TAT practice — the aspirant's own attempts and feedback. Analysis can take
// close to a minute on the free model, so it gets a long timeout.
export const getTat = async () => {
  const { data } = await api.get('/api/tat');
  return data;             // { used_today, daily_limit, attempts }
};

export const analyzeTat = async (pictureId, story) => {
  const { data } = await api.post('/api/tat/analyze', { picture_id: pictureId, story }, { timeout: 90000 });
  return data;             // { attempt, used_today, daily_limit }
};

// Prep sheet — the sheet is static content in data/prepSheet.js; these only
// read and write the signed-in aspirant's own progress through it.
export const getPrepProgress = async () => {
  const { data } = await api.get('/api/prep');
  return data;             // { progress: [...], activity: [{ day, actions }] }
};

// patch: any of { status: 0|1|2, starred: bool, note: string }
export const savePrepTopic = async (topicId, patch) => {
  const { data } = await api.put(`/api/prep/${topicId}`, patch);
  return data.progress;
};

// A spoken answer, already turned into text by the browser. The model takes a
// while, so this waits far longer than the default 10s.
export const speakPrepTopic = async (topicId, payload) => {
  const { data } = await api.post(`/api/prep/${topicId}/speak`, payload, { timeout: 90000 });
  return data;             // { progress, feedback, used_today, daily_limit }
};

// One piece (under 30s) of a spoken answer, as recorded audio. terms are
// names from the topic for the recogniser to expect.
export const transcribeAudio = async (blob, terms = []) => {
  const { data } = await api.post('/api/prep/transcribe', blob, {
    headers: { 'Content-Type': (blob.type || 'audio/webm').split(';')[0] },
    params: { terms: JSON.stringify(terms) },
    timeout: 40000,
  });
  return data.text;
};

export const reviewPrepTopic = async (topicId, recalled) => {
  const { data } = await api.post(`/api/prep/${topicId}/review`, { recalled });
  return data.progress;
};

// Community — reading works signed out, writing does not.
export const getCommunityFeed = async ({ limit = 30, offset = 0 } = {}) => {
  const { data } = await api.get(`/api/community?limit=${limit}&offset=${offset}`);
  return data;             // { posts, can_post }
};

export const getCommunityPost = async (id) => {
  const { data } = await api.get(`/api/community/${id}`);
  return data;             // { post, comments }
};

export const createCommunityPost = async (payload) => {
  const { data } = await api.post('/api/community', payload);
  return data.post;
};

export const addCommunityComment = async (id, body) => {
  const { data } = await api.post(`/api/community/${id}/comments`, { body });
  return data.comments;
};

export const voteCommunityPost = async (id) => {
  const { data } = await api.post(`/api/community/${id}/vote`);
  return data;             // { voted, upvotes }
};

export const deleteCommunityPost = async (id) => {
  const { data } = await api.delete(`/api/community/${id}`);
  return data;
};

export const deleteCommunityComment = async (id) => {
  const { data } = await api.delete(`/api/community/comments/${id}`);
  return data;
};

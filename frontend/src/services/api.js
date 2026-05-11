import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Replace the IP below with YOUR computer's
//     IPv4 address. Open cmd → type ipconfig → look for
//     "IPv4 Address" e.g. 192.168.1.55
// ─────────────────────────────────────────────────────────
const BASE_URL = 'http://192.168.1.100:5000/api';

// ── Token helpers ─────────────────────────────────────────
export const saveAuth = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getToken = async () => AsyncStorage.getItem('token');
export const getUser  = async () => {
  const s = await AsyncStorage.getItem('user');
  return s ? JSON.parse(s) : null;
};

export const clearAuth = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// ── Core request helper ───────────────────────────────────
const request = async (endpoint, method = 'GET', body = null) => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data     = await response.json();

  if (!response.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
};

// ── AUTH ──────────────────────────────────────────────────
// POST /api/auth/login  →  { token, user: { id, role, username } }
export const login = (username, password) =>
  request('/auth/login', 'POST', { username, password });

// ── ISSUES (Facility Manager) ─────────────────────────────
// GET  /api/issues           → array of ticket objects
export const getAllIssues = () => request('/issues');

// GET  /api/issues/:id       → single ticket object
//   ticket fields: ticket_id, title, description, status,
//                  priority, location_id, category_id,
//                  photo_url, created_by, created_at, updated_at
export const getIssueById = (id) => request(`/issues/${id}`);

// PUT  /api/issues/:id/status  body: { status }
//   allowed: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
export const updateIssueStatus = (id, status) =>
  request(`/issues/${id}/status`, 'PUT', { status });

// DELETE /api/issues/:id
export const deleteIssue = (id) => request(`/issues/${id}`, 'DELETE');

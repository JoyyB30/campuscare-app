import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Change this IP to your computer's IP address when testing on phone
// To find it: open cmd and type "ipconfig" → look for IPv4 Address
const BASE_URL = 'http://30.30.30.34:5000/api';

// Get saved token from storage
const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

// Main request helper — adds token to every request
const request = async (endpoint, method = 'GET', body = null) => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
};

// ── AUTH ─────────────────────────────────────────
export const login = (username, password) =>
  request('/auth/login', 'POST', { username, password });

// ── ISSUES (Facility Manager) ─────────────────────
export const getAllIssues  = ()         => request('/issues');
export const getIssueById = (id)        => request(`/issues/${id}`);
export const updateStatus = (id, status) => request(`/issues/${id}/status`, 'PUT', { status });
export const deleteIssue  = (id)        => request(`/issues/${id}`, 'DELETE');

// ── WORKERS ───────────────────────────────────────
// Gets all users with role=worker so FM can assign issues
export const getWorkers = () => request('/auth/users?role=worker');

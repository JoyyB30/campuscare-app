import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────
// API URL
// Browser uses localhost.
// Expo Go phone uses laptop Wi-Fi IP.
// Backend must be running on port 5000.
// ─────────────────────────────────────────────────────────

const LAPTOP_IP = '192.168.1.101';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  return 'http://${LAPTOP_IP}:5000/api';
};

const BASE_URL = getBaseUrl();

console.log('Using API URL:', BASE_URL);

// ── Token helpers ─────────────────────────────────────────
export const saveAuth = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getToken = async () => {
  return AsyncStorage.getItem('token');
};

export const getUser = async () => {
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

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

// ── AUTH ──────────────────────────────────────────────────
export const login = async (email, password) => {
  const data = await request('/auth/login', 'POST', { email, password });

  if (data.token && data.user) {
    await saveAuth(data.token, data.user);
  }

  return data;
};

export const logout = async () => {
  try {
    await request('/auth/logout', 'POST');
  } finally {
    await clearAuth();
  }
};

// ── ISSUES: Facility Manager ──────────────────────────────
export const getAllIssues = async (filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return request(`/issues${queryString ? `?${queryString}` : ''}`);
};

export const getIssueById = (id) => {
  return request(`/issues/${id}`);
};

export const updateIssueStatus = (id, status) => {
  return request(`/issues/${id}/status`, 'PUT', { status });
};

export const updateIssuePriority = (id, priority) => {
  return request(`/issues/${id}/priority`, 'PUT', { priority });
};

export const assignIssueToWorker = (id, assigned_to) => {
  return request(`/issues/${id}/assign`, 'PUT', { assigned_to });
};

export const closeIssue = (id) => {
  return request(`/issues/${id}/close`, 'PUT');
};

export const deleteIssue = (id) => {
  return request(`/issues/${id}`, 'DELETE');
};

// ── WORKERS: Facility Manager ─────────────────────────────
export const getWorkers = async () => {
  return request('/manager/workers');
};

export const updateWorkerStatus = (id, is_active) => {
  return request(`/manager/workers/${id}/status`, 'PUT', { is_active });
};

// ── NOTIFICATIONS ─────────────────────────────────────────
export const getMyNotifications = async () => {
  return request('/issues/notifications/my');
};

export const markNotificationAsRead = async (notificationId) => {
  return request(`/issues/notifications/${notificationId}/read`, 'PUT');
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────
// API URL
// Browser uses localhost.
// Expo Go on a physical phone uses your laptop's Wi-Fi IP.
// Backend must be running on port 5000.
//
// HOW TO FIND YOUR LAPTOP IP:
//   Windows: open cmd → type "ipconfig" → look for "IPv4 Address"
//   Mac/Linux: open terminal → type "ifconfig" → look for "inet 192.168.x.x"
// ─────────────────────────────────────────────────────────

const LAPTOP_IP = '192.168.1.101'; // ← CHANGE THIS to your actual laptop IP

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // FIX: was single quotes before — must be backticks for template literal to work
  return `http://${LAPTOP_IP}:5000/api`;
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
export const register = async (username, email, password, role) => {
  return request('/auth/register', 'POST', { username, email, password, role });
};

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

// ── ISSUES: Community Member ──────────────────────────────
export const getMyIssues = () => {
  return request('/issues/my');
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

// ── ISSUES: Worker ────────────────────────────────────────
export const getAssignedIssues = () => {
  return request('/issues/assigned/my');
};

export const addComment = (id, comment_text) => {
  return request(`/issues/${id}/comments`, 'POST', { comment_text });
};

// ── PHOTO UPLOAD (multipart — cannot use regular request helper) ──
// Used by Community Member (submit issue) and Worker (completion photo)
export const uploadPhoto = async (endpoint, imageUri, imageMimeType = 'image/jpeg') => {
  const token = await getToken();

  const formData = new FormData();
  formData.append('photo', {
    uri: imageUri,
    type: imageMimeType,
    name: 'photo.jpg',
  });

  // IMPORTANT: Do NOT set Content-Type manually here.
  // React Native's fetch sets it automatically with the correct boundary.
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Upload failed');
  }

  return data;
};

// Shortcut helpers for specific upload endpoints
export const uploadIssueWithPhoto = async (formFields, imageUri, imageMimeType) => {
  const token = await getToken();

  const formData = new FormData();
  formData.append('title',       formFields.title);
  formData.append('description', formFields.description);
  formData.append('location_id', String(formFields.location_id));
  formData.append('category_id', String(formFields.category_id));

  if (imageUri) {
    formData.append('photo', {
      uri:  imageUri,
      type: imageMimeType || 'image/jpeg',
      name: 'issue_photo.jpg',
    });
  }

  const response = await fetch(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data.message || data.error || 'Failed to submit issue');
  return data;
};

export const uploadCompletionPhoto = async (issueId, imageUri, imageMimeType) => {
  return uploadPhoto(`/issues/${issueId}/photo`, imageUri, imageMimeType);
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
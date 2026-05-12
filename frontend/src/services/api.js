import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 5000;

/*
  IMPORTANT:
  - Web uses localhost.
  - Expo Go on a real phone uses your laptop IPv4 address.
  - If phone cannot load data, replace this IP with your real laptop IPv4 from:
      Windows terminal: ipconfig
      Look for IPv4 Address under Wi-Fi.
*/
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

export const getToken = async () => AsyncStorage.getItem('token');

export const getUser = async () => {
  const s = await AsyncStorage.getItem('user');
  return s ? JSON.parse(s) : null;
};

export const clearAuth = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// ── Helpers ───────────────────────────────────────────────
const safeJson = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const getErrorMessage = (data, fallback) => {
  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.raw ||
    fallback ||
    'Request failed'
  );
};

const request = async (endpoint, method = 'GET', body = null) => {
  const token = await getToken();

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body !== null) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await safeJson(response);

    console.log(`[API] ${method} ${endpoint}`, {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuth();
      }

      if (response.status === 403) {
        throw new Error(
          getErrorMessage(
            data,
            'Access denied. You are logged in with a role that is not allowed to use this screen.'
          )
        );
      }

      throw new Error(getErrorMessage(data));
    }

    return data;
  } catch (err) {
    if (
      err.message === 'Network request failed' ||
      err.name === 'TypeError' ||
      String(err.message).includes('Failed to fetch')
    ) {
      throw new Error(
        `Network request failed. Frontend is trying to reach: ${BASE_URL}. Make sure the backend is running on port ${PORT}. If using Expo Go on a phone, make sure your phone and laptop are on the same Wi-Fi and LAPTOP_IP is correct.`
      );
    }

    throw err;
  }
};

// ── AUTH ──────────────────────────────────────────────────
export const register = async (username, email, password, role) => {
  return request('/auth/register', 'POST', {
    username,
    email,
    password,
    role,
  });
};

export const login = async (email, password) => {
  const data = await request('/auth/login', 'POST', { email, password });

  if (data.token && data.user) {
    await saveAuth(data.token, data.user);
  }

  return data;
};

export const forgotPassword = async (email) => {
  return request('/auth/forgot-password', 'POST', { email });
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

export const createIssue = (issueData) => {
  return uploadIssueWithPhoto(
    issueData,
    issueData?.photoUri,
    issueData?.photoMimeType
  );
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

// ── PHOTO UPLOAD ──────────────────────────────────────────
export const uploadPhoto = async (
  endpoint,
  imageUri,
  imageMimeType = 'image/jpeg'
) => {
  const token = await getToken();

  const formData = new FormData();
  formData.append('photo', {
    uri: imageUri,
    type: imageMimeType || 'image/jpeg',
    name: imageMimeType?.includes('png') ? 'photo.png' : 'photo.jpg',
  });

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await safeJson(response);

    console.log(`[API-UPLOAD] POST ${endpoint}`, {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuth();
      }

      throw new Error(getErrorMessage(data, 'Upload failed'));
    }

    return data;
  } catch (err) {
    if (
      err.message === 'Network request failed' ||
      err.name === 'TypeError' ||
      String(err.message).includes('Failed to fetch')
    ) {
      throw new Error(
        `Upload failed because frontend cannot reach backend at ${BASE_URL}. Check backend, Wi-Fi, and LAPTOP_IP.`
      );
    }

    throw err;
  }
};

export const uploadIssueWithPhoto = async (
  formFields,
  imageUri,
  imageMimeType
) => {
  const token = await getToken();

  const formData = new FormData();

  formData.append('title', formFields.title);
  formData.append('description', formFields.description);
  formData.append('location_id', String(formFields.location_id));
  formData.append('category_id', String(formFields.category_id));

  if (imageUri) {
    formData.append('photo', {
      uri: imageUri,
      type: imageMimeType || 'image/jpeg',
      name: imageMimeType?.includes('png') ? 'issue_photo.png' : 'issue_photo.jpg',
    });
  }

  const response = await fetch(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await safeJson(response);

  console.log('[API-UPLOAD] POST /issues', {
    status: response.status,
    ok: response.ok,
    data,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuth();
    }

    throw new Error(getErrorMessage(data, 'Failed to submit issue'));
  }

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

// ── ADMIN ─────────────────────────────────────────────────
export const getAdminUsers = async () => {
  return request('/admin/users');
};

export const updateAdminUserStatus = async (userId, is_active) => {
  return request(`/admin/users/${userId}/status`, 'PUT', {
    is_active,
    status: is_active ? 'active' : 'inactive',
  });
};

// ── NOTIFICATIONS ─────────────────────────────────────────
export const getMyNotifications = async () => {
  return request('/issues/notifications/my');
};

export const markNotificationAsRead = async (notificationId) => {
  return request(`/issues/notifications/${notificationId}/read`, 'PUT');
};

// ── STATIC LOOKUPS USED BY COMMUNITY MEMBER SUBMISSION ──
// These should match backend/database seed IDs.
export const CATEGORIES = [
  { category_id: 1, category_name: 'Electrical' },
  { category_id: 2, category_name: 'Plumbing' },
  { category_id: 3, category_name: 'Furniture' },
  { category_id: 4, category_name: 'Cleaning' },
  { category_id: 5, category_name: 'Air Conditioning' },
];

export const LOCATIONS = [
  {
    location_id: 1,
    building_name: 'Building A',
    floor: '1',
    room_number: '101',
    area: 'North Wing',
  },
  {
    location_id: 2,
    building_name: 'Building B',
    floor: '2',
    room_number: '205',
    area: 'South Wing',
  },
  {
    location_id: 3,
    building_name: 'Library',
    floor: 'Ground',
    room_number: 'L1',
    area: 'Main Area',
  },
  {
    location_id: 4,
    building_name: 'Cafeteria',
    floor: 'Ground',
    room_number: 'C1',
    area: 'Food Court',
  },
  {
    location_id: 5,
    building_name: 'Parking Area',
    floor: 'Outdoor',
    room_number: 'P1',
    area: 'East Side',
  },
];
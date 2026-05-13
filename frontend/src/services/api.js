import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PORT = 5000;

// For Expo Go on a real phone, replace this with your laptop IPv4 address.
// Windows: open CMD and run: ipconfig
// Use the IPv4 Address under Wi-Fi.
const LAPTOP_IP = '192.168.1.101';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  return `http://${LAPTOP_IP}:${PORT}/api`;
};

export const BASE_URL = getBaseUrl();

console.log('CampusCare API URL:', BASE_URL);

// Auth storage
export const saveAuth = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getToken = async () => {
  return AsyncStorage.getItem('token');
};

export const getUser = async () => {
  const storedUser = await AsyncStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const clearAuth = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// Helpers
const safeJson = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const getErrorMessage = (data, fallback = 'Request failed') => {
  return data?.message || data?.error || data?.detail || data?.raw || fallback;
};

const handleNetworkError = (error) => {
  if (
    error.message === 'Network request failed' ||
    error.name === 'TypeError' ||
    String(error.message).includes('Failed to fetch')
  ) {
    throw new Error(
      `Network request failed. Frontend is trying to reach: ${BASE_URL}. Make sure the backend is running on port ${PORT}. If using Expo Go on a phone, make sure your phone and laptop are on the same Wi-Fi and LAPTOP_IP is correct.`
    );
  }

  throw error;
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

      throw new Error(getErrorMessage(data));
    }

    return data;
  } catch (error) {
    handleNetworkError(error);
  }
};

// AUTH
export const register = async (name, email, password, role) => {
  const data = await request('/auth/register', 'POST', {
    name,
    username: name,
    email,
    password,
    role,
  });

  if (data.token && data.user) {
    await saveAuth(data.token, data.user);
  }

  return data;
};

export const login = async (email, password) => {
  const data = await request('/auth/login', 'POST', {
    email,
    password,
  });

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

export const forgotPassword = async (email) => {
  return request('/auth/forgot-password', 'POST', { email });
};

export const resetPassword = async (email, newPassword) => {
  return request('/auth/reset-password', 'POST', {
    email,
    newPassword,
  });
};

// LOOKUPS
export const getCategories = async () => {
  return request('/issues/meta/categories');
};

export const getLocations = async () => {
  return request('/issues/meta/locations');
};

// COMMUNITY MEMBER
export const getMyIssues = async () => {
  return request('/issues/my');
};

export const createIssue = async (issueData) => {
  return uploadIssueWithPhoto(
    issueData,
    issueData?.photoUri,
    issueData?.photoMimeType
  );
};

export const getIssueById = async (id) => {
  return request(`/issues/${id}`);
};

// FACILITY MANAGER
export const getAllIssues = async (filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return request(`/issues${queryString ? `?${queryString}` : ''}`);
};

export const assignIssueToWorker = async (id, assigned_to) => {
  return request(`/issues/${id}/assign`, 'PUT', { assigned_to });
};

export const updateIssueStatus = async (id, status) => {
  return request(`/issues/${id}/status`, 'PUT', { status });
};

export const updateIssuePriority = async (id, priority) => {
  return request(`/issues/${id}/priority`, 'PUT', { priority });
};

export const closeIssue = async (id) => {
  return request(`/issues/${id}/close`, 'PUT');
};

export const deleteIssue = async (id) => {
  return request(`/issues/${id}`, 'DELETE');
};

export const getWorkers = async () => {
  return request('/manager/workers');
};

export const updateWorkerStatus = async (id, is_active) => {
  return request(`/manager/workers/${id}/status`, 'PUT', { is_active });
};

// WORKER
export const getAssignedIssues = async () => {
  return request('/issues/assigned/my');
};

export const addComment = async (id, comment_text) => {
  return request(`/issues/${id}/comments`, 'POST', { comment_text });
};

export const uploadCompletionPhoto = async (issueId, imageUri, imageMimeType) => {
  return uploadPhoto(`/issues/${issueId}/photo`, imageUri, imageMimeType);
};

// ADMIN
export const getAdminUsers = async () => {
  return request('/admin/users');
};

export const updateAdminUserStatus = async (userId, is_active) => {
  return request(`/admin/users/${userId}/status`, 'PUT', { is_active });
};

// NOTIFICATIONS
export const getMyNotifications = async () => {
  return request('/issues/notifications/my');
};

export const markNotificationAsRead = async (notificationId) => {
  return request(`/issues/notifications/${notificationId}/read`, 'PUT');
};

// UPLOAD HELPERS
export const uploadPhoto = async (
  endpoint,
  imageUri,
  imageMimeType = 'image/jpeg'
) => {
  const token = await getToken();

  if (!imageUri) {
    throw new Error('No image selected');
  }

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
  } catch (error) {
    handleNetworkError(error);
  }
};

export const uploadIssueWithPhoto = async (
  formFields,
  imageUri,
  imageMimeType = 'image/jpeg'
) => {
  const token = await getToken();

  const formData = new FormData();

  if (formFields?.title) {
    formData.append('title', formFields.title);
  }

  formData.append('description', formFields.description || '');
  formData.append('location_id', String(formFields.location_id || ''));
  formData.append('category_id', String(formFields.category_id || ''));

  if (imageUri) {
    formData.append('photo', {
      uri: imageUri,
      type: imageMimeType || 'image/jpeg',
      name: imageMimeType?.includes('png') ? 'issue_photo.png' : 'issue_photo.jpg',
    });
  }

  try {
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
  } catch (error) {
    handleNetworkError(error);
  }
};

// Fallback lists only. Screens should prefer getCategories/getLocations.
export const CATEGORIES = [
  { category_id: 1, category_name: 'Electrical' },
  { category_id: 2, category_name: 'Plumbing' },
  { category_id: 3, category_name: 'Cleaning' },
  { category_id: 4, category_name: 'Furniture' },
  { category_id: 5, category_name: 'Air Conditioning' },
  { category_id: 6, category_name: 'Safety' },
];

export const LOCATIONS = [
  {
    location_id: 1,
    building_name: 'Building A',
    floor: '1',
    room_number: 'A101',
    area: 'North Wing',
    location_name: 'Building A - 1 - A101 - North Wing',
  },
  {
    location_id: 2,
    building_name: 'Building B',
    floor: '2',
    room_number: 'B205',
    area: 'South Wing',
    location_name: 'Building B - 2 - B205 - South Wing',
  },
  {
    location_id: 3,
    building_name: 'Library',
    floor: 'Ground',
    room_number: 'L-G01',
    area: 'Main Reading Area',
    location_name: 'Library - Ground - L-G01 - Main Reading Area',
  },
  {
    location_id: 4,
    building_name: 'Cafeteria',
    floor: 'Ground',
    room_number: 'C-G01',
    area: 'Food Court',
    location_name: 'Cafeteria - Ground - C-G01 - Food Court',
  },
  {
    location_id: 5,
    building_name: 'Parking Area',
    floor: '',
    room_number: 'P1',
    area: 'East Side',
    location_name: 'Parking Area - P1 - East Side',
  },
  {
    location_id: 6,
    building_name: 'Building C',
    floor: '3',
    room_number: 'C303',
    area: 'West Wing',
    location_name: 'Building C - 3 - C303 - West Wing',
  },
];
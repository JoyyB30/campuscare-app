// src/screens/community/common.js
export const C = {
  navy: '#0B1F3A',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
  green: '#15803D',
  purple: '#7C3AED',
  cyan: '#0891B2',
  orange: '#D97706',
  darkOverlay: 'rgba(11,31,58,0.75)',
};

export const STATUS_META = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '⏳' },
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: '👤' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', icon: '🔧' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', icon: '✅' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', icon: '🔒' },
};

export const CATEGORY_ID_TO_NAME = {
  1: 'Electrical',
  2: 'Plumbing',
  3: 'Furniture',
  4: 'Cleaning',
  5: 'Air Conditioning',
};

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getId = (issue) => issue?.ticket_id || issue?.issue_id || issue?.id || issue?._id;
export const getCategory = (issue) => issue?.category || issue?.category_name || CATEGORY_ID_TO_NAME[issue?.category_id] || '—';
export const getLocation = (issue) => issue?.location || issue?.location_name || `Location #${issue?.location_id || '—'}`;
export const getStatus = (issue) => issue?.status || issue?.current_status || 'pending';

export const normalizeIssueList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.issues)) return data.issues;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

export const normalizeIssueDetail = (data) => ({
  issue: data?.issue || data?.data || data?.row || data,
  comments: Array.isArray(data?.comments) ? data.comments : [],
  photos: Array.isArray(data?.photos) ? data.photos : [],
});

export const normalizeNotifications = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

export const formatLocationOption = (loc) => {
  if (!loc) return '';
  return `${loc.building_name} - ${loc.floor} - ${loc.room_number} - ${loc.area}`;
};

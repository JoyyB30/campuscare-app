// src/screens/community/common.js

// Colors - Matching Manager Dashboard
export const C = {
  navy: '#0B1F3A',
  navy2: '#162D4E',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  orange: '#E76F51',
  green: '#2A9D8F',
  red: '#DC2626',
  purple: '#7C3AED',
  cyan: '#0891B2',
  darkOverlay: 'rgba(11,31,58,0.75)',
};

// Status Meta - With dot icons matching Manager
export const STATUS_META = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: '●' },
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', dot: '◆' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', dot: '◐' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', dot: '✓' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', dot: '■' },
};

// Category mapping
export const CATEGORY_ID_TO_NAME = {
  1: 'Electrical',
  2: 'Plumbing',
  3: 'Furniture',
  4: 'Cleaning',
  5: 'Air Conditioning',
};

// Category icons and backgrounds (matching Manager)
export const CAT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🔧',
  Cleaning: '🧹',
  Furniture: '🪑',
  'Air Conditioning': '❄️',
};

export const CAT_BG = {
  Electrical: '#FFFBEB',
  Plumbing: '#ECFEFF',
  Cleaning: '#F0FDF4',
  Furniture: '#FFF7F5',
  'Air Conditioning': '#EFF6FF',
};

// Format date (short)
export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Format date with time
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

// Get issue ID from various possible keys
export const getId = (issue) => issue?.ticket_id || issue?.issue_id || issue?.id || issue?._id;

// Get category name from various possible keys
export const getCategory = (issue) => issue?.category || issue?.category_name || CATEGORY_ID_TO_NAME[issue?.category_id] || '—';

// Get category icon
export const getCategoryIcon = (issue) => {
  const name = getCategory(issue);
  return CAT_ICONS[name] || '📋';
};

// Get category background
export const getCategoryBg = (issue) => {
  const name = getCategory(issue);
  return CAT_BG[name] || '#F8FAFC';
};

// Get location from various possible keys
export const getLocation = (issue) => issue?.location || issue?.location_name || `Location #${issue?.location_id || '—'}`;

// Get status from various possible keys
export const getStatus = (issue) => issue?.status || issue?.current_status || 'pending';

// Get status meta with dot
export const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

// Normalize issue list from various API response formats
export const normalizeIssueList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.issues)) return data.issues;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

// Normalize issue detail from various API response formats
export const normalizeIssueDetail = (data) => ({
  issue: data?.issue || data?.data || data?.row || data,
  comments: Array.isArray(data?.comments) ? data.comments : [],
  photos: Array.isArray(data?.photos) ? data.photos : [],
});

// Normalize notifications from various API response formats
export const normalizeNotifications = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

// Format location option for display
export const formatLocationOption = (loc) => {
  if (!loc) return '';
  return `${loc.building_name} - ${loc.floor} - ${loc.room_number} - ${loc.area}`;
};

// Spacing - Consistent with Manager
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography - Consistent with Manager
export const typography = {
  h1: { fontSize: 32, fontWeight: '900', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '800', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};

// Radius - Consistent with Manager
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 30,
  round: 40,
};

// Get notification icon based on type
export const getNotificationIcon = (notification) => {
  const type = notification?.notification_type || notification?.type;
  if (type === 'assignment') return '👷';
  if (type === 'completion') return '✅';
  if (type === 'status_change') return '🔄';
  if (type === 'comment') return '💬';
  return '🔔';
};

// Get priority color
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return C.red;
    case 'high': return C.orange;
    case 'medium': return C.cyan;
    case 'low': return C.green;
    default: return C.slate;
  }
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

import {
  getUser,
  clearAuth,
  getAllIssues,
  getWorkers,
  getMyNotifications,
  markNotificationAsRead,
} from '../services/api';

const C = {
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
};

const STATUS_META = {
  pending: {
    label: 'Pending',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FCD34D',
    dot: '●',
  },
  assigned: {
    label: 'Assigned',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    dot: '◆',
  },
  in_progress: {
    label: 'In Progress',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#67E8F9',
    dot: '◐',
  },
  resolved: {
    label: 'Resolved',
    color: '#15803D',
    bg: '#F0FDF4',
    border: '#86EFAC',
    dot: '✓',
  },
  closed: {
    label: 'Closed',
    color: '#475569',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    dot: '■',
  },
};

const CAT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🔧',
  Cleaning: '🧹',
  Furniture: '🪑',
  'Air Conditioning': '❄️',
};

const CAT_BG = {
  Electrical: '#FFFBEB',
  Plumbing: '#ECFEFF',
  Cleaning: '#F0FDF4',
  Furniture: '#FFF7F5',
  'Air Conditioning': '#EFF6FF',
};

const STATUS_FILTERS = ['All', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];

const CATEGORY_FILTERS = [
  'All',
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Furniture',
  'Air Conditioning',
];

const CATEGORY_ID_TO_NAME = {
  1: 'Electrical',
  2: 'Plumbing',
  3: 'Furniture',
  4: 'Cleaning',
  5: 'Air Conditioning',
};

const getCategoryName = (item) => {
  return item.category || CATEGORY_ID_TO_NAME[item.category_id] || 'Issue';
};

const getNotificationIcon = (type) => {
  if (type === 'assignment') return '👷';
  if (type === 'completion') return '✅';
  if (type === 'status_change') return '🔄';
  return '🔔';
};

export default function FMDashboardScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('All');
  const [categoryF, setCategoryF] = useState('All');

  const [error, setError] = useState(null);
  const [username, setUsername] = useState('Manager');

  useEffect(() => {
    loadUser();
    loadAllData();
  }, []);

  // Debounce search so typing stays smooth and updates automatically.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    applyFilters(issues, search, statusF, categoryF);
  }, [search, statusF, categoryF, issues]);

  const loadUser = async () => {
    const u = await getUser();
    if (u) setUsername(u.username || 'Manager');
  };

  const loadAllData = async () => {
    setLoading(true);

    await Promise.all([
      fetchIssues(),
      fetchWorkers(),
      fetchNotifications(),
    ]);

    setLoading(false);
    setRefreshing(false);
  };

  const fetchIssues = async () => {
    try {
      setError(null);

      // Fetch all issues and filter locally.
      // This makes search instant and makes closed filter work properly.
      const data = await getAllIssues({});
      const list = Array.isArray(data) ? data : data.issues || [];

      setIssues(list);
      applyFilters(list, search, statusF, categoryF);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await getWorkers();
      const list = Array.isArray(data) ? data : data.workers || [];
      setWorkers(list);
    } catch (err) {
      console.log('Failed to load workers:', err.message);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      const list = Array.isArray(data) ? data : data.notifications || [];
      setNotifications(list);
    } catch (err) {
      console.log('Failed to load notifications:', err.message);
    }
  };

  const applyFilters = (list, s, st, cat) => {
    let r = [...list];

    if (st !== 'All') {
      r = r.filter(i => i.status === st);
    }

    if (cat !== 'All') {
      r = r.filter(i => getCategoryName(i) === cat);
    }

    if (s.trim()) {
      const keyword = s.trim().toLowerCase();

      r = r.filter(i => {
        const title = i.title || '';
        const description = i.description || '';
        const categoryName = getCategoryName(i);
        const priority = i.priority || '';
        const status = i.status || '';
        const ticketId = String(i.ticket_id || i.id || '');

        return (
          title.toLowerCase().includes(keyword) ||
          description.toLowerCase().includes(keyword) ||
          categoryName.toLowerCase().includes(keyword) ||
          priority.toLowerCase().includes(keyword) ||
          status.toLowerCase().includes(keyword) ||
          ticketId.includes(keyword)
        );
      });
    }

    setFiltered(r);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [search, statusF, categoryF]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();

          if (navigation.replace) {
            navigation.replace('Login');
          }
        },
      },
    ]);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const counts = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending' || i.status === 'assigned').length,
    active: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderIssueCard = (item) => {
    const id = item.ticket_id || item.id;
    const s = STATUS_META[item.status] || STATUS_META.pending;

    const categoryName = getCategoryName(item);
    const icon = CAT_ICONS[categoryName] || '📋';
    const bg = CAT_BG[categoryName] || '#F8FAFC';

    return (
      <TouchableOpacity
        key={String(id)}
        style={[styles.card, { borderLeftColor: s.border }]}
        onPress={() => navigation.navigate('FMIssueDetail', { issueId: id })}
        activeOpacity={0.82}
      >
        <View style={styles.cardRow1}>
          <View style={styles.cardLeft}>
            <View style={[styles.catBox, { backgroundColor: bg }]}>
              <Text style={styles.catIcon}>{icon}</Text>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                {item.title || categoryName || 'Issue'}
              </Text>
              <Text style={styles.cardId}>Ticket #{id}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: s.bg, borderColor: s.border },
            ]}
          >
            <Text style={[styles.statusDot, { color: s.color }]}>{s.dot} </Text>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            🏷 {item.priority ? item.priority.toUpperCase() : 'MEDIUM'} priority
          </Text>

          <Text style={styles.cardDate}>
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </Text>
        </View>

        <View style={styles.tapHintRow}>
          <Text style={styles.tapHintText}>Tap to manage →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWorkerCard = (item) => (
    <View key={String(item.user_id)} style={styles.workerCard}>
      <View style={styles.workerIconBox}>
        <Text style={styles.workerIcon}>👷</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.workerName}>{item.username}</Text>
        <Text style={styles.workerEmail}>{item.email}</Text>
        <Text style={styles.workerId}>Worker #{item.user_id}</Text>
      </View>

      <View
        style={[
          styles.workerStatus,
          { backgroundColor: item.is_active === false ? '#FEF2F2' : '#F0FDF4' },
        ]}
      >
        <Text
          style={[
            styles.workerStatusText,
            { color: item.is_active === false ? '#DC2626' : '#15803D' },
          ]}
        >
          {item.is_active === false ? 'Inactive' : 'Active'}
        </Text>
      </View>
    </View>
  );

  const renderNotificationCard = (item) => {
    const icon = getNotificationIcon(item.notification_type);

    return (
      <View
        key={String(item.notification_id)}
        style={[
          styles.notificationCard,
          item.is_read ? styles.notificationRead : styles.notificationUnread,
        ]}
      >
        <View style={styles.notificationIconBox}>
          <Text style={styles.notificationIcon}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.notificationType}>
            {(item.notification_type || 'notification').replace('_', ' ').toUpperCase()}
          </Text>

          <Text style={styles.notificationMessage}>
            {item.message || 'No message provided.'}
          </Text>

          <Text style={styles.notificationDate}>
            Ticket #{item.ticket_id} •{' '}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </Text>
        </View>

        {!item.is_read ? (
          <TouchableOpacity
            style={styles.tickButton}
            onPress={() => handleMarkAsRead(item.notification_id)}
          >
            <Text style={styles.tickButtonText}>✓</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readBadge}>
            <Text style={styles.readBadgeText}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        <View style={styles.headerTop}>
          <View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏛 CAMPUSCARE</Text>
            </View>
            <Text style={styles.headerSub}>Facility Manager Portal</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{username} 👋</Text>

        <View style={styles.statsRow}>
          <StatPill label="Total" value={counts.total} color={C.gold} />
          <StatPill label="Pending" value={counts.pending} color={C.orange} />
          <StatPill label="Active" value={counts.active} color={C.teal} />
          <StatPill label="Done" value={counts.resolved} color={C.green} />
        </View>
      </View>

      {activeTab === 'dashboard' && (
        <>
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search issues by title, category, status, priority or ticket..."
                placeholderTextColor="#CBD5E1"
                value={searchInput}
                onChangeText={setSearchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />

              {searchInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                >
                  <Text style={{ color: '#CBD5E1', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>STATUS</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingRight: 16 }}
            >
              {STATUS_FILTERS.map(item => {
                const active = statusF === item;
                const meta = STATUS_META[item];

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: meta?.color || C.navy,
                        borderColor: meta?.color || C.navy,
                      },
                    ]}
                    onPress={() => setStatusF(item)}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>
                      {item === 'All' ? '🗂 All' : `${meta?.dot} ${meta?.label}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.filterWrap, { marginTop: 4 }]}>
            <Text style={styles.filterLabel}>CATEGORY</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingRight: 16 }}
            >
              {CATEGORY_FILTERS.map(item => {
                const active = categoryF === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      active && { backgroundColor: C.teal, borderColor: C.teal },
                    ]}
                    onPress={() => setCategoryF(item)}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>
                      {item === 'All' ? '🗂 All' : `${CAT_ICONS[item] || '📋'} ${item}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.resultsBar}>
            <Text style={styles.resultsText}>
              {filtered.length} issue{filtered.length !== 1 ? 's' : ''} found
            </Text>

            <TouchableOpacity onPress={loadAllData}>
              <Text style={styles.refreshBtn}>↺ Refresh</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>

              <TouchableOpacity onPress={fetchIssues} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeTab === 'workers' && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {workers.length} worker{workers.length !== 1 ? 's' : ''} found
          </Text>

          <TouchableOpacity onPress={fetchWorkers}>
            <Text style={styles.refreshBtn}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'notifications' && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} found
            {unreadCount > 0 ? ` • ${unreadCount} unread` : ''}
          </Text>

          <TouchableOpacity onPress={fetchNotifications}>
            <Text style={styles.refreshBtn}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderContent = () => {
    if (activeTab === 'workers') {
      if (workers.length === 0) {
        return renderEmpty('👷', 'No workers found', 'Create worker accounts first');
      }

      return workers.map(renderWorkerCard);
    }

    if (activeTab === 'notifications') {
      if (notifications.length === 0) {
        return renderEmpty(
          '🔔',
          'No notifications found',
          'Notifications will appear after assignments, status updates, and completions'
        );
      }

      return notifications.map(renderNotificationCard);
    }

    if (filtered.length === 0) {
      return renderEmpty('📭', 'No issues found', 'Try adjusting your filters or search');
    }

    return filtered.map(renderIssueCard);
  };

  const renderEmpty = (icon, title, subtitle) => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );

  if (loading) return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Fetching dashboard...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderHeader()}
        {renderContent()}
      </ScrollView>

      <View style={styles.navBar}>
        {[
          { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { key: 'workers', icon: '👷', label: 'Workers' },
          { key: 'notifications', icon: '🔔', label: 'Notifications' },
        ].map(n => {
          const active = activeTab === n.key;

          return (
            <TouchableOpacity
              key={n.key}
              style={styles.navItem}
              onPress={() => setActiveTab(n.key)}
            >
              <View>
                <Text style={styles.navIcon}>{n.icon}</Text>

                {n.key === 'notifications' && unreadCount > 0 && (
                  <View style={styles.unreadDot}>
                    <Text style={styles.unreadDotText}>{unreadCount}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.navLabel, active && { color: C.navy }]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function StatPill({ label, value, color }) {
  return (
    <View style={[styles.statPill, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F4EF' },
  scroll: { flex: 1 },

  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4EF',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
  },

  header: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(240,165,0,0.12)',
  },
  deco2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10,147,150,0.18)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 1,
  },
  badge: {
    backgroundColor: 'rgba(240,165,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(240,165,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    color: '#F0A500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    zIndex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    zIndex: 1,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  searchWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0B1F3A',
  },

  filterWrap: {
    paddingLeft: 16,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  refreshBtn: {
    fontSize: 12,
    color: '#0B1F3A',
    fontWeight: '700',
  },

  errorBox: {
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  list: {
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 14,
    borderLeftWidth: 4,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B1F3A',
    maxWidth: 130,
  },
  cardId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusDot: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  cardDate: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  tapHintRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tapHintText: {
    fontSize: 12,
    color: '#0B1F3A',
    fontWeight: '700',
    textAlign: 'right',
  },

  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  workerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerIcon: {
    fontSize: 22,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B1F3A',
  },
  workerEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  workerId: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  workerStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  workerStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#F0A500',
  },
  notificationRead: {
    borderLeftWidth: 4,
    borderLeftColor: '#CBD5E1',
    opacity: 0.78,
  },
  notificationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationType: {
    fontSize: 11,
    color: '#0B1F3A',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  notificationDate: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 5,
  },
  tickButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0B1F3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  readBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readBadgeText: {
    color: '#15803D',
    fontSize: 18,
    fontWeight: '900',
  },

  empty: {
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1F3A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unreadDot: {
    position: 'absolute',
    top: -5,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});
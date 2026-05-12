import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getUser,
  clearAuth,
  getAllIssues,
  getWorkers,
  updateWorkerStatus,
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

const STATUS_FILTERS = ['All', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];

const CATEGORY_FILTERS = [
  'All',
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Furniture',
  'Air Conditioning',
];

const DATE_FILTERS = [
  'All',
  'Today',
  'Last 7 Days',
  'Last 30 Days',
];

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

const getNotificationIcon = (notification) => {
  const type = notification.notification_type || notification.type;

  if (type === 'assignment') return '👷';
  if (type === 'completion') return '✅';
  if (type === 'status_change') return '🔄';

  return '🔔';
};

export default function FMDashboardScreen({ route, navigation }) {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'dashboard');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('All');
  const [categoryF, setCategoryF] = useState('All');
  const [dateF, setDateF] = useState('All');

  const [error, setError] = useState(null);
  const [username, setUsername] = useState('Manager');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab, route?.params?.refreshKey]);

  useFocusEffect(
    useCallback(() => {
      loadAllData(false);
    }, [])
  );

  const loadUser = async () => {
    const u = await getUser();
    if (u) setUsername(u.username || 'Manager');
  };

  const loadAllData = async (showMainLoader = true) => {
    if (showMainLoader) setLoading(true);

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
      const data = await getAllIssues({});
      const list = Array.isArray(data) ? data : data.issues || [];
      setIssues(list);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData(false);
  }, []);

  const statusCounts = useMemo(() => {
    return {
      All: issues.length,
      pending: issues.filter(i => i.status === 'pending').length,
      assigned: issues.filter(i => i.status === 'assigned').length,
      in_progress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length,
    };
  }, [issues]);

  const filtered = useMemo(() => {
    let r = [...issues];

    if (statusF !== 'All') {
      r = r.filter(i => i.status === statusF);
    }

    if (categoryF !== 'All') {
      r = r.filter(i => getCategoryName(i) === categoryF);
    }

    if (dateF !== 'All') {
      const now = new Date();

      r = r.filter(i => {
        if (!i.created_at) return false;

        const issueDate = new Date(i.created_at);

        if (dateF === 'Today') {
          return issueDate.toDateString() === now.toDateString();
        }

        if (dateF === 'Last 7 Days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return issueDate >= sevenDaysAgo;
        }

        if (dateF === 'Last 30 Days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return issueDate >= thirtyDaysAgo;
        }

        return true;
      });
    }

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();

      r = r.filter(i => {
        const id = String(i.ticket_id || i.id || '');
        const title = String(i.title || '').toLowerCase();
        const description = String(i.description || '').toLowerCase();
        const category = String(getCategoryName(i)).toLowerCase();
        const priority = String(i.priority || '').toLowerCase();
        const status = String(i.status || '').toLowerCase();
        const worker = String(i.assigned_worker || i.assigned_worker_username || i.worker_username || '').toLowerCase();

        return (
          id.includes(keyword) ||
          title.includes(keyword) ||
          description.includes(keyword) ||
          category.includes(keyword) ||
          priority.includes(keyword) ||
          status.includes(keyword) ||
          worker.includes(keyword)
        );
      });
    }

    return r;
  }, [issues, statusF, categoryF, dateF, search]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWorkerStatusChange = async (workerId, isActive) => {
    try {
      await updateWorkerStatus(workerId, isActive);
      await fetchWorkers();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update worker status.');
    }
  };

  const openIssue = (id) => {
    navigation.navigate('FMIssueDetail', { issueId: id });
  };

  const renderHeader = () => (
    <>
      <View style={styles.topHeader}>
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🏛 CAMPUSCARE</Text>
            </View>
            <Text style={styles.portalText}>Facility Manager Portal</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.welcomeSmall}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{username} 👋</Text>
      </View>

      {activeTab === 'dashboard' && (
        <>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search issues by title, category, status, priority or ticket..."
              placeholderTextColor="#CBD5E1"
              value={searchInput}
              onChangeText={setSearchInput}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput('');
                  setSearch('');
                }}
              >
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>STATUS</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 18 }}
            >
              {STATUS_FILTERS.map(item => {
                const active = statusF === item;
                const meta = STATUS_META[item];
                const count = statusCounts[item] || 0;

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
                      {item === 'All' ? `🗂 All (${count})` : `${meta?.dot} ${meta?.label} (${count})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>CATEGORY</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 18 }}
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

          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>DATE</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 18 }}
            >
              {DATE_FILTERS.map(item => {
                const active = dateF === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      active && { backgroundColor: C.gold, borderColor: C.gold },
                    ]}
                    onPress={() => setDateF(item)}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>
                      {item === 'All' ? '📅 All Dates' : `📅 ${item}`}
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

            <TouchableOpacity onPress={() => loadAllData(false)}>
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
        onPress={() => openIssue(id)}
        activeOpacity={0.82}
      >
        <View style={styles.cardRow1}>
          <View style={styles.cardLeft}>
            <View style={[styles.catBox, { backgroundColor: bg }]}>
              <Text style={styles.catIcon}>{icon}</Text>
            </View>

            <View style={{ flex: 1 }}>
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
            <Text style={[styles.statusLabel, { color: s.color }]}>
              {s.dot} {s.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.cardDetails}>
          <Text style={styles.detailLine}>
            👷 Assigned worker: {item.assigned_worker || item.assigned_worker_username || item.worker_username || 'Not assigned'}
          </Text>

          <Text style={styles.detailLine}>
            🗓 Submission date: {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
          </Text>

          <Text style={styles.detailLine}>
            🏷 Priority: {item.priority ? item.priority.toUpperCase() : 'MEDIUM'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWorkerCard = (worker) => {
    const isActive = worker.is_active !== false;

    return (
      <View key={String(worker.user_id)} style={styles.workerCard}>
        <View style={styles.workerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>👷 {worker.username}</Text>
            <Text style={styles.workerEmail}>{worker.email}</Text>
          </View>

          <View
            style={[
              styles.workerStatusPill,
              {
                backgroundColor: isActive ? '#F0FDF4' : '#FEF2F2',
                borderColor: isActive ? '#86EFAC' : '#FECACA',
              },
            ]}
          >
            <Text
              style={[
                styles.workerStatusText,
                { color: isActive ? '#15803D' : '#DC2626' },
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.workerButtonRow}>
          <TouchableOpacity
            style={[
              styles.workerActionBtn,
              !isActive ? styles.workerActiveBright : styles.workerInactiveDull,
            ]}
            onPress={() => handleWorkerStatusChange(worker.user_id, true)}
            disabled={isActive}
          >
            <Text
              style={[
                styles.workerActionText,
                { color: !isActive ? '#15803D' : '#94A3B8' },
              ]}
            >
              Activate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.workerActionBtn,
              isActive ? styles.workerDeactiveBright : styles.workerInactiveDull,
            ]}
            onPress={() => handleWorkerStatusChange(worker.user_id, false)}
            disabled={!isActive}
          >
            <Text
              style={[
                styles.workerActionText,
                { color: isActive ? '#DC2626' : '#94A3B8' },
              ]}
            >
              Deactivate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderNotificationCard = (n) => {
    const id = n.notification_id || n.id;

    return (
      <TouchableOpacity
        key={String(id)}
        style={[
          styles.notificationCard,
          !n.is_read && { borderLeftColor: C.gold, backgroundColor: '#FFFBEB' },
        ]}
        onPress={() => handleMarkAsRead(id)}
        activeOpacity={0.85}
      >
        <Text style={styles.notifIcon}>{getNotificationIcon(n)}</Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>
            {n.title || n.message || 'Notification'}
          </Text>

          {n.message && n.title && (
            <Text style={styles.notifMsg}>{n.message}</Text>
          )}

          <Text style={styles.notifDate}>
            {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
          </Text>
        </View>

        {!n.is_read && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = (icon, title, subtitle) => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
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

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={styles.loadingText}>Fetching dashboard...</Text>
        </View>
      </View>
    );
  }

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
              onPress={() => {
                setActiveTab(n.key);
                loadAllData(false);
              }}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingBottom: 110,
  },
  topHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(10,147,150,0.18)',
    left: -65,
    bottom: -90,
  },
  deco2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(240,165,0,0.10)',
    right: -85,
    top: -80,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(240,165,0,0.45)',
    backgroundColor: 'rgba(240,165,0,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoText: {
    color: C.gold,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11,
  },
  portalText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    fontSize: 13,
  },
  signOutBtn: {
    minWidth: 96,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#fff',
    fontWeight: '800',
  },
  welcomeSmall: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 18,
  },
  welcomeName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
  },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: C.navy,
    fontSize: 14,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '900',
    padding: 6,
  },
  filterWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    color: C.slate,
    fontWeight: '800',
    fontSize: 13,
  },
  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    color: C.slate,
    fontWeight: '800',
  },
  refreshBtn: {
    color: C.navy,
    fontWeight: '900',
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: C.red,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: C.red,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '900',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 22,
  },
  cardTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 3,
  },
  cardId: {
    color: C.slate,
    fontWeight: '700',
    fontSize: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusLabel: {
    fontWeight: '900',
    fontSize: 12,
  },
  cardDesc: {
    color: C.slate,
    lineHeight: 20,
    marginTop: 14,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    marginTop: 14,
    paddingTop: 12,
    gap: 6,
  },
  detailLine: {
    color: C.slate,
    fontSize: 13,
    fontWeight: '800',
  },
  workerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0',
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  workerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  workerName: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 18,
  },
  workerEmail: {
    color: C.slate,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 4,
  },
  workerStatusPill: {
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  workerStatusText: {
    fontWeight: '900',
    fontSize: 13,
  },
  workerButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  workerActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  workerActiveBright: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  workerDeactiveBright: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  workerInactiveDull: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.55,
  },
  workerActionText: {
    fontWeight: '900',
    fontSize: 15,
  },
  notificationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifIcon: {
    fontSize: 24,
  },
  notifTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 14,
  },
  notifMsg: {
    color: C.slate,
    marginTop: 4,
    lineHeight: 18,
  },
  notifDate: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.gold,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  emptyTitle: {
    color: C.navy,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  emptySub: {
    color: C.slate,
    textAlign: 'center',
    marginTop: 6,
  },
  navBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 23,
    textAlign: 'center',
  },
  navLabel: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  unreadDot: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: C.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: C.slate,
    fontWeight: '800',
  },
});
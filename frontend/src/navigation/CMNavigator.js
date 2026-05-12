import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import {
  getUser,
  clearAuth,
  getMyIssues,
  getMyNotifications,
  markNotificationAsRead,
} from '../services/api';

const Stack = createNativeStackNavigator();

const C = {
  navy: '#0B1F3A',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
  green: '#15803D',
};

const STATUS_META = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '⏳' },
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: '👤' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', icon: '🔧' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', icon: '✅' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', icon: '🔒' },
};

const getNotificationIcon = (type) => {
  if (type === 'assignment') return '👷';
  if (type === 'completion') return '✅';
  if (type === 'status_change') return '🔄';
  if (type === 'comment') return '💬';
  return '🔔';
};

function CommunityHome({ navigation }) {
  const [username, setUsername] = useState('Member');
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('issues');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const normalizeList = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key];
    }

    return [];
  };

  const loadData = async () => {
    try {
      const user = await getUser();
      if (user) setUsername(user.username || 'Member');

      const [issuesData, notifData] = await Promise.all([
        getMyIssues(),
        getMyNotifications(),
      ]);

      const issueList = normalizeList(issuesData, ['issues', 'tickets', 'data']);
      const notifList = normalizeList(notifData, ['notifications', 'data']);

      setIssues(issueList);
      setNotifications(notifList);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load member data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();

          const rootNav = navigation.getParent() || navigation;
          rootNav.replace('Login');
        },
      },
    ]);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not mark notification as read.');
    }
  };

  const renderIssueCard = (item) => {
    const id = item.ticket_id || item.id;
    const status = STATUS_META[item.status] || STATUS_META.pending;

    return (
      <View key={String(id)} style={[styles.card, { borderLeftColor: status.border }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title || 'Issue'}</Text>
            <Text style={styles.cardId}>Ticket #{id}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.icon} {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        <Text style={styles.cardMeta}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
        </Text>
      </View>
    );
  };

  const renderNotificationCard = (n) => {
    const id = n.notification_id || n.id;
    const type = n.notification_type || n.type;

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
        <Text style={styles.notifIcon}>{getNotificationIcon(type)}</Text>

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading member portal...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.navy}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>🏛 CAMPUSCARE</Text>
              </View>

              <Text style={styles.portalText}>Community Member Portal</Text>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.welcomeSmall}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{username} 👋</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'issues' && styles.tabActive]}
            onPress={() => setActiveTab('issues')}
          >
            <Text style={[styles.tabText, activeTab === 'issues' && styles.tabTextActive]}>
              My Issues ({issues.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
              Notifications ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {activeTab === 'issues' ? 'My submitted issues' : 'My notifications'}
          </Text>

          <TouchableOpacity onPress={loadData}>
            <Text style={styles.refreshText}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'issues' && (
          issues.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No issues yet</Text>
              <Text style={styles.emptySub}>Your submitted issues will appear here.</Text>
            </View>
          ) : (
            issues.map(renderIssueCard)
          )
        )}

        {activeTab === 'notifications' && (
          notifications.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                Updates will appear here when your issue status changes.
              </Text>
            </View>
          ) : (
            notifications.map(renderNotificationCard)
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function CMNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CMHome" component={CommunityHome} />
    </Stack.Navigator>
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
  content: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: C.slate,
    fontWeight: '800',
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  headerTop: {
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: C.navy,
  },
  tabText: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsText: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 16,
  },
  refreshText: {
    color: C.teal,
    fontWeight: '900',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
  },
  cardId: {
    color: C.slate,
    fontWeight: '700',
    marginTop: 3,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontWeight: '900',
    fontSize: 12,
  },
  cardDesc: {
    color: C.slate,
    marginTop: 14,
    lineHeight: 20,
  },
  cardMeta: {
    color: C.slate,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
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
    alignItems: 'center',
    gap: 12,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    fontWeight: '600',
  },
  notifDate: {
    color: C.slate,
    fontSize: 11,
    marginTop: 6,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.gold,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 26,
  },
  emptyIcon: {
    fontSize: 54,
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
    lineHeight: 20,
  },
});
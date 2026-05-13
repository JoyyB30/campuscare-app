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
import { useFocusEffect } from '@react-navigation/native';

import {
  getAssignedIssues,
  getUser,
  clearAuth,
} from '../../services/api';

const C = {
  navy: '#0B1F3A',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
};

const STATUS_META = {
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: '👤' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', icon: '🔧' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', icon: '✅' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', icon: '🔒' },
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '⏳' },
};

const CATEGORY_ID_TO_NAME = {
  1: 'Electrical',
  2: 'Plumbing',
  3: 'Furniture',
  4: 'Cleaning',
  5: 'Air Conditioning',
};

const CAT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🔧',
  Cleaning: '🧹',
  Furniture: '🪑',
  'Air Conditioning': '❄️',
};

const getCategoryName = (item) => {
  return item.category || CATEGORY_ID_TO_NAME[item.category_id] || 'Issue';
};

export default function AssignedIssuesScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [username, setUsername] = useState('Worker');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const user = await getUser();
      if (user) setUsername(user.username || 'Worker');

      const data = await getAssignedIssues();
      const list = Array.isArray(data) ? data : data.issues || data.tickets || [];
      setIssues(list);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load assigned issues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeIssues = useMemo(() => {
    return issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  }, [issues]);

  const completedCount = useMemo(() => {
    return issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  }, [issues]);

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

  const renderIssueCard = (item) => {
    const id = item.ticket_id || item.id;
    const status = STATUS_META[item.status] || STATUS_META.assigned;
    const category = getCategoryName(item);
    const icon = CAT_ICONS[category] || '📋';

    return (
      <TouchableOpacity
        key={String(id)}
        style={[styles.card, { borderLeftColor: status.border }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('WorkerIssueDetail', { issueId: id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.cardTitle}>
                {item.title || category}
              </Text>
              <Text style={styles.ticketId}>Ticket #{id}</Text>
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.icon} {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.meta}>
            📍 {item.location || item.location_name || 'Campus location'}
          </Text>

          <Text style={styles.meta}>
            🏷 {(item.priority || 'medium').toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
      >
        <View style={styles.header}>
          <View style={styles.deco1} />
          <View style={styles.deco2} />

          <View style={styles.headerTop}>
            <View>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>🏛 CAMPUSCARE</Text>
              </View>
              <Text style={styles.portalText}>Worker Portal</Text>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.welcomeSmall}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{username} 👋</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{activeIssues.length}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNum}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>Tasks still not done</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.refreshText}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>

        {activeIssues.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No active tasks</Text>
            <Text style={styles.emptySub}>Finished tasks are removed from this list.</Text>
          </View>
        ) : (
          activeIssues.map(renderIssueCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },
  content: { paddingBottom: 30 },
  center: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 10, color: C.slate, fontWeight: '800' },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
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
  welcomeSmall: { color: 'rgba(255,255,255,0.72)', fontSize: 18 },
  welcomeName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statNum: { color: C.navy, fontSize: 24, fontWeight: '900' },
  statLabel: { color: C.slate, fontSize: 11, fontWeight: '900', marginTop: 3 },
  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsText: { color: C.navy, fontWeight: '900', fontSize: 16 },
  refreshText: { color: C.teal, fontWeight: '900' },
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
    alignItems: 'flex-start',
    gap: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconText: { fontSize: 22 },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  ticketId: {
    color: C.slate,
    fontWeight: '700',
    marginTop: 3,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: 145,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 12,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  description: {
    color: C.slate,
    marginTop: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    marginTop: 14,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  meta: {
    color: C.slate,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 26 },
  emptyIcon: { fontSize: 54 },
  emptyTitle: { color: C.navy, fontSize: 22, fontWeight: '900', marginTop: 10 },
  emptySub: { color: C.slate, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
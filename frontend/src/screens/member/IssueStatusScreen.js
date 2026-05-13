// src/screens/community/IssueStatusScreen.js
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyIssues, getMyNotifications, markNotificationAsRead } from '../../services/api';

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
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: '●' },
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', dot: '◆' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', dot: '◐' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', dot: '✓' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', dot: '■' },
};

const TABS = ['Overview', 'Notifications'];

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.statusText, { color: s.color }]}>{s.dot} {s.label}</Text>
    </View>
  );
}

export default function IssueStatusScreen({ navigation }) {
  const [tab, setTab] = useState(0);
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [issueData, notifData] = await Promise.all([getMyIssues(), getMyNotifications()]);
      const issuesList = issueData?.issues || issueData?.data || (Array.isArray(issueData) ? issueData : []);
      const notifList = notifData?.notifications || notifData?.data || (Array.isArray(notifData) ? notifData : []);
      setIssues(Array.isArray(issuesList) ? issuesList : []);
      setNotifications(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
      console.log('Load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => { setRefreshing(true); load(); };

  const statusCounts = issues.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => (n.notification_id === id || n.id === id) ? { ...n, is_read: true } : n));
    } catch (err) { console.log(err); }
  };

  const getIcon = (type) => {
    if (type === 'assignment') return '👷';
    if (type === 'completion') return '✅';
    if (type === 'status_change') return '🔄';
    return '🔔';
  };

  const renderIssue = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('IssueDetail', { issueId: item.ticket_id || item.id })} activeOpacity={0.82}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardId}>Ticket #{item.ticket_id || item.id}</Text>
            <Text style={styles.cardTitle}>{item.title || 'Issue'}</Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderNotification = ({ item }) => {
    const id = item.notification_id || item.id;
    return (
      <TouchableOpacity
        onPress={() => { if (!item.is_read) markRead(id); if (item.ticket_id) navigation.navigate('IssueDetail', { issueId: item.ticket_id }); }}
        activeOpacity={0.85}
      >
        <View style={[styles.notifCard, !item.is_read && styles.notifUnread]}>
          <Text style={styles.notifIcon}>{getIcon(item.notification_type)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.notifText}>{item.message || item.title}</Text>
            <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Status</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((item, idx) => (
          <TouchableOpacity key={item} style={[styles.tab, tab === idx && styles.tabActive]} onPress={() => setTab(idx)}>
            <Text style={[styles.tabText, tab === idx && styles.tabTextActive]}>
              {item}{idx === 1 && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 0 ? (
        <FlatList
          data={issues}
          keyExtractor={item => String(item.ticket_id || item.id)}
          renderItem={renderIssue}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTotal}>{issues.length}</Text>
              <Text style={styles.summaryLabel}>Total Issues</Text>
              <View style={styles.progressBar}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  count > 0 && (
                    <View key={status} style={[styles.progressSegment, { flex: count / issues.length, backgroundColor: STATUS_META[status]?.color || C.slate }]} />
                  )
                ))}
              </View>
              <View style={styles.legend}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_META[status]?.color || C.slate }]} />
                    <Text style={styles.legendText}>{STATUS_META[status]?.label}: {count}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={!loading && (
            <View style={styles.empty}><Text style={{ fontSize: 52 }}>📊</Text><Text style={styles.emptyTitle}>No issues</Text></View>
          )}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.notification_id || item.id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          ListHeaderComponent={
            unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={() => notifications.filter(n => !n.is_read).forEach(n => markRead(n.notification_id || n.id))}>
                <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
              </TouchableOpacity>
            )
          }
          ListEmptyComponent={!loading && (
            <View style={styles.empty}><Text style={{ fontSize: 52 }}>🔔</Text><Text style={styles.emptyTitle}>No notifications</Text></View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: C.navy,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: C.navy },
  tabText: { fontWeight: '700', color: C.slate },
  tabTextActive: { color: '#fff' },
  
  list: { padding: 16, paddingBottom: 40 },
  
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.navy,
  },
  summaryTotal: { fontSize: 48, fontWeight: '900', color: C.navy },
  summaryLabel: { color: C.slate, fontWeight: '700', marginBottom: 12 },
  progressBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', width: '100%', backgroundColor: C.border },
  progressSegment: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '700', color: C.slate },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardId: { fontSize: 12, fontWeight: '700', color: C.teal, marginBottom: 4 },
  cardTitle: { fontWeight: '900', color: C.navy, marginBottom: 4 },
  cardDate: { fontSize: 12, color: C.slate },
  statusPill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontWeight: '900', fontSize: 12 },
  
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
  },
  notifUnread: { borderLeftColor: C.gold, backgroundColor: '#FFFBEB' },
  notifIcon: { fontSize: 24 },
  notifText: { fontWeight: '700', color: C.navy, marginBottom: 4 },
  notifDate: { fontSize: 11, color: '#94A3B8' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold, marginTop: 4 },
  
  markAllBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  markAllText: { color: '#fff', fontWeight: '800' },
  
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginTop: 10 },
});
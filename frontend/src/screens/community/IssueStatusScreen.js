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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getMyIssues, getMyNotifications, markNotificationAsRead } from '../../services/api';
import { C, STATUS_META, formatDateTime, getId, normalizeIssueList, normalizeNotifications } from './common';

const TABS = ['Overview', 'Notifications'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.border }]}> 
      <Text style={[styles.statusText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
    </View>
  );
}

function StatusProgress({ statusCounts, total }) {
  const order = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
  return (
    <View style={styles.progressBar}>
      {order.map((status) => {
        const count = statusCounts[status] || 0;
        if (!count || total === 0) return null;
        return <View key={status} style={[styles.progressSegment, { flex: count / total, backgroundColor: STATUS_META[status].color }]} />;
      })}
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
      setIssues(normalizeIssueList(issueData));
      setNotifications(normalizeNotifications(notifData));
    } catch (err) {
      console.log('Issue status load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const statusCounts = issues.reduce((acc, issue) => {
    const s = issue.status || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => ((n.notification_id || n.id) === notificationId ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.log('mark read error:', err.message);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markNotificationAsRead(n.notification_id || n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const notificationIcon = (type) => {
    if (type === 'assignment') return '👷';
    if (type === 'completion') return '✅';
    if (type === 'status_change') return '🔄';
    if (type === 'comment') return '💬';
    return '🔔';
  };

  const renderIssue = ({ item }) => {
    const id = getId(item);
    return (
      <TouchableOpacity onPress={() => navigation.navigate('IssueDetail', { issueId: id })} activeOpacity={0.86}>
        <View style={styles.issueRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.issueId}>Ticket #{id}</Text>
            <Text style={styles.issueTitle} numberOfLines={1}>{item.title || 'Issue'}</Text>
            <Text style={styles.issueDate}>{formatDateTime(item.created_at)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }) => {
    const notificationId = item.notification_id || item.id;
    const ticketId = item.ticket_id;
    return (
      <TouchableOpacity
        onPress={() => {
          if (!item.is_read) markRead(notificationId);
          if (ticketId) navigation.navigate('IssueDetail', { issueId: ticketId });
        }}
        activeOpacity={0.86}
      >
        <View style={[styles.notificationCard, !item.is_read && styles.notificationUnread]}>
          <Text style={styles.notificationIcon}>{notificationIcon(item.notification_type || item.type)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationText}>{item.message || item.title || 'Notification'}</Text>
            <Text style={styles.notificationDate}>{formatDateTime(item.created_at)}{ticketId ? ` • Ticket #${ticketId}` : ''}</Text>
          </View>
          {!item.is_read ? <View style={styles.unreadDot} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.header}>
        <View style={styles.decoLarge} />
        <View style={styles.decoSmall} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Status</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>🏛 CAMPUSCARE</Text></View>
        <Text style={styles.headerSub}>Track your submitted issues and updates.</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.tabBar}>
          {TABS.map((item, index) => (
            <TouchableOpacity key={item} style={[styles.tab, tab === index && styles.tabActive]} onPress={() => setTab(index)}>
              <Text style={[styles.tabText, tab === index && styles.tabTextActive]}>{item}{index === 1 && unreadCount > 0 ? ` (${unreadCount})` : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 0 ? (
          <FlatList
            data={issues}
            keyExtractor={(item) => String(getId(item))}
            renderItem={renderIssue}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
            ListHeaderComponent={
              <View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTotal}>{issues.length}</Text>
                  <Text style={styles.summaryLabel}>Total Issues Submitted</Text>
                  <StatusProgress statusCounts={statusCounts} total={issues.length} />
                </View>
                <Text style={styles.sectionTitle}>All Issues Status</Text>
              </View>
            }
            ListEmptyComponent={!loading ? <EmptyState icon="📊" title="No issues to track" text="Submit an issue to start tracking its status." /> : null}
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.notification_id || item.id)}
            renderItem={renderNotification}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
            ListHeaderComponent={unreadCount > 0 ? <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}><Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text></TouchableOpacity> : null}
            ListEmptyComponent={!loading ? <EmptyState icon="🔔" title="No notifications" text="You will be notified when your issues are updated." /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 18 : 14, paddingBottom: 26, overflow: 'hidden' },
  decoLarge: { position: 'absolute', top: -70, right: -80, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)' },
  decoSmall: { position: 'absolute', bottom: -70, left: -65, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(10,147,150,0.20)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, zIndex: 2 },
  headerSide: { flex: 1 },
  backText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  headerTitle: { flex: 1.6, color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.16)', borderWidth: 1.5, borderColor: 'rgba(240,165,0,0.45)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, zIndex: 2 },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12, zIndex: 2 },
  body: { flex: 1, backgroundColor: C.cream, paddingTop: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 8, marginHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  tabActive: { backgroundColor: C.navy },
  tabText: { color: C.slate, fontWeight: '900' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 34 },
  summaryCard: { backgroundColor: C.white, borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 16, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryTotal: { color: C.navy, fontSize: 54, fontWeight: '900', lineHeight: 60 },
  summaryLabel: { color: C.slate, fontWeight: '800', marginBottom: 14 },
  progressBar: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: C.border, flexDirection: 'row' },
  progressSegment: { height: '100%' },
  sectionTitle: { color: C.navy, fontWeight: '900', fontSize: 18, marginBottom: 10 },
  issueRow: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  issueId: { color: C.teal, fontWeight: '900', fontSize: 12, marginBottom: 3 },
  issueTitle: { color: C.navy, fontWeight: '900', marginBottom: 3 },
  issueDate: { color: C.slate, fontWeight: '700', fontSize: 12 },
  statusPill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText: { fontWeight: '900', fontSize: 11 },
  notificationCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  notificationUnread: { borderColor: C.teal, backgroundColor: '#F0FDFA' },
  notificationIcon: { fontSize: 22 },
  notificationText: { color: C.navy, fontWeight: '800', lineHeight: 20 },
  notificationDate: { color: C.slate, fontWeight: '700', fontSize: 12, marginTop: 6 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.teal, marginTop: 4 },
  markAllBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  markAllText: { color: '#fff', fontWeight: '900' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 90 },
  emptyIcon: { fontSize: 54, marginBottom: 12 },
  emptyTitle: { color: C.navy, fontWeight: '900', fontSize: 24, marginBottom: 6 },
  emptyText: { color: C.slate, fontWeight: '700', textAlign: 'center', fontSize: 15 },
});

// src/screens/community/MyIssuesScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyIssues } from '../../services/api';

const C = {
  navy: '#0B1F3A',
  navy2: '#162D4E',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
  green: '#2A9D8F',
};

const STATUS_META = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: '●' },
  assigned: { label: 'Assigned', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', dot: '◆' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', dot: '◐' },
  resolved: { label: 'Resolved', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', dot: '✓' },
  closed: { label: 'Closed', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', dot: '■' },
};

const FILTERS = ['all', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

// Helper to check if issue has unread updates
const hasUnreadUpdate = (issue) => {
  return issue.has_unread_update || (issue.comments && issue.comments.length > 0 && !issue.viewed);
};

// Helper to get comment count
const getCommentCount = (issue) => {
  if (issue.comments && Array.isArray(issue.comments)) return issue.comments.length;
  if (issue.worker_comments && Array.isArray(issue.worker_comments)) return issue.worker_comments.length;
  if (issue.updates && Array.isArray(issue.updates)) return issue.updates.length;
  return 0;
};

export default function MyIssuesScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getMyIssues();
      const list = data?.issues || data?.data || (Array.isArray(data) ? data : []);
      setIssues(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log('Load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    let result = [...issues];
    if (activeFilter !== 'all') result = result.filter(i => i.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        (i.title || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.category_name || i.category || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [issues, activeFilter, search]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }) => {
    const id = item.ticket_id || item.id;
    const s = STATUS_META[item.status] || STATUS_META.pending;
    const hasUpdate = hasUnreadUpdate(item);
    const commentCount = getCommentCount(item);

    return (
      <TouchableOpacity onPress={() => navigation.navigate('IssueDetail', { issueId: id })} activeOpacity={0.82}>
        <View style={[styles.card, { borderLeftColor: s.border }]}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.cardTitle}>{item.title || 'Issue'}</Text>
                {hasUpdate && (
                  <View style={styles.updateBadge}>
                    <Text style={styles.updateBadgeText}>New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardId}>Ticket #{id}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statusLabel, { color: s.color }]}>{s.dot} {s.label}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No description'}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>📅 {formatDate(item.created_at)}</Text>
              {item.photo_url && <Text style={styles.footerText}>📷 Photo</Text>}
            </View>
            {commentCount > 0 && (
              <Text style={styles.updateIndicator}>💬 {commentCount} update{commentCount !== 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusCount = (filter) => {
    if (filter === 'all') return issues.length;
    return issues.filter(i => i.status === filter).length;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Issues</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SubmitIssue')}>
          <Text style={styles.newText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search issues by title, category, or description..."
          placeholderTextColor={C.slate}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const active = activeFilter === item;
          const meta = item === 'all' ? { label: 'All', color: C.navy, dot: '🗂' } : STATUS_META[item];
          const count = getStatusCount(item);
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, active && { color: '#fff' }]}>
                {meta.dot} {meta.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>{filtered.length} of {issues.length} issues</Text>
        <TouchableOpacity onPress={load}><Text style={styles.refreshBtn}>↺ Refresh</Text></TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.ticket_id || item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 52 }}>📭</Text>
              <Text style={styles.emptyTitle}>No issues found</Text>
              <Text style={styles.emptySub}>{search ? 'Try a different search' : 'Tap + New to submit your first issue'}</Text>
            </View>
          )
        }
      />
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
  newText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  searchBox: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: C.navy },
  clearText: { color: '#94A3B8', fontSize: 16, fontWeight: '900', padding: 6 },
  
  filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterText: { color: C.slate, fontWeight: '800', fontSize: 13 },
  
  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: { color: C.slate, fontWeight: '800' },
  refreshBtn: { color: C.navy, fontWeight: '900' },
  
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  cardTitle: { 
    color: C.navy, 
    fontWeight: '900', 
    fontSize: 15, 
    marginBottom: 3 
  },
  cardId: { 
    color: C.slate, 
    fontWeight: '700', 
    fontSize: 12 
  },
  statusPill: { 
    borderWidth: 1, 
    borderRadius: 16, 
    paddingHorizontal: 10, 
    paddingVertical: 6 
  },
  statusLabel: { 
    fontWeight: '900', 
    fontSize: 12 
  },
  cardDesc: { 
    color: C.slate, 
    lineHeight: 20, 
    marginBottom: 12 
  },
  cardFooter: { 
    borderTopWidth: 1, 
    borderTopColor: '#EEF2F7', 
    paddingTop: 10 
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  footerText: { 
    color: C.slate, 
    fontSize: 12, 
    fontWeight: '700' 
  },
  updateIndicator: {
    color: C.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  updateBadge: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  updateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  
  empty: { 
    alignItems: 'center', 
    paddingTop: 60 
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: C.navy, 
    marginTop: 10 
  },
  emptySub: { 
    color: C.slate, 
    textAlign: 'center', 
    marginTop: 6 
  },
});
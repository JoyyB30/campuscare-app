import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  TextInput, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllIssues } from '../services/api';

// ── Design Tokens ─────────────────────────────────
const C = {
  navy:    '#0A2463',   // primary — deep university navy
  teal:    '#1B998B',   // accent — fresh teal
  gold:    '#E9C46A',   // highlight — warm gold
  bg:      '#F0F4F8',   // background
  white:   '#FFFFFF',
  card:    '#FFFFFF',
  text:    '#1A1A2E',
  sub:     '#5C6B7A',
  border:  '#DDE3EA',
  red:     '#E63946',
  green:   '#2DC653',
  orange:  '#F4A261',
  grey:    '#ADB5BD',
};

const STATUS_CONFIG = {
  'Pending':     { color: C.orange, bg: '#FFF3E0', icon: '⏳' },
  'In Progress': { color: C.teal,   bg: '#E0F5F3', icon: '🔧' },
  'Resolved':    { color: C.green,  bg: '#E6F7EC', icon: '✅' },
  'Closed':      { color: C.grey,   bg: '#F0F0F0', icon: '🔒' },
};

const STATUS_FILTERS   = ['All', 'Pending', 'In Progress', 'Resolved', 'Closed'];
const CATEGORY_FILTERS = ['All', 'Electrical', 'Plumbing', 'Cleaning', 'Furniture'];

export default function FMDashboardScreen({ navigation }) {
  const [issues,     setIssues]     = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('All');
  const [categoryF,  setCategoryF]  = useState('All');
  const [error,      setError]      = useState(null);
  const [username,   setUsername]   = useState('');

  useEffect(() => {
    loadUser();
    fetchIssues();
  }, []);

  useEffect(() => {
    applyFilters(issues, search, statusF, categoryF);
  }, [search, statusF, categoryF, issues]);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    if (stored) setUsername(JSON.parse(stored).username || 'Manager');
  };

  const fetchIssues = async () => {
    try {
      setError(null);
      const data = await getAllIssues();
      const list = Array.isArray(data) ? data : data.issues || [];
      setIssues(list);
      applyFilters(list, search, statusF, categoryF);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (list, s, st, cat) => {
    let r = [...list];
    if (st  !== 'All') r = r.filter(i => i.status   === st);
    if (cat !== 'All') r = r.filter(i => i.category === cat);
    if (s.trim())      r = r.filter(i =>
      (i.description || '').toLowerCase().includes(s.toLowerCase()) ||
      (i.location    || '').toLowerCase().includes(s.toLowerCase()) ||
      (i.category    || '').toLowerCase().includes(s.toLowerCase())
    );
    setFiltered(r);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchIssues(); }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const counts = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'Pending').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved:   issues.filter(i => i.status === 'Resolved').length,
  };

  const renderIssue = ({ item }) => {
    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG['Pending'];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('FMIssueDetail', { issueId: item.issue_id || item.id })}
        activeOpacity={0.88}
      >
        <View style={styles.cardTop}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category || 'General'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={styles.statusIcon}>{s.icon}</Text>
            <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description.'}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.cardMeta}>📍 {item.location || '—'}</Text>
          <Text style={styles.cardDate}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.navy} />
      <Text style={styles.loadingText}>Loading issues...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back,</Text>
          <Text style={styles.headerName}>{username} 👋</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <StatCard label="Total"       value={counts.total}      color={C.navy}   />
        <StatCard label="Pending"     value={counts.pending}    color={C.orange} />
        <StatCard label="In Progress" value={counts.inProgress} color={C.teal}   />
        <StatCard label="Resolved"    value={counts.resolved}   color={C.green}  />
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search issues..."
          placeholderTextColor={C.grey}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: C.grey, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Status Filters ── */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, statusF === item && styles.pillActiveBlue]}
            onPress={() => setStatusF(item)}
          >
            <Text style={[styles.pillText, statusF === item && styles.pillTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ── Category Filters ── */}
      <FlatList
        data={CATEGORY_FILTERS}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={[styles.filterRow, { marginTop: 4 }]}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, categoryF === item && styles.pillActiveTeal]}
            onPress={() => setCategoryF(item)}
          >
            <Text style={[styles.pillText, categoryF === item && styles.pillTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Issues</Text>
        <Text style={styles.sectionCount}>{filtered.length} found</Text>
      </View>

      {/* ── Error ── */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchIssues}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {filtered.length === 0 && !error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={styles.emptyText}>No issues found</Text>
          <Text style={styles.emptySub}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.issue_id || item.id)}
          renderItem={renderIssue}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:   { marginTop: 12, color: C.sub, fontSize: 14 },

  // Header
  header:        { backgroundColor: C.navy, paddingHorizontal: 20,
                   paddingTop: 16, paddingBottom: 20,
                   flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting:{ color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerName:    { color: C.white, fontSize: 20, fontWeight: '700', marginTop: 2 },
  logoutBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14,
                   paddingVertical: 7, borderRadius: 20 },
  logoutText:    { color: C.white, fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14,
                   backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  statCard:      { flex: 1, alignItems: 'center', borderTopWidth: 3, marginHorizontal: 4,
                   paddingTop: 8, backgroundColor: C.white, borderRadius: 8,
                   paddingBottom: 8,
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue:     { fontSize: 22, fontWeight: '800' },
  statLabel:     { fontSize: 10, color: C.sub, marginTop: 2, fontWeight: '500' },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', margin: 14,
                   backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14,
                   paddingVertical: 10, borderWidth: 1, borderColor: C.border,
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchIcon:    { fontSize: 16, marginRight: 8 },
  searchInput:   { flex: 1, fontSize: 14, color: C.text },

  // Filters
  filterRow:     { marginBottom: 4 },
  pill:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                   backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  pillActiveBlue:{ backgroundColor: C.navy, borderColor: C.navy },
  pillActiveTeal:{ backgroundColor: C.teal, borderColor: C.teal },
  pillText:      { fontSize: 12, color: C.sub, fontWeight: '500' },
  pillTextActive:{ color: C.white },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: C.text },
  sectionCount:  { fontSize: 13, color: C.sub },

  // Cards
  list:          { paddingHorizontal: 14, paddingBottom: 24 },
  card:          { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 10,
                   shadowColor: C.navy, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
                   borderLeftWidth: 4, borderLeftColor: C.navy },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryTag:   { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4,
                   borderRadius: 8 },
  categoryText:  { fontSize: 12, color: C.navy, fontWeight: '700' },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
                   paddingVertical: 4, borderRadius: 20, gap: 4 },
  statusIcon:    { fontSize: 11 },
  statusText:    { fontSize: 11, fontWeight: '700' },
  cardDesc:      { fontSize: 13, color: C.sub, lineHeight: 18, marginBottom: 10 },
  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta:      { fontSize: 12, color: C.grey },
  cardDate:      { fontSize: 11, color: C.grey },

  // Error
  errorBox:      { marginHorizontal: 14, padding: 14, backgroundColor: '#FFF3CD',
                   borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' },
  errorText:     { color: '#856404', fontSize: 13, flex: 1 },
  retryText:     { color: C.navy, fontWeight: '700', fontSize: 13 },

  emptyText:     { fontSize: 18, fontWeight: '600', color: C.text, marginTop: 10 },
  emptySub:      { fontSize: 13, color: C.grey, marginTop: 4 },
});

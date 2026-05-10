import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
  SafeAreaView, StatusBar, Platform, Alert,
} from 'react-native';
import { getUser, clearAuth, getAllIssues } from '../services/api';

// ── Tokens (match HTML mockup exactly) ────────────────────
const C = {
  navy:   '#0B1F3A',
  navy2:  '#162D4E',
  gold:   '#F0A500',
  teal:   '#0A9396',
  cream:  '#F8F4EF',
  white:  '#FFFFFF',
  slate:  '#64748B',
  border: '#E2E8F0',
  orange: '#E76F51',
  green:  '#2A9D8F',
};

// ── Status config (backend uses lowercase) ─────────────────
const STATUS_META = {
  pending:     { label: 'Pending',     color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: '●' },
  assigned:    { label: 'Assigned',    color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', dot: '◆' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', dot: '◐' },
  resolved:    { label: 'Resolved',    color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', dot: '✓' },
  closed:      { label: 'Closed',      color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', dot: '■' },
};

const CAT_ICONS = { Electrical:'⚡', Plumbing:'🔧', Cleaning:'🧹', Furniture:'🪑' };
const CAT_BG    = { Electrical:'#FFFBEB', Plumbing:'#ECFEFF', Cleaning:'#F0FDF4', Furniture:'#FFF7F5' };

const STATUS_FILTERS   = ['All', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];
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
  const [username,   setUsername]   = useState('Manager');

  useEffect(() => {
    loadUser();
    fetchIssues();
  }, []);

  useEffect(() => {
    applyFilters(issues, search, statusF, categoryF);
  }, [search, statusF, categoryF, issues]);

  const loadUser = async () => {
    const u = await getUser();
    if (u) setUsername(u.username || 'Manager');
  };

  const fetchIssues = async () => {
    try {
      setError(null);
      const data = await getAllIssues();
      const list = Array.isArray(data) ? data : (data.issues || []);
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
    if (st  !== 'All') r = r.filter(i => i.status    === st);
    if (cat !== 'All') r = r.filter(i => i.category  === cat);
    if (s.trim())      r = r.filter(i =>
      (i.title       || '').toLowerCase().includes(s.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(s.toLowerCase()) ||
      (i.category    || '').toLowerCase().includes(s.toLowerCase())
    );
    setFiltered(r);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchIssues(); }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await clearAuth();
        navigation.replace('Login');
      }},
    ]);
  };

  const counts = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'pending' || i.status === 'assigned').length,
    active:     issues.filter(i => i.status === 'in_progress').length,
    resolved:   issues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  };

  const renderCard = ({ item }) => {
    const id   = item.ticket_id || item.id;
    const s    = STATUS_META[item.status] || STATUS_META['pending'];
    const icon = CAT_ICONS[item.category] || '📋';
    const bg   = CAT_BG[item.category]   || '#F8FAFC';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: s.border }]}
        onPress={() => navigation.navigate('FMIssueDetail', { issueId: id })}
        activeOpacity={0.82}
      >
        {/* Top row */}
        <View style={styles.cardRow1}>
          <View style={styles.cardLeft}>
            <View style={[styles.catBox, { backgroundColor: bg }]}>
              <Text style={styles.catIcon}>{icon}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>
                {item.title || item.category || 'Issue'}
              </Text>
              <Text style={styles.cardId}>Ticket #{id}</Text>
            </View>
          </View>
          <View style={[styles.statusPill,
            { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusDot, { color: s.color }]}>{s.dot} </Text>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            🏷 {item.priority ? item.priority.toUpperCase() : 'MEDIUM'} priority
          </Text>
          <Text style={styles.cardDate}>
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-GB',
                  { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </Text>
        </View>

        {/* Tap hint */}
        <View style={styles.tapHintRow}>
          <Text style={styles.tapHintText}>Tap to manage →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Fetching issues...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── HEADER ────────────────────────────────── */}
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatPill label="Total"    value={counts.total}    color={C.gold}   />
          <StatPill label="Pending"  value={counts.pending}  color={C.orange} />
          <StatPill label="Active"   value={counts.active}   color={C.teal}   />
          <StatPill label="Done"     value={counts.resolved} color={C.green}  />
        </View>
      </View>

      {/* ── SEARCH ────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues..."
            placeholderTextColor="#CBD5E1"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: '#CBD5E1', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── STATUS FILTER ─────────────────────────── */}
      <View style={styles.filterWrap}>
        <Text style={styles.filterLabel}>STATUS</Text>
        <FlatList
          data={STATUS_FILTERS}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={{ gap: 6, paddingRight: 16 }}
          renderItem={({ item }) => {
            const active = statusF === item;
            const meta   = STATUS_META[item];
            return (
              <TouchableOpacity
                style={[styles.chip,
                  active && { backgroundColor: meta?.color || C.navy,
                               borderColor:   meta?.color || C.navy }]}
                onPress={() => setStatusF(item)}
              >
                <Text style={[styles.chipText, active && { color: '#fff' }]}>
                  {item === 'All' ? '🗂 All' : `${meta?.dot} ${meta?.label}`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── CATEGORY FILTER ───────────────────────── */}
      <View style={[styles.filterWrap, { marginTop: 4 }]}>
        <Text style={styles.filterLabel}>CATEGORY</Text>
        <FlatList
          data={CATEGORY_FILTERS}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={{ gap: 6, paddingRight: 16 }}
          renderItem={({ item }) => {
            const active = categoryF === item;
            return (
              <TouchableOpacity
                style={[styles.chip,
                  active && { backgroundColor: C.teal, borderColor: C.teal }]}
                onPress={() => setCategoryF(item)}
              >
                <Text style={[styles.chipText, active && { color: '#fff' }]}>
                  {item === 'All' ? '🗂 All' : `${CAT_ICONS[item] || '📋'} ${item}`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── RESULTS BAR ───────────────────────────── */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''} found
        </Text>
        <TouchableOpacity onPress={() => { setLoading(true); fetchIssues(); }}>
          <Text style={styles.refreshBtn}>↺ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* ── ERROR ─────────────────────────────────── */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchIssues} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── LIST ──────────────────────────────────── */}
      {filtered.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>📭</Text>
          <Text style={styles.emptyTitle}>No issues found</Text>
          <Text style={styles.emptySub}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.ticket_id || item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── NAV BAR ───────────────────────────────── */}
      <View style={styles.navBar}>
        {[
          { icon: '🏠', label: 'Dashboard', active: true  },
          { icon: '📋', label: 'Issues',    active: false },
          { icon: '👷', label: 'Workers',   active: false },
          { icon: '👤', label: 'Profile',   active: false },
        ].map(n => (
          <View key={n.label} style={styles.navItem}>
            <Text style={styles.navIcon}>{n.icon}</Text>
            <Text style={[styles.navLabel, n.active && { color: C.navy }]}>{n.label}</Text>
          </View>
        ))}
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
  root:          { flex: 1, backgroundColor: '#F8F4EF' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4EF' },
  loadingCard:   { backgroundColor: '#fff', borderRadius: 20, padding: 32,
                   alignItems: 'center', shadowColor: '#0B1F3A',
                   shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  loadingText:   { color: '#64748B', fontSize: 14, marginTop: 12 },

  // Header
  header:    { backgroundColor: '#0B1F3A', paddingHorizontal: 22,
               paddingTop: Platform.OS === 'android' ? 44 : 16,
               paddingBottom: 22, overflow: 'hidden' },
  deco1:     { position: 'absolute', top: -40, right: -40, width: 180, height: 180,
               borderRadius: 90, backgroundColor: 'rgba(240,165,0,0.12)' },
  deco2:     { position: 'absolute', bottom: -20, left: -20, width: 120, height: 120,
               borderRadius: 60, backgroundColor: 'rgba(10,147,150,0.18)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between',
               alignItems: 'flex-start', marginBottom: 16, zIndex: 1 },
  badge:     { backgroundColor: 'rgba(240,165,0,0.2)', borderWidth: 1,
               borderColor: 'rgba(240,165,0,0.3)', paddingHorizontal: 10,
               paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  badgeText: { color: '#F0A500', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
               borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14,
               paddingVertical: 7, borderRadius: 20 },
  logoutText:{ color: '#fff', fontSize: 12, fontWeight: '600' },
  greeting:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, zIndex: 1 },
  username:  { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16, zIndex: 1 },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 8, zIndex: 1 },
  statPill:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
               borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700',
               letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },

  // Search
  searchWrap:  { padding: 16, paddingBottom: 8 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                 borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
                 borderWidth: 1.5, borderColor: '#E2E8F0',
                 shadowColor: '#0B1F3A', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  searchIcon:  { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#0B1F3A' },

  // Filters
  filterWrap:  { paddingLeft: 16, marginBottom: 4 },
  filterLabel: { fontSize: 9, fontWeight: '800', color: '#64748B',
                 letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                 borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  chipText:    { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // Results bar
  resultsBar:  { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  resultsText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  refreshBtn:  { fontSize: 12, color: '#0B1F3A', fontWeight: '700' },

  // Error
  errorBox:   { marginHorizontal: 16, backgroundColor: '#FEF2F2', borderRadius: 12,
                padding: 14, flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  errorText:  { color: '#991B1B', fontSize: 13, flex: 1 },
  retryBtn:   { backgroundColor: '#DC2626', paddingHorizontal: 12,
                paddingVertical: 6, borderRadius: 8 },
  retryText:  { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Cards
  list:       { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 24 },
  card:       { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                marginBottom: 10, borderLeftWidth: 4,
                shadowColor: '#0B1F3A', shadowOpacity: 0.07, shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardRow1:   { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 10 },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  catBox:     { width: 40, height: 40, borderRadius: 10,
                justifyContent: 'center', alignItems: 'center' },
  catIcon:    { fontSize: 18 },
  cardTitle:  { fontSize: 14, fontWeight: '800', color: '#0B1F3A', maxWidth: 130 },
  cardId:     { fontSize: 11, color: '#64748B', marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
                paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  statusDot:  { fontSize: 10, fontWeight: '900' },
  statusLabel:{ fontSize: 11, fontWeight: '700' },
  cardDesc:   { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta:   { fontSize: 12, color: '#64748B' },
  cardDate:   { fontSize: 11, color: '#CBD5E1' },
  tapHintRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  tapHintText:{ fontSize: 12, color: '#0B1F3A', fontWeight: '700', textAlign: 'right' },

  // Empty
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0B1F3A', marginTop: 12 },
  emptySub:   { fontSize: 14, color: '#64748B', marginTop: 4 },

  // Nav
  navBar:    { flexDirection: 'row', backgroundColor: '#fff',
               borderTopWidth: 1, borderTopColor: '#E2E8F0',
               paddingVertical: 10,
               paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  navItem:   { flex: 1, alignItems: 'center' },
  navIcon:   { fontSize: 22, marginBottom: 3 },
  navLabel:  { fontSize: 10, fontWeight: '700', color: '#64748B',
               textTransform: 'uppercase', letterSpacing: 0.5 },
});

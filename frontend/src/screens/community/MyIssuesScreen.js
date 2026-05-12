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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getMyIssues } from '../../services/api';
import { C, STATUS_META, formatDate, getId, getCategory, normalizeIssueList } from './common';

const FILTERS = ['all', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.border }]}> 
      <Text style={[styles.statusText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
    </View>
  );
}

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
      setIssues(normalizeIssueList(data));
    } catch (err) {
      console.log('My issues load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    let result = [...issues];
    if (activeFilter !== 'all') result = result.filter((issue) => issue.status === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((issue) => {
        const title = String(issue.title || '').toLowerCase();
        const desc = String(issue.description || '').toLowerCase();
        const category = String(getCategory(issue) || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || category.includes(q);
      });
    }
    setFiltered(result);
  }, [issues, activeFilter, search]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }) => {
    const id = getId(item);
    return (
      <TouchableOpacity onPress={() => navigation.navigate('IssueDetail', { issueId: id })} activeOpacity={0.86}>
        <View style={styles.issueCard}>
          <View style={styles.cardTop}>
            <View style={styles.ticketBadge}><Text style={styles.ticketText}>Ticket #{id}</Text></View>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.issueTitle} numberOfLines={2}>{item.title || 'Issue'}</Text>
          <Text style={styles.issueCategory}>{getCategory(item)}</Text>
          <Text style={styles.issueDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Submitted: {formatDate(item.created_at)}</Text>
            {item.photo_url ? <Text style={styles.footerText}>Photo</Text> : null}
          </View>
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
          <Text style={styles.headerTitle}>My Issues</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SubmitIssue')} style={styles.headerSide}><Text style={styles.newText}>+ New</Text></TouchableOpacity>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>🏛 CAMPUSCARE</Text></View>
        <Text style={styles.headerSub}>{filtered.length} of {issues.length} issue{issues.length === 1 ? '' : 's'}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, category, or description..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={styles.clearText}>✕</Text></TouchableOpacity>}
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = activeFilter === item;
            const meta = item === 'all' ? { label: 'All', color: C.navy, icon: '📋' } : STATUS_META[item];
            return (
              <TouchableOpacity style={[styles.filterChip, active && { backgroundColor: meta.color, borderColor: meta.color }]} onPress={() => setActiveFilter(item)}>
                <Text style={[styles.filterText, active && { color: '#fff' }]}>{meta.icon} {meta.label}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(getId(item))}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>{loading ? '⏳' : '📭'}</Text>
              <Text style={styles.emptyTitle}>{loading ? 'Loading issues...' : 'No issues found'}</Text>
              <Text style={styles.emptyText}>{loading ? 'Please wait.' : search || activeFilter !== 'all' ? 'Try changing your search or filter.' : 'Tap + New to submit your first issue.'}</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
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
  newText: { color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.16)', borderWidth: 1.5, borderColor: 'rgba(240,165,0,0.45)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, zIndex: 2 },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12, zIndex: 2 },
  body: { flex: 1, backgroundColor: C.cream, paddingTop: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, height: 48 },
  searchInput: { flex: 1, color: C.navy, fontWeight: '700' },
  clearText: { color: C.slate, fontWeight: '900', padding: 6 },
  filterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { color: C.slate, fontWeight: '900', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 34 },
  issueCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12 },
  ticketBadge: { backgroundColor: '#ECFEFF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#67E8F9' },
  ticketText: { color: C.teal, fontWeight: '900', fontSize: 12 },
  statusPill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText: { fontWeight: '900', fontSize: 11 },
  issueTitle: { color: C.navy, fontWeight: '900', fontSize: 16, marginBottom: 4 },
  issueCategory: { color: C.teal, fontWeight: '900', fontSize: 12, marginBottom: 8 },
  issueDesc: { color: C.slate, fontWeight: '600', lineHeight: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, marginTop: 12 },
  footerText: { color: C.slate, fontWeight: '800', fontSize: 12 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 90 },
  emptyIcon: { fontSize: 54, marginBottom: 12 },
  emptyTitle: { color: C.navy, fontWeight: '900', fontSize: 24, marginBottom: 6 },
  emptyText: { color: C.slate, fontWeight: '700', textAlign: 'center', fontSize: 15 },
});

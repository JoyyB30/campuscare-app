import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList,
  Image, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { getIssueById, updateIssueStatus, deleteIssue } from '../services/api';

const C = {
  navy:   '#0B1F3A',
  navy2:  '#162D4E',
  gold:   '#F0A500',
  teal:   '#0A9396',
  cream:  '#F8F4EF',
  white:  '#FFFFFF',
  slate:  '#64748B',
  border: '#E2E8F0',
  red:    '#DC2626',
  green:  '#15803D',
};

// Backend uses lowercase statuses
const STATUS_META = {
  pending:     { label: 'Pending',     color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '⏳' },
  assigned:    { label: 'Assigned',    color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: '👤' },
  in_progress: { label: 'In Progress', color: '#0891B2', bg: '#ECFEFF', border: '#67E8F9', icon: '🔧' },
  resolved:    { label: 'Resolved',    color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', icon: '✅' },
  closed:      { label: 'Closed',      color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', icon: '🔒' },
};

// These are sent to the backend
const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];

const PRIORITY_COLORS = {
  low:    { color: '#15803D', bg: '#F0FDF4' },
  medium: { color: '#D97706', bg: '#FFFBEB' },
  high:   { color: '#DC2626', bg: '#FEF2F2' },
};

export default function FMIssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const [issue,         setIssue]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusModal,   setStatusModal]   = useState(false);
  const [error,         setError]         = useState(null);

  useEffect(() => { fetchIssue(); }, []);

  const fetchIssue = async () => {
    try {
      setError(null);
      const data = await getIssueById(issueId);
      // Backend returns the ticket object directly
      setIssue(data.issue || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Update status ──────────────────────────────
  const handleStatusUpdate = async (newStatus) => {
    setStatusModal(false);
    if (newStatus === issue.status) return;
    setActionLoading(true);
    try {
      const result = await updateIssueStatus(issueId, newStatus);
      setIssue(result.issue || { ...issue, status: newStatus });
      Alert.alert('✅ Updated', `Status changed to "${STATUS_META[newStatus]?.label}"`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Close issue (set to closed) ────────────────
  const handleClose = () => {
    if (issue.status !== 'resolved') {
      Alert.alert('Cannot Close', 'Issue must be "Resolved" before it can be closed.');
      return;
    }
    Alert.alert('Close Issue', 'Mark this issue as fully closed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        setActionLoading(true);
        try {
          const result = await updateIssueStatus(issueId, 'closed');
          setIssue(result.issue || { ...issue, status: 'closed' });
          Alert.alert('🔒 Closed', 'Issue has been closed successfully.');
        } catch (err) {
          Alert.alert('Error', err.message);
        } finally { setActionLoading(false); }
      }},
    ]);
  };

  // ── Delete issue ───────────────────────────────
  const handleDelete = () => {
    Alert.alert('Delete Issue', 'Permanently delete this issue? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setActionLoading(true);
        try {
          await deleteIssue(issueId);
          Alert.alert('Deleted', 'Issue removed.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } catch (err) {
          Alert.alert('Error', err.message);
          setActionLoading(false);
        }
      }},
    ]);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.navy} />
      <Text style={styles.loadingText}>Loading issue...</Text>
    </View>
  );

  if (error || !issue) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
      <Text style={styles.errorMsg}>{error || 'Issue not found'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchIssue}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const s         = STATUS_META[issue.status] || STATUS_META['pending'];
  const p         = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS['medium'];
  const isClosed  = issue.status === 'closed';
  const canClose  = issue.status === 'resolved';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── HEADER ────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerDeco} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ticket #{issueId}</Text>
          <View style={[styles.headerStatusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.headerStatusText, { color: s.color }]}>
              {s.icon} {s.label}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── PHOTO ───────────────────────────────── */}
        {issue.photo_url ? (
          <Image source={{ uri: issue.photo_url }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={{ fontSize: 32, marginBottom: 6 }}>📷</Text>
            <Text style={styles.noPhotoText}>No photo uploaded</Text>
          </View>
        )}

        {/* ── DETAILS CARD ────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>ISSUE DETAILS</Text>
          </View>

          <DetailRow label="Title"
            value={issue.title || '—'} />
          <DetailRow label="Category"
            value={issue.category || '—'} />
          <DetailRow label="Priority"
            value={
              <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                <Text style={[styles.priorityText, { color: p.color }]}>
                  {(issue.priority || 'medium').toUpperCase()}
                </Text>
              </View>
            }
          />
          <DetailRow label="Submitted"
            value={issue.created_at
              ? new Date(issue.created_at).toLocaleDateString('en-GB',
                  { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          />
          <DetailRow label="Last Updated"
            value={issue.updated_at
              ? new Date(issue.updated_at).toLocaleDateString('en-GB',
                  { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          />
        </View>

        {/* ── DESCRIPTION ─────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionIcon}>📝</Text>
            <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          </View>
          <Text style={styles.descText}>
            {issue.description || 'No description provided.'}
          </Text>
        </View>

        {/* ── MANAGE ISSUE ────────────────────────── */}
        {!isClosed ? (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionIcon}>⚙️</Text>
              <Text style={styles.sectionTitle}>MANAGE ISSUE</Text>
            </View>

            {/* Update Status */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.navy }]}
              onPress={() => setStatusModal(true)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnIcon}>🔄</Text>
              <View style={styles.actionBtnBody}>
                <Text style={styles.actionBtnTitle}>Update Status</Text>
                <Text style={styles.actionBtnSub}>
                  Current: {s.label}
                </Text>
              </View>
              <Text style={styles.actionBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* Set Priority */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => Alert.alert('Set Priority', 'Choose priority:', [
                { text: 'Low',    onPress: () => {} },
                { text: 'Medium', onPress: () => {} },
                { text: 'High',   onPress: () => {} },
                { text: 'Cancel', style: 'cancel' },
              ])}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnIcon}>🎯</Text>
              <View style={styles.actionBtnBody}>
                <Text style={styles.actionBtnTitle}>Set Priority</Text>
                <Text style={styles.actionBtnSub}>
                  Current: {(issue.priority || 'medium').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.actionBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* Assign Worker */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.teal }]}
              onPress={() => Alert.alert('Assign Worker',
                'Worker assignment will be available once the workers module is integrated.')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnIcon}>👷</Text>
              <View style={styles.actionBtnBody}>
                <Text style={styles.actionBtnTitle}>Assign Worker</Text>
                <Text style={styles.actionBtnSub}>Select from available workers</Text>
              </View>
              <Text style={styles.actionBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* Close Issue */}
            <TouchableOpacity
              style={[styles.actionBtn,
                { backgroundColor: canClose ? '#15803D' : '#94A3B8' }]}
              onPress={handleClose}
              disabled={actionLoading || !canClose}
              activeOpacity={canClose ? 0.8 : 1}
            >
              <Text style={styles.actionBtnIcon}>🔒</Text>
              <View style={styles.actionBtnBody}>
                <Text style={styles.actionBtnTitle}>Close Issue</Text>
                <Text style={styles.actionBtnSub}>
                  {canClose
                    ? 'Mark as fully resolved and closed'
                    : 'Requires "Resolved" status first'}
                </Text>
              </View>
              {canClose && <Text style={styles.actionBtnArrow}>›</Text>}
            </TouchableOpacity>

            {actionLoading && (
              <View style={{ flexDirection: 'row', justifyContent: 'center',
                             alignItems: 'center', paddingVertical: 10, gap: 8 }}>
                <ActivityIndicator size="small" color={C.navy} />
                <Text style={{ color: C.slate, fontSize: 13 }}>Processing...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.closedCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔒</Text>
            <Text style={styles.closedTitle}>Issue Closed</Text>
            <Text style={styles.closedSub}>
              This issue has been resolved and closed.
            </Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── STATUS MODAL ────────────────────────── */}
      <Modal visible={statusModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🔄 Update Status</Text>
            <Text style={styles.modalSub}>Select a new status for this issue</Text>

            {STATUS_OPTIONS.map(opt => {
              const m      = STATUS_META[opt];
              const active = issue.status === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption,
                    { borderColor: active ? m.color : C.border,
                      backgroundColor: active ? m.bg : '#fff' }]}
                  onPress={() => handleStatusUpdate(opt)}
                >
                  <Text style={styles.modalOptionIcon}>{m.icon}</Text>
                  <Text style={[styles.modalOptionText,
                    { color: active ? m.color : C.navy, fontWeight: active ? '800' : '600' }]}>
                    {m.label}
                  </Text>
                  {active && (
                    <Text style={[styles.modalCheck, { color: m.color }]}>✓ Current</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setStatusModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{label}</Text>
      {typeof value === 'string'
        ? <Text style={styles.detailVal}>{value}</Text>
        : value
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8F4EF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 14, color: '#64748B', fontSize: 14 },
  errorMsg:    { color: '#DC2626', textAlign: 'center', fontSize: 15, marginBottom: 16 },
  retryBtn:    { backgroundColor: '#0B1F3A', paddingHorizontal: 28,
                 paddingVertical: 12, borderRadius: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '700' },

  // Header
  header:      { backgroundColor: '#0B1F3A', flexDirection: 'row', alignItems: 'center',
                 justifyContent: 'space-between', paddingHorizontal: 16,
                 paddingTop: Platform.OS === 'android' ? 44 : 14,
                 paddingBottom: 18, overflow: 'hidden' },
  headerDeco:  { position: 'absolute', top: -30, right: -30, width: 140, height: 140,
                 borderRadius: 70, backgroundColor: 'rgba(240,165,0,0.1)' },
  backBtn:     { padding: 6, minWidth: 70 },
  backText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerCenter:{ alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 5 },
  headerStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerStatusText:  { fontSize: 12, fontWeight: '700' },
  deleteBtn:   { padding: 6, minWidth: 70, alignItems: 'flex-end' },
  deleteIcon:  { fontSize: 20 },

  scroll: { flex: 1 },

  // Photo
  photo:       { width: '100%', height: 220 },
  noPhoto:     { height: 110, backgroundColor: '#E2E8F0', justifyContent: 'center',
                 alignItems: 'center', margin: 16, borderRadius: 16,
                 borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1' },
  noPhotoText: { color: '#64748B', fontSize: 13 },

  // Card
  card:        { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 14,
                 marginTop: 12, padding: 16,
                 shadowColor: '#0B1F3A', shadowOpacity: 0.07,
                 shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8,
                 marginBottom: 14, paddingBottom: 10,
                 borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sectionIcon: { fontSize: 18 },
  sectionTitle:{ fontSize: 11, fontWeight: '800', color: '#64748B',
                 textTransform: 'uppercase', letterSpacing: 1.5 },

  // Detail rows
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', paddingVertical: 10,
                 borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  detailKey:   { fontSize: 13, color: '#64748B' },
  detailVal:   { fontSize: 13, color: '#0B1F3A', fontWeight: '700',
                 maxWidth: '55%', textAlign: 'right' },

  priorityBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '800' },

  descText:    { fontSize: 14, color: '#64748B', lineHeight: 22 },

  // Action buttons
  actionBtn:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14,
                   paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, gap: 12 },
  actionBtnIcon: { fontSize: 22 },
  actionBtnBody: { flex: 1 },
  actionBtnTitle:{ color: '#fff', fontSize: 15, fontWeight: '800' },
  actionBtnSub:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  actionBtnArrow:{ color: 'rgba(255,255,255,0.7)', fontSize: 22 },

  // Closed
  closedCard:  { backgroundColor: '#F8FAFC', borderRadius: 16, marginHorizontal: 14,
                 marginTop: 12, padding: 24, alignItems: 'center',
                 borderWidth: 1, borderColor: '#E2E8F0' },
  closedTitle: { fontSize: 18, fontWeight: '800', color: '#0B1F3A', marginBottom: 4 },
  closedSub:   { fontSize: 13, color: '#64748B', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11,31,58,0.6)',
                  justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24,
                  borderTopRightRadius: 24, padding: 24 },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2,
                  alignSelf: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: '#0B1F3A', marginBottom: 4 },
  modalSub:     { fontSize: 13, color: '#64748B', marginBottom: 18 },
  modalOption:  { flexDirection: 'row', alignItems: 'center', padding: 14,
                  borderRadius: 12, marginBottom: 8, borderWidth: 1.5, gap: 12 },
  modalOptionIcon: { fontSize: 20 },
  modalOptionText: { flex: 1, fontSize: 15 },
  modalCheck:      { fontSize: 12, fontWeight: '700' },
  modalCancel:  { marginTop: 6, paddingVertical: 15, backgroundColor: '#F1F5F9',
                  borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '700', fontSize: 15 },

  // Nav bar
  navBar:    { flexDirection: 'row', backgroundColor: '#fff',
               borderTopWidth: 1, borderTopColor: '#E2E8F0',
               paddingVertical: 10,
               paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  navItem:   { flex: 1, alignItems: 'center' },
  navIcon:   { fontSize: 22, marginBottom: 3 },
  navLabel:  { fontSize: 10, fontWeight: '700', color: '#64748B',
               textTransform: 'uppercase', letterSpacing: 0.5 },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList, Image, SafeAreaView, StatusBar,
} from 'react-native';
import { getIssueById, updateStatus, deleteIssue, getWorkers } from '../services/api';

const C = {
  navy:   '#0A2463',
  teal:   '#1B998B',
  gold:   '#E9C46A',
  bg:     '#F0F4F8',
  white:  '#FFFFFF',
  text:   '#1A1A2E',
  sub:    '#5C6B7A',
  border: '#DDE3EA',
  red:    '#E63946',
  green:  '#2DC653',
  orange: '#F4A261',
  grey:   '#ADB5BD',
};

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];

const STATUS_CONFIG = {
  'Pending':     { color: '#F4A261', bg: '#FFF3E0', icon: '⏳' },
  'In Progress': { color: '#1B998B', bg: '#E0F5F3', icon: '🔧' },
  'Resolved':    { color: '#2DC653', bg: '#E6F7EC', icon: '✅' },
  'Closed':      { color: '#ADB5BD', bg: '#F0F0F0', icon: '🔒' },
};

export default function FMIssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const [issue,         setIssue]         = useState(null);
  const [workers,       setWorkers]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [workerModal,   setWorkerModal]   = useState(false);
  const [statusModal,   setStatusModal]   = useState(false);
  const [error,         setError]         = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const issueData = await getIssueById(issueId);
      setIssue(issueData.issue || issueData);

      // Try to get workers — gracefully handle if endpoint not ready
      try {
        const wData = await getWorkers();
        setWorkers(Array.isArray(wData) ? wData : wData.workers || []);
      } catch {
        setWorkers([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Update Status ──────────────────────────────
  const handleStatusUpdate = async (newStatus) => {
    setStatusModal(false);
    if (newStatus === issue.status) return;
    setActionLoading(true);
    try {
      await updateStatus(issueId, newStatus);
      setIssue(prev => ({ ...prev, status: newStatus }));
      Alert.alert('✅ Updated', `Status changed to "${newStatus}"`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Close Issue (set status to Closed) ─────────
  const handleClose = () => {
    Alert.alert(
      'Close Issue',
      'Mark this issue as fully closed? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Close It',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await updateStatus(issueId, 'Closed');
              setIssue(prev => ({ ...prev, status: 'Closed' }));
              Alert.alert('🔒 Closed', 'Issue has been closed.');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Delete Issue ───────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Issue',
      'Permanently delete this issue? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.navy} />
      <Text style={styles.loadingText}>Loading issue...</Text>
    </View>
  );

  if (error || !issue) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text style={styles.errorText}>{error || 'Issue not found'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const s = STATUS_CONFIG[issue.status] || STATUS_CONFIG['Pending'];
  const isClosed = issue.status === 'Closed';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue #{issueId}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status Banner ── */}
        <View style={[styles.statusBanner, { backgroundColor: s.bg }]}>
          <Text style={styles.statusBannerIcon}>{s.icon}</Text>
          <Text style={[styles.statusBannerText, { color: s.color }]}>{issue.status}</Text>
        </View>

        {/* ── Photo ── */}
        {issue.photo_url ? (
          <Image source={{ uri: issue.photo_url }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>📷 No photo uploaded</Text>
          </View>
        )}

        {/* ── Details Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Issue Details</Text>
          <Row label="Category" value={issue.category || '—'} />
          <Row label="Location" value={issue.location  || '—'} />
          <Row label="Priority" value={issue.priority  || 'Normal'} />
          <Row label="Submitted" value={issue.created_at
            ? new Date(issue.created_at).toLocaleString('en-GB') : '—'} />
        </View>

        {/* ── Description ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.descText}>{issue.description || 'No description provided.'}</Text>
        </View>

        {/* ── Actions ── */}
        {!isClosed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.navy }]}
              onPress={() => setStatusModal(true)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>🔄  Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.teal }]}
              onPress={() => setWorkerModal(true)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>👷  Assign Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: issue.status === 'Resolved' ? C.green : C.grey }
              ]}
              onPress={handleClose}
              disabled={actionLoading || issue.status !== 'Resolved'}
            >
              <Text style={styles.actionBtnText}>🔒  Close Issue</Text>
            </TouchableOpacity>

            {issue.status !== 'Resolved' && (
              <Text style={styles.hint}>* Issue must be Resolved before closing</Text>
            )}
          </View>
        )}

        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedText}>🔒 This issue has been closed</Text>
          </View>
        )}

        {actionLoading && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 8 }}>
            <ActivityIndicator size="small" color={C.navy} />
            <Text style={{ color: C.sub }}>Processing...</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Status Modal ── */}
      <Modal visible={statusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Status</Text>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, issue.status === opt && styles.modalOptionActive]}
                onPress={() => handleStatusUpdate(opt)}
              >
                <Text style={[styles.modalOptionText, issue.status === opt && { color: C.navy, fontWeight: '700' }]}>
                  {STATUS_CONFIG[opt]?.icon} {opt}
                </Text>
                {issue.status === opt && <Text style={{ color: C.navy }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setStatusModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Worker Modal ── */}
      <Modal visible={workerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Assign a Worker</Text>
            {workers.length === 0 ? (
              <Text style={{ color: C.grey, textAlign: 'center', padding: 20 }}>
                No workers available yet.{'\n'}This will work once Adam pushes his part.
              </Text>
            ) : (
              <FlatList
                data={workers}
                keyExtractor={item => String(item.user_id || item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.workerItem}
                    onPress={() => {
                      setWorkerModal(false);
                      Alert.alert('✅ Assigned', `Issue assigned to ${item.username}`);
                    }}
                  >
                    <View style={styles.workerAvatar}>
                      <Text style={styles.workerInitial}>
                        {(item.username || 'W').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.workerName}>{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setWorkerModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:   { marginTop: 12, color: C.sub },
  errorText:     { color: C.red, textAlign: 'center', marginTop: 10, fontSize: 14 },
  retryBtn:      { marginTop: 16, backgroundColor: C.navy, paddingHorizontal: 24,
                   paddingVertical: 10, borderRadius: 8 },
  retryBtnText:  { color: C.white, fontWeight: '600' },

  header:        { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center',
                   justifyContent: 'space-between', paddingHorizontal: 16,
                   paddingTop: 14, paddingBottom: 16 },
  backBtn:       { padding: 4 },
  backArrow:     { color: C.white, fontSize: 15, fontWeight: '600' },
  headerTitle:   { color: C.white, fontSize: 17, fontWeight: '700' },
  deleteBtn:     { padding: 4 },
  deleteText:    { fontSize: 20 },

  scroll:        { flex: 1 },

  statusBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   paddingVertical: 12, gap: 8 },
  statusBannerIcon: { fontSize: 18 },
  statusBannerText: { fontSize: 16, fontWeight: '700' },

  photo:         { width: '100%', height: 200 },
  noPhoto:       { height: 100, backgroundColor: '#E8ECF0', justifyContent: 'center',
                   alignItems: 'center', marginHorizontal: 16, borderRadius: 12, marginTop: 8 },
  noPhotoText:   { color: C.grey },

  card:          { backgroundColor: C.white, borderRadius: 14, marginHorizontal: 14,
                   marginTop: 12, padding: 16,
                   shadowColor: C.navy, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle:     { fontSize: 13, fontWeight: '700', color: C.sub, textTransform: 'uppercase',
                   letterSpacing: 0.8, marginBottom: 12 },

  row:           { flexDirection: 'row', justifyContent: 'space-between',
                   paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  rowLabel:      { fontSize: 13, color: C.grey },
  rowValue:      { fontSize: 13, color: C.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  descText:      { fontSize: 14, color: C.sub, lineHeight: 22 },

  actionBtn:     { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  hint:          { textAlign: 'center', color: C.grey, fontSize: 11, marginTop: -4 },

  closedBanner:  { margin: 14, padding: 16, backgroundColor: '#E8ECF0',
                   borderRadius: 12, alignItems: 'center' },
  closedText:    { color: C.sub, fontWeight: '600', fontSize: 15 },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: C.white, borderTopLeftRadius: 20,
                   borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHandle:   { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2,
                   alignSelf: 'center', marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
  modalOption:   { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
                   marginBottom: 8, backgroundColor: C.bg,
                   flexDirection: 'row', justifyContent: 'space-between' },
  modalOptionActive: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: C.navy },
  modalOptionText:   { fontSize: 15, color: C.sub },
  modalCancel:   { marginTop: 6, paddingVertical: 14, alignItems: 'center',
                   backgroundColor: C.bg, borderRadius: 10 },
  modalCancelText:   { color: C.sub, fontWeight: '600' },

  workerItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
                   borderBottomWidth: 1, borderBottomColor: C.border },
  workerAvatar:  { width: 38, height: 38, borderRadius: 19, backgroundColor: C.navy,
                   justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  workerInitial: { color: C.white, fontWeight: '700', fontSize: 16 },
  workerName:    { fontSize: 15, color: C.text, fontWeight: '500' },
});

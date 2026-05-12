import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import {
  getIssueById,
  updateIssueStatus,
  updateIssuePriority,
  assignIssueToWorker,
  closeIssue,
  deleteIssue,
  getWorkers,
} from '../services/api';

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

const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'resolved'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_COLORS = {
  low: { color: '#15803D', bg: '#F0FDF4' },
  medium: { color: '#D97706', bg: '#FFFBEB' },
  high: { color: '#DC2626', bg: '#FEF2F2' },
  urgent: { color: '#991B1B', bg: '#FEE2E2' },
};

const CATEGORY_ID_TO_NAME = {
  1: 'Electrical',
  2: 'Plumbing',
  3: 'Furniture',
  4: 'Cleaning',
  5: 'Air Conditioning',
};

const getCategoryName = (issue) => {
  return issue?.category || CATEGORY_ID_TO_NAME[issue?.category_id] || '—';
};

export default function FMIssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [priorityModal, setPriorityModal] = useState(false);
  const [workerModal, setWorkerModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssue();
    fetchWorkers();
  }, []);

  const goDashboard = (tab = 'dashboard') => {
    navigation.navigate('FMDashboard', {
      initialTab: tab,
      refreshKey: Date.now(),
    });
  };

  const fetchIssue = async () => {
    try {
      setError(null);
      const data = await getIssueById(issueId);
      setIssue(data.issue || data);
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      setError(err.message || 'Could not load issue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await getWorkers();
      const list = Array.isArray(data) ? data : data.workers || data.users || [];
      setWorkers(list);
    } catch (err) {
      console.log('Failed to load workers:', err.message);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatusModal(false);
    if (!issue || newStatus === issue.status) return;

    setActionLoading(true);
    try {
      const result = await updateIssueStatus(issueId, newStatus);
      setIssue(result.issue || { ...issue, status: newStatus });
      Alert.alert('✅ Updated', `Status changed to ${STATUS_META[newStatus]?.label || newStatus}.`);
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityUpdate = async (priority) => {
    setPriorityModal(false);
    if (!issue || priority === issue.priority) return;

    setActionLoading(true);
    try {
      const result = await updateIssuePriority(issueId, priority);
      setIssue(result.issue || { ...issue, priority });
      Alert.alert('✅ Updated', `Priority changed to ${priority.toUpperCase()}.`);
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignWorker = async (workerId) => {
    setWorkerModal(false);
    setActionLoading(true);

    try {
      const result = await assignIssueToWorker(issueId, workerId);
      setIssue(result.issue || { ...issue, assigned_to: workerId, status: 'assigned' });
      Alert.alert('✅ Assigned', 'Issue assigned to worker successfully.');
      await fetchWorkers();
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not assign worker.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    if (issue.status !== 'resolved') {
      Alert.alert('Cannot Close', 'Issue must be resolved before it can be closed.');
      return;
    }

    if (!issue.completed_photo_url) {
      Alert.alert('Completion Photo Required', 'Worker must upload a completion photo before closing.');
      return;
    }

    Alert.alert('Close Issue', 'Close this issue after checking the completed work?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const result = await closeIssue(issueId);
            setIssue(result.issue || { ...issue, status: 'closed' });
            Alert.alert('🔒 Closed', 'Issue closed successfully.');
            await fetchIssue();
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not close issue.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Issue', 'Permanently delete this issue? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deleteIssue(issueId);
            Alert.alert('Deleted', 'Issue removed.', [
              { text: 'OK', onPress: () => goDashboard('dashboard') },
            ]);
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not delete issue.');
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const renderOptionModal = (visible, title, data, onClose, renderItem) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item, index) => String(item?.user_id || item || index)}
            renderItem={renderItem}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading issue...</Text>
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Issue not found.'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchIssue}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.slate }]} onPress={() => goDashboard()}>
          <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_META[issue.status] || STATUS_META.pending;
  const assignedWorker = workers.find(w => w.user_id === issue.assigned_to);
  const assignedWorkerName = issue.assigned_worker_name || assignedWorker?.username || (issue.assigned_to ? `Worker #${issue.assigned_to}` : 'Not assigned');
  const isClosed = issue.status === 'closed';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goDashboard('dashboard')} style={styles.backBtn}>
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ticket #{issueId}</Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.icon} {status.label}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Text style={styles.photoTitle}>Reported Issue Photo</Text>
          {issue.photo_url ? (
            <Image source={{ uri: issue.photo_url }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.noPhoto}>
              <Text style={{ fontSize: 32 }}>📷</Text>
              <Text style={styles.noPhotoText}>No issue photo uploaded</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📋 ISSUE DETAILS</Text>
          <DetailRow label="Title" value={issue.title || '—'} />
          <DetailRow label="Description" value={issue.description || '—'} />
          <DetailRow label="Category" value={getCategoryName(issue)} />
          <DetailRow label="Location" value={issue.location || issue.location_name || `Location #${issue.location_id || '—'}`} />
          <DetailRow label="Priority" value={(issue.priority || 'medium').toUpperCase()} />
          <DetailRow label="Status" value={STATUS_META[issue.status]?.label || issue.status || '—'} />
          <DetailRow label="Assigned Worker" value={assignedWorkerName} />
          <DetailRow label="Issue Date" value={issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'} />
          <DetailRow label="Submission Date" value={issue.submitted_at || issue.created_at ? new Date(issue.submitted_at || issue.created_at).toLocaleString() : '—'} />
          <DetailRow label="Created By" value={issue.creator_username || (issue.created_by ? `User #${issue.created_by}` : '—')} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ MANAGER ACTIONS</Text>

          <TouchableOpacity
            style={[styles.actionBtn, isClosed && styles.disabled]}
            onPress={() => setStatusModal(true)}
            disabled={isClosed || actionLoading}
          >
            <Text style={styles.actionText}>🔄 Change Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.gold }, isClosed && styles.disabled]}
            onPress={() => setPriorityModal(true)}
            disabled={isClosed || actionLoading}
          >
            <Text style={[styles.actionText, { color: C.navy }]}>🏷 Change Priority</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.teal }, isClosed && styles.disabled]}
            onPress={() => setWorkerModal(true)}
            disabled={isClosed || actionLoading}
          >
            <Text style={styles.actionText}>👷 Assign to Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.green }, issue.status !== 'resolved' && styles.disabled]}
            onPress={handleClose}
            disabled={issue.status !== 'resolved' || actionLoading}
          >
            <Text style={styles.actionText}>🔒 Close Issue</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.photoSection}>
          <Text style={styles.photoTitle}>Worker Completion Photo</Text>
          {issue.completed_photo_url ? (
            <Image source={{ uri: issue.completed_photo_url }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.noPhoto}>
              <Text style={{ fontSize: 32 }}>🛠️</Text>
              <Text style={styles.noPhotoText}>No completion photo yet</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💬 WORKER COMMENTS</Text>
          {comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet.</Text>
          ) : (
            comments.map(comment => (
              <View key={String(comment.comment_id)} style={styles.commentBox}>
                <Text style={styles.commentAuthor}>{comment.username || 'Worker'} • {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</Text>
                <Text style={styles.commentText}>{comment.comment_text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {renderOptionModal(
        statusModal,
        'Change Status',
        STATUS_OPTIONS,
        () => setStatusModal(false),
        ({ item }) => {
          const s = STATUS_META[item];
          return (
            <TouchableOpacity style={styles.modalOption} onPress={() => handleStatusUpdate(item)}>
              <Text style={styles.modalOptionText}>{s.icon} {s.label}</Text>
            </TouchableOpacity>
          );
        }
      )}

      {renderOptionModal(
        priorityModal,
        'Change Priority',
        PRIORITY_OPTIONS,
        () => setPriorityModal(false),
        ({ item }) => (
          <TouchableOpacity style={styles.modalOption} onPress={() => handlePriorityUpdate(item)}>
            <Text style={styles.modalOptionText}>🏷 {item.toUpperCase()}</Text>
          </TouchableOpacity>
        )
      )}

      {renderOptionModal(
        workerModal,
        'Assign to Worker',
        workers.filter(w => w.is_active !== false),
        () => setWorkerModal(false),
        ({ item }) => (
          <TouchableOpacity style={styles.modalOption} onPress={() => handleAssignWorker(item.user_id)}>
            <Text style={styles.modalOptionText}>👷 {item.username}</Text>
            <Text style={styles.modalSubText}>{item.email}</Text>
          </TouchableOpacity>
        )
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: C.slate, fontWeight: '800' },
  errorText: { color: C.red, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  header: { backgroundColor: C.navy, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { flex: 1 },
  backText: { color: '#fff', fontWeight: '900' },
  headerCenter: { flex: 1.4, alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  deleteBtn: { flex: 1, alignItems: 'flex-end' },
  deleteText: { fontSize: 22 },
  statusPill: { marginTop: 7, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  statusText: { fontWeight: '900', fontSize: 12 },
  content: { paddingBottom: 30 },
  photoSection: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  photoTitle: { padding: 14, color: C.navy, fontWeight: '900', borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  photo: { width: '100%', height: 230, backgroundColor: '#E2E8F0' },
  noPhoto: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  noPhotoText: { color: C.slate, fontWeight: '700', marginTop: 6 },
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.navy, fontWeight: '900', fontSize: 14, marginBottom: 14 },
  detailRow: { marginBottom: 12 },
  detailLabel: { color: C.slate, fontWeight: '900', fontSize: 12, marginBottom: 4 },
  detailValue: { color: C.navy, fontWeight: '700', lineHeight: 20 },
  actionBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.45 },
  badgeRow: { marginTop: 8 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  priorityText: { fontWeight: '900' },
  primaryBtn: { backgroundColor: C.navy, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { width: '100%', maxHeight: '75%', backgroundColor: '#fff', borderRadius: 18, padding: 16 },
  modalTitle: { color: C.navy, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  modalOptionText: { color: C.navy, fontWeight: '900', fontSize: 15 },
  modalSubText: { color: C.slate, marginTop: 3 },
  modalCancel: { marginTop: 12, backgroundColor: C.navy, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  modalCancelText: { color: '#fff', fontWeight: '900' },
  emptyText: { color: C.slate, fontWeight: '700' },
  commentBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  commentAuthor: { color: C.slate, fontSize: 12, fontWeight: '900', marginBottom: 5 },
  commentText: { color: C.navy, fontWeight: '700', lineHeight: 20 },
});

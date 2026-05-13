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
  green: '#15803D',
};

const STATUS_META = {
  pending: {
    label: 'Pending',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FCD34D',
    icon: '⏳',
  },
  assigned: {
    label: 'Assigned',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    icon: '👤',
  },
  in_progress: {
    label: 'In Progress',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#67E8F9',
    icon: '🔧',
  },
  resolved: {
    label: 'Resolved',
    color: '#15803D',
    bg: '#F0FDF4',
    border: '#86EFAC',
    icon: '✅',
  },
  closed: {
    label: 'Closed',
    color: '#475569',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    icon: '🔒',
  },
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
  6: 'Safety',
};

const getCategoryName = (issue) => {
  return issue?.category || issue?.category_name || CATEGORY_ID_TO_NAME[issue?.category_id] || '—';
};

const formatDateTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
};

export default function FMIssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);
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
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
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

  const handleAssignWorker = async (workerId) => {
    setWorkerModal(false);
    setActionLoading(true);

    try {
      const result = await assignIssueToWorker(issueId, workerId);

      setIssue(result.issue || {
        ...issue,
        assigned_to: workerId,
        status: 'assigned',
      });

      Alert.alert('✅ Assigned', 'Issue assigned to worker successfully.');

      await fetchWorkers();
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not assign worker.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatusModal(false);

    if (!issue || newStatus === issue.status) return;

    setActionLoading(true);

    try {
      const result = await updateIssueStatus(issueId, newStatus);

      setIssue(result.issue || {
        ...issue,
        status: newStatus,
      });

      Alert.alert(
        '✅ Updated',
        `Status changed to ${STATUS_META[newStatus]?.label || newStatus}.`
      );

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

      setIssue(result.issue || {
        ...issue,
        priority,
      });

      Alert.alert('✅ Updated', `Priority changed to ${priority.toUpperCase()}.`);

      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    if (!issue) return;

    if (issue.status !== 'resolved') {
      Alert.alert('Cannot Close', 'Issue must be resolved before it can be closed.');
      return;
    }

    Alert.alert('Close Issue', 'Close this resolved issue after reviewing the worker completion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);

          try {
            const result = await closeIssue(issueId);

            setIssue(result.issue || {
              ...issue,
              status: 'closed',
            });

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
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const renderOptionModal = (visible, title, data, onClose, renderItem) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>

          <FlatList
            data={data}
            keyExtractor={(item, index) => String(item?.user_id || item || index)}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.modalEmpty}>No options available.</Text>
            }
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

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: C.slate }]}
          onPress={() => goDashboard()}
        >
          <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_META[issue.status] || STATUS_META.pending;

  const assignedWorker = workers.find(
    (worker) => Number(worker.user_id) === Number(issue.assigned_to)
  );

  const assignedWorkerName =
    issue.assigned_worker_name ||
    issue.assigned_worker_username ||
    assignedWorker?.username ||
    (issue.assigned_to ? `Worker #${issue.assigned_to}` : 'Not assigned');

  const priorityMeta =
    PRIORITY_COLORS[issue.priority || 'medium'] || PRIORITY_COLORS.medium;

  const completionPhoto =
    issue.completed_photo_url ||
    photos.find((photo) => photo.photo_type === 'completion')?.photo_url;

  const activeWorkers = workers.filter((worker) => worker.is_active !== false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goDashboard('dashboard')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ticket #{issueId}</Text>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: status.bg,
                borderColor: status.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.icon} {status.label}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoSection}>
          <Text style={styles.photoTitle}>Reported Issue Photo</Text>

          {issue.photo_url ? (
            <Image
              source={{ uri: issue.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
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
          <DetailRow
            label="Location"
            value={issue.location || issue.location_name || `Location #${issue.location_id || '—'}`}
          />
          <DetailRow label="Submitted By" value={issue.creator_username || issue.created_by_username || `User #${issue.created_by || '—'}`} />
          <DetailRow label="Submitted At" value={formatDateTime(issue.created_at)} />
          <DetailRow label="Last Updated" value={formatDateTime(issue.updated_at)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👷 ASSIGNMENT</Text>

          <DetailRow label="Assigned Worker" value={assignedWorkerName} />

          <TouchableOpacity
            style={[styles.actionBtn, actionLoading && styles.disabled]}
            onPress={() => setWorkerModal(true)}
            disabled={actionLoading}
          >
            <Text style={styles.actionText}>👷 Assign / Change Worker</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ ISSUE MANAGEMENT</Text>

          <View style={styles.managementRow}>
            <View style={styles.managementBox}>
              <Text style={styles.managementLabel}>Current Status</Text>

              <View
                style={[
                  styles.smallPill,
                  {
                    backgroundColor: status.bg,
                    borderColor: status.border,
                  },
                ]}
              >
                <Text style={[styles.smallPillText, { color: status.color }]}>
                  {status.icon} {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.managementBox}>
              <Text style={styles.managementLabel}>Priority</Text>

              <View
                style={[
                  styles.smallPill,
                  {
                    backgroundColor: priorityMeta.bg,
                    borderColor: priorityMeta.bg,
                  },
                ]}
              >
                <Text style={[styles.smallPillText, { color: priorityMeta.color }]}>
                  {(issue.priority || 'medium').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.secondaryAction, actionLoading && styles.disabled]}
            onPress={() => setStatusModal(true)}
            disabled={actionLoading}
          >
            <Text style={styles.secondaryActionText}>🔄 Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryAction, actionLoading && styles.disabled]}
            onPress={() => setPriorityModal(true)}
            disabled={actionLoading}
          >
            <Text style={styles.secondaryActionText}>🏷 Set Priority</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeBtn, actionLoading && styles.disabled]}
            onPress={handleClose}
            disabled={actionLoading}
          >
            <Text style={styles.closeBtnText}>🔒 Close Resolved Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, actionLoading && styles.disabled]}
            onPress={handleDelete}
            disabled={actionLoading}
          >
            <Text style={styles.deleteBtnText}>🗑 Delete Issue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💬 WORKER COMMENTS</Text>

          {comments.length === 0 ? (
            <Text style={styles.emptyText}>No worker comments yet.</Text>
          ) : (
            comments.map((comment) => (
              <View key={String(comment.comment_id)} style={styles.commentBox}>
                <Text style={styles.commentAuthor}>
                  {comment.username || 'Worker'} • {comment.role || 'worker'}
                </Text>

                <Text style={styles.commentText}>{comment.comment_text}</Text>

                <Text style={styles.commentDate}>
                  {formatDateTime(comment.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>

        {completionPhoto ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✅ COMPLETION PHOTO</Text>

            <Image
              source={{ uri: completionPhoto }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </ScrollView>

      {renderOptionModal(
        workerModal,
        'Assign Worker',
        activeWorkers,
        () => setWorkerModal(false),
        ({ item }) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => handleAssignWorker(item.user_id || item.id)}
          >
            <Text style={styles.modalItemTitle}>
              👷 {item.username || item.name || 'Worker'}
            </Text>

            <Text style={styles.modalItemSub}>
              {item.email || 'No email'}
            </Text>
          </TouchableOpacity>
        )
      )}

      {renderOptionModal(
        statusModal,
        'Update Status',
        STATUS_OPTIONS,
        () => setStatusModal(false),
        ({ item }) => {
          const meta = STATUS_META[item] || STATUS_META.pending;

          return (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleStatusUpdate(item)}
            >
              <Text style={styles.modalItemTitle}>
                {meta.icon} {meta.label}
              </Text>
            </TouchableOpacity>
          );
        }
      )}

      {renderOptionModal(
        priorityModal,
        'Set Priority',
        PRIORITY_OPTIONS,
        () => setPriorityModal(false),
        ({ item }) => {
          const meta = PRIORITY_COLORS[item] || PRIORITY_COLORS.medium;

          return (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handlePriorityUpdate(item)}
            >
              <Text style={[styles.modalItemTitle, { color: meta.color }]}>
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        }
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  center: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 10,
    color: C.slate,
    fontWeight: '800',
  },

  errorText: {
    color: C.red,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 12,
  },

  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    flex: 1,
  },

  backText: {
    color: '#fff',
    fontWeight: '900',
  },

  headerCenter: {
    flex: 1.4,
    alignItems: 'center',
  },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },

  statusPill: {
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },

  statusText: {
    fontWeight: '900',
    fontSize: 12,
  },

  content: {
    paddingBottom: 30,
  },

  photoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },

  photoTitle: {
    padding: 14,
    color: C.navy,
    fontWeight: '900',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },

  photo: {
    width: '100%',
    height: 230,
    backgroundColor: '#E2E8F0',
  },

  noPhoto: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  noPhotoText: {
    color: C.slate,
    fontWeight: '700',
    marginTop: 6,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  sectionTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 14,
  },

  detailRow: {
    marginBottom: 12,
  },

  detailLabel: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 4,
  },

  detailValue: {
    color: C.navy,
    fontWeight: '700',
    lineHeight: 20,
  },

  actionBtn: {
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  actionText: {
    color: '#fff',
    fontWeight: '900',
  },

  secondaryAction: {
    borderWidth: 1,
    borderColor: C.teal,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },

  secondaryActionText: {
    color: C.teal,
    fontWeight: '900',
    fontSize: 15,
  },

  closeBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  closeBtnText: {
    color: '#fff',
    fontWeight: '900',
  },

  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  deleteBtnText: {
    color: C.red,
    fontWeight: '900',
  },

  managementRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  managementBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  managementLabel: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 11,
    marginBottom: 8,
  },

  smallPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },

  smallPillText: {
    fontWeight: '900',
    fontSize: 12,
  },

  commentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  commentAuthor: {
    color: C.teal,
    fontWeight: '900',
    marginBottom: 6,
  },

  commentText: {
    color: C.navy,
    lineHeight: 20,
    fontWeight: '700',
  },

  commentDate: {
    color: C.slate,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },

  emptyText: {
    color: C.slate,
    fontWeight: '700',
  },

  disabled: {
    opacity: 0.5,
  },

  primaryBtn: {
    backgroundColor: C.navy,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '900',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalBox: {
    backgroundColor: '#fff',
    width: '100%',
    maxHeight: '75%',
    borderRadius: 18,
    padding: 16,
  },

  modalTitle: {
    color: C.navy,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },

  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },

  modalItemTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
  },

  modalItemSub: {
    color: C.slate,
    fontWeight: '700',
    marginTop: 3,
  },

  modalCancel: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  modalCancelText: {
    color: C.red,
    fontWeight: '900',
  },

  modalEmpty: {
    color: C.slate,
    textAlign: 'center',
    paddingVertical: 20,
    fontWeight: '700',
  },
});
// src/screens/IssueDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  getIssueById,
  updateIssueStatus,
  addComment,
  uploadCompletionPhoto,
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
  pending: {
    label: 'Pending',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FCD34D',
    icon: '⏳',
  },
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

export default function IssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;

  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssue();
  }, []);

  const fetchIssue = async () => {
    try {
      setError(null);
      const data = await getIssueById(issueId);
      setIssue(data.issue || data);
    } catch (err) {
      setError(err.message || 'Could not load issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    if (issue.status === 'in_progress') {
      Alert.alert('Already in progress', 'This task is already marked as in progress.');
      return;
    }

    setActionLoading(true);

    try {
      const result = await updateIssueStatus(issueId, 'in_progress');
      setIssue(result.issue || { ...issue, status: 'in_progress' });
      Alert.alert('✅ Updated', 'Task marked as in progress.');
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Missing comment', 'Please write a comment first.');
      return;
    }

    setActionLoading(true);

    try {
      await addComment(issueId, comment.trim());
      setComment('');
      Alert.alert('✅ Comment Added', 'Your comment was sent to the manager.');
      await fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add comment.');
    } finally {
      setActionLoading(false);
    }
  };

  const takeLivePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const chooseCompletionPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const handleFinishWork = async () => {
    if (!photo) {
      Alert.alert(
        'Completion Photo Required',
        'Take or choose a completion photo before submitting.'
      );
      return;
    }

    setActionLoading(true);

    try {
      await uploadCompletionPhoto(issueId, photo, photoMimeType);

      try {
        await updateIssueStatus(issueId, 'resolved');
      } catch (statusErr) {
        console.log('Resolve after upload:', statusErr.message);
      }

      Alert.alert(
        '✅ Work Submitted',
        'The task was marked as resolved and sent to the manager for review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit finished work.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading task...</Text>
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

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_META[issue.status] || STATUS_META.assigned;
  const isClosed = issue.status === 'closed';
  const isResolved = issue.status === 'resolved';
  const disabled = isClosed || isResolved || actionLoading;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Tasks</Text>
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
          <Text style={styles.sectionTitle}>📋 TASK DETAILS</Text>

          <DetailRow label="Title" value={issue.title || '—'} />
          <DetailRow label="Description" value={issue.description || '—'} />
          <DetailRow label="Category" value={getCategoryName(issue)} />
          <DetailRow
            label="Location"
            value={
              issue.location ||
              issue.location_name ||
              `Location #${issue.location_id || '—'}`
            }
          />
          <DetailRow label="Priority" value={(issue.priority || 'medium').toUpperCase()} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💬 COMMENT TO MANAGER</Text>

          <TextInput
            style={styles.input}
            placeholder="Write an update for the manager..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            editable={!disabled}
          />

          <TouchableOpacity
            style={[styles.secondaryAction, disabled && styles.disabled]}
            onPress={handleAddComment}
            disabled={disabled}
          >
            <Text style={styles.secondaryActionText}>💬 Send Comment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ WORK ACTIONS</Text>

          <TouchableOpacity
            style={[styles.actionBtn, disabled && styles.disabled]}
            onPress={handleMarkInProgress}
            disabled={disabled}
          >
            <Text style={styles.actionText}>🔧 Mark as In Progress</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Completion Photo</Text>

          {photo ? (
            <Image source={{ uri: photo }} style={styles.previewPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={{ fontSize: 34 }}>📸</Text>
              <Text style={styles.noPhotoText}>No completion photo selected</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.photoBtn, disabled && styles.disabled]}
            onPress={takeLivePhoto}
            disabled={disabled}
          >
            <Text style={styles.photoBtnText}>📸 Take Live Completion Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoBtnAlt, disabled && styles.disabled]}
            onPress={chooseCompletionPhoto}
            disabled={disabled}
          >
            <Text style={styles.photoBtnAltText}>🖼️ Choose Completion Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishBtn, disabled && styles.disabled]}
            onPress={handleFinishWork}
            disabled={disabled}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishBtnText}>✅ Submit Finished Work</Text>
            )}
          </TouchableOpacity>

          {isResolved && (
            <Text style={styles.doneNote}>
              This task is resolved and waiting for manager review.
            </Text>
          )}

          {isClosed && (
            <Text style={styles.doneNote}>
              This task has been closed by the manager.
            </Text>
          )}
        </View>
      </ScrollView>
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

  input: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
    color: C.navy,
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
    fontWeight: '600',
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

  actionBtn: {
    backgroundColor: C.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  actionText: {
    color: '#fff',
    fontWeight: '900',
  },

  label: {
    color: C.navy,
    fontWeight: '900',
    marginBottom: 8,
  },

  uploadPlaceholder: {
    height: 145,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  previewPhoto: {
    height: 210,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },

  photoBtn: {
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  photoBtnText: {
    color: '#fff',
    fontWeight: '900',
  },

  photoBtnAlt: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  photoBtnAltText: {
    color: '#92400E',
    fontWeight: '900',
  },

  finishBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },

  finishBtnText: {
    color: '#fff',
    fontWeight: '900',
  },

  doneNote: {
    color: C.green,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  disabled: {
    opacity: 0.45,
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

  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  secondaryBtnText: {
    color: C.navy,
    fontWeight: '900',
  },
});
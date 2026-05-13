// src/screens/community/IssueDetailScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { getIssueById } from '../../services/api';

// Colors matching Manager
const C = {
  navy: '#0B1F3A',
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

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const normalizeComments = (data, issueData) => {
  const possibleComments =
    data?.comments ||
    data?.worker_comments ||
    data?.updates ||
    data?.data?.comments ||
    data?.data?.worker_comments ||
    data?.data?.updates ||
    issueData?.comments ||
    issueData?.worker_comments ||
    issueData?.updates ||
    [];

  return Array.isArray(possibleComments) ? possibleComments : [];
};

const normalizePhotos = (data, issueData) => {
  const possiblePhotos =
    data?.photos ||
    data?.data?.photos ||
    issueData?.photos ||
    [];

  return Array.isArray(possiblePhotos) ? possiblePhotos : [];
};

export default function IssueDetailScreen({ navigation, route }) {
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const issueId = route?.params?.issueId;

  const loadIssue = useCallback(async () => {
    if (!issueId) {
      setLoading(false);
      Alert.alert('Error', 'No issue ID provided.');
      return;
    }

    try {
      const data = await getIssueById(issueId);

      const issueData = data?.issue || data?.data?.issue || data?.data || data;

      setIssue(issueData);
      setComments(normalizeComments(data, issueData));
      setPhotos(normalizePhotos(data, issueData));
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not load issue details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadIssue();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={styles.loadingText}>Loading issue details...</Text>
        </View>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={styles.emptyTitle}>Issue not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = STATUS_META[issue.status] || STATUS_META.pending;

  const resolutionMessage =
    issue.resolution_message ||
    issue.resolution_notes ||
    (issue.status === 'resolved'
      ? 'This issue has been resolved by the facilities team.'
      : null);

  const issuePhoto =
    issue.photo_url ||
    issue.image_url ||
    photos.find((photo) => photo.photo_type === 'issue')?.photo_url;

  const completionPhoto =
    issue.completion_photo_url ||
    issue.completed_photo_url ||
    photos.find((photo) => photo.photo_type === 'completion')?.photo_url;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket #{issue.ticket_id || issueId}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: s.bg,
              borderColor: s.border,
              alignSelf: 'center',
              marginBottom: 16,
            },
          ]}
        >
          <Text style={[styles.statusLabel, { color: s.color }]}>
            {s.dot} {s.label}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{issue.title || 'Issue Details'}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{issue.category_name || issue.category || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{issue.location_name || issue.location || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority</Text>
            <Text style={styles.detailValue}>{issue.priority || 'Medium'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To</Text>
            <Text style={styles.detailValue}>
              {issue.assigned_worker ||
                issue.assigned_worker_username ||
                issue.worker_name ||
                'Not assigned yet'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(issue.created_at)}</Text>
          </View>

          {issue.updated_at && issue.updated_at !== issue.created_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>{formatDate(issue.updated_at)}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>{issue.description || 'No description provided.'}</Text>
        </View>

        {issuePhoto && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attached Photo</Text>
            <Image source={{ uri: issuePhoto }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {resolutionMessage && (
          <View style={[styles.card, styles.resolutionCard]}>
            <Text style={styles.resolutionIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.resolutionTitle}>Resolution Note</Text>
              <Text style={styles.resolutionText}>{resolutionMessage}</Text>
            </View>
          </View>
        )}

        {completionPhoto && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Completion Photo</Text>
            <Image source={{ uri: completionPhoto }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {comments.length > 0 ? '📝 Updates & Worker Comments' : '📝 Updates'}
          </Text>

          {comments.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsIcon}>💬</Text>
              <Text style={styles.noCommentsText}>No updates or comments yet</Text>
              <Text style={styles.noCommentsSubtext}>
                Check back later for status updates from the facilities team
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {comments.map((comment, idx) => {
                const isStatusChange = comment.type === 'status_change' || comment.is_status_update;
                const isWorkerComment = comment.type === 'comment' || comment.is_comment || comment.comment_text;
                const isAssignment = comment.type === 'assignment' || comment.is_assignment;

                let icon = '💬';
                let iconBg = C.cream;

                if (isStatusChange) {
                  icon = '🔄';
                  iconBg = '#ECFEFF';
                } else if (isAssignment) {
                  icon = '👷';
                  iconBg = '#F5F3FF';
                } else if (isWorkerComment) {
                  icon = '👤';
                  iconBg = '#F0FDF4';
                }

                return (
                  <View key={String(comment.comment_id || comment.id || idx)} style={styles.timelineItem}>
                    <View style={[styles.timelineIcon, { backgroundColor: iconBg }]}>
                      <Text style={styles.timelineIconText}>{icon}</Text>
                    </View>

                    <View style={styles.timelineContent}>
                      <Text style={styles.commentAuthor}>
                        {comment.worker_name ||
                          comment.username ||
                          comment.user_name ||
                          comment.author ||
                          comment.role ||
                          (isStatusChange ? 'System' : 'Facilities Team')}
                      </Text>

                      <Text style={styles.commentText}>
                        {comment.comment_text ||
                          comment.comment ||
                          comment.message ||
                          comment.update_text ||
                          (isStatusChange
                            ? `Status changed to ${comment.new_status || issue.status}`
                            : 'No comment text')}
                      </Text>

                      <Text style={styles.commentDate}>
                        {formatDate(comment.created_at || comment.updated_at)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  statusPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  statusLabel: { fontWeight: '900', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
  },
  title: { fontSize: 20, fontWeight: '900', color: C.navy, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: C.navy, marginBottom: 12 },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailLabel: { color: C.slate, fontWeight: '700', fontSize: 13, width: '35%' },
  detailValue: {
    color: C.navy,
    fontWeight: '800',
    fontSize: 13,
    width: '60%',
    textAlign: 'right',
  },

  description: { color: C.slate, lineHeight: 22, fontSize: 14 },
  image: { width: '100%', height: 220, borderRadius: 14, marginTop: 8 },

  resolutionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftColor: C.green,
  },
  resolutionIcon: { fontSize: 28 },
  resolutionTitle: { fontWeight: '900', color: C.navy, marginBottom: 4 },
  resolutionText: { color: C.slate, lineHeight: 20 },

  timeline: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconText: { fontSize: 20 },
  timelineContent: { flex: 1 },
  commentAuthor: { fontWeight: '900', color: C.navy, marginBottom: 4 },
  commentText: { color: C.slate, lineHeight: 20, marginBottom: 4 },
  commentDate: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },

  noCommentsContainer: { alignItems: 'center', paddingVertical: 24 },
  noCommentsIcon: { fontSize: 40, marginBottom: 12, opacity: 0.5 },
  noCommentsText: { fontWeight: '700', color: C.slate, marginBottom: 4 },
  noCommentsSubtext: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  loadingScreen: {
    flex: 1,
    backgroundColor: C.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: { backgroundColor: '#fff', padding: 24, borderRadius: 18, alignItems: 'center' },
  loadingText: { marginTop: 10, color: C.slate, fontWeight: '800' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginTop: 16, marginBottom: 16 },
  backBtn: { backgroundColor: C.navy, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
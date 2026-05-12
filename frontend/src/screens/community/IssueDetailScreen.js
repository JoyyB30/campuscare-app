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
  Platform,
} from 'react-native';

import { BASE_URL, getIssueById } from '../../services/api';
import { C, STATUS_META } from './common';

const getIssueId = issue => issue?.id || issue?.issue_id || issue?.ticket_id || issue?._id;

const valueOf = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
};

const formatDate = value => {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const normalizePhotoUrl = value => {
  if (!value) return null;
  if (String(value).startsWith('http')) return value;
  const clean = String(value).startsWith('/') ? value : `/${value}`;
  const apiRoot = BASE_URL.replace('/api', '');
  return `${apiRoot}${clean}`;
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.border }]}> 
      <Text style={[styles.statusText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
    </View>
  );
}

export default function IssueDetailScreen({ navigation, route }) {
  const routeIssue = route?.params?.issue || null;
  const routeIssueId = route?.params?.issueId || getIssueId(routeIssue);

  const [issue, setIssue] = useState(routeIssue);
  const [loading, setLoading] = useState(!routeIssue);
  const [refreshing, setRefreshing] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!routeIssueId) {
      setLoading(false);
      Alert.alert('Error', 'No issue ID was provided.');
      return;
    }
    try {
      const data = await getIssueById(routeIssueId);
      setIssue(data?.issue || data?.data || data?.row || data);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not load issue details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [routeIssueId]);

  useEffect(() => { loadIssue(); }, [loadIssue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadIssue();
  };

  const title = valueOf(issue?.title, issue?.issue_title, 'Issue Details');
  const description = valueOf(issue?.description, issue?.issue_description);
  const status = valueOf(issue?.status, issue?.current_status, 'pending');
  const category = valueOf(issue?.category_name, issue?.category, issue?.category_title);
  const location = valueOf(issue?.location_name, issue?.location, issue?.location_title);
  const priority = valueOf(issue?.priority, issue?.priority_level);
  const submittedDate = valueOf(issue?.created_at, issue?.submitted_at, issue?.submission_date, issue?.date_created);

  const photoUrl = normalizePhotoUrl(valueOf(issue?.photo_url, issue?.image_url, issue?.issue_photo, issue?.photo, issue?.photo_path));
  const completionPhotoUrl = normalizePhotoUrl(valueOf(issue?.completion_photo_url, issue?.completed_photo_url, issue?.worker_photo_url, issue?.completion_photo, issue?.completed_photo));
  const comments = issue?.comments || issue?.worker_comments || issue?.updates || [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={C.teal} />
          <Text style={styles.loadingText}>Loading issue details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={styles.loadingScreen}>
          <Text style={styles.emptyTitle}>Issue not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backBtnText}>Go Back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.header}>
        <View style={styles.decoLarge} />
        <View style={styles.decoSmall} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Issues</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket #{routeIssueId}</Text>
          <View style={{ width: 70 }} />
        </View>
        <StatusBadge status={status} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <DetailRow label="Category" value={category || 'Not available'} />
          <DetailRow label="Location" value={location || 'Not available'} />
          <DetailRow label="Status" value={String(status).replace(/_/g, ' ')} />
          <DetailRow label="Priority" value={priority || 'Not assigned'} />
          <DetailRow label="Submitted Date" value={formatDate(submittedDate)} />
        </View>

        <PhotoCard title="Issue Photo" url={photoUrl} empty="No issue photo available" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description || 'No description provided.'}</Text>
        </View>

        <PhotoCard title="Worker Completion Photo" url={completionPhotoUrl} empty="No completion photo uploaded yet" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Updates & Worker Comments</Text>
          {Array.isArray(comments) && comments.length ? (
            comments.map((comment, index) => (
              <View key={String(comment.id || index)} style={styles.commentBox}>
                <Text style={styles.commentAuthor}>{comment.worker_name || comment.user_name || comment.author || 'Worker Update'}</Text>
                <Text style={styles.commentText}>{comment.comment_text || comment.comment || comment.message || comment.update_text || 'No comment text'}</Text>
                <Text style={styles.commentDate}>{formatDate(comment.created_at || comment.updated_at || comment.date)}</Text>
              </View>
            ))
          ) : <Text style={styles.noCommentsText}>No worker comments or updates yet.</Text>}
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

function PhotoCard({ title, url, empty }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {url ? <Image source={{ uri: url }} style={styles.issueImage} /> : <View style={styles.noImageBox}><Text style={styles.noImageText}>{empty}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 18 : 14, paddingBottom: 24, overflow: 'hidden', alignItems: 'center' },
  decoLarge: { position: 'absolute', top: -70, right: -80, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)' },
  decoSmall: { position: 'absolute', bottom: -75, left: -65, width: 185, height: 185, borderRadius: 93, backgroundColor: 'rgba(10,147,150,0.20)' },
  headerRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, marginBottom: 12 },
  backText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statusPill: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 8, zIndex: 2 },
  statusText: { fontSize: 13, fontWeight: '900' },
  body: { flex: 1, backgroundColor: C.cream },
  content: { padding: 18, paddingBottom: 40 },
  card: { backgroundColor: C.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 24, fontWeight: '900', color: C.navy, marginBottom: 16 },
  detailRow: { marginBottom: 14 },
  detailLabel: { fontSize: 13, color: C.slate, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  detailValue: { fontSize: 16, color: C.navy, fontWeight: '800', lineHeight: 22, textTransform: 'capitalize' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: C.navy, marginBottom: 12 },
  issueImage: { width: '100%', height: 220, borderRadius: 16, backgroundColor: C.border },
  noImageBox: { height: 150, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  noImageText: { color: C.slate, fontWeight: '800' },
  descriptionText: { color: C.navy, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  commentBox: { borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: '#FAFAFA' },
  commentAuthor: { fontSize: 15, fontWeight: '900', color: C.navy, marginBottom: 6 },
  commentText: { fontSize: 15, color: C.navy, lineHeight: 22, marginBottom: 8 },
  commentDate: { fontSize: 12, color: C.slate, fontWeight: '700' },
  noCommentsText: { color: C.slate, fontSize: 15, fontWeight: '700' },
  loadingScreen: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: C.slate, fontWeight: '700' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginBottom: 16 },
  backBtn: { backgroundColor: C.navy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '900' },
});

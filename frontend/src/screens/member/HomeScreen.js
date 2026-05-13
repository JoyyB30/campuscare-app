// src/screens/community/HomeScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  getMyIssues,
  uploadIssueWithPhoto,
  getMyNotifications,
  logout,
  getUser,
  CATEGORIES,
  LOCATIONS,
} from '../../services/api';

// Colors matching Manager
const C = {
  navy: '#0B1F3A',
  navy2: '#162D4E',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  orange: '#E76F51',
  green: '#2A9D8F',
  red: '#DC2626',
  darkOverlay: 'rgba(11,31,58,0.75)',
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
  return d.toLocaleDateString();
};

// Helper to check if issue has unread updates
const hasUnreadUpdate = (issue) => {
  return issue.has_unread_update || (issue.comments && issue.comments.length > 0 && !issue.viewed);
};

// Helper to get comment count
const getCommentCount = (issue) => {
  if (issue.comments && Array.isArray(issue.comments)) return issue.comments.length;
  if (issue.worker_comments && Array.isArray(issue.worker_comments)) return issue.worker_comments.length;
  if (issue.updates && Array.isArray(issue.updates)) return issue.updates.length;
  return 0;
};

export default function HomeScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('issues');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [createVisible, setCreateVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [username, setUsername] = useState('Member');

  const loadData = useCallback(async () => {
    try {
      const user = await getUser();

      if (user) {
        setUsername(user.username || user.name || 'Member');
      }

      const [issuesResult, notificationsResult] = await Promise.all([
        getMyIssues(),
        getMyNotifications(),
      ]);

      const issuesList =
        issuesResult?.issues ||
        issuesResult?.data ||
        (Array.isArray(issuesResult) ? issuesResult : []);

      const notifList =
        notificationsResult?.notifications ||
        notificationsResult?.data ||
        (Array.isArray(notificationsResult) ? notificationsResult : []);

      setIssues(Array.isArray(issuesList) ? issuesList : []);
      setNotifications(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
      console.log('Load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedLocation(null);
    setPhoto(null);
    setPhotoMimeType('image/jpeg');
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateVisible(true);
  };

  const closeCreateModal = () => {
    if (!submitLoading) {
      setCreateVisible(false);
      resetCreateForm();
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission needed', 'Please allow camera access.');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.75 });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission needed', 'Please allow photo library access.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.75 });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const submitIssue = async () => {
    if (!title.trim()) return Alert.alert('Missing title', 'Please enter an issue title.');
    if (!description.trim()) return Alert.alert('Missing description', 'Please enter the issue description.');
    if (!selectedCategory) return Alert.alert('Missing category', 'Please select a category.');
    if (!selectedLocation) return Alert.alert('Missing location', 'Please select a location.');
    if (!photo) return Alert.alert('Photo required', 'Please take or upload a photo for the issue.');

    setSubmitLoading(true);
    try {
      await uploadIssueWithPhoto(
        {
          title: title.trim(),
          description: description.trim(),
          category_id: selectedCategory.category_id,
          location_id: selectedLocation.location_id,
        },
        photo,
        photoMimeType
      );
      Alert.alert('Issue Submitted', 'Your issue has been submitted successfully.');
      setCreateVisible(false);
      resetCreateForm();
      loadData();
    } catch (err) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit issue.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const statusCounts = {
    All: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    assigned: issues.filter(i => i.status === 'assigned').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const openIssueDetails = (issueId) => {
    navigation.navigate('IssueDetail', { issueId });
  };

  const renderIssueCard = (item) => {
    const id = item.ticket_id || item.id;
    const s = STATUS_META[item.status] || STATUS_META.pending;
    const hasUpdate = hasUnreadUpdate(item);
    const commentCount = getCommentCount(item);

    return (
      <TouchableOpacity
        key={String(id)}
        style={[styles.card, { borderLeftColor: s.border }]}
        onPress={() => openIssueDetails(id)}
        activeOpacity={0.82}
      >
        <View style={styles.cardRow1}>
          <View style={styles.cardLeft}>
            <View style={styles.cardTitleWrapper}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.cardTitle}>{item.title || 'Issue'}</Text>
                {hasUpdate && (
                  <View style={styles.updateBadge}>
                    <Text style={styles.updateBadgeText}>New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardId}>Ticket #{id}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.dot} {s.label}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLine}>📅 Submitted: {formatDate(item.created_at)}</Text>
            <Text style={styles.detailLine}>🏷 {item.category_name || item.category || '—'}</Text>
          </View>
          {commentCount > 0 && (
            <Text style={styles.updateIndicator}>💬 {commentCount} update{commentCount !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationCard = (n) => {
    const id = n.notification_id || n.id;
    const getIcon = () => {
      const type = n.notification_type || n.type;
      if (type === 'assignment') return '👷';
      if (type === 'completion') return '✅';
      if (type === 'status_change') return '🔄';
      return '🔔';
    };

    return (
      <TouchableOpacity
        key={String(id)}
        style={[styles.notificationCard, !n.is_read && { borderLeftColor: C.gold, backgroundColor: '#FFFBEB' }]}
        activeOpacity={0.85}
      >
        <Text style={styles.notifIcon}>{getIcon()}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>{n.title || n.message || 'Notification'}</Text>
          {n.message && n.title && <Text style={styles.notifMsg}>{n.message}</Text>}
          <Text style={styles.notifDate}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</Text>
        </View>
        {!n.is_read && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = (icon, title, subtitle) => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Same as Manager */}
        <View style={styles.topHeader}>
          <View style={styles.deco1} />
          <View style={styles.deco2} />
          <View style={styles.headerTopRow}>
            <View>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>🏛 CAMPUSCARE</Text>
              </View>
              <Text style={styles.portalText}>Community Member Portal</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeSmall}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{username} 👋</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, activeTab === 'issues' && styles.activeStatCard]}
            onPress={() => setActiveTab('issues')}
          >
            <Text style={[styles.statNumber, activeTab === 'issues' && styles.activeStatText]}>{statusCounts.All}</Text>
            <Text style={[styles.statLabel, activeTab === 'issues' && styles.activeStatText]}>My Issues</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, activeTab === 'notifications' && styles.activeStatCard]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.statNumber, activeTab === 'notifications' && styles.activeStatText]}>{notifications.length}</Text>
            <Text style={[styles.statLabel, activeTab === 'notifications' && styles.activeStatText]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Bar */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {activeTab === 'issues'
              ? `${issues.length} issue${issues.length !== 1 ? 's' : ''} found`
              : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} found${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`
            }
          </Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.refreshBtn}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'issues' ? (
          issues.length === 0 ? renderEmpty('📭', 'No issues yet', 'Tap + to submit your first issue') : issues.map(renderIssueCard)
        ) : (
          notifications.length === 0 ? renderEmpty('🔔', 'No notifications', 'You will be notified when your issues are updated') : notifications.map(renderNotificationCard)
        )}
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Submit Issue Modal */}
      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={closeCreateModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report an Issue</Text>
                <TouchableOpacity onPress={closeCreateModal}>
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Issue Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Issue title"
                placeholderTextColor={C.slate}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail"
                placeholderTextColor={C.slate}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.optionsWrap}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.category_id}
                    style={[styles.optionBtn, selectedCategory?.category_id === cat.category_id && styles.optionSelected]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.optionText, selectedCategory?.category_id === cat.category_id && styles.optionTextSelected]}>{cat.category_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Location</Text>
              <View style={styles.optionsWrap}>
                {LOCATIONS.map(loc => (
                  <TouchableOpacity
                    key={loc.location_id}
                    style={[styles.optionBtn, selectedLocation?.location_id === loc.location_id && styles.optionSelected]}
                    onPress={() => setSelectedLocation(loc)}
                  >
                    <Text style={[styles.optionText, selectedLocation?.location_id === loc.location_id && styles.optionTextSelected]}>{loc.building_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Photo</Text>
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.previewImage} />
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.photoBtn} onPress={choosePhoto}>
                      <Text style={styles.photoBtnText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.photoBtn, styles.removeBtn]} onPress={() => setPhoto(null)}>
                      <Text style={[styles.photoBtnText, { color: C.red }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}>
                    <Text style={styles.photoActionText}>📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoActionBtn} onPress={choosePhoto}>
                    <Text style={styles.photoActionText}>🖼️ Choose from Library</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={[styles.submitBtn, submitLoading && styles.disabledBtn]} onPress={submitIssue} disabled={submitLoading}>
                {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Issue</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },
  list: { paddingBottom: 110 },

  topHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(10,147,150,0.18)',
    left: -65,
    bottom: -90,
  },
  deco2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(240,165,0,0.10)',
    right: -85,
    top: -80,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(240,165,0,0.45)',
    backgroundColor: 'rgba(240,165,0,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoText: {
    color: C.gold,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11,
  },
  portalText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    fontSize: 13,
  },
  signOutBtn: {
    minWidth: 96,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#fff',
    fontWeight: '800',
  },
  welcomeSmall: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 18,
  },
  welcomeName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 14,
    marginTop: 18,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  activeStatCard: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: C.navy,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.slate,
    marginTop: 4,
  },
  activeStatText: {
    color: '#fff',
  },
  statBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    color: C.slate,
    fontWeight: '800',
  },
  refreshBtn: {
    color: C.navy,
    fontWeight: '900',
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardTitleWrapper: {
    flex: 1,
  },
  cardTitle: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 3,
  },
  cardId: {
    color: C.slate,
    fontWeight: '700',
    fontSize: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusLabel: {
    fontWeight: '900',
    fontSize: 12,
  },
  cardDesc: {
    color: C.slate,
    lineHeight: 20,
    marginTop: 12,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    marginTop: 12,
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailLine: {
    color: C.slate,
    fontSize: 12,
    fontWeight: '700',
  },
  updateIndicator: {
    color: C.teal,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  updateBadge: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  updateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  notificationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifIcon: { fontSize: 24 },
  notifTitle: { color: C.navy, fontWeight: '900', fontSize: 14 },
  notifMsg: { color: C.slate, marginTop: 4, lineHeight: 18 },
  notifDate: { color: '#94A3B8', marginTop: 6, fontSize: 11, fontWeight: '700' },
  unreadBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold, marginTop: 4 },

  empty: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  emptyTitle: {
    color: C.navy,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  emptySub: {
    color: C.slate,
    textAlign: 'center',
    marginTop: 6,
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 26,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: C.darkOverlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.navy,
  },
  closeText: {
    color: C.teal,
    fontWeight: '900',
    fontSize: 16,
  },
  label: {
    color: C.slate,
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: C.navy,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  optionBtn: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  optionText: {
    color: C.slate,
    fontWeight: '700',
    fontSize: 13,
  },
  optionTextSelected: {
    color: '#fff',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginVertical: 10,
    backgroundColor: C.border,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  photoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.teal,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeBtn: {
    borderColor: C.red,
  },
  photoBtnText: {
    color: C.teal,
    fontWeight: '700',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  photoActionBtn: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: C.teal,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photoActionText: {
    color: C.teal,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: C.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: C.slate,
    fontWeight: '800',
  },
});
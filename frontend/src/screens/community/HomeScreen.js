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
  Platform,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  getMyIssues,
  uploadIssueWithPhoto,
  getMyNotifications,
  logout,
  CATEGORIES,
  LOCATIONS,
} from '../../services/api';
import { C, formatLocationOption } from './common';

const getIssueId = issue => issue?.id || issue?.issue_id || issue?.ticket_id || issue?._id;
const getIssueTitle = issue => issue?.title || issue?.issue_title || issue?.category_name || issue?.category || 'Untitled Issue';
const getIssueStatus = issue => issue?.status || issue?.current_status || 'pending';
const getIssueCategory = issue => issue?.category_name || issue?.category || issue?.category_title || 'No category';
const getIssueDate = issue => issue?.created_at || issue?.submitted_at || issue?.submission_date || issue?.date_created || null;

const formatDate = value => {
  if (!value) return 'No date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const statusStyle = status => {
  const s = String(status || '').toLowerCase();
  if (s.includes('progress')) return { backgroundColor: 'rgba(240,165,0,0.14)', color: C.gold, borderColor: 'rgba(240,165,0,0.35)' };
  if (s.includes('resolved') || s.includes('closed') || s.includes('complete')) return { backgroundColor: 'rgba(21,128,61,0.12)', color: C.green, borderColor: 'rgba(21,128,61,0.28)' };
  return { backgroundColor: 'rgba(10,147,150,0.12)', color: C.teal, borderColor: 'rgba(10,147,150,0.28)' };
};

export default function HomeScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('issues');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');

  const loadData = useCallback(async () => {
    try {
      const [issuesResult, notificationsResult] = await Promise.allSettled([getMyIssues(), getMyNotifications()]);
      if (issuesResult.status === 'fulfilled') {
        const raw = issuesResult.value;
        const list = raw?.issues || raw?.data || raw?.rows || (Array.isArray(raw) ? raw : []);
        setIssues(Array.isArray(list) ? list : []);
      } else console.log('GET MY ISSUES ERROR:', issuesResult.reason);
      if (notificationsResult.status === 'fulfilled') {
        const raw = notificationsResult.value;
        const list = raw?.notifications || raw?.data || raw?.rows || (Array.isArray(raw) ? raw : []);
        setNotifications(Array.isArray(list) ? list : []);
      } else console.log('GET NOTIFICATIONS ERROR:', notificationsResult.reason);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not load your issues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedLocation(null);
    setPhoto(null);
    setPhotoMimeType('image/jpeg');
  };

  const openCreateModal = () => { resetCreateForm(); setCreateVisible(true); };
  const closeCreateModal = () => { if (!submitLoading) { setCreateVisible(false); resetCreateForm(); } };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.log('LOGOUT ERROR:', err); }
    finally { navigation.replace('Login'); }
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
      await uploadIssueWithPhoto({ title: title.trim(), description: description.trim(), category_id: selectedCategory.category_id, location_id: selectedLocation.location_id }, photo, photoMimeType);
      Alert.alert('Issue Submitted', 'Your issue has been submitted successfully.');
      setCreateVisible(false);
      resetCreateForm();
      loadData();
    } catch (err) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit issue.');
    } finally { setSubmitLoading(false); }
  };

  const openIssueDetails = issue => {
    const issueId = getIssueId(issue);
    if (!issueId) return Alert.alert('Error', 'Could not open this issue because it has no ID.');
    navigation.navigate('IssueDetail', { issueId, issue });
  };

  const renderIssueCard = issue => {
    const status = getIssueStatus(issue);
    const badge = statusStyle(status);
    return (
      <TouchableOpacity key={String(getIssueId(issue))} style={styles.issueCard} activeOpacity={0.85} onPress={() => openIssueDetails(issue)}>
        <View style={styles.issueTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.issueTitle}>{getIssueTitle(issue)}</Text>
            <Text style={styles.issueCategory}>{getIssueCategory(issue)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>{String(status).replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.issueBottomRow}>
          <Text style={styles.issueDate}>Submitted: {formatDate(getIssueDate(issue))}</Text>
          <Text style={styles.viewText}>View Details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.header}>
        <View style={styles.decoLarge} />
        <View style={styles.decoSmall} />
        <View style={styles.headerTop}>
          <View>
            <View style={styles.badge}><Text style={styles.badgeText}>🏛 CAMPUSCARE</Text></View>
            <Text style={styles.portalText}>Community Member Portal</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}><Text style={styles.signOutText}>Sign Out</Text></TouchableOpacity>
        </View>
        <Text style={styles.welcomeLight}>Welcome back,</Text>
        <Text style={styles.welcomeName}>hello 👋</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, activeTab === 'issues' && styles.activeStatCard]} onPress={() => setActiveTab('issues')} activeOpacity={0.85}>
            <Text style={[styles.statNumber, activeTab === 'issues' && styles.activeStatText]}>{issues.length}</Text>
            <Text style={[styles.statLabel, activeTab === 'issues' && styles.activeStatText]}>My Issues</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, activeTab === 'notifications' && styles.activeStatCard]} onPress={() => setActiveTab('notifications')} activeOpacity={0.85}>
            <Text style={[styles.statNumber, activeTab === 'notifications' && styles.activeStatText]}>{notifications.length}</Text>
            <Text style={[styles.statLabel, activeTab === 'notifications' && styles.activeStatText]}>Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activeTab === 'issues' ? 'My submitted issues' : 'Notifications'}</Text>
          <TouchableOpacity onPress={loadData}><Text style={styles.refreshText}>↻ Refresh</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}><ActivityIndicator color={C.teal} size="large" /><Text style={styles.loadingText}>Loading...</Text></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.listContent}>
            {activeTab === 'issues' ? (
              issues.length ? issues.map(renderIssueCard) : <EmptyState icon="📬" title="No issues yet" text="Your submitted issues will appear here." />
            ) : notifications.length ? (
              notifications.map((n, index) => <View key={String(n.id || index)} style={styles.issueCard}><Text style={styles.issueTitle}>{n.title || n.type || 'Notification'}</Text><Text style={styles.notificationBody}>{n.message || n.body || 'No message'}</Text></View>)
            ) : <EmptyState icon="🔔" title="No notifications yet" text="Updates about your issues will appear here." />}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.85}><Text style={styles.fabText}>+</Text></TouchableOpacity>
      </View>

      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={closeCreateModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit New Issue</Text>
                <TouchableOpacity onPress={closeCreateModal}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Issue Title</Text>
              <TextInput style={styles.modalInput} value={title} onChangeText={setTitle} />
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput style={[styles.modalInput, styles.descriptionInput]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.optionWrap}>{CATEGORIES.map(cat => <TouchableOpacity key={cat.category_id} style={[styles.optionBtn, selectedCategory?.category_id === cat.category_id && styles.optionSelected]} onPress={() => setSelectedCategory(cat)}><Text style={[styles.optionText, selectedCategory?.category_id === cat.category_id && styles.optionTextSelected]}>{cat.category_name}</Text></TouchableOpacity>)}</View>
              <Text style={styles.modalLabel}>Location</Text>
              <View style={styles.locationWrap}>{LOCATIONS.map(loc => <TouchableOpacity key={loc.location_id} style={[styles.locationBtn, selectedLocation?.location_id === loc.location_id && styles.optionSelected]} onPress={() => setSelectedLocation(loc)}><Text style={[styles.optionText, selectedLocation?.location_id === loc.location_id && styles.optionTextSelected]}>{formatLocationOption(loc)}</Text></TouchableOpacity>)}</View>
              <Text style={styles.modalLabel}>Photo</Text>
              {photo ? <Image source={{ uri: photo }} style={styles.previewImage} /> : <View style={styles.noPhotoBox}><Text style={styles.noPhotoText}>No photo selected</Text></View>}
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}><Text style={styles.photoBtnText}>Take Photo</Text></TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={choosePhoto}><Text style={styles.photoBtnText}>Upload Photo</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.submitBtn, submitLoading && styles.disabledBtn]} onPress={submitIssue} disabled={submitLoading}>{submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Issue</Text>}</TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({ icon, title, text }) {
  return <View style={styles.emptyState}><Text style={styles.emptyIcon}>{icon}</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptySub}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  header: { backgroundColor: C.navy, paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 20 : 12, paddingBottom: 34, overflow: 'hidden' },
  decoLarge: { position: 'absolute', top: -80, right: -80, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)' },
  decoSmall: { position: 'absolute', bottom: -65, left: -60, width: 195, height: 195, borderRadius: 98, backgroundColor: 'rgba(10,147,150,0.20)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 46, zIndex: 2 },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.16)', borderWidth: 1.5, borderColor: 'rgba(240,165,0,0.45)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  portalText: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12 },
  signOutBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22 },
  signOutText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  welcomeLight: { color: 'rgba(255,255,255,0.68)', fontSize: 28, marginBottom: 6, zIndex: 2 },
  welcomeName: { color: '#fff', fontSize: 38, fontWeight: '900', zIndex: 2 },
  body: { flex: 1, backgroundColor: C.cream, paddingHorizontal: 18, paddingTop: 18 },
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 18, paddingVertical: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  activeStatCard: { backgroundColor: C.navy, borderColor: C.navy },
  statNumber: { color: C.navy, fontSize: 34, fontWeight: '900', marginBottom: 6 },
  statLabel: { color: C.slate, fontSize: 15, fontWeight: '900' },
  activeStatText: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: C.navy, flex: 1 },
  refreshText: { fontSize: 16, fontWeight: '900', color: C.teal },
  listContent: { paddingBottom: 110 },
  issueCard: { backgroundColor: C.white, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  issueTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  issueTitle: { fontSize: 18, fontWeight: '900', color: C.navy, marginBottom: 6 },
  issueCategory: { fontSize: 14, color: C.slate, fontWeight: '700' },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '900' },
  issueBottomRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issueDate: { fontSize: 13, color: C.slate, fontWeight: '700' },
  viewText: { fontSize: 13, color: C.teal, fontWeight: '900' },
  notificationBody: { color: C.slate, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.slate, marginTop: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 130 },
  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 28, fontWeight: '900', color: C.navy, marginBottom: 8 },
  emptySub: { fontSize: 16, color: C.slate, textAlign: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 26, width: 64, height: 64, borderRadius: 32, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', shadowColor: C.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 9 },
  fabText: { color: '#FFFFFF', fontSize: 40, fontWeight: '700', marginTop: -3 },
  modalOverlay: { flex: 1, backgroundColor: C.darkOverlay, justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '92%', backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 28, fontWeight: '900', color: C.navy, flex: 1 },
  closeText: { color: C.teal, fontSize: 16, fontWeight: '900' },
  modalLabel: { fontSize: 12, fontWeight: '900', color: C.slate, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 15, fontSize: 15, color: C.navy, marginBottom: 12 },
  descriptionInput: { minHeight: 110 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  locationWrap: { gap: 8, marginBottom: 12 },
  optionBtn: { borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  locationBtn: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  optionSelected: { backgroundColor: C.navy, borderColor: C.navy },
  optionText: { color: C.slate, fontSize: 13, fontWeight: '800' },
  optionTextSelected: { color: '#fff' },
  previewImage: { width: '100%', height: 180, borderRadius: 16, marginBottom: 12, backgroundColor: C.border },
  noPhotoBox: { height: 120, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noPhotoText: { color: C.slate, fontWeight: '800' },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  photoBtn: { flex: 1, borderWidth: 1.5, borderColor: C.teal, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: C.white },
  photoBtnText: { color: C.teal, fontSize: 14, fontWeight: '900' },
  submitBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginBottom: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  disabledBtn: { opacity: 0.7 },
});

// src/screens/community/SubmitIssueScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { uploadIssueWithPhoto, LOCATIONS, CATEGORIES } from '../../services/api';
import { C, formatLocationOption } from './common';

function PickerModal({ visible, title, items, labelKey, valueKey, onSelect, onClose, renderLabel }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item[valueKey])}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={pickerStyles.item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={pickerStyles.itemText}>{renderLabel ? renderLabel(item) : item[labelKey]}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SubmitIssueScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library access is needed to select images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const validate = () => {
    if (!title.trim()) return Alert.alert('Missing Field', 'Please enter an issue title.'), false;
    if (!description.trim()) return Alert.alert('Missing Field', 'Please enter an issue description.'), false;
    if (!category) return Alert.alert('Missing Field', 'Please select a category.'), false;
    if (!location) return Alert.alert('Missing Field', 'Please select a location.'), false;
    if (!photoUri) return Alert.alert('Photo Required', 'Please take or upload a photo.'), false;
    return true;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setLocation(null);
    setPhotoUri(null);
    setPhotoMimeType('image/jpeg');
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await uploadIssueWithPhoto(
        { title: title.trim(), description: description.trim(), category_id: category.category_id, location_id: location.location_id },
        photoUri,
        photoMimeType
      );
      Alert.alert('Issue Submitted', 'Your issue has been reported successfully.', [
        { text: 'View My Issues', onPress: () => navigation.replace('MyIssues') },
        { text: 'Submit Another', onPress: resetForm },
      ]);
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not submit issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.decoLarge} />
          <View style={styles.decoSmall} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Issue</Text>
            <View style={styles.headerSide} />
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>🏛 CAMPUSCARE</Text></View>
          <Text style={styles.headerSub}>Submit a clear report for the facility team.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Issue Details</Text>
            <Text style={styles.label}>Issue Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} editable={!loading} />
            <Text style={styles.label}>Description *</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline editable={!loading} textAlignVertical="top" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Location & Category</Text>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)} disabled={loading}>
              <Text style={category ? styles.pickerValue : styles.pickerPlaceholder}>{category ? category.category_name : 'Select category'}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowLocationPicker(true)} disabled={loading}>
              <Text style={location ? styles.pickerValue : styles.pickerPlaceholder}>{location ? formatLocationOption(location) : 'Select location'}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Issue Photo *</Text>
            {photoUri ? (
              <View>
                <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
                <View style={styles.photoActionRow}>
                  <TouchableOpacity style={styles.photoSmallBtn} onPress={pickFromLibrary} disabled={loading}><Text style={styles.photoSmallText}>Change</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.photoSmallBtn, styles.removeBtn]} onPress={() => setPhotoUri(null)} disabled={loading}><Text style={[styles.photoSmallText, { color: C.red }]}>Remove</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} disabled={loading}><Text style={styles.photoText}>Take Photo</Text></TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary} disabled={loading}><Text style={styles.photoText}>Upload Photo</Text></TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.submitBtn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Issue Report</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal visible={showCategoryPicker} title="Select Category" items={CATEGORIES} labelKey="category_name" valueKey="category_id" onSelect={setCategory} onClose={() => setShowCategoryPicker(false)} />
      <PickerModal visible={showLocationPicker} title="Select Location" items={LOCATIONS} labelKey="building_name" valueKey="location_id" renderLabel={formatLocationOption} onSelect={setLocation} onClose={() => setShowLocationPicker(false)} />
    </SafeAreaView>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.darkOverlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '72%' },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  title: { color: C.navy, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  item: { backgroundColor: C.white, paddingVertical: 15, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  itemText: { color: C.navy, fontSize: 15, fontWeight: '800' },
  cancelBtn: { marginTop: 10, borderWidth: 2, borderColor: C.teal, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: C.teal, fontWeight: '900' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 18 : 14, paddingBottom: 26, overflow: 'hidden' },
  decoLarge: { position: 'absolute', top: -70, right: -80, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)' },
  decoSmall: { position: 'absolute', bottom: -70, left: -65, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(10,147,150,0.20)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, zIndex: 2 },
  headerSide: { flex: 1 },
  backText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  headerTitle: { flex: 1.6, color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.16)', borderWidth: 1.5, borderColor: 'rgba(240,165,0,0.45)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, zIndex: 2 },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 12, zIndex: 2 },
  content: { padding: 16, paddingBottom: 34 },
  card: { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14, shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { color: C.navy, fontWeight: '900', fontSize: 18, marginBottom: 14 },
  label: { color: C.slate, fontWeight: '900', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14, color: C.navy, fontSize: 15, marginBottom: 14, fontWeight: '700' },
  textArea: { minHeight: 115, lineHeight: 21 },
  pickerBtn: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pickerValue: { flex: 1, color: C.navy, fontWeight: '800' },
  pickerPlaceholder: { flex: 1, color: '#94A3B8', fontWeight: '700' },
  chevron: { color: C.navy, fontSize: 16, fontWeight: '900' },
  preview: { width: '100%', height: 210, borderRadius: 16, marginBottom: 12, backgroundColor: C.border },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, borderWidth: 2, borderColor: C.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: C.white },
  photoText: { color: C.teal, fontWeight: '900' },
  photoActionRow: { flexDirection: 'row', gap: 10 },
  photoSmallBtn: { flex: 1, borderWidth: 1.5, borderColor: C.teal, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  removeBtn: { borderColor: C.red },
  photoSmallText: { color: C.teal, fontWeight: '900' },
  submitBtn: { backgroundColor: C.navy, borderRadius: 16, paddingVertical: 17, alignItems: 'center', shadowColor: C.navy, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.7 },
});

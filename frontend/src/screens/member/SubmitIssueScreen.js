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

const C = {
  navy: '#0B1F3A',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  white: '#FFFFFF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
  darkOverlay: 'rgba(11,31,58,0.75)',
};

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
              <TouchableOpacity style={pickerStyles.item} onPress={() => { onSelect(item); onClose(); }}>
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
    if (!permission.granted) return Alert.alert('Permission Required', 'Camera access needed.');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission Required', 'Library access needed.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setLocation(null);
    setPhotoUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing', 'Please enter a title.');
    if (!description.trim()) return Alert.alert('Missing', 'Please enter a description.');
    if (!category) return Alert.alert('Missing', 'Please select a category.');
    if (!location) return Alert.alert('Missing', 'Please select a location.');
    if (!photoUri) return Alert.alert('Missing', 'Please take or upload a photo.');
    
    setLoading(true);
    try {
      await uploadIssueWithPhoto(
        { title: title.trim(), description: description.trim(), category_id: category.category_id, location_id: location.location_id },
        photoUri,
        photoMimeType
      );
      Alert.alert('Success', 'Issue submitted successfully!', [
        { text: 'View My Issues', onPress: () => navigation.replace('MyIssues') },
        { text: 'Submit Another', onPress: resetForm },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit issue.');
    } finally {
      setLoading(false);
    }
  };

  const formatLocationOption = (loc) => `${loc.building_name} - ${loc.area}`;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Issue</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Issue Details</Text>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Brief summary" placeholderTextColor={C.slate} />
            <Text style={styles.label}>Description *</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Detailed description" placeholderTextColor={C.slate} multiline textAlignVertical="top" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location & Category</Text>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)}>
              <Text style={category ? styles.pickerValue : styles.pickerPlaceholder}>{category ? category.category_name : 'Select category'}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowLocationPicker(true)}>
              <Text style={location ? styles.pickerValue : styles.pickerPlaceholder}>{location ? formatLocationOption(location) : 'Select location'}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photo *</Text>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary}><Text style={styles.photoBtnText}>Change</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.photoBtn, styles.removeBtn]} onPress={() => setPhotoUri(null)}><Text style={[styles.photoBtnText, { color: C.red }]}>Remove</Text></TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}><Text style={styles.photoActionText}>📷 Take Photo</Text></TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={pickFromLibrary}><Text style={styles.photoActionText}>🖼️ Choose from Library</Text></TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.submitBtn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Issue</Text>}
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
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '70%' },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 16, color: C.navy },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  itemText: { fontSize: 16, color: C.navy },
  cancelBtn: { marginTop: 12, borderWidth: 2, borderColor: C.teal, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: C.teal, fontWeight: '900' },
});

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
  content: { padding: 16, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: C.navy, marginBottom: 12 },
  label: { color: C.slate, fontWeight: '900', fontSize: 11, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: C.navy,
    marginBottom: 12,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  pickerValue: { flex: 1, color: C.navy },
  pickerPlaceholder: { flex: 1, color: C.slate },
  chevron: { fontSize: 12, color: C.slate },
  
  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoBtn: { flex: 1, borderWidth: 1.5, borderColor: C.teal, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  removeBtn: { borderColor: C.red },
  photoBtnText: { color: C.teal, fontWeight: '700' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoActionBtn: { flex: 1, borderWidth: 1.5, borderColor: C.teal, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  photoActionText: { color: C.teal, fontWeight: '700' },
  
  submitBtn: { backgroundColor: C.navy, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.7 },
});
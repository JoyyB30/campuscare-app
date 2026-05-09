import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_IP:5000';

export default function IssueDetailScreen({ route, navigation }) {
  const { issue, token } = route.params;
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const markInProgress = async () => {
    setLoading(true);
    try {
      await axios.put(
        API_URL + '/api/issues/' + issue.ticket_id + '/status',
        { status: 'in_progress' },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      Alert.alert('Success', 'Issue marked as In Progress!');
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadCompletionPhoto = async () => {
    if (!photo) {
      Alert.alert('No photo', 'Please pick a photo first');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', { uri: photo, name: 'completion.jpg', type: 'image/jpeg' });
      formData.append('comment', comment);
      await axios.post(
        API_URL + '/api/issues/' + issue.ticket_id + '/photo',
        formData,
        { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } }
      );
      Alert.alert('Success', 'Completion photo uploaded!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not upload photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{issue.title}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{issue.location}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{issue.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{issue.status}</Text>
      </View>

      <TouchableOpacity style={styles.btnBlue} onPress={markInProgress} disabled={loading}>
        <Text style={styles.btnText}>Mark as In Progress</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>Add Comment</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe what you did..."
          value={comment}
          onChangeText={setComment}
          multiline={true}
        />
      </View>

      <TouchableOpacity style={styles.btnGray} onPress={pickPhoto}>
        <Text style={styles.btnText}>Pick Completion Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnGreen} onPress={uploadCompletionPhoto} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Submit Completion</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 13, color: '#95a5a6', marginBottom: 4 },
  value: { fontSize: 15, color: '#2c3e50' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fff', minHeight: 80 },
  btnBlue: { backgroundColor: '#3498db', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnGreen: { backgroundColor: '#2ecc71', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnGray: { backgroundColor: '#95a5a6', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
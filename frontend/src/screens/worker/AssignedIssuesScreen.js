import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_IP:5000';

export default function AssignedIssuesScreen({ navigation, route }) {
  const { token } = route.params;
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await axios.get(API_URL + '/api/issues/assigned', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setIssues(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load issues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return '#f39c12';
    if (status === 'in_progress') return '#3498db';
    if (status === 'resolved') return '#2ecc71';
    return '#95a5a6';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Assigned Tasks</Text>
      {issues.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No issues assigned to you yet.</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.ticket_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('IssueDetail', { issue: item, token: token })}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardLocation}>{item.location}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#95a5a6' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLocation: { fontSize: 12, color: '#95a5a6' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});
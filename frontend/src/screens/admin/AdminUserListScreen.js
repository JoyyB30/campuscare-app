import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_IP:5000';

export default function AdminUserListScreen({ route }) {
  const { token } = route.params;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL + '/api/admin/users', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setUsers(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, isActive) => {
    const newStatus = isActive ? 'inactive' : 'active';
    try {
      await axios.put(
        API_URL + '/api/admin/users/' + userId + '/status',
        { status: newStatus },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, is_active: !isActive } : u
      ));
    } catch (err) {
      Alert.alert('Error', 'Could not update user status');
    }
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
      <Text style={styles.title}>All Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, item.is_active ? styles.btnRed : styles.btnGreen]}
              onPress={() => toggleStatus(item.user_id, item.is_active)}
            >
              <Text style={styles.btnText}>{item.is_active ? 'Deactivate' : 'Activate'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  cardLeft: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  email: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  role: { fontSize: 12, color: '#95a5a6', marginTop: 4 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnRed: { backgroundColor: '#e74c3c' },
  btnGreen: { backgroundColor: '#2ecc71' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
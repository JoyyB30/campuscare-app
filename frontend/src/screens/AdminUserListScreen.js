import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getAdminUsers,
  updateAdminUserStatus,
  clearAuth,
} from '../services/api';

const C = {
  navy: '#0B1F3A',
  gold: '#F0A500',
  teal: '#0A9396',
  cream: '#F8F4EF',
  slate: '#64748B',
  border: '#E2E8F0',
  red: '#DC2626',
  green: '#15803D',
};

const ROLE_META = {
  facility_manager: {
    label: 'Facility Manager',
    icon: '🏛️',
    color: '#0B1F3A',
    bg: '#EFF6FF',
  },
  worker: {
    label: 'Worker',
    icon: '👷',
    color: '#0891B2',
    bg: '#ECFEFF',
  },
  community_member: {
    label: 'Community Member',
    icon: '🎓',
    color: '#15803D',
    bg: '#F0FDF4',
  },
};

export default function AdminUserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const normalizeUsers = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.users)) return data.users;
    return [];
  };

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      const allUsers = normalizeUsers(data);

      // IMPORTANT:
      // Admin accounts are hidden completely.
      // The admin can only manage community members, workers, and facility managers.
      const nonAdminUsers = allUsers.filter(user => user.role !== 'admin');

      setUsers(nonAdminUsers);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const counts = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active !== false).length,
      inactive: users.filter(u => u.is_active === false).length,
    };
  }, [users]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const updateUserActiveState = async (user, newActiveState) => {
    const userId = user.user_id || user.id;

    try {
      await updateAdminUserStatus(userId, newActiveState);

      setUsers(prev =>
        prev.map(u =>
          (u.user_id || u.id) === userId
            ? { ...u, is_active: newActiveState }
            : u
        )
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update user status.');
    }
  };

  const confirmActivate = (user) => {
    const name = user.username || user.email || 'this user';

    Alert.alert(
      'Activate User',
      `Are you sure you want to activate ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => updateUserActiveState(user, true),
        },
      ]
    );
  };

  const confirmDeactivate = (user) => {
    const name = user.username || user.email || 'this user';

    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => updateUserActiveState(user, false),
        },
      ]
    );
  };

  const renderUserCard = (user) => {
    const id = user.user_id || user.id;
    const isActive = user.is_active !== false;

    const role = ROLE_META[user.role] || {
      label: user.role || 'User',
      icon: '👤',
      color: C.slate,
      bg: '#F8FAFC',
    };

    const name =
      user.username ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      'Unnamed User';

    return (
      <View key={String(id)} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.roleIcon, { backgroundColor: role.bg }]}>
            <Text style={styles.roleIconText}>{role.icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View
            style={[
              styles.activePill,
              {
                backgroundColor: isActive ? '#F0FDF4' : '#FEF2F2',
                borderColor: isActive ? '#86EFAC' : '#FECACA',
              },
            ]}
          >
            <Text
              style={{
                color: isActive ? C.green : C.red,
                fontWeight: '900',
                fontSize: 12,
              }}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={[styles.rolePill, { backgroundColor: role.bg }]}>
            <Text style={[styles.roleText, { color: role.color }]}>
              {role.label}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                !isActive ? styles.activateBright : styles.inactiveDull,
              ]}
              onPress={() => confirmActivate(user)}
              disabled={isActive}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: !isActive ? C.green : '#94A3B8' },
                ]}
              >
                Activate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                isActive ? styles.deactivateBright : styles.inactiveDull,
              ]}
              onPress={() => confirmDeactivate(user)}
              disabled={!isActive}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: isActive ? C.red : '#94A3B8' },
                ]}
              >
                Deactivate
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.navy}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.deco1} />
          <View style={styles.deco2} />

          <View style={styles.headerTop}>
            <View>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>🏛 CAMPUSCARE</Text>
              </View>
              <Text style={styles.portalText}>Admin Portal</Text>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.welcomeSmall}>User Management</Text>
          <Text style={styles.welcomeName}>Accounts & Access 🛡️</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{counts.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNum}>{counts.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNum}>{counts.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>Registered users</Text>

          <TouchableOpacity onPress={loadUsers}>
            <Text style={styles.refreshText}>↺ Refresh</Text>
          </TouchableOpacity>
        </View>

        {users.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySub}>
              No manageable users found. Admin accounts are hidden.
            </Text>
          </View>
        ) : (
          users.map(renderUserCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: C.slate,
    fontWeight: '800',
  },

  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
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

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  statNum: {
    color: C.navy,
    fontSize: 24,
    fontWeight: '900',
  },

  statLabel: {
    color: C.slate,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },

  resultsBar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  resultsText: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 16,
  },

  refreshText: {
    color: C.teal,
    fontWeight: '900',
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleIconText: {
    fontSize: 22,
  },

  name: {
    color: C.navy,
    fontWeight: '900',
    fontSize: 15,
  },

  email: {
    color: C.slate,
    fontWeight: '700',
    marginTop: 3,
  },

  activePill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
    marginTop: 14,
  },

  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 12,
  },

  roleText: {
    fontWeight: '900',
    fontSize: 12,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  activateBright: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },

  deactivateBright: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  inactiveDull: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.55,
  },

  actionText: {
    fontWeight: '900',
    fontSize: 15,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 26,
  },

  emptyIcon: {
    fontSize: 54,
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
});
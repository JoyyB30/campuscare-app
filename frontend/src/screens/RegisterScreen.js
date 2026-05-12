import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { register } from '../services/api';

// The roles a user can pick when registering.
// Admins and Facility Managers should be created by an admin in a real system,
// but we include them here for demo/testing purposes.
const ROLES = [
  { value: 'community_member', label: '🎓  Community Member', desc: 'Submit and track issues' },
  { value: 'worker',           label: '🔧  Worker',           desc: 'Handle assigned issues' },
  { value: 'facility_manager', label: '🏛  Facility Manager', desc: 'Manage all issues' },
  { value: 'admin',            label: '🛡  Admin',            desc: 'Manage all registered users' },
];

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('community_member');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Missing field', 'Please enter a username.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing field', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password, role);
      Alert.alert(
        '✅ Account created!',
        'You can now log in with your credentials.',
        [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1F3A" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.deco1} />
            <View style={styles.deco2} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏛 CAMPUSCARE</Text>
            </View>
            <Text style={styles.headline}>Create account</Text>
            <Text style={styles.sub}>Join the CampusCare community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. john_doe"
              placeholderTextColor="#CBD5E1"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#CBD5E1"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(v => !v)}
              >
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleGroup}>
              {ROLES.map(r => {
                const active = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleDesc, active && styles.roleDescActive]}>
                      {r.desc}
                    </Text>
                    {active && (
                      <View style={styles.roleCheck}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.registerBtnText}>Create Account →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>Already have an account? Sign in</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F3A' },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(240,165,0,0.12)',
  },
  deco2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(10,147,150,0.18)',
  },
  backBtn: { marginBottom: 20, alignSelf: 'flex-start', padding: 4 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240,165,0,0.2)',
    borderWidth: 1, borderColor: 'rgba(240,165,0,0.35)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, marginBottom: 16,
  },
  badgeText: { color: '#F0A500', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  headline:  { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  sub:       { color: 'rgba(255,255,255,0.55)', fontSize: 14 },

  form: {
    flex: 1,
    backgroundColor: '#F8F4EF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 32,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#0B1F3A',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#0B1F3A',
  },
  eyeBtn:  { paddingHorizontal: 16 },
  eyeIcon: { fontSize: 18 },

  roleGroup:    { gap: 10, marginBottom: 28 },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: '#0B1F3A',
    borderColor: '#0B1F3A',
  },
  roleLabel: { fontSize: 14, fontWeight: '800', color: '#0B1F3A', marginBottom: 2 },
  roleLabelActive: { color: '#F0A500' },
  roleDesc:  { fontSize: 12, color: '#64748B' },
  roleDescActive: { color: 'rgba(255,255,255,0.6)' },
  roleCheck: {
    position: 'absolute', top: 14, right: 14,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#0A9396',
    alignItems: 'center', justifyContent: 'center',
  },

  registerBtn: {
    backgroundColor: '#0B1F3A',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  loginLink: { alignItems: 'center', paddingBottom: 24 },
  loginLinkText: { color: '#0A9396', fontSize: 14, fontWeight: '700' },
});

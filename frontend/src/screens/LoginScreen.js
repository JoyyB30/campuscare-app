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

import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Missing field', 'Please enter your email address.');
      return;
    }

    if (!password) {
      Alert.alert('Missing field', 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const data = await login(email.trim().toLowerCase(), password);
      const role = data.user?.role;

      if (role === 'facility_manager') {
        navigation.replace('FMApp');
      } else if (role === 'admin') {
        navigation.replace('AdminApp');
      } else if (role === 'community_member') {
        navigation.replace('CMApp');
      } else if (role === 'worker') {
        navigation.replace('WorkerApp');
      } else {
        Alert.alert('Error', 'Unknown role. Please contact your administrator.');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
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
          <View style={styles.header}>
            <View style={styles.deco1} />
            <View style={styles.deco2} />

            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏛 CAMPUSCARE</Text>
            </View>

            <Text style={styles.headline}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to your account to continue</Text>
          </View>

          <View style={styles.form}>
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
                placeholder="••••••••"
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

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to CampusCare?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerBtnText}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1F3A',
  },

  scroll: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
    overflow: 'hidden',
  },

  deco1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(240,165,0,0.12)',
  },

  deco2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(10,147,150,0.18)',
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240,165,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(240,165,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 20,
  },

  badgeText: {
    color: '#F0A500',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  headline: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
    zIndex: 1,
  },

  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },

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
    marginBottom: 24,
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

  eyeBtn: {
    paddingHorizontal: 16,
  },

  eyeIcon: {
    fontSize: 18,
  },

  loginBtn: {
    backgroundColor: '#0B1F3A',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  registerBtn: {
    borderWidth: 2,
    borderColor: '#0A9396',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  registerBtnText: {
    color: '#0A9396',
    fontSize: 15,
    fontWeight: '800',
  },
});
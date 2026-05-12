// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';

import { login, forgotPassword } from '../services/api';

const colors = {
  primary: '#0B1F3A',
  secondary: '#F0A500',
  accent: '#0A9396',
  background: '#F8F4EF',
  surface: '#FFFFFF',
  text: '#0B1F3A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const typography = {
  h1: { fontSize: 32, fontWeight: '900', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '800', lineHeight: 32 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};
const radius = { md: 14, xl: 30, round: 40 };

const goToRoleApp = (navigation, role) => {
  if (role === 'facility_manager') navigation.replace('FMApp');
  else if (role === 'admin') navigation.replace('AdminApp');
  else if (role === 'community_member') navigation.replace('CMApp');
  else if (role === 'worker') navigation.replace('WorkerApp');
  else Alert.alert('Login Failed', 'Unknown user role.');
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Missing Field', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      goToRoleApp(navigation, data.user?.role);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotContinue = async () => {
    const cleanEmail = forgotEmail.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert('Missing Field', 'Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    try {
      // This checks that the email exists on the backend.
      await forgotPassword(cleanEmail);
      setForgotVisible(false);
      setForgotEmail('');
      navigation.navigate('ResetPassword', { email: cleanEmail });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not start password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏫</Text>
            </View>
            <Text style={styles.appName}>CampusCare</Text>
            <Text style={styles.tagline}>Report • Track • Resolve</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => {
                setForgotEmail(email.trim().toLowerCase());
                setForgotVisible(true);
              }}
              disabled={loading}
            >
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
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
              disabled={loading}
            >
              <Text style={styles.registerBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>CampusCare © 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>🔐</Text>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.modalText}>
              Enter your account email, then you will create a new password on the next screen.
            </Text>
        <View style={styles.modalInputGroup}>
          <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!forgotLoading}
            />
        </View>

            <TouchableOpacity
              style={[styles.loginBtn, forgotLoading && styles.loginBtnDisabled]}
              onPress={handleForgotContinue}
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setForgotVisible(false)}
              disabled={forgotLoading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  header: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 44 },
  appName: { ...typography.h1, color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: { ...typography.h2, color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  formSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputGroup: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  passwordInput: { flex: 1, padding: spacing.md, fontSize: 15, color: colors.text },
  eyeBtn: { paddingRight: spacing.md },
  eyeIcon: { fontSize: 14, fontWeight: '700', color: colors.primary },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotLinkText: { color: colors.secondary, fontWeight: '800', fontSize: 14 },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  registerBtn: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  registerBtnText: { color: colors.accent, fontSize: 15, fontWeight: '900' },
  footer: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalIcon: { fontSize: 42, textAlign: 'center', marginBottom: spacing.sm },
  modalTitle: { ...typography.h2, color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  modalText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '800' },
  modalInputGroup: {
  marginTop: spacing.sm,
  marginBottom: spacing.lg,
},

modalContinueBtn: {
  backgroundColor: colors.primary,
  borderRadius: radius.md,
  paddingVertical: spacing.md,
  alignItems: 'center',
  marginBottom: spacing.md,
},
});

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
  Linking,
} from 'react-native';
import { login } from '../services/api';

// Theme Colors
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
  success: '#10B981',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  h1: { fontSize: 32, fontWeight: '900', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '800', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};

const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 30,
  round: 40,
};

// Get laptop IP - update this with your actual IP
const getLaptopIp = () => {
  return '192.168.0.90'; // Update with your actual IP
};

const BASE_URL = `http://${getLaptopIp()}:5000/api`;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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
        Alert.alert('Login Failed', 'Unknown user role');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Missing Field', 'Please enter your email address.');
      return;
    }

    setResetLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send reset email');
      }

      // Show preview URL for Ethereal email testing
      let message = `If an account exists with ${resetEmail}, you will receive password reset instructions.`;
      
      if (data.preview) {
        message = `Reset email sent!\n\n📧 Preview URL: ${data.preview}\n\nCheck this link to see the reset email in your browser (Ethereal test inbox).\n\n${message}`;
      }
      
      if (data.resetToken) {
        message += `\n\n🔑 Reset Token (for testing): ${data.resetToken.substring(0, 20)}...`;
      }

      Alert.alert(
        'Reset Email Sent',
        message,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setForgotModalVisible(false);
              setResetEmail('');
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const openTermsLink = () => {
    Linking.openURL('https://www.campuscaredemo.com/terms');
  };

  const openPrivacyLink = () => {
    Linking.openURL('https://www.campuscaredemo.com/privacy');
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
                placeholder="Enter your Email"
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
              onPress={() => setForgotModalVisible(true)}
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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account?{' '}
                <Text style={styles.registerLinkHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={openTermsLink}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>•</Text>
              <TouchableOpacity onPress={openPrivacyLink}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>CampusCare © 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={forgotModalVisible}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!resetLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.resetBtn, resetLoading && styles.resetBtnDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetBtnText}>Send Reset Instructions</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setForgotModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 40 },
  appName: { ...typography.h1, color: '#FFFFFF', letterSpacing: -1 },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: spacing.xs },
  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md, padding: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, elevation: 10,
  },
  formTitle: { ...typography.h2, color: colors.primary, marginBottom: spacing.xs },
  formSubtitle: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.primary, fontWeight: '800', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text,
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  },
  passwordInput: { flex: 1, padding: spacing.md, fontSize: 15, color: colors.text },
  eyeBtn: { paddingRight: spacing.md },
  eyeIcon: { fontSize: 14, fontWeight: '600', color: colors.primary },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotLinkText: { ...typography.caption, color: colors.secondary, fontWeight: '700' },
  loginBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, marginHorizontal: spacing.sm, color: colors.textSecondary, fontWeight: '600' },
  registerLink: { alignItems: 'center', paddingVertical: spacing.sm },
  registerLinkText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  registerLinkHighlight: { color: colors.secondary, fontWeight: '800' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  legalLinkText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  legalSeparator: { ...typography.caption, color: colors.textSecondary, marginHorizontal: spacing.sm },
  footer: { ...typography.caption, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: spacing.xl, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: '85%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, color: colors.primary },
  modalClose: { padding: spacing.sm },
  modalCloseText: { fontSize: 20, color: colors.textSecondary },
  modalDescription: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  resetBtn: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  resetBtnDisabled: { opacity: 0.7 },
  resetBtnText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  modalCancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  modalCancelText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
});
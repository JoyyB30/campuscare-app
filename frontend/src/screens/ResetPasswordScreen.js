// src/screens/ResetPasswordScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';

import { resetPassword } from '../services/api';

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

export default function ResetPasswordScreen({ navigation, route }) {
  const emailFromRoute = route?.params?.email || '';

  const [email, setEmail] = useState(emailFromRoute);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    setVerifying(false);
  }, []);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert('Missing Field', 'Please enter your email address.');
      return;
    }

    if (!newPassword) {
      Alert.alert('Missing Field', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(cleanEmail, newPassword);

      Alert.alert(
        'Success',
        'Your password has been reset successfully! Please log in with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'Reset Failed',
        err.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reset screen...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🔐</Text>
            </View>
            <Text style={styles.appName}>Reset Password</Text>
            <Text style={styles.tagline}>
              Create a new password for your account
            </Text>
          </View>

          <View style={styles.formCard}>
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
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password (min. 6 characters)"
                  placeholderTextColor={colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your new password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.errorMessage}>✗ Passwords do not match</Text>
            )}

            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Remember your password?{' '}
                <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>CampusCare © 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    ...typography.h2,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
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
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: { paddingRight: spacing.md },
  eyeIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  errorMessage: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  resetBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetBtnDisabled: { opacity: 0.7 },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  loginLinkText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  loginLinkHighlight: {
    color: colors.secondary,
    fontWeight: '800',
  },
  footer: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '700',
  },
});
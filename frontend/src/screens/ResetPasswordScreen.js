// src/screens/ResetPasswordScreen.js
import React, { useEffect, useState } from 'react';
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
  weak: '#DC2626',
  fair: '#F59E0B',
  good: '#10B981',
  strong: '#059669',
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

const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: colors.border, percent: 0 };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: colors.weak, percent: 25 };
  if (score <= 4) return { score, label: 'Fair', color: colors.fair, percent: 50 };
  if (score <= 5) return { score, label: 'Good', color: colors.good, percent: 75 };
  return { score, label: 'Strong', color: colors.strong, percent: 100 };
};

const getRequirementStatus = (password, requirement) => {
  switch (requirement) {
    case 'length6': return password.length >= 6;
    case 'lowercase': return /[a-z]/.test(password);
    case 'uppercase': return /[A-Z]/.test(password);
    case 'number': return /[0-9]/.test(password);
    case 'special': return /[^a-zA-Z0-9]/.test(password);
    default: return false;
  }
};

export default function ResetPasswordScreen({ navigation, route }) {
  const emailFromLogin = route.params?.email || '';

  const [email, setEmail] = useState(emailFromLogin);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''));

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPassword));
  }, [newPassword]);

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
        '✅ Password Updated',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      Alert.alert('Reset Failed', err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🔐</Text>
            </View>
            <Text style={styles.appName}>Reset Password</Text>
            <Text style={styles.tagline}>Create a new password for your account</Text>
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
                editable={!loading && !emailFromLogin}
              />
            </View>

            

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.errorMessage}>✗ Passwords do not match</Text>
            )}<View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {newPassword.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password Strength</Text>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
                <View style={styles.strengthBarBackground}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.color },
                    ]}
                  />
                </View>

                <View style={styles.requirementsContainer}>
                  <RequirementItem met={getRequirementStatus(newPassword, 'length6')} text="At least 6 characters" />
                  <RequirementItem met={getRequirementStatus(newPassword, 'lowercase')} text="Lowercase letter" />
                  <RequirementItem met={getRequirementStatus(newPassword, 'uppercase')} text="Uppercase letter" />
                  <RequirementItem met={getRequirementStatus(newPassword, 'number')} text="Number" />
                  <RequirementItem met={getRequirementStatus(newPassword, 'special')} text="Special character" />
                </View>
              </View>
            )}

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
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

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

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('Login')}>
              <Text style={styles.loginLinkText}>
                Remember your password? <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>CampusCare © 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RequirementItem({ met, text }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementIcon, { color: met ? colors.success : colors.textSecondary }]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>{text}</Text>
    </View>
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
  passwordStrengthContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  strengthLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  strengthText: { fontSize: 12, fontWeight: '900' },
  strengthBarBackground: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 3 },
  requirementsContainer: { marginTop: spacing.sm },
  requirementItem: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  requirementIcon: { fontSize: 14, fontWeight: '900', marginRight: spacing.sm, width: 18 },
  requirementText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  requirementTextMet: { color: colors.success },
  errorMessage: { ...typography.bodySmall, color: colors.danger, marginBottom: spacing.md, fontWeight: '700' },
  resetBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resetBtnDisabled: { opacity: 0.7 },
  resetBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  loginLink: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  loginLinkText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  loginLinkHighlight: { color: colors.secondary, fontWeight: '800' },
  footer: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '700',
  },
});

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
import { colors, typography, spacing, radius } from '../utils/theme';

const getLaptopIp = () => {
  return '192.168.0.90'; // Update with your actual IP
};

const BASE_URL = `http://${getLaptopIp()}:5000/api`;

export default function ResetPasswordScreen({ navigation, route }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Get token from route params (from deep linking)
    const urlToken = route.params?.token || '';
    setToken(urlToken);
    
    if (urlToken) {
      setValidToken(true);
    }
    setVerifying(false);
  }, [route.params]);

  const handleResetPassword = async () => {
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
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token, 
          newPassword: newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password');
      }

      Alert.alert(
        'Success',
        'Your password has been reset successfully! Please log in with your new password.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      Alert.alert('Reset Failed', err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!validToken || !token) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>🔒</Text>
          <Text style={styles.errorTitle}>Invalid Reset Link</Text>
          <Text style={styles.errorText}>
            This password reset link is invalid or has expired.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.resendBtnText}>Request New Reset Link</Text>
          </TouchableOpacity>
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
            <Text style={styles.tagline}>Create a new password for your account</Text>
          </View>

          <View style={styles.formCard}>
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
                  <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
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
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  errorIcon: { fontSize: 64, marginBottom: spacing.md },
  errorTitle: { ...typography.h2, color: colors.primary, marginBottom: spacing.sm },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  backBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resendBtn: { paddingVertical: spacing.md },
  resendBtnText: { color: colors.secondary, fontSize: 14, fontWeight: '600' },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: radius.round, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoEmoji: { fontSize: 40 },
  appName: { ...typography.h2, color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: spacing.xs },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.xl, marginHorizontal: spacing.md, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, elevation: 10 },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.primary, fontWeight: '800', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md },
  passwordInput: { flex: 1, padding: spacing.md, fontSize: 15, color: colors.text },
  eyeBtn: { paddingRight: spacing.md },
  eyeIcon: { fontSize: 14, fontWeight: '600', color: colors.primary },
  errorMessage: { ...typography.bodySmall, color: colors.danger, marginTop: -spacing.sm, marginBottom: spacing.md },
  resetBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  resetBtnDisabled: { opacity: 0.7 },
  resetBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  loginLink: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  loginLinkText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  loginLinkHighlight: { color: colors.secondary, fontWeight: '800' },
  footer: { ...typography.caption, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: spacing.xl, fontWeight: '700' },
});
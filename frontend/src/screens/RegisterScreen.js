// src/screens/RegisterScreen.js
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
  Linking,
} from 'react-native';
import { register, saveAuth } from '../services/api';

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
  warning: '#F59E0B',
  weak: '#DC2626',
  fair: '#F59E0B',
  good: '#10B981',
  strong: '#059669',
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

const ROLES = [
  { value: 'community_member', label: '🎓 Community Member', desc: 'Submit and track issues' },
  { value: 'worker', label: '🔧 Worker', desc: 'Handle assigned issues' },
  { value: 'facility_manager', label: '🏛 Facility Manager', desc: 'Manage all issues' },
  { value: 'admin', label: '🛡 Admin', desc: 'Manage all registered users' },
];

// Password strength checker (matching backend: min 6 characters)
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: colors.border, percent: 0 };
  
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { score, label: 'Weak', color: colors.weak, percent: 25 };
  } else if (score <= 4) {
    return { score, label: 'Fair', color: colors.fair, percent: 50 };
  } else if (score <= 6) {
    return { score, label: 'Good', color: colors.good, percent: 75 };
  } else {
    return { score, label: 'Strong', color: colors.strong, percent: 100 };
  }
};

const getRequirementStatus = (password, requirement) => {
  switch(requirement) {
    case 'length6': return password.length >= 6;
    case 'length10': return password.length >= 10;
    case 'lowercase': return /[a-z]/.test(password);
    case 'uppercase': return /[A-Z]/.test(password);
    case 'number': return /[0-9]/.test(password);
    case 'special': return /[^a-zA-Z0-9]/.test(password);
    default: return false;
  }
};

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('community_member');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: colors.border, percent: 0 });
  const [showRequirements, setShowRequirements] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert('Missing Field', 'Please enter your username.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email address.');
      return false;
    }
    if (!password) {
      Alert.alert('Missing Field', 'Please create a password.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms and Conditions.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await register(
        username.trim(),
        email.trim().toLowerCase(),
        password,
        role
      );

      console.log('Registration response:', data);

      // Check if we got token and user back
      if (data.token && data.user) {
        // Save auth data
        await saveAuth(data.token, data.user);
        
        const userRole = data.user.role;
        console.log('User role:', userRole);
        
        // ✅ ROLE-BASED NAVIGATION - Direct to role screen immediately
        if (userRole === 'facility_manager') {
          navigation.replace('FMApp');
        } else if (userRole === 'admin') {
          navigation.replace('AdminApp');
        } else if (userRole === 'community_member') {
          navigation.replace('CMApp');
        } else if (userRole === 'worker') {
          navigation.replace('WorkerApp');
        } else {
          // Fallback
          Alert.alert('Success', 'Account created! Please log in.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      } else {
        // If backend doesn't return token, ask user to login
        Alert.alert('Success', 'Account created! Please log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('Registration Error', err.message || 'Could not create account');
    } finally {
      setLoading(false);
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
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join the CampusCare community</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

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
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => {
                    setShowRequirements(true);
                    setPasswordFocused(true);
                  }}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="next"
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
              
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View 
                      style={[
                        styles.strengthBarFill, 
                        { 
                          width: `${passwordStrength.percent}%`,
                          backgroundColor: passwordStrength.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label} Password
                  </Text>
                </View>
              )}
              
              {(showRequirements || passwordFocused || password.length > 0) && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password must contain:</Text>
                  <View style={styles.requirementsList}>
                    <Text style={[styles.requirement, getRequirementStatus(password, 'length6') && styles.requirementMet]}>
                      {getRequirementStatus(password, 'length6') ? '✓' : '○'} At least 6 characters (required)
                    </Text>
                    <Text style={[styles.requirement, getRequirementStatus(password, 'lowercase') && styles.requirementMet]}>
                      {getRequirementStatus(password, 'lowercase') ? '✓' : '○'} Lowercase letter (a-z)
                    </Text>
                    <Text style={[styles.requirement, getRequirementStatus(password, 'uppercase') && styles.requirementMet]}>
                      {getRequirementStatus(password, 'uppercase') ? '✓' : '○'} Uppercase letter (A-Z)
                    </Text>
                    <Text style={[styles.requirement, getRequirementStatus(password, 'number') && styles.requirementMet]}>
                      {getRequirementStatus(password, 'number') ? '✓' : '○'} Number (0-9)
                    </Text>
                    <Text style={[styles.requirement, getRequirementStatus(password, 'special') && styles.requirementMet]}>
                      {getRequirementStatus(password, 'special') ? '✓' : '○'} Special character (!@#$%^&*)
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              
              {confirmPassword.length > 0 && (
                <View style={styles.matchContainer}>
                  <Text style={[
                    styles.matchText,
                    password === confirmPassword && password.length > 0 ? styles.matchSuccess : styles.matchError
                  ]}>
                    {password === confirmPassword && password.length > 0 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Select Your Role</Text>
            <View style={styles.roleGroup}>
              {ROLES.map((r) => {
                const isActive = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleCard, isActive && styles.roleCardActive]}
                    onPress={() => setRole(r.value)}
                    disabled={loading}
                  >
                    <Text style={[styles.roleLabel, isActive && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleDesc, isActive && styles.roleDescActive]}>
                      {r.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={openTermsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink} onPress={openPrivacyLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkHighlight}>Sign In</Text>
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
  appName: { ...typography.h2, color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: spacing.xs },
  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md, padding: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, elevation: 10,
  },
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
  strengthContainer: { marginTop: spacing.sm },
  strengthBarBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { ...typography.caption, marginTop: spacing.xs, fontWeight: '600' },
  requirementsContainer: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: '#F8FAFC', borderRadius: radius.sm },
  requirementsTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  requirementsList: { gap: 4 },
  requirement: { ...typography.caption, color: colors.textSecondary },
  requirementMet: { color: colors.success, fontWeight: '600' },
  matchContainer: { marginTop: spacing.xs },
  matchText: { ...typography.caption, fontWeight: '500' },
  matchSuccess: { color: colors.success },
  matchError: { color: colors.danger },
  roleGroup: { gap: 10, marginBottom: spacing.md },
  roleCard: { backgroundColor: '#F8FAFC', borderRadius: radius.md, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  roleCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleLabel: { ...typography.bodySmall, fontWeight: '800', color: colors.text },
  roleLabelActive: { color: colors.secondary },
  roleDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  roleDescActive: { color: 'rgba(255,255,255,0.6)' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  checkboxChecked: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  checkmark: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  termsText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  termsLink: { color: colors.secondary, fontWeight: '700' },
  registerBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  loginLink: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  loginLinkText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  loginLinkHighlight: { color: colors.secondary, fontWeight: '800' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  legalLinkText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  legalSeparator: { ...typography.caption, color: colors.textSecondary, marginHorizontal: spacing.sm },
  footer: { ...typography.caption, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: spacing.xl, fontWeight: '700' },
});
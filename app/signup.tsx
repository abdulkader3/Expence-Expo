import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';

export default function SignupScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    cardBg: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
    primary: '#5bee2b',
    inputBg: isDark ? '#1e293b' : '#f6f8f6',
    border: isDark ? '#1e293b' : '#f1f5f9',
    checkboxBorder: isDark ? '#475569' : '#cbd5e1',
    error: '#ef4444',
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    console.log("Register pressed");
    setGeneralError('');
    setErrors({});
    
    if (!agreeToTerms) {
      setGeneralError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (result.success) {
        router.replace('/');
      } else {
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          const fieldErrorsMap: Record<string, string> = {};
          result.fieldErrors.forEach(err => {
            fieldErrorsMap[err.field] = err.message;
          });
          setErrors(fieldErrorsMap);
        }
        
        if (result.error) {
          if (result.error.includes('Email already registered')) {
            setGeneralError(result.error);
          } else {
            setGeneralError(result.error);
          }
        }
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.decorativeTop} />
          <View style={styles.decorativeBottom} />

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary + '33' }]}>
                <Text style={styles.logoIcon}>💰</Text>
              </View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>PocketPartners</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join the Team</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {generalError ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
                  <Text style={[styles.errorBannerText, { color: colors.error }]}>{generalError}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: errors.fullName ? colors.error : 'transparent' }]}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.textMuted}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      autoCapitalize="words"
                      autoComplete="name"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.fullName ? <Text style={[styles.fieldError, { color: colors.error }]}>{errors.fullName}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: errors.email ? colors.error : 'transparent' }]}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Your best email"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.email ? <Text style={[styles.fieldError, { color: colors.error }]}>{errors.email}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: errors.password ? colors.error : 'transparent' }]}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Create a strong password"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password-new"
                      editable={!isLoading}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} disabled={isLoading}>
                      <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </Pressable>
                  </View>
                  {errors.password ? <Text style={[styles.fieldError, { color: colors.error }]}>{errors.password}</Text> : null}
                </View>

                <View style={styles.termsRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: agreeToTerms ? colors.primary : colors.checkboxBorder },
                      agreeToTerms && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => !isLoading && setAgreeToTerms(!agreeToTerms)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                    I agree to the{' '}
                    <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
                    {' '}and Privacy Policy
                  </Text>
                </View>

                <Pressable 
                  style={[styles.signupButton, isLoading && styles.signupButtonDisabled]} 
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#1a1a1a" />
                  ) : (
                    <>
                      <Text style={styles.signupButtonText}>Create Account</Text>
                      <Text style={styles.signupButtonArrow}>→</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => !isLoading && router.push('/login')} disabled={isLoading}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  decorativeTop: { position: 'absolute', top: '5%', left: '5%', width: 256, height: 256, borderRadius: 128, backgroundColor: 'rgba(91, 238, 43, 0.1)', opacity: 0.3 },
  decorativeBottom: { position: 'absolute', bottom: '5%', right: '5%', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(91, 238, 43, 0.08)', opacity: 0.3 },
  content: { paddingHorizontal: 24, paddingVertical: 48, gap: 32 },
  header: { alignItems: 'center' },
  logoContainer: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoIcon: { fontSize: 32 },
  brandTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  card: { borderRadius: 24, padding: 32, borderWidth: 1 },
  errorBanner: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBannerText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingLeft: 16, paddingRight: 12, borderWidth: 2 },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '500' },
  fieldError: { fontSize: 12, marginLeft: 4 },
  eyeButton: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkmark: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  termsText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  termsLink: { fontWeight: '600' },
  signupButton: { backgroundColor: '#5bee2b', height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#5bee2b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  signupButtonDisabled: { opacity: 0.7 },
  signupButtonText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  signupButtonArrow: { fontSize: 18, color: '#1a1a1a' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, fontWeight: '500' },
  loginLink: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
});

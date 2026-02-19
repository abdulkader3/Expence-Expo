import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
    primary: '#5bee2b',
    inputBg: isDark ? '#1e293b' : '#f6f8f6',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  const handleLogin = () => {
    login();
    router.replace('/');
  };

  const handleFingerprint = () => {
    console.log('Fingerprint login');
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

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.primary + '1a' }]}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary + '33' }]}>
                <Text style={styles.logoIcon}>💰</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Log in to manage your joint finances with your partner.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                  <Pressable>
                    <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot Password?</Text>
                  </Pressable>
                </View>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
                <Text style={styles.loginButtonArrow}>→</Text>
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>Or login with</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <Pressable style={[styles.fingerprintButton, { borderColor: colors.border }]} onPress={handleFingerprint}>
                <Text style={styles.fingerprintIcon}>👆</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/signup')}>
                <Text style={[styles.signupLink, { color: colors.primary }]}>Sign up</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  decorativeTop: { position: 'absolute', top: '10%', left: '5%', width: 256, height: 256, borderRadius: 128, backgroundColor: 'rgba(91, 238, 43, 0.1)', opacity: 0.3 },
  decorativeBottom: { position: 'absolute', bottom: '10%', right: '5%', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(91, 238, 43, 0.08)', opacity: 0.3 },
  card: { borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, borderWidth: 1 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4, marginRight: 4 },
  forgotLink: { fontSize: 12, fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingLeft: 16, paddingRight: 12, borderWidth: 2, borderColor: 'transparent' },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, fontWeight: '500' },
  eyeButton: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  loginButton: { backgroundColor: '#5bee2b', height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8, shadowColor: '#5bee2b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  loginButtonText: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  loginButtonArrow: { fontSize: 18, color: '#1a1a1a' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  fingerprintButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  fingerprintIcon: { fontSize: 28 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '500' },
  signupLink: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline', marginLeft: 4 },
});

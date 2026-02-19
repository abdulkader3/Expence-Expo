/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';

const users = [
  { id: 'alex', name: 'Alex', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOg65orNmJuNBu8uIlUkuR3n3Pq-IDG_2SXuVvk_Syq81n2dEsgBUpIZYGheTv7a90DRRMDO-mUvX5CWm_xnM6T-GDkLZkmQqr2btNHHga39hke2amvAAAlfcAvAlKKaja3HytsLw_UipxikiYWK-KSVaBgck6ZX0w9WkiKm6gwfsPYSwEfnWjdpBP1o4PmWlXMCYrFk_RdoqZuZfdhDuTHp6nPnGje-HCy29bdR9koU9QVDTc1cKVYaWKw6scJEP0zHQZIENFXd2F', bgColor: '#ffe8f2' },
  { id: 'jordan', name: 'Jordan', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_0iSzFd_P9G3AbA15IFRSSampURYnq8shmVdE8nPACzwpFvkBSzPaqvUTTZL0cdcYIhVByglpxftJv1nSTRZZAvVr55TMrAeNGzDWjNfsUMooMqAt_MJVJduuKcPK1nahYUC2lWnqh8nzu-Y79455YLNa9s3HiQPZ0Kx4dB5qKmHeGgLLUvWnCjtkrG6MFdZMi1Z_eU6IJ2yFXlIBLjaN23i2U0l7JKmGuzUr3bYZTx8Oy09PqAWeC-3kBrTK4PRH_LrMD9vw_hJk', isSelected: true, isYou: true },
  { id: 'sam', name: 'Sam', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7c0Dqmetp6nmg78GdOih_xub1NMwImauY15zSJqu5fRFhx9arKIaXh914pssReQtNZTEe3cG54apXVUfKV13yVZGqmxY-XNVZVQWpw97G0VyT7Qn5H3PG7NbJmBv2JY-hIqXTdEQCv1AS8btYx-K2L9Xi97Xy-QCPYqNQTJberPD2d4I3fiFgQRY0D37CZjNWhS-OlL2WTAlOW-O300e7gj8rkGo2-l__hdf_qCv4q97vtjhtOYNSK_Nn8b0fIAWYRZjzHYdcqhUY', bgColor: '#fffadd' },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [selectedUser, setSelectedUser] = useState('jordan');
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.0.103:5000/health');
      const data = await response.json();
      console.log('Health response:', data);
      Alert.alert('Backend Connected Successfully');
      router.push('/budget');
    } catch (error) {
      console.error('Health check error:', error);
      Alert.alert('Backend Connection Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
    primary: '#5bee2b',
    badgeBg: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
    signalDot: isDark ? '#ffffff' : '#1a1a1a',
    link: isDark ? '#d4d4d4' : '#525252',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] as any} edges={['top']}>
      <View style={styles.statusBar as any}>
        <Text style={[styles.time, { color: colors.text }] as any}>{currentTime || '9:41'}</Text>
        <View style={styles.statusIcons as any}>
          <View style={[styles.signalDot, { backgroundColor: colors.signalDot, opacity: 0.2 }] as any} />
          <View style={[styles.signalDot, { backgroundColor: colors.signalDot, opacity: 0.2 }] as any} />
          <View style={[styles.signalDot, { backgroundColor: colors.signalDot, opacity: 1 }] as any} />
        </View>
      </View>

      <ScrollView style={styles.scrollView as any} showsVerticalScrollIndicator={false}>
        <View style={styles.header as any}>
          <Text style={[styles.brandText, { color: colors.primary }] as any}>PocketPartners</Text>
        </View>

        <View style={styles.heroSection as any}>
          <View style={styles.blobYellow as any} />
          <View style={styles.blobGreen as any} />
          <View style={[styles.heroImageContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e9f5ff' }] as any}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMryFGDSRDCiI5QQWcrvYVVrksXf4IOlR7xc4vLSTH9nILClYBfEEYjP9u1b0r8okmIXtwMJ7mpvaEGMmlWAqBF_b8bwnKmewHinhwSMFkljnReAbY2YMCTjKHd7DmDiPovJ8PcWmYBrKjVmkjkhwFLhnGmwsn8zTtMB1wWgyIgOtEbqhjcNSRdgdvK7b2QNeC2iF5rJx4HAk0iy5Df8cI8TXRLIecVl9m0Vw4WeXSQAH1Nsf-a4MpppBqrkYVxTYaeA-S0Yet8nZo' }}
              style={styles.heroImage as any}
              resizeMode="cover"
            />
            <View style={[styles.heroBadge, { backgroundColor: colors.badgeBg }] as any}>
              <Text style={styles.heroBadgeIcon as any}>💰</Text>
              <Text style={[styles.heroBadgeText, { color: colors.text }] as any}>Contribution Tracking</Text>
            </View>
          </View>
        </View>

        <View style={styles.content as any}>
          <Text style={[styles.title, { color: colors.text }] as any}>
            Welcome,{'\n'}
            <Text style={[styles.titleHighlight, { color: colors.primary }] as any}>Partners!</Text> 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }] as any}>
            Who is tracking contributions today? Select your profile to jump in.
          </Text>
        </View>

        <View style={styles.avatarSection as any}>
          <View style={styles.avatarRow as any}>
            {users.map((user) => (
              <Pressable
                key={user.id}
                style={styles.avatarButton as any}
                onPress={() => setSelectedUser(user.id)}
              >
                <View
                  style={[
                    user.id === 'jordan' ? styles.avatarWrapperSelected : styles.avatarWrapper,
                    user.bgColor ? { backgroundColor: user.bgColor } : undefined,
                  ] as any}
                >
                  <Image source={{ uri: user.avatar }} style={user.id === 'jordan' ? styles.avatarSelected as any : styles.avatar as any} />
                </View>
                {user.id === 'jordan' && (
                  <View style={styles.avatarRing as any} />
                )}
                {user.id === 'jordan' && (
                  <View style={styles.checkBadge as any}>
                    <Text style={styles.checkIcon as any}>✓</Text>
                  </View>
                )}
                {user.id === 'jordan' ? (
                  <Text style={[styles.avatarNameSelected, { color: colors.text }] as any}>{user.name}</Text>
                ) : (
                  <Text style={[styles.avatarName, { color: colors.textMuted }] as any}>{user.name}</Text>
                )}
                {user.isYou && (
                  <View style={[styles.youBadge, { backgroundColor: isDark ? '#ffffff' : '#1a1a1a' }] as any}>
                    <Text style={[styles.youBadgeText, { color: isDark ? '#1a1a1a' : '#ffffff' }] as any}>You</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer as any}>
        <Pressable style={styles.button} onPress={handleGetStarted} disabled={isLoading}>
          <Text style={[styles.buttonText, { color: colors.text }] as any}>{isLoading ? 'Connecting...' : 'Get Started'}</Text>
          <Text style={[styles.buttonArrow, { color: colors.text }] as any}>→</Text>
        </Pressable>
        <Text style={[styles.footerText, { color: colors.textMuted }] as any}>
          Already have an account?{' '}
          <Pressable onPress={() => router.push('/login')}>
            <Text style={[styles.linkText, { color: colors.link }] as any}>Log in</Text>
          </Pressable>
        </Text>
        <View style={{ display: 'none' } as any}>
          <Text style={[styles.footerText, { color: colors.textMuted }] as any}>
            Switching accounts?{' '}
            <Pressable onPress={handleLogout}>
              <Text style={[styles.linkText, { color: colors.link }] as any}>Log out</Text>
            </Pressable>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  time: { fontSize: 14, fontWeight: '600' },
  statusIcons: { flexDirection: 'row', gap: 4 },
  signalDot: { width: 12, height: 12, borderRadius: 6 },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, alignItems: 'center' },
  brandText: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  heroSection: { paddingHorizontal: 16, marginBottom: 16, position: 'relative' },
  blobYellow: { position: 'absolute', top: 20, left: 30, width: 96, height: 96, borderRadius: 48, backgroundColor: '#fffadd', opacity: 0.6 },
  blobGreen: { position: 'absolute', bottom: 30, right: 30, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(91, 238, 43, 0.2)', opacity: 0.6 },
  heroImageContainer: { width: '100%', aspectRatio: 4 / 3, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroBadge: { position: 'absolute', bottom: 16, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeIcon: { fontSize: 14 },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', lineHeight: 38, marginBottom: 12 },
  titleHighlight: { fontWeight: '800' },
  subtitle: { fontSize: 16, fontWeight: '500', textAlign: 'center', lineHeight: 24, maxWidth: 280 },
  avatarSection: { paddingHorizontal: 16, paddingBottom: 24 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 16, height: 140 },
  avatarButton: { alignItems: 'center', gap: 12 },
  avatarWrapper: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: 'transparent', overflow: 'hidden' },
  avatarWrapperSelected: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarRing: { position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#5bee2b' },
  avatar: { width: '100%', height: '100%', borderRadius: 32 },
  avatarSelected: { width: '100%', height: '100%', borderRadius: 40 },
  avatarName: { fontSize: 14, fontWeight: '700' },
  avatarNameSelected: { fontSize: 16, fontWeight: '800' },
  youBadge: { position: 'absolute', top: -20, left: '50%', marginLeft: -16, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  youBadgeText: { fontSize: 9, fontWeight: '700' },
  checkBadge: { position: 'absolute', top: 56, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#5bee2b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  checkIcon: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  button: { backgroundColor: '#5bee2b', height: 56, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#5bee2b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 8 },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  buttonArrow: { fontSize: 18, color: '#1a1a1a' },
  footerText: { marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: '500' },
  linkText: { textDecorationLine: 'underline', textDecorationColor: '#5bee2b' },
});

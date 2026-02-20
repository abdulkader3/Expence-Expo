import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from './contexts/AuthContext';
import { getUserSettings, updateUserSettings, UserSettings } from '../src/services/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#152111' : '#f6f8f6',
    surface: isDark ? '#1e2e19' : '#ffffff',
    text: isDark ? '#f1f4f0' : '#131811',
    textSubtle: isDark ? '#a3bca0' : '#6c8863',
    primary: '#70eb47',
    primaryHover: '#60d939',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#f1f4f0',
    orangeBg: isDark ? 'rgba(249,115,22,0.2)' : '#fff7ed',
    orangeText: isDark ? '#fb923c' : '#ea580c',
    blueBg: isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff',
    blueText: isDark ? '#60a5fa' : '#2563eb',
    purpleBg: isDark ? 'rgba(168,85,247,0.2)' : '#faf5ff',
    purpleText: isDark ? '#c084fc' : '#9333ea',
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getUserSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await updateUserSettings({
        notifications: { ...settings.notifications, enabled: value },
      });
      setSettings(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notifications setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await updateUserSettings({
        biometric_lock_enabled: value,
      });
      setSettings(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export functionality coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const navigateToProfile = () => {
    router.push('/partner-ledger');
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerText}>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Account</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>
        <Pressable style={styles.profileContainer} onPress={navigateToProfile}>
          <Image
            source={{
              uri: user?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwAtEBECqUxar-x2qViJXUmofg69j_7RFMw91TWgOprw9urMtxeg390CYpiwk9kV8RBmBy6OtHyMkCJQ4-FsSWXVMGZknh3tuo2mpG3bONomrenlDOcQIXRBcZ7Gn1qd1eZmocbsou_JoCf3j5ZKdNPohU8XgehiCweFB-mpQFQsOZHe6U3cQ0oPA--ln32KNT7UbGS88e0PIvOw7JmOuG5ApmKdAoM3PO8_0IMW2Ey_0pbIWrnJT2JrhbUq6YNN2tqVXc0-Clzcrh',
            }}
            style={styles.profileImage}
          />
          <View style={[styles.onlineIndicator, { backgroundColor: colors.primary }]} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>
          
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={navigateToProfile}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="person-circle" size={28} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Settings</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSubtle }]}>Manage your personal info</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSubtle} />
          </Pressable>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.orangeBg }]}>
              <Ionicons name="notifications" size={28} color={colors.orangeText} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSubtle }]}>Updates on contributions</Text>
            </View>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={handleToggleNotifications}
              disabled={isSaving}
              trackColor={{ false: '#e5e7eb', true: colors.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor="#e5e7eb"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.blueBg }]}>
              <Ionicons name="scan" size={28} color={colors.blueText} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Security & FaceID</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSubtle }]}>Biometric app lock</Text>
            </View>
            <Switch
              value={settings.biometric_lock_enabled}
              onValueChange={handleToggleBiometric}
              disabled={isSaving}
              trackColor={{ false: '#e5e7eb', true: colors.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor="#e5e7eb"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
          
          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={handleExport}
          >
            <View style={styles.exportTextContainer}>
              <Text style={styles.exportTitle}>Export Contributions</Text>
              <Text style={styles.exportSubtitle}>Download CSV History</Text>
            </View>
            <View style={styles.exportIcon}>
              <Ionicons name="download" size={24} color={colors.text} />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Team</Text>
          
          <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.purpleBg }]}>
              <Ionicons name="people" size={28} color={colors.purpleText} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Team Management</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSubtle }]}>Manage roles & permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSubtle} />
          </Pressable>

          <Pressable style={[styles.inviteButton, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={[styles.inviteText, { color: colors.primary }]}>Invite New Partner</Text>
          </Pressable>
        </View>

        <View style={styles.logoutSection}>
          <Pressable
            style={[styles.logoutButton, { backgroundColor: colors.surface }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerText: { flex: 1 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  profileContainer: { position: 'relative' },
  profileImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: 'rgba(112,235,71,0.2)' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  exportTextContainer: {},
  exportTitle: { fontSize: 18, fontWeight: '800', color: '#131811' },
  exportSubtitle: { fontSize: 14, fontWeight: '500', opacity: 0.8 },
  exportIcon: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 24 },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  inviteText: { fontSize: 16, fontWeight: '700' },
  logoutSection: { marginTop: 8, marginBottom: 100 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
});

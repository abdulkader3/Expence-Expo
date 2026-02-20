import { View, Text, StyleSheet, ScrollView, Image, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../src/services/partners';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1e2e19' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
    primary: '#5bee2b',
    border: isDark ? '#2a3f27' : '#e5e5e5',
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaderboard({ limit: 10 });
      setLeaderboard(response.data);
    } catch (err) {
      console.error('[LEADERBOARD] Error fetching:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' });

  const topPartner = leaderboard.find(p => p.top_contributor) || leaderboard[0];
  const secondPartner = leaderboard.find(p => !p.top_contributor && p.rank === 2);
  const totalPool = leaderboard.reduce((sum, p) => sum + p.total_contributed, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchLeaderboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>Hi, Alex 👋</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB4b8ew-QhuilbTPlWAJK24TikraxesnGHtBbYUwq77glDXcZAiErGeNPu0xBh2uWh4w0NM5ZmacmwPILeEgQux8JuFAjKtUKIk-hnBqgzdY2REqxnHaguuwfx3GlN_vSi1EqjkmBGoslUcM0dO4eLZJ1YxZWTxgtQZX8HSZrLHWEPejYeg-8JaB-eoOkpJkpyPRe1subgl0WCxXz1y2hxDWB3tE46G1tq8S3wxV3jJYWAy5gEmWpy3xUbkyY5hXPSW16kA4G5YE7I' }}
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
        <Pressable style={styles.statsButton}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>Stats</Text>
          <MaterialIcons name="chevron-right" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderboardScroll} contentContainerStyle={styles.leaderboardContent}>
        {topPartner && (
          <View style={[styles.partnerCard, styles.topPartnerCard, { borderColor: colors.primary + '33' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#d1fae5' }]}>
                <MaterialIcons name="trending-up" size={20} color="#059669" />
              </View>
              <View style={styles.topBadge}>
                <MaterialIcons name="emoji-events" size={12} color="#d97706" />
                <Text style={styles.topBadgeText}>Top Contributor</Text>
              </View>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.crown}>👑</Text>
              <View style={[styles.partnerAvatar, { borderWidth: 4, borderColor: '#fcd34d' }]}>
                <Image source={{ uri: topPartner.avatar_url }} style={styles.avatarImage} />
              </View>
              <Text style={[styles.partnerName, { color: colors.text }]}>{topPartner.name}</Text>
            </View>
            <View style={styles.partnerTotal}>
              <Text style={styles.totalAmount}>${topPartner.total_contributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Contributed</Text>
            </View>
          </View>
        )}

        {secondPartner && (
          <View style={[styles.partnerCard, styles.youCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <MaterialIcons name="add-circle" size={20} color="#fff" />
              </View>
              <View style={styles.risingBadge}>
                <Text style={styles.risingBadgeText}>Rising Star</Text>
              </View>
            </View>
            <View style={styles.partnerInfo}>
              <View style={[styles.partnerAvatar, { borderWidth: 4, borderColor: '#1e293b' }]}>
                <Image source={{ uri: secondPartner.avatar_url }} style={styles.avatarImage} />
              </View>
              <Text style={[styles.partnerName, { color: '#fff' }]}>{secondPartner.name}</Text>
            </View>
            <View style={styles.partnerTotal}>
              <Text style={[styles.totalAmount, { color: '#fff' }]}>${secondPartner.total_contributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              <Text style={[styles.totalLabel, { color: '#94a3b8' }]}>Total Contributed</Text>
            </View>
          </View>
        )}

        <View style={[styles.partnerCard, styles.poolCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: isDark ? colors.surface : '#fff' }]}>
              <MaterialIcons name="savings" size={20} color="#3b82f6" />
            </View>
            <View style={styles.poolBadge}>
              <Text style={styles.poolBadgeText}>Total Pool</Text>
            </View>
          </View>
          <View style={styles.partnerInfo}>
            <View style={[styles.poolIconContainer, { backgroundColor: isDark ? colors.surface : '#fff' }]}>
              <MaterialIcons name="dataset" size={40} color="#3b82f6" />
            </View>
            <Text style={[styles.partnerName, { color: colors.text }]}>Team Pot</Text>
          </View>
          <View style={styles.partnerTotal}>
            <Text style={[styles.totalAmount, { color: colors.text }]}>${totalPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.goalText}>Goal: $10,000 🚀</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.contributionsSection, { backgroundColor: colors.surface }]}>
        <View style={styles.contributionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Contributors</Text>
          <View style={styles.headerButtons}>
            <Pressable onPress={() => router.push('/transactions')} style={styles.activityButton}>
              <Text style={[styles.activityText, { color: colors.primary }]}>Activity</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/partners')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.contributionsList}>
          {leaderboard.slice(0, 5).map((partner) => (
            <View key={partner.partner_id} style={styles.contributionItem}>
              <View style={[styles.contributionIcon, { backgroundColor: partner.top_contributor ? '#d1fae5' : '#f3f4f6' }]}>
                <MaterialIcons name="person" size={24} color={partner.top_contributor ? '#059669' : '#6b7280'} />
              </View>
              <View style={styles.contributionInfo}>
                <Text style={[styles.contributionTitle, { color: colors.text }]}>{partner.name}</Text>
                <Text style={[styles.contributionMeta, { color: colors.textSecondary }]}>
                  {partner.top_contributor ? 'Top Contributor' : `Rank #${partner.rank}`}
                </Text>
              </View>
              <View style={styles.contributionRight}>
                <Text style={styles.contributionAmount}>+${partner.total_contributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                <Text style={[styles.contributionDate, { color: colors.textMuted }]}>Total</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.gradientOverlay, { backgroundColor: colors.surface }]} pointerEvents="none" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: '#131811' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  dateText: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  greeting: { fontSize: 24, fontWeight: '800' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#5bee2b', borderWidth: 2, borderColor: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  statsButton: { flexDirection: 'row', alignItems: 'center' },
  statsText: { fontSize: 14, fontWeight: '600' },
  leaderboardScroll: { maxHeight: 340 },
  leaderboardContent: { paddingHorizontal: 24, gap: 16, paddingBottom: 24 },
  partnerCard: { width: 256, height: 320, borderRadius: 24, padding: 20, justifyContent: 'space-between', marginRight: 16 },
  topPartnerCard: { backgroundColor: '#fff' },
  youCard: { backgroundColor: '#0f172a' },
  poolCard: { backgroundColor: '#e0f2fe' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#fef3c7' },
  topBadgeText: { fontSize: 10, fontWeight: '700', color: '#b45309' },
  risingBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1e293b' },
  risingBadgeText: { fontSize: 10, fontWeight: '700', color: '#7dd3fc' },
  poolBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)' },
  poolBadgeText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8' },
  partnerInfo: { alignItems: 'center', gap: 12 },
  crown: { fontSize: 24, marginBottom: -8 },
  partnerAvatar: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  partnerName: { fontSize: 20, fontWeight: '700' },
  partnerTotal: { alignItems: 'center' },
  totalAmount: { fontSize: 28, fontWeight: '800', color: '#059669' },
  totalLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  poolIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  goalText: { fontSize: 12, fontWeight: '500', color: '#3b82f6', marginTop: 4 },
  contributionsSection: { flex: 1, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 24, marginTop: -8 },
  contributionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 8 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityButton: { paddingHorizontal: 12, paddingVertical: 6 },
  activityText: { fontSize: 14, fontWeight: '700' },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  contributionsList: { flex: 1, paddingHorizontal: 24, paddingBottom: 100 },
  contributionItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  contributionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  contributionInfo: { flex: 1 },
  contributionTitle: { fontSize: 16, fontWeight: '700' },
  contributionMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  contributionRight: { alignItems: 'flex-end' },
  contributionAmount: { fontSize: 14, fontWeight: '700', color: '#059669' },
  contributionDate: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 96 },
  fab: { position: 'absolute', bottom: 88, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#5bee2b', alignItems: 'center', justifyContent: 'center', shadowColor: '#5bee2b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: 1, paddingBottom: 8, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  navSpacer: { flex: 1 },
});

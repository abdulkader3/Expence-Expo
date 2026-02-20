import { View, Text, StyleSheet, Pressable, Image, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { getPartners, Partner } from '../src/services/partners';

interface PartnerWithRank extends Partner {
  rank: number;
  isTopContributor: boolean;
}

export default function PartnersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  
  const [partners, setPartners] = useState<PartnerWithRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1c2e15' : '#ffffff',
    text: isDark ? '#ffffff' : '#131811',
    textMuted: isDark ? '#6b8961' : '#6b8961',
    primary: '#5bee2b',
    primaryDark: '#4cd622',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5',
    tabInactive: '#a3a3a3',
  };

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPartners({ 
        sort_by: 'total_contributed',
        per_page: 20,
      });
      
      const partnersWithRank: PartnerWithRank[] = response.data.map((partner, index) => ({
        ...partner,
        rank: index + 1,
        isTopContributor: index === 0,
      }));
      
      setPartners(partnersWithRank);
    } catch (err) {
      console.error('[PARTNERS] Error fetching partners:', err);
      setError('Failed to load partners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderPartnerCard = (partner: PartnerWithRank) => (
    <View
      key={partner.id}
      style={[
        styles.partnerCard,
        { backgroundColor: colors.surface },
        partner.isTopContributor && { borderWidth: 2, borderColor: colors.primary + '33' },
      ]}
    >
      <View style={styles.partnerHeader}>
        <View style={styles.partnerInfo}>
          <View style={[styles.avatarContainer, partner.isTopContributor && { borderColor: colors.primary + '33' }]}>
            <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
            <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.rankText}>#{partner.rank}</Text>
            </View>
          </View>
          <View style={styles.partnerDetails}>
            <Text style={[styles.partnerName, { color: colors.text }]}>{partner.name}</Text>
            {partner.isTopContributor ? (
              <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="military-tech" size={12} color={colors.text} />
                <Text style={[styles.roleText, { color: colors.text }]}>Top Contributor</Text>
              </View>
            ) : (
              <View style={[styles.memberBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
                <Text style={[styles.memberText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Team Member</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.contributionSection}>
        <View style={styles.contributionLabel}>
          <MaterialIcons name="savings" size={14} color={colors.textMuted} />
          <Text style={[styles.contributionLabelText, { color: colors.textMuted }]}>Total Contributed</Text>
        </View>
        <Text style={[styles.contributionAmount, { color: colors.text }]}>{formatCurrency(partner.total_contributed)}</Text>
      </View>

      <Pressable
        style={[
          styles.historyButton,
          partner.isTopContributor
            ? { backgroundColor: colors.primary, shadowColor: colors.primaryDark }
            : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f6f8f6', borderColor: colors.border, borderWidth: 1 },
        ]}
        onPress={() => router.push('/partner-ledger')}
      >
        <Text style={[styles.historyButtonText, !partner.isTopContributor && { color: colors.text }]}>See History</Text>
        <MaterialIcons name="arrow-forward" size={18} color={partner.isTopContributor ? '#131811' : colors.text} />
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Partner Profiles</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Team Finances</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Partner Profiles</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Team Finances</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchPartners}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Partner Profiles</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Team Finances</Text>
        </View>
        <Pressable style={[styles.addButton, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {partners.map(renderPartnerCard)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, gap: 24, paddingBottom: 100 },
  partnerCard: {
    borderRadius: 24,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderTopLeftRadius: 8,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#131811',
  },
  partnerDetails: {
    gap: 4,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  contributionSection: {
    gap: 4,
  },
  contributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contributionLabelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contributionAmount: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131811',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131811',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 8,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navItemActive: {
    width: 48,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '700',
  },
});

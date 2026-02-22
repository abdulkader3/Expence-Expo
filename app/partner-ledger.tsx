 
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, useColorScheme, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './contexts/AuthContext';
import { getCurrentUser, UserResponse } from '../src/services/auth';
import { getTransactions, Transaction } from '../src/services/transactions';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food & Drink', icon: 'restaurant' },
  { id: 'travel', label: 'Travel', icon: 'airplane' },
  { id: 'supplies', label: 'Supplies', icon: 'bag-handle' },
];

const categoryColors: Record<string, { color: string; bgColor: string }> = {
  food: { color: '#f97316', bgColor: '#fff7ed' },
  travel: { color: '#3b82f6', bgColor: '#eff6ff' },
  supplies: { color: '#6b7280', bgColor: '#f3f4f6' },
  software: { color: '#a855f7', bgColor: '#faf5ff' },
  default: { color: '#6b7280', bgColor: '#f3f4f6' },
};

const getCategoryColor = (category: string) => categoryColors[category.toLowerCase()] || categoryColors.default;

const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    food: 'restaurant',
    travel: 'airplane',
    supplies: 'bag-handle',
    software: 'layers',
    default: 'receipt',
  };
  return iconMap[category.toLowerCase()] || iconMap.default;
};

export default function PartnerLedgerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, refreshUser, updateUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedCompany, setEditedCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsFetchingData(true);
    try {
      const userResponse = await getCurrentUser();
      setCurrentUser(userResponse);
      setEditedName(userResponse.name || '');
      setEditedPhone(userResponse.phone || '');
      setEditedCompany(userResponse.company || '');

      const transactionsResponse = await getTransactions({ 
        recorded_by: userResponse.id,
        sort_by: 'date_desc',
        per_page: 50
      });
      setUserTransactions(transactionsResponse.data);
    } catch (error) {
      console.error('[PARTNER_LEDGER] Error fetching data:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setEditedName(currentUser.name || '');
      setEditedPhone(currentUser.phone || '');
      setEditedCompany(currentUser.company || '');
    }
  }, [currentUser]);

  const handleAvatarPick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsUploadingAvatar(true);
      
      const uploadResult = await updateUser({
        avatar: {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        },
      });
      
      setIsUploadingAvatar(false);
      
      if (uploadResult.success) {
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to update profile picture');
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateUser({
      name: editedName,
      phone: editedPhone,
      company: editedCompany,
    });
    setIsLoading(false);
    
    if (result.success) {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1e2f18' : '#ffffff',
    text: isDark ? '#ffffff' : '#131811',
    textSubtle: isDark ? '#6b8961' : '#6b8961',
    primary: '#5bee2b',
    primaryDark: '#4ad81e',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#f1f4f0',
    tabInactive: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };

  const totalContributed = useMemo(() => {
    return userTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [userTransactions]);

  const isTopContributor = totalContributed > 500;

  const dynamicCategories = useMemo(() => {
    const categorySet = new Set<string>();
    userTransactions.forEach(tx => {
      if (tx.category) categorySet.add(tx.category.toLowerCase());
    });
    
    const categoryMap: Record<string, { id: string; label: string; icon: string }> = {
      food: { id: 'food', label: 'Food & Drink', icon: 'restaurant' },
      travel: { id: 'travel', label: 'Travel', icon: 'airplane' },
      supplies: { id: 'supplies', label: 'Supplies', icon: 'bag-handle' },
      software: { id: 'software', label: 'Software', icon: 'layers' },
    };

    const categoriesArray = [{ id: 'all', label: 'All', icon: 'apps' }];
    categorySet.forEach(cat => {
      if (categoryMap[cat]) {
        categoriesArray.push(categoryMap[cat]);
      }
    });
    
    return categoriesArray;
  }, [userTransactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return userTransactions;
    return userTransactions.filter(tx => 
      tx.category?.toLowerCase() === selectedCategory
    );
  }, [userTransactions, selectedCategory]);

  const renderTransaction = (tx: Transaction) => {
    const catColor = getCategoryColor(tx.category || 'default');
    const iconName = getCategoryIcon(tx.category || 'default') as any;
    const date = new Date(tx.date);
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return (
      <Pressable
        key={tx.id}
        style={[
          styles.transactionCard,
          { backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: isDark ? `${catColor.color}20` : catColor.bgColor },
          ]}
        >
          <Ionicons name={iconName} size={24} color={catColor.color} />
        </View>
        <View style={styles.transactionContent}>
          <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>
            {tx.context || tx.description || 'Contribution'}
          </Text>
          <Text style={[styles.transactionSubtitle, { color: colors.textSubtle }]}>
            {tx.recorded_for_name || 'Unknown'} • {dateStr} • {timeStr}
          </Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: isDark ? colors.primary : colors.primaryDark }]}>
            +${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <View
            style={[
              styles.transactionTag,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
              },
            ]}
          >
            <Text
              style={[
                styles.transactionTagText,
                { color: colors.textSubtle },
              ]}
            >
              {tx.category || 'Other'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: `${colors.surface}cc` }]}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Partner Ledger</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Pressable style={styles.avatarContainer} onPress={handleAvatarPick} disabled={isUploadingAvatar}>
            <Image
              source={{
                uri: currentUser?.avatar_url || user?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfkbT8HE2Gk4Rxx_giLvhdwR_VVLODiuzRGljQ5yY-TzqvG34OigMynOn1tppq4a8ufekAMyylAsxQS2Phtt4c2p0Bf7pSmTRByeJCOZJHGfg6g7oOAmHUgpqbw7IA4ChhCrZmGLANwRyuW6fz_RWyQsGVrz6Iz1tm3TP3ny7gPLjI4kx9r9XXoA5E4dblH2e1Dqxsxetpzd6nCsGKtApk6-ZGVR-rILeb8AgMgkmiTmpt-El11SfeZowaBiq84F_D1QR_gjJ318BH',
              }}
              style={styles.avatar}
            />
            {isUploadingAvatar && (
              <View style={styles.avatarUploadOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={styles.avatarCameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </Pressable>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Name"
                placeholderTextColor={colors.textSubtle}
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editedPhone}
                onChangeText={setEditedPhone}
                placeholder="Phone"
                placeholderTextColor={colors.textSubtle}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editedCompany}
                onChangeText={setEditedCompany}
                placeholder="Company"
                placeholderTextColor={colors.textSubtle}
              />
              <View style={styles.editButtons}>
                <Pressable
                  style={[styles.editButton, { backgroundColor: colors.surface }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={[styles.editButtonText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#131811" />
                  ) : (
                    <Text style={[styles.editButtonText, { color: '#131811' }]}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Pressable style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
                <Text style={[styles.userName, { color: colors.text }]}>{currentUser?.name || user?.name || 'User'}</Text>
                <Ionicons name="pencil" size={16} color={colors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>
              <Text style={styles.userRole}>
                {currentUser?.company || user?.company || 'No company'} {currentUser?.email || user?.email ? `• ${currentUser?.email || user?.email}` : ''}
              </Text>
            </>
          )}

          <View style={styles.contributionSection}>
            <Text style={styles.contributionLabel}>Total Contributed</Text>
            <View style={styles.contributionAmount}>
              <Text style={[styles.contributionPlus, { color: colors.primary }]}>+</Text>
              <Text style={[styles.contributionValue, { color: colors.text }]}>
                ${totalContributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            {isTopContributor && (
              <View style={styles.topContributorBadge}>
                <Ionicons name="star" size={14} color={isDark ? '#facc15' : '#ca8a04'} />
                <Text style={styles.topContributorText}>Top Contributor</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {dynamicCategories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    selectedCategory === cat.id ? colors.text : colors.surface,
                  borderColor: selectedCategory === cat.id ? 'transparent' : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              {cat.icon && (
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.id ? '#fff' : colors.text}
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === cat.id ? '#fff' : colors.text,
                    fontWeight: selectedCategory === cat.id ? '700' : '600',
                  },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.transactionsSection}>
          {isFetchingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSubtle }]}>Loading transactions...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map(renderTransaction)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSubtle }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSubtle }]}>Start contributing to see your history here</Text>
            </View>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  profileSection: { alignItems: 'center', paddingTop: 8, paddingBottom: 32 },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5bee2b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f6f8f6',
  },
  avatarUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 56,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f6f8f6',
  },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 16, letterSpacing: -0.5 },
  userRole: { fontSize: 14, fontWeight: '500', color: '#6b8961', marginTop: 4 },
  contributionSection: { alignItems: 'center', marginTop: 24 },
  contributionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b8961',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contributionAmount: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  contributionPlus: { fontSize: 24, fontWeight: '700' },
  contributionValue: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  topContributorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    gap: 4,
  },
  topContributorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ca8a04',
  },
  categoriesScroll: { marginBottom: 16 },
  categoriesContainer: { paddingHorizontal: 24, gap: 12, flexDirection: 'row' },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  categoryIcon: { marginRight: 8 },
  categoryText: { fontSize: 14 },
  transactionsSection: { paddingHorizontal: 24, paddingBottom: 100 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { fontSize: 14, marginTop: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: { flex: 1, minWidth: 0 },
  transactionTitle: { fontSize: 16, fontWeight: '700' },
  transactionSubtitle: { fontSize: 14, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '700' },
  transactionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  transactionTagText: { fontSize: 10, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#5bee2b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 8,
  },
  fabText: { fontSize: 16, fontWeight: '700', color: '#131811' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40 },
  navItemActive: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  navDot: {
    position: 'absolute',
    top: -4,
    right: -10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editContainer: { width: '100%', paddingHorizontal: 24, marginTop: 16 },
  editInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  editButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  editButtonText: { fontSize: 16, fontWeight: '600' },
  editProfileButton: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});

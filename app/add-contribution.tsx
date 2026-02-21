import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Image, useColorScheme, Animated, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSaveTrigger } from '@/src/contexts/SaveTriggerContext';
import { getPartners, Partner, createSelfPartner, createContribution } from '@/src/services/partners';
import { getCurrentUser, UserResponse } from '@/src/services/auth';
import { uploadReceipt } from '@/src/services/uploads';
import { ApiError } from '@/src/services/api';

interface ContributorOption {
  id: string;
  name: string;
  avatar: string | null;
  isCurrentUser: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
}

export default function AddContributionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const scrollY = useRef(new Animated.Value(0)).current;
  const saveTriggerRef = useSaveTrigger();

  const [contributors, setContributors] = useState<ContributorOption[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');

  const EMOJI_OPTIONS = ['📁', '💰', '✈️', '📦', '🎒', '💻', '🛒', '📱', '🎁', '🏠', '🚗', '🍔', '💡', '📢', '🔧', '📸'];
  const [amount, setAmount] = useState('0.00');
  const [selectedContributor, setSelectedContributor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('marketing');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  const categories: Category[] = [...customCategories];

  useEffect(() => {
    loadContributors();
  }, []);

  useEffect(() => {
    saveTriggerRef.current.triggerSave = handleSave;
  }, [selectedContributor, amount, receiptFile, note, selectedCategory, saving]);

  const loadContributors = async () => {
    try {
      setLoadingContributors(true);
      
      const [user, partnersData] = await Promise.all([
        getCurrentUser(),
        getPartners({ sort_by: 'name' })
      ]);

      setCurrentUser(user);

      const currentUserOption: ContributorOption = {
        id: user.id,
        name: user.name,
        avatar: user.avatar_url || null,
        isCurrentUser: true,
      };

      const partnerOptions: ContributorOption[] = partnersData.data
        .filter((p: Partner) => p.id !== user.id)
        .map((p: Partner) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar_url || null,
          isCurrentUser: false,
        }));

      const allContributors = [currentUserOption, ...partnerOptions];
      setContributors(allContributors);
      
      if (allContributors.length > 0) {
        setSelectedContributor(allContributors[0].id);
      }
    } catch (error) {
      console.error('Error loading contributors:', error);
    } finally {
      setLoadingContributors(false);
    }
  };

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1e2e19' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
    primary: '#5bee2b',
    border: isDark ? '#2a3f27' : '#e5e5e5',
    inputBg: isDark ? '#1e2e19' : '#f6f8f6',
    keypadBg: isDark ? 'rgba(30,46,25,0.5)' : '#f6f8f6',
  };

  const handleKeypadPress = (key: string) => {
    if (key === 'backspace') {
      if (amount.length > 1) {
        setAmount(amount.slice(0, -1));
      } else {
        setAmount('0');
      }
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + '.');
      }
    } else {
      if (amount === '0' || amount === '0.00') {
        setAmount(key);
      } else {
        const parts = amount.split('.');
        if (parts[1] && parts[1].length >= 2) return;
        setAmount(amount + key);
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const categoryId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
      const newCategory: Category = {
        id: categoryId,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
      };
      setCustomCategories([...customCategories, newCategory]);
      setSelectedCategory(categoryId);
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
      setIsAddingCategory(false);
    }
  };

  const handleReceiptPick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to attach a receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setReceiptUri(asset.uri);
      setReceiptFile({
        uri: asset.uri,
        name: asset.fileName || 'receipt.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUri(null);
    setReceiptFile(null);
  };

  const handleSave = async () => {
    if (saving) {
      console.log('[ADD-CONTRIBUTION] Already saving, ignoring...');
      return;
    }
    
    if (!selectedContributor) {
      console.log('[ADD-CONTRIBUTION] No contributor selected');
      Alert.alert('Error', 'Please select a contributor');
      return;
    }
    
    if (amount === '0' || amount === '0.00' || !amount) {
      console.log('[ADD-CONTRIBUTION] Invalid amount:', amount);
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      const amountValue = parseFloat(amount);
      
      let receiptId: string | undefined;
      
      // Upload receipt first if attached
      if (receiptFile) {
        setIsUploadingReceipt(true);
        try {
          const uploadResponse = await uploadReceipt({
            file: receiptFile,
          });
          receiptId = uploadResponse.receipt_id;
        } catch (uploadError) {
          console.error('Receipt upload failed:', uploadError);
          Alert.alert('Warning', 'Receipt upload failed, but contribution will still be saved.');
        } finally {
          setIsUploadingReceipt(false);
        }
      }
      
      try {
        await createContribution({
          recorded_for: selectedContributor,
          amount: amountValue,
          category: selectedCategory,
          context: note || undefined,
          receipt_id: receiptId,
        });
        
        router.replace('/leaderboard');
      } catch (contributionError) {
        // Check if it's a "Partner not found" error
        if (contributionError instanceof ApiError && 
            contributionError.status === 404 && 
            contributionError.message === 'Partner not found') {
          
          console.log('[ADD-CONTRIBUTION] Partner not found, creating partner entry...');
          
          // Check if this is the current user
          if (currentUser && selectedContributor === currentUser.id) {
            // Create a partner entry for the current user using the self endpoint
            const partnerResponse = await createSelfPartner();
            
            console.log('[ADD-CONTRIBUTION] Partner created:', partnerResponse);
            
            // Retry the contribution with the new partner
            await createContribution({
              recorded_for: partnerResponse.partner.id,
              amount: amountValue,
              category: selectedCategory,
              context: note || undefined,
              receipt_id: receiptId,
            });
            
            router.replace('/leaderboard');
          } else {
            throw contributionError;
          }
        } else {
          throw contributionError;
        }
      }
    } catch (error) {
      console.error('[ADD-CONTRIBUTION] Error saving contribution:', error);
      Alert.alert('Error', 'Failed to save contribution. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const KeypadButton = ({ value, onPress }: { value: string; onPress: (key: string) => void }) => {
    const isBackspace = value === 'backspace';
    const isDot = value === '.';
    return (
      <Pressable
        style={[styles.keypadBtn, { backgroundColor: isBackspace || isDot ? 'transparent' : colors.keypadBg }]}
        onPress={() => onPress(value)}
      >
        {isBackspace ? (
          <MaterialIcons name="backspace" size={24} color={colors.text} />
        ) : (
          <Text style={[styles.keypadBtnText, { color: colors.text }]}>{value}</Text>
        )}
      </Pressable>
    );
  };

  const scrollDistance = 100;
  
  const amountContainerStyle = {
    transform: [
      { 
        scale: scrollY.interpolate({
          inputRange: [0, scrollDistance],
          outputRange: [1, 0.5],
          extrapolate: 'clamp',
        }) 
      },
      {
        translateX: scrollY.interpolate({
          inputRange: [0, scrollDistance],
          outputRange: [0, 140],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: scrollY.interpolate({
          inputRange: [0, scrollDistance],
          outputRange: [0, 150],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const plusSignStyle = {
  };

  const labelOpacity = scrollY.interpolate({
    inputRange: [0, scrollDistance / 2, scrollDistance],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.amountContainer, amountContainerStyle]}>
          <Animated.Text style={[styles.plusSign, { color: colors.textSecondary }, plusSignStyle]}>+</Animated.Text>
          <Text style={[styles.amountText, { color: colors.text }]}>{amount}</Text>
        </Animated.View>

        <View style={styles.formSection}>
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <MaterialIcons name="payments" size={20} color={colors.primary} />
              <Text style={[styles.labelText, { color: colors.text }]}>Contributor</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contributorsScroll}>
              {loadingContributors ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                contributors.map((contributor) => (
                  <Pressable
                    key={contributor.id}
                    style={[
                      styles.contributorButton,
                      selectedContributor === contributor.id && styles.contributorButtonSelected,
                      { borderColor: selectedContributor === contributor.id ? colors.primary : 'transparent' },
                    ]}
                    onPress={() => setSelectedContributor(contributor.id)}
                  >
                    <View style={[styles.contributorAvatar, { backgroundColor: isDark ? '#2a3f27' : '#e5e5e5' }]}>
                      {contributor.avatar ? (
                        <Image source={{ uri: contributor.avatar }} style={styles.avatarImage} />
                      ) : (
                        <MaterialIcons name="person" size={16} color={colors.textSecondary} />
                      )}
                    </View>
                    <Text style={[
                      styles.contributorName,
                      { color: selectedContributor === contributor.id ? '#1a1a1a' : colors.textSecondary }
                    ]}>
                      {contributor.isCurrentUser ? 'You' : contributor.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <MaterialIcons name="category" size={20} color={colors.primary} />
              <Text style={[styles.labelText, { color: colors.text }]}>Category</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonSelected,
                    { backgroundColor: selectedCategory === category.id ? 'rgba(91,238,43,0.2)' : colors.inputBg },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryName,
                    { color: selectedCategory === category.id ? (isDark ? '#d4ffc4' : '#166534') : colors.textSecondary }
                  ]}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
              {isAddingCategory ? (
                <View style={styles.addCategoryContainer}>
                  <View style={styles.emojiPickerRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiPickerScroll}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <Pressable
                          key={emoji}
                          style={[
                            styles.emojiOption,
                            newCategoryEmoji === emoji && styles.emojiOptionSelected,
                          ]}
                          onPress={() => setNewCategoryEmoji(emoji)}
                        >
                          <Text style={styles.emojiOptionText}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={[styles.addCategoryInputRow, { backgroundColor: colors.inputBg }]}>
                    <Text style={styles.addCategoryEmojiPreview}>{newCategoryEmoji}</Text>
                    <TextInput
                      style={[styles.addCategoryInput, { color: colors.text }]}
                      placeholder="Category name"
                      placeholderTextColor={colors.textSecondary}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      autoFocus
                      onSubmitEditing={handleAddCategory}
                    />
                    <Pressable onPress={handleAddCategory} style={styles.addCategoryConfirm}>
                      <MaterialIcons name="check" size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable 
                  style={[styles.addCategoryButton, { backgroundColor: colors.inputBg }]}
                  onPress={() => setIsAddingCategory(true)}
                >
                  <MaterialIcons name="add" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <MaterialIcons name="edit-note" size={20} color={colors.primary} />
              <Text style={[styles.labelText, { color: colors.text }]}>Note</Text>
            </View>
            <View style={[styles.noteInputContainer, { backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="short-text" size={20} color={colors.textSecondary} style={styles.noteIcon} />
              <TextInput
                style={[styles.noteInput, { color: colors.text }]}
                placeholder="What is this contribution for?"
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <MaterialIcons name="receipt" size={20} color={colors.primary} />
              <Text style={[styles.labelText, { color: colors.text }]}>Receipt (Optional)</Text>
            </View>
            {receiptUri ? (
              <View style={[styles.receiptPreview, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                <View style={styles.receiptActions}>
                  <Pressable style={styles.receiptRemoveBtn} onPress={handleRemoveReceipt}>
                    <MaterialIcons name="close" size={20} color="#ef4444" />
                    <Text style={styles.receiptRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable 
                style={[styles.receiptButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                onPress={handleReceiptPick}
              >
                <MaterialIcons name="add-photo-alternate" size={24} color={colors.textSecondary} />
                <Text style={[styles.receiptButtonText, { color: colors.textSecondary }]}>
                  Attach receipt image
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
            <KeypadButton key={key} value={key} onPress={handleKeypadPress} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(30,46,25,0.9)' : 'rgba(255,255,255,0.9)', borderTopColor: colors.border }]}>
        <View style={styles.footerInfo}>
          <MaterialIcons name="book" size={16} color={colors.textSecondary} />
          <Text style={[styles.footerInfoText, { color: colors.textSecondary }]}>
            Recorded under: <Text style={{ color: colors.text }}>Q3 Budget will increase their total</Text>
          </Text>
        </View>
        <Pressable 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save Contribution</Text>
              <MaterialIcons name="check" size={20} color="#1a1a1a" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: { width: 48, height: 6, borderRadius: 3, backgroundColor: '#d4d4d4', alignSelf: 'center', marginTop: 12 },
  header: { paddingVertical: 16, alignItems: 'center' },
  headerLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  scrollView: { flex: 1 },
  amountContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, flexDirection: 'row' },
  plusSign: { fontSize: 36, fontWeight: '700', marginRight: 4 },
  amountText: { fontSize: 72, fontWeight: '800' },
  formSection: { paddingHorizontal: 24 },
  fieldContainer: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  labelText: { fontSize: 16, fontWeight: '700' },
  contributorsScroll: { flexDirection: 'row' },
  contributorButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingRight: 16, paddingVertical: 4, borderRadius: 24, gap: 8, marginRight: 12, borderWidth: 2 },
  contributorButtonSelected: { backgroundColor: '#5bee2b' },
  contributorAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  contributorName: { fontSize: 14, fontWeight: '700' },
  loadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  categoryButtonSelected: { borderWidth: 1, borderColor: '#5bee2b' },
  categoryEmoji: { fontSize: 16 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  addCategoryButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addCategoryContainer: { gap: 8 },
  emojiPickerRow: { marginBottom: 8 },
  emojiPickerScroll: { flexDirection: 'row' },
  emojiOption: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginRight: 6 },
  emojiOptionSelected: { backgroundColor: 'rgba(91,238,43,0.3)' },
  emojiOptionText: { fontSize: 20 },
  addCategoryInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingLeft: 12, paddingRight: 4, gap: 8 },
  addCategoryEmojiPreview: { fontSize: 20 },
  addCategoryInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontWeight: '600' },
  addCategoryConfirm: { padding: 6 },
  noteInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingLeft: 16 },
  noteIcon: { marginRight: 8 },
  noteInput: { flex: 1, paddingVertical: 14, paddingRight: 16, fontSize: 16, fontWeight: '500' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 24, marginTop: 16 },
  keypadBtn: { width: 90, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  keypadBtnText: { fontSize: 24, fontWeight: '700' },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, opacity: 0.6 },
  footerInfoText: { fontSize: 12, fontWeight: '500' },
  saveButton: { backgroundColor: '#5bee2b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  receiptPreview: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 8, gap: 12 },
  receiptImage: { width: 60, height: 60, borderRadius: 8 },
  receiptActions: { flex: 1 },
  receiptRemoveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  receiptRemoveText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  receiptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  receiptButtonText: { fontSize: 14, fontWeight: '600' },
});

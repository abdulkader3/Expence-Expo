import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Image, useColorScheme, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const contributors = [
  { id: 'you', name: 'You', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbY0z9rl86XH9Y5Q2itlOpqe--7tWEDIC_g_6OHi2kTQJUSgnXEnxPEWo4pc5ecK0RMJiRgYJhoolHJO_VBYR5MV86Vf31FyxjNMTVtbUc0d4psmr2_1wpK3HIqW4xnYN_gmWCWjCJ8VdKjmLESNfmDI2rgkeGPG9xp4_MTWOz8tw66ufSUB2nAKrPPctD-1vFqhP6zaCJVXiDLhHtnHNYkGs44xy7tfKWfwt6f1JFFZBJ-QYfu2lNlk1zCvSbjhUqmnryFyjZhqu4' },
  { id: 'alex', name: 'Alex', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5DOTg9KZVC6btp_LiqakSrf2anLcM2eVnpWmq40TVqVZeTFTq0MHn7OyDNX5AgzV24Li7QHR3TEFtBCBSbtualILvCqWlBN9tfA4VDeIUnmNI1i0ue8kQTJPJuY5G35tYbowTp2W9TNcyBxw2vBGC7C-lCc9B3xEiCtI873tAnVviDIzkp4IUqVC89LL9zF3wzbYbcyAKOrKF5477ljMNPddGVWNk51mZU79EUrQfdqlpR_7qfYhBiLEcXngfENBqFzM9sApPmJMc' },
  { id: 'sam', name: 'Sam', avatar: null },
];

const categories = [
  { id: 'equipment', name: 'Equipment', emoji: '💻' },
  { id: 'marketing', name: 'Marketing', emoji: '🚀' },
  { id: 'tools', name: 'Tools', emoji: '🔧' },
];

export default function AddContributionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const scrollY = useRef(new Animated.Value(0)).current;

  const [amount, setAmount] = useState('0.00');
  const [selectedContributor, setSelectedContributor] = useState('you');
  const [selectedCategory, setSelectedCategory] = useState('marketing');
  const [note, setNote] = useState('');

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

  const handleSave = () => {
    router.replace('/leaderboard');
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
    opacity: scrollY.interpolate({
      inputRange: [0, scrollDistance / 2, scrollDistance],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    }),
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
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>NEW CONTRIBUTION</Text>
      </View>

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
              {contributors.map((contributor) => (
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
                    {contributor.name}
                  </Text>
                </Pressable>
              ))}
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
              <Pressable style={[styles.addCategoryButton, { backgroundColor: colors.inputBg }]}>
                <MaterialIcons name="add" size={20} color={colors.textSecondary} />
              </Pressable>
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
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Contribution</Text>
          <MaterialIcons name="check" size={20} color="#1a1a1a" />
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
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  categoryButtonSelected: { borderWidth: 1, borderColor: '#5bee2b' },
  categoryEmoji: { fontSize: 16 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  addCategoryButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
  saveButtonText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
});

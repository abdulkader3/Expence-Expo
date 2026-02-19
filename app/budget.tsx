import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function BudgetScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    cardBg: isDark ? '#1e2e1c' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    primary: '#5bee2b',
    border: isDark ? '#2a3f27' : '#e5e5e5',
    fabBg: isDark ? '#ffffff' : '#1a1a1a',
    fabIcon: isDark ? '#1a1a1a' : '#ffffff',
    tabInactive: '#a3a3a3',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={[styles.headerButton, { backgroundColor: colors.cardBg }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Q3 Marketing Budget</Text>
        <Pressable style={[styles.headerButton, { backgroundColor: colors.cardBg }]}>
          <MaterialIcons name="more-horiz" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={[styles.glow, { backgroundColor: colors.primary }]} />
          <View style={[styles.illustrationWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }]}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBLIpzPz9LHnQU397G34WdeTJmfRCwZeouNv8Ezj52qRC5IQmQnCS86_17SSmTbnjRtOZaImI2bXtMwqX4pFVE9cO_MORV5xLkBV_hANxR_fcgd5o6K1rJm-HMcKslP6Dg-YrFhVFeOwjYw48HkzL9kiDcVc5ajEr41mIfWFDgWflwEUkVi5eLqxo0343lRkeNpaSiXTihUUj_EExXsdKYm0qsf47nWLUkHEvUO8xIEnv9IoIKj4qPbjGnMQrBX9gfyTvM9Lh4WvpP' }}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Fresh Start!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No contributions yet. Tap{' '}
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>+</Text>
            </View>
            {' '}to add the first one!
          </Text>
        </View>

        <Pressable style={styles.addButton} onPress={() => router.push('/add-contribution')}>
          <View style={styles.addButtonContent}>
            <MaterialIcons name="add-circle" size={24} color="#1a1a1a" />
            <Text style={styles.addButtonText}>Add First Contribution</Text>
          </View>
        </Pressable>
      </View>

      <Pressable style={[styles.fab, { backgroundColor: colors.fabBg }]} onPress={() => router.push('/add-contribution')}>
        <MaterialIcons name="add" size={32} color={colors.fabIcon} />
      </Pressable>

      <View style={[styles.bottomNav, { backgroundColor: isDark ? 'rgba(21,34,16,0.9)' : 'rgba(255,255,255,0.9)', borderTopColor: colors.border }]}>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="home" size={28} color={colors.tabInactive} />
          <Text style={[styles.navLabel, { color: colors.tabInactive }]}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="pie-chart" size={28} color={colors.primary} />
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Budget</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="receipt-long" size={28} color={colors.tabInactive} />
          <Text style={[styles.navLabel, { color: colors.tabInactive }]}>Activity</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/partner-ledger')}>
          <MaterialIcons name="person" size={28} color={colors.tabInactive} />
          <Text style={[styles.navLabel, { color: colors.tabInactive }]}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 80 },
  illustrationContainer: { marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 256, height: 256, borderRadius: 128, opacity: 0.2 },
  illustrationWrapper: { width: 200, height: 200, borderRadius: 100, padding: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  illustration: { width: '130%', height: '130%', },
  textContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '500', textAlign: 'center', lineHeight: 24 },
  plusBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(91,238,43,0.3)', alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  addButton: { backgroundColor: '#5bee2b', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 28, shadowColor: '#5bee2b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  addButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButtonText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  bottomNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8, paddingBottom: 24, borderTopWidth: 1 },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  navLabelActive: { fontSize: 10, fontWeight: '700' },
});

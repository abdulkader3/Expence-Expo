import { useRouter, usePathname } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (pathname === '/' || pathname === '/index') {
    return null;
  }

  const colors = {
    surface: isDark ? '#1e2e19' : '#ffffff',
    text: isDark ? '#f1f4f0' : '#131811',
    textSubtle: isDark ? '#a3bca0' : '#6c8863',
    primary: '#70eb47',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#f1f4f0',
  };

  const isActive = (path: string) => {
    if (path === '/budget' && pathname === '/') return true;
    if (path === pathname) return true;
    return false;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Pressable style={styles.navItem} onPress={() => router.push('/budget')}>
        <Ionicons 
          name={isActive('/budget') ? 'home' : 'home-outline'} 
          size={28} 
          color={isActive('/budget') ? colors.primary : colors.textSubtle} 
        />
        <Text style={[
          styles.navLabel, 
          { color: isActive('/budget') ? colors.primary : colors.textSubtle }
        ]}>
          Home
        </Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.push('/leaderboard')}>
        <Ionicons 
          name={isActive('/leaderboard') ? 'bar-chart' : 'bar-chart-outline'} 
          size={28} 
          color={isActive('/leaderboard') ? colors.primary : colors.textSubtle} 
        />
        <Text style={[
          styles.navLabel, 
          { color: isActive('/leaderboard') ? colors.primary : colors.textSubtle }
        ]}>
          Track
        </Text>
      </Pressable>

      <Pressable style={styles.fabContainer} onPress={() => router.push('/add-contribution')}>
        <View style={[styles.fab, { backgroundColor: colors.text }]}>
          <Ionicons name="add" size={32} color={colors.surface} />
        </View>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.push('/partners')}>
        <Ionicons 
          name={isActive('/partners') ? 'people' : 'people-outline'} 
          size={28} 
          color={isActive('/partners') ? colors.primary : colors.textSubtle} 
        />
        <Text style={[
          styles.navLabel, 
          { color: isActive('/partners') ? colors.primary : colors.textSubtle }
        ]}>
          Team
        </Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.push('/settings')}>
        <View style={isActive('/settings') ? [styles.navItemActive, { backgroundColor: `${colors.primary}20` }] : {}}>
          <Ionicons 
            name={isActive('/settings') ? 'settings' : 'settings-outline'} 
            size={24} 
            color={isActive('/settings') ? colors.primary : colors.textSubtle} 
          />
        </View>
        <Text style={[
          styles.navLabel, 
          { color: isActive('/settings') ? colors.text : colors.textSubtle }
        ]}>
          Settings
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  navItemActive: {
    padding: 8,
    borderRadius: 12,
  },
});

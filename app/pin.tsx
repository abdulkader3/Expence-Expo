import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PIN_LENGTH = 4;

export default function PinScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [pin, setPin] = useState('');
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#5bee2b',
    primaryDark: '#4ad320',
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1e2f18' : '#ffffff',
    neutral: isDark ? '#2a3825' : '#e2e8e0',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a3a3a3' : '#6b6b6b',
    textMuted: isDark ? '#525252' : '#a3a3a3',
  };

  const handlePress = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          router.back();
        }, 300);
      }
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const renderDots = () => {
    return Array.from({ length: PIN_LENGTH }, (_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          {
            backgroundColor: i < pin.length ? colors.primary : colors.neutral,
            borderColor: i < pin.length ? colors.primary : 'transparent',
            shadowColor: i < pin.length ? colors.primary : 'transparent',
          },
        ]}
      />
    ));
  };

  const renderKeypadButton = (value: string, isAction?: boolean) => (
    <Pressable
      style={({ pressed }) => [
        styles.keypadButton,
        { backgroundColor: colors.surface },
        pressed && styles.keypadButtonPressed,
      ]}
      onPress={() => {
        if (value === 'Clear') handleClear();
        else if (value === '⌫') handleBackspace();
        else handlePress(value);
      }}
    >
      <Text
        style={[
          styles.keypadText,
          isAction ? { fontSize: 14, color: colors.textMuted } : { color: colors.text },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <Text style={styles.lockIcon}>🔓</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Unlock PocketPartners</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your PIN to access contributions
          </Text>
        </View>

        <View style={styles.dotsContainer}>{renderDots()}</View>

        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {renderKeypadButton('1')}
            {renderKeypadButton('2')}
            {renderKeypadButton('3')}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton('4')}
            {renderKeypadButton('5')}
            {renderKeypadButton('6')}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton('7')}
            {renderKeypadButton('8')}
            {renderKeypadButton('9')}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton('Clear', true)}
            {renderKeypadButton('0')}
            {renderKeypadButton('⌫', true)}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.biometricButton,
              { backgroundColor: colors.surface },
              pressed && styles.biometricButtonPressed,
            ]}
          >
            <Text style={styles.faceIcon}>👤</Text>
            <Text style={[styles.biometricText, { color: colors.text }]}>Use FaceID</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.forgotText, { color: colors.textMuted }]}>Forgot PIN?</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  header: { alignItems: 'center', marginTop: 40 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIcon: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  keypad: { gap: 20 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  keypadButtonPressed: { transform: [{ scale: 0.95 }] },
  keypadText: { fontSize: 28, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 16 },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
  },
  biometricButtonPressed: { opacity: 0.8 },
  faceIcon: { fontSize: 24 },
  biometricText: { fontSize: 16, fontWeight: '700' },
  forgotText: { fontSize: 12, fontWeight: '600' },
});

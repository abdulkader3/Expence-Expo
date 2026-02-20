import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransaction, updateTransaction, undoTransaction, Transaction } from '../../src/services/transactions';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedContext, setEditedContext] = useState('');

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1c2e15' : '#ffffff',
    text: isDark ? '#ffffff' : '#131811',
    textMuted: isDark ? '#6b8961' : '#6b8961',
    primary: '#5bee2b',
    primaryDark: '#4cd622',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5',
    danger: '#ef4444',
  };

  const fetchTransaction = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTransaction(id);
      setTransaction(response.transaction);
      setEditedAmount(String(response.transaction.amount));
      setEditedCategory(response.transaction.category || '');
      setEditedContext(response.transaction.context || '');
    } catch (err: any) {
      console.error('[TRANSACTION DETAIL] Error fetching transaction:', err);
      if (err.status === 404) {
        setError('Transaction not found');
      } else {
        setError('Failed to load transaction');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleSave = async () => {
    if (!transaction) return;

    try {
      setSaving(true);
      const payload: any = {};
      if (editedAmount !== String(transaction.amount)) payload.amount = Number(editedAmount);
      if (editedCategory !== (transaction.category || '')) payload.category = editedCategory;
      if (editedContext !== (transaction.context || '')) payload.context = editedContext;

      const response = await updateTransaction(id, payload);
      setTransaction(response.transaction);
      setIsEditing(false);
      Alert.alert('Success', 'Transaction updated successfully');
    } catch (err: any) {
      console.error('[TRANSACTION DETAIL] Error updating transaction:', err);
      Alert.alert('Error', err.message || 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    Alert.alert(
      'Undo Transaction',
      'Are you sure you want to undo this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await undoTransaction(id);
              Alert.alert('Success', 'Transaction undone successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (err: any) {
              console.error('[TRANSACTION DETAIL] Error undoing transaction:', err);
              Alert.alert('Error', err.message || 'Failed to undo transaction');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Transaction not found'}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchTransaction}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction</Text>
        <Pressable style={styles.headerButton} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.amountIcon, { backgroundColor: isDark ? `${colors.primary}20` : '#f0fdf4' }]}>
            <Ionicons name="cash" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount</Text>
          {isEditing ? (
            <TextInput
              style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
              value={editedAmount}
              onChangeText={setEditedAmount}
              keyboardType="numeric"
            />
          ) : (
            <Text style={[styles.amountValue, { color: colors.text }]}>
              {formatCurrency(transaction.amount, transaction.currency)}
            </Text>
          )}
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
              {transaction.type}
            </Text>
          </View>
        </View>

        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DETAILS</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Category</Text>
            {isEditing ? (
              <TextInput
                style={[styles.detailInput, { color: colors.text, borderColor: colors.border }]}
                value={editedCategory}
                onChangeText={setEditedCategory}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.category || '-'}</Text>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Context</Text>
            {isEditing ? (
              <TextInput
                style={[styles.detailInput, { color: colors.text, borderColor: colors.border }]}
                value={editedContext}
                onChangeText={setEditedContext}
                placeholder="Context"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.context || '-'}</Text>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(transaction.date)}</Text>
          </View>

          {transaction.description && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Description</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.description}</Text>
            </View>
          )}
        </View>

        <View style={[styles.peopleCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PEOPLE</Text>
          
          <View style={styles.personRow}>
            <View style={[styles.personIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
              <Ionicons name="person" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: colors.textMuted }]}>Recorded For</Text>
              <Text style={[styles.personName, { color: colors.text }]}>{transaction.recorded_for_name}</Text>
              {transaction.recorded_for_email && (
                <Text style={[styles.personEmail, { color: colors.textMuted }]}>{transaction.recorded_for_email}</Text>
              )}
            </View>
          </View>

          <View style={styles.personRow}>
            <View style={[styles.personIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: colors.textMuted }]}>Recorded By</Text>
              <Text style={[styles.personName, { color: colors.text }]}>{transaction.recorded_by_name || transaction.recorded_by}</Text>
              {transaction.recorded_by_email && (
                <Text style={[styles.personEmail, { color: colors.textMuted }]}>{transaction.recorded_by_email}</Text>
              )}
            </View>
          </View>
        </View>

        {transaction.receipt_url && (
          <View style={[styles.receiptCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECEIPT</Text>
            <Pressable style={[styles.receiptButton, { borderColor: colors.border }]}>
              <Ionicons name="receipt" size={24} color={colors.primary} />
              <Text style={[styles.receiptText, { color: colors.text }]}>View Receipt</Text>
              <Ionicons name="open-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        <View style={styles.metaSection}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Created: {formatDate(transaction.created_at)}
          </Text>
          {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Updated: {formatDate(transaction.updated_at)}
            </Text>
          )}
        </View>

        {transaction.type === 'contribution' && (
          <View style={styles.actionsSection}>
            {isEditing ? (
              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#131811" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={[styles.undoButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
                onPress={handleUndo}
                disabled={saving}
              >
                <Ionicons name="refresh" size={20} color={colors.danger} />
                <Text style={[styles.undoButtonText, { color: colors.danger }]}>Undo Transaction</Text>
              </Pressable>
            )}
          </View>
        )}
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
    borderBottomWidth: 1,
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: '#131811' },
  amountCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  amountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amountLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  amountValue: { fontSize: 42, fontWeight: '900', marginTop: 8, letterSpacing: -1 },
  amountInput: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 150,
  },
  typeBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  typeBadgeText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  detailsCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  detailInput: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  peopleCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  personRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  personIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1 },
  personLabel: { fontSize: 12 },
  personName: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  personEmail: { fontSize: 13, marginTop: 2 },
  receiptCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  receiptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderRadius: 12, borderStyle: 'dashed' },
  receiptText: { flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  metaSection: { paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  metaText: { fontSize: 12 },
  actionsSection: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  saveButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#131811' },
  undoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  undoButtonText: { fontSize: 16, fontWeight: '700' },
});

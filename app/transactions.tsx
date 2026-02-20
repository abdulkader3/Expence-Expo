import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, Transaction, GetTransactionsParams } from '../src/services/transactions';

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const colors = {
    background: isDark ? '#152210' : '#f6f8f6',
    surface: isDark ? '#1c2e15' : '#ffffff',
    text: isDark ? '#ffffff' : '#131811',
    textMuted: isDark ? '#6b8961' : '#6b8961',
    primary: '#5bee2b',
    primaryDark: '#4cd622',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5',
  };

  const fetchTransactions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const params: GetTransactionsParams = {
        page: pageNum,
        per_page: 20,
        sort_by: 'date_desc',
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedCategory) params.category = selectedCategory;

      const response = await getTransactions(params);

      if (append) {
        setTransactions(prev => [...prev, ...response.data]);
      } else {
        setTransactions(response.data);
      }
      setTotalPages(Math.ceil(response.meta.total / response.meta.per_page));
      setPage(pageNum);
    } catch (err) {
      console.error('[TRANSACTIONS] Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchTransactions(page + 1, true);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'monthly': return 'calendar';
      case 'food': return 'restaurant';
      case 'travel': return 'airplane';
      case 'supplies': return 'bag-handle';
      default: return 'cash';
    }
  };

  const renderTransaction = (transaction: Transaction) => (
    <Pressable
      key={transaction.id}
      style={[styles.transactionCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: transaction.id } })}
    >
      <View style={[styles.transactionIcon, { backgroundColor: isDark ? `${colors.primary}20` : '#f0fdf4' }]}>
        <Ionicons name={getCategoryIcon(transaction.category) as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.transactionContent}>
        <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>
          {transaction.context || transaction.category || 'Transaction'}
        </Text>
        <Text style={[styles.transactionSubtitle, { color: colors.textMuted }]}>
          {transaction.recorded_for_name} • {formatDate(transaction.date)}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: colors.primary }]}>
          +{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <View style={[styles.typeTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
          <Text style={[styles.typeTagText, { color: colors.textMuted }]}>
            {transaction.type}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>All Transactions</Text>
          <Pressable style={styles.exportButton}>
            <Ionicons name="download-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Transactions</Text>
        <Pressable 
          style={styles.exportButton}
          onPress={() => {
            // TODO: Implement CSV export
          }}
        >
          <Ionicons name="download-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchTransactions(1)}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => { setSearchQuery(''); fetchTransactions(1); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        <Pressable
          style={[
            styles.categoryButton,
            {
              backgroundColor: selectedCategory === '' ? colors.text : colors.surface,
              borderColor: selectedCategory === '' ? 'transparent' : colors.border,
            },
          ]}
          onPress={() => { setSelectedCategory(''); fetchTransactions(1); }}
        >
          <Text style={[styles.categoryText, { color: selectedCategory === '' ? '#fff' : colors.text }]}>
            All
          </Text>
        </Pressable>
        {['monthly', 'food', 'travel', 'supplies'].map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === cat ? colors.text : colors.surface,
                borderColor: selectedCategory === cat ? 'transparent' : colors.border,
              },
            ]}
            onPress={() => { setSelectedCategory(cat); fetchTransactions(1); }}
          >
            <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#fff' : colors.text }]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => fetchTransactions()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onMomentumScrollEnd={handleLoadMore}
        >
          {transactions.map(renderTransaction)}
          
          {page < totalPages && (
            <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
              <Text style={[styles.loadMoreText, { color: colors.textMuted }]}>Load more</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  categoriesScroll: { marginTop: 16, maxHeight: 44 },
  categoriesContainer: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: { flex: 1, minWidth: 0 },
  transactionTitle: { fontSize: 16, fontWeight: '600' },
  transactionSubtitle: { fontSize: 13, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '700' },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  typeTagText: { fontSize: 10, fontWeight: '500', textTransform: 'capitalize' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: '#131811' },
  loadMoreButton: { paddingVertical: 20, alignItems: 'center' },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
});

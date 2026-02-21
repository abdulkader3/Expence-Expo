import { View, Text, StyleSheet, Pressable, Image, useColorScheme, Modal, TextInput, ScrollView, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { createSale, getBanks, getSales, getSalesSummary, refundSale, Bank, Sale, SalesSummary } from '../src/services/sales';
import { createCostEntry, getCostEntries, CostEntry } from '../src/services/costEntries';
import { createAllocation } from '../src/services/allocations';

export default function BudgetScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [loadingCostEntries, setLoadingCostEntries] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'sale' | 'cost'>('sale');
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Allocation modal state
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [selectedSaleForAllocation, setSelectedSaleForAllocation] = useState<Sale | null>(null);
  const [selectedCostForAllocation, setSelectedCostForAllocation] = useState<CostEntry | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('');

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleTotal, setSaleTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [cashHolder, setCashHolder] = useState('');
  const [costDescription, setCostDescription] = useState('');
  const [costTotal, setCostTotal] = useState('');

  const [activeTab, setActiveTab] = useState<'sales' | 'costs'>('sales');

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
    inputBg: isDark ? '#2a3f27' : '#f5f5f5',
    error: '#ff4444',
    success: '#22c55e',
  };

  const loadSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const response = await getSales({ per_page: 50 });
      if (response.data && Array.isArray(response.data)) {
        setSales(response.data);
      }
    } catch (error: any) {
      console.log('[BUDGET] Error loading sales:', error);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const loadCostEntries = useCallback(async () => {
    setLoadingCostEntries(true);
    try {
      const response = await getCostEntries({ per_page: 50 });
      if (response.data && Array.isArray(response.data)) {
        setCostEntries(response.data);
      }
    } catch (error: any) {
      console.log('[BUDGET] Error loading cost entries:', error);
    } finally {
      setLoadingCostEntries(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const fromDate = new Date(dateFrom).toISOString();
      const toDate = new Date(dateTo).toISOString();
      const response = await getSalesSummary(fromDate, toDate);
      setSummary(response.summary);
    } catch (error: any) {
      console.log('[BUDGET] Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadSales();
    loadCostEntries();
    loadSummary();
  }, [loadSales, loadCostEntries, loadSummary]);

  useEffect(() => {
    if (modalVisible && paymentMethod === 'bank') {
      loadBanks();
    }
  }, [modalVisible, paymentMethod]);

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await getBanks();
      setBanks(response.data);
    } catch (error) {
      console.log('Error loading banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setQuantity('1');
    setSaleTotal('');
    setPaymentMethod('cash');
    setSelectedBank(null);
    setCashHolder('');
    setCostDescription('');
    setCostTotal('');
  };

  const handleCloseModal = () => {
    resetForm();
    setModalVisible(false);
  };

  const handleOpenModal = (type: 'sale' | 'cost') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (modalType === 'sale') {
      if (!productName.trim()) {
        Alert.alert('Validation Error', 'Product name is required');
        return;
      }
      const total = parseFloat(saleTotal);
      if (isNaN(total) || total < 0) {
        Alert.alert('Validation Error', 'Sale total must be a valid positive number');
        return;
      }
      if (paymentMethod === 'bank' && !selectedBank) {
        Alert.alert('Validation Error', 'Please select a bank');
        return;
      }
      setLoading(true);
      try {
        await createSale({
          product_name: productName.trim(),
          quantity: parseInt(quantity) || 1,
          sale_total: total,
          currency: 'BDT',
          payment_method: paymentMethod,
          bank_id: paymentMethod === 'bank' ? selectedBank?.id : undefined,
          bank_name: paymentMethod === 'bank' ? selectedBank?.name : undefined,
          cash_holder: paymentMethod === 'cash' ? cashHolder.trim() || undefined : undefined,
        });
        Alert.alert('Success', 'Sale record created successfully');
        handleCloseModal();
        loadSales();
        loadSummary();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create sale record');
      } finally {
        setLoading(false);
      }
    } else {
      if (!costDescription.trim()) {
        Alert.alert('Validation Error', 'Description is required');
        return;
      }
      const total = parseFloat(costTotal);
      if (isNaN(total) || total <= 0) {
        Alert.alert('Validation Error', 'Total cost must be greater than 0');
        return;
      }
      setLoading(true);
      try {
        await createCostEntry({
          description: costDescription.trim(),
          total_cost: total,
          currency: 'BDT',
        });
        Alert.alert('Success', 'Cost entry created successfully');
        handleCloseModal();
        loadCostEntries();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create cost entry');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefund = async (sale: Sale) => {
    Alert.alert(
      'Refund Sale',
      `Are you sure you want to refund "${sale.product_name}" for ${formatCurrency(sale.sale_total, sale.currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await refundSale(sale.id);
              Alert.alert('Success', `Sale refunded. ${response.allocations_reversed} allocation(s) reversed.`);
              loadSales();
              loadSummary();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to refund sale');
            }
          },
        },
      ]
    );
  };

  const handleOpenAllocationModal = (sale: Sale) => {
    setSelectedSaleForAllocation(sale);
    setSelectedCostForAllocation(null);
    setAllocationAmount('');
    setAllocationModalVisible(true);
  };

  const handleSelectCostForAllocation = (cost: CostEntry) => {
    setSelectedCostForAllocation(cost);
    const remaining = cost.total_cost - (cost.allocated_amount || 0);
    setAllocationAmount(String(remaining));
  };

  const handleSubmitAllocation = async () => {
    if (!selectedSaleForAllocation || !selectedCostForAllocation) {
      Alert.alert('Validation Error', 'Please select both a sale and a cost entry');
      return;
    }

    const amount = parseFloat(allocationAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Allocation amount must be greater than 0');
      return;
    }

    const remaining = selectedCostForAllocation.total_cost - (selectedCostForAllocation.allocated_amount || 0);
    if (amount > remaining) {
      Alert.alert('Validation Error', `Allocation amount cannot exceed remaining amount (${formatCurrency(remaining, 'BDT')})`);
      return;
    }

    setLoading(true);
    try {
      await createAllocation({
        sale_id: selectedSaleForAllocation.id,
        cost_id: selectedCostForAllocation.id,
        allocated_amount: amount,
      });

      Alert.alert('Success', 'Cost allocated to sale successfully');
      setAllocationModalVisible(false);
      loadSales();
      loadCostEntries();
      loadSummary();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  const closeAllocationModal = () => {
    setAllocationModalVisible(false);
    setSelectedSaleForAllocation(null);
    setSelectedCostForAllocation(null);
    setAllocationAmount('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.sale_total, 0);
  const totalCosts = costEntries.reduce((sum, entry) => sum + entry.total_cost, 0);

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.product_name}</Text>
        <View style={styles.cardDetails}>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Qty: {item.quantity}</Text>
          <View style={[styles.badge, { backgroundColor: item.payment_method === 'cash' ? colors.primary + '20' : '#3b82f620' }]}>
            <Text style={[styles.badgeText, { color: item.payment_method === 'cash' ? colors.primary : '#3b82f6' }]}>
              {item.payment_method === 'cash' ? 'Cash' : item.bank_name}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardAmount}>
        <Text style={[styles.amountText, { color: colors.success }]}>{formatCurrency(item.sale_total, item.currency)}</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
        {(item.status === 'completed' || !item.status) && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} 
              onPress={() => handleOpenAllocationModal(item)}
            >
              <MaterialIcons name="link" size={14} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Allocate</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]} 
              onPress={() => handleRefund(item)}
            >
              <MaterialIcons name="undo" size={14} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Refund</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const renderCostItem = ({ item }: { item: CostEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.description}</Text>
        <View style={styles.cardDetails}>
          <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.error }]}>Cost</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardAmount}>
        <Text style={[styles.amountText, { color: colors.error }]}>{formatCurrency(item.total_cost, item.currency)}</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );

  const renderSummaryCards = () => (
    <View>
      <Pressable style={[styles.datePicker, { backgroundColor: colors.cardBg }]} onPress={() => setDatePickerVisible(true)}>
        <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
        <Text style={[styles.datePickerText, { color: colors.text }]}>
          {new Date(dateFrom).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })} - {new Date(dateTo).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
      </Pressable>

      {loadingSummary ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
      ) : summary ? (
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Revenue</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>{formatCurrency(summary.total_revenue, 'BDT')}</Text>
            <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>{summary.total_sales} sales</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Costs</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>{formatCurrency(summary.total_allocated_cost, 'BDT')}</Text>
            <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>Allocated</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Profit</Text>
            <Text style={[styles.summaryAmount, { color: summary.total_profit >= 0 ? colors.success : colors.error }]}>{formatCurrency(summary.total_profit, 'BDT')}</Text>
            <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>{summary.overall_profit_margin.toFixed(1)}% margin</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderEmptySales = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="point-of-sale" size={80} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sales Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add your first sale to get started!</Text>
    </View>
  );

  const renderEmptyCosts = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={80} color={colors.error} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Costs Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Track your expenses here!</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={[styles.headerButton, { backgroundColor: colors.cardBg }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Budget</Text>
        <Pressable style={[styles.addButtonSmall, { backgroundColor: colors.primary }]} onPress={() => handleOpenModal(activeTab === 'sales' ? 'sale' : 'cost')}>
          <MaterialIcons name="add" size={18} color="#1a1a1a" />
        </Pressable>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.cardBg }]}>
        <Pressable style={[styles.tab, activeTab === 'sales' && { backgroundColor: colors.primary }]} onPress={() => setActiveTab('sales')}>
          <Text style={[styles.tabText, { color: activeTab === 'sales' ? '#1a1a1a' : colors.textSecondary }]}>Sales</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'costs' && { backgroundColor: colors.primary }]} onPress={() => setActiveTab('costs')}>
          <Text style={[styles.tabText, { color: activeTab === 'costs' ? '#1a1a1a' : colors.textSecondary }]}>Costs</Text>
        </Pressable>
      </View>

      {activeTab === 'sales' ? (
        loadingSales ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : sales.length === 0 ? (
          renderEmptySales()
        ) : (
          <FlatList
            data={sales}
            renderItem={renderSaleItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderSummaryCards}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        loadingCostEntries ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : costEntries.length === 0 ? (
          renderEmptyCosts()
        ) : (
          <FlatList
            data={costEntries}
            renderItem={renderCostItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <View style={{ paddingTop: 16 }}>
                <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Costs</Text>
                  <Text style={[styles.summaryAmount, { color: colors.error }]}>{formatCurrency(totalCosts, 'BDT')}</Text>
                  <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>{costEntries.length} entries</Text>
                </View>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{modalType === 'sale' ? 'Add Sale' : 'Add Cost'}</Text>
              <Pressable onPress={handleCloseModal}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {modalType === 'sale' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={productName} onChangeText={setProductName} placeholder="Enter product name" placeholderTextColor={colors.textSecondary} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={quantity} onChangeText={setQuantity} placeholder="1" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1.5 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Total *</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={saleTotal} onChangeText={setSaleTotal} placeholder="0.00" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Payment Method *</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable style={[styles.optionButton, { backgroundColor: colors.inputBg }, paymentMethod === 'cash' && { backgroundColor: colors.primary }]} onPress={() => setPaymentMethod('cash')}>
                        <MaterialIcons name="payments" size={20} color={paymentMethod === 'cash' ? '#1a1a1a' : colors.textSecondary} />
                        <Text style={{ color: paymentMethod === 'cash' ? '#1a1a1a' : colors.textSecondary }}>Cash</Text>
                      </Pressable>
                      <Pressable style={[styles.optionButton, { backgroundColor: colors.inputBg }, paymentMethod === 'bank' && { backgroundColor: colors.primary }]} onPress={() => setPaymentMethod('bank')}>
                        <MaterialIcons name="account-balance" size={20} color={paymentMethod === 'bank' ? '#1a1a1a' : colors.textSecondary} />
                        <Text style={{ color: paymentMethod === 'bank' ? '#1a1a1a' : colors.textSecondary }}>Bank</Text>
                      </Pressable>
                    </View>
                  </View>
                  {paymentMethod === 'bank' && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Select Bank *</Text>
                      {loadingBanks ? <ActivityIndicator color={colors.primary} /> : banks.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {banks.map((bank) => (
                            <Pressable key={bank.id} style={[styles.bankOption, { backgroundColor: colors.inputBg }, selectedBank?.id === bank.id && { backgroundColor: colors.primary }]} onPress={() => setSelectedBank(bank)}>
                              <Text style={{ color: selectedBank?.id === bank.id ? '#1a1a1a' : colors.text }}>{bank.name}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : <Text style={{ color: colors.textSecondary }}>No banks available</Text>}
                    </View>
                  )}
                  {paymentMethod === 'cash' && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Cash Holder (Optional)</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={cashHolder} onChangeText={setCashHolder} placeholder="Enter holder name" placeholderTextColor={colors.textSecondary} />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={costDescription} onChangeText={setCostDescription} placeholder="Enter description" placeholderTextColor={colors.textSecondary} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Total Cost *</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={costTotal} onChangeText={setCostTotal} placeholder="0.00" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" />
                  </View>
                </>
              )}
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable style={[styles.cancelButton, { backgroundColor: colors.inputBg }]} onPress={handleCloseModal}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitButton, { backgroundColor: modalType === 'sale' ? colors.primary : colors.error }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>{modalType === 'sale' ? 'Add Sale' : 'Add Cost'}</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent visible={datePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date Range</Text>
              <Pressable onPress={() => setDatePickerVisible(false)}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>From Date</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>To Date</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <Pressable style={[styles.quickDateButton, { backgroundColor: colors.inputBg }]} onPress={() => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1); setDateFrom(f.toISOString().split('T')[0]); setDateTo(t.toISOString().split('T')[0]); }}>
                  <Text style={{ color: colors.text }}>This Month</Text>
                </Pressable>
                <Pressable style={[styles.quickDateButton, { backgroundColor: colors.inputBg }]} onPress={() => { const t = new Date(); const l = new Date(t); l.setDate(t.getDate() - 30); setDateFrom(l.toISOString().split('T')[0]); setDateTo(t.toISOString().split('T')[0]); }}>
                  <Text style={{ color: colors.text }}>Last 30 Days</Text>
                </Pressable>
                <Pressable style={[styles.quickDateButton, { backgroundColor: colors.inputBg }]} onPress={() => { const t = new Date(); const y = new Date(t.getFullYear(), 0, 1); setDateFrom(y.toISOString().split('T')[0]); setDateTo(t.toISOString().split('T')[0]); }}>
                  <Text style={{ color: colors.text }}>This Year</Text>
                </Pressable>
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable style={[styles.cancelButton, { backgroundColor: colors.inputBg }]} onPress={() => setDatePickerVisible(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={() => { setDatePickerVisible(false); loadSummary(); }}>
                <Text style={{ color: '#1a1a1a' }}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Allocation Modal */}
      <Modal animationType="slide" transparent visible={allocationModalVisible} onRequestClose={closeAllocationModal}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Allocate Cost to Sale</Text>
              <Pressable onPress={closeAllocationModal}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedSaleForAllocation && (
                <View style={[styles.selectedItemCard, { backgroundColor: colors.primary + '20', padding: 16, borderRadius: 12, marginBottom: 20 }]}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Allocating to Sale</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{selectedSaleForAllocation.product_name}</Text>
                  <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700' }}>{formatCurrency(selectedSaleForAllocation.sale_total, selectedSaleForAllocation.currency)}</Text>
                </View>
              )}
              <Text style={[styles.label, { color: colors.text }]}>Select Cost Entry</Text>
              {loadingCostEntries ? (
                <ActivityIndicator color={colors.primary} />
              ) : costEntries.length > 0 ? (
                <View style={{ gap: 8, marginBottom: 20 }}>
                  {costEntries.filter(c => (c.total_cost - (c.allocated_amount || 0)) > 0).map((cost) => {
                    const remaining = cost.total_cost - (cost.allocated_amount || 0);
                    return (
                      <Pressable
                        key={cost.id}
                        style={[styles.costOption, { backgroundColor: colors.inputBg, padding: 14, borderRadius: 12 }, selectedCostForAllocation?.id === cost.id && { backgroundColor: colors.primary }]}
                        onPress={() => handleSelectCostForAllocation(cost)}
                      >
                        <View>
                          <Text style={{ color: selectedCostForAllocation?.id === cost.id ? '#1a1a1a' : colors.text, fontWeight: '600' }}>{cost.description}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Remaining: {formatCurrency(remaining, cost.currency)}</Text>
                        </View>
                        <Text style={{ color: selectedCostForAllocation?.id === cost.id ? '#1a1a1a' : colors.error, fontWeight: '700' }}>{formatCurrency(cost.total_cost, cost.currency)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>No cost entries available</Text>
              )}
              {selectedCostForAllocation && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Allocation Amount</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                    value={allocationAmount}
                    onChangeText={setAllocationAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable style={[styles.cancelButton, { backgroundColor: colors.inputBg }]} onPress={closeAllocationModal}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmitAllocation} disabled={loading || !selectedCostForAllocation}>
                {loading ? <ActivityIndicator color="#1a1a1a" /> : <Text style={{ color: '#1a1a1a' }}>Allocate</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  addButtonSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, padding: 4, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  datePicker: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginHorizontal: 16, marginTop: 16 },
  datePickerText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  summarySubtext: { fontSize: 11 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardDetails: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardSubtitle: { fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  dateText: { fontSize: 11 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },
  optionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  bankOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  quickDateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  refundButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  refundText: { fontSize: 11, fontWeight: '600' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  actionButtonText: { fontSize: 11, fontWeight: '600' },
  selectedItemCard: { padding: 16, borderRadius: 12, marginBottom: 20 },
  costOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import {
  getDeletedSales,
  DeletedSale,
} from "../src/services/sales";
import {
  getDeletedCostEntries,
  DeletedCostEntry,
} from "../src/services/costEntries";

export default function DeletedItemsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<"sales" | "costs">("sales");
  const [deletedSales, setDeletedSales] = useState<DeletedSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [deletedCosts, setDeletedCosts] = useState<DeletedCostEntry[]>([]);
  const [loadingCosts, setLoadingCosts] = useState(true);

  const colors = {
    background: isDark ? "#152210" : "#f6f8f6",
    cardBg: isDark ? "#1e2e1c" : "#ffffff",
    text: isDark ? "#ffffff" : "#1a1a1a",
    textSecondary: isDark ? "#a3a3a3" : "#6b6b6b",
    textMuted: isDark ? "#525252" : "#a3a3a3",
    primary: "#5bee2b",
    border: isDark ? "#2a3f27" : "#e5e5e5",
    error: "#ff4444",
    success: "#22c55e",
    warning: "#f59e0b",
  };

  const loadDeletedSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const response = await getDeletedSales({ per_page: 50 });
      setDeletedSales(response.data);
    } catch (error: any) {
      console.log("[DELETED ITEMS] Error loading deleted sales:", error);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const loadDeletedCosts = useCallback(async () => {
    setLoadingCosts(true);
    try {
      const response = await getDeletedCostEntries({ per_page: 50 });
      setDeletedCosts(response.data);
    } catch (error: any) {
      console.log("[DELETED ITEMS] Error loading deleted costs:", error);
    } finally {
      setLoadingCosts(false);
    }
  }, []);

  useEffect(() => {
    loadDeletedSales();
    loadDeletedCosts();
  }, [loadDeletedSales, loadDeletedCosts]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const renderDeletedSaleItem = ({ item }: { item: DeletedSale }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.product_name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Qty: {item.quantity} • {item.payment_method === "cash" ? "Cash" : item.bank_name}
          </Text>
        </View>
        <View style={styles.cardAmount}>
          <Text style={[styles.amountText, { color: colors.error }]}>
            {formatCurrency(item.sale_total, item.currency)}
          </Text>
        </View>
      </View>

      <View style={[styles.metaSection, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Deleted: {formatDate(item.deleted_at)}
          </Text>
        </View>
        {item.deleted_by && (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Deleted by: {item.deleted_by.name}
            </Text>
          </View>
        )}
      </View>

      {item.audit_log && item.audit_log.length > 0 && (
        <View style={[styles.auditSection, { backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5" }]}>
          <Text style={[styles.auditTitle, { color: colors.text }]}>
            Audit Log
          </Text>
          {item.audit_log[0]?.reversed_allocation_details?.map((detail, idx) => (
            <View key={idx} style={styles.auditItem}>
              <Text style={[styles.auditText, { color: colors.textSecondary }]}>
                • Reversed allocation: {formatCurrency(detail.allocated_amount, item.currency)} (qty: {detail.allocation_quantity})
              </Text>
              <Text style={[styles.auditDate, { color: colors.textMuted }]}>
                {formatDate(detail.reversed_at)}
              </Text>
            </View>
          ))}
          <Text style={[styles.auditSummary, { color: colors.primary }]}>
            Total allocations reversed: {item.audit_log[0]?.allocations_reversed || 0}
          </Text>
        </View>
      )}
    </View>
  );

  const renderDeletedCostItem = ({ item }: { item: DeletedCostEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.description}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {item.quantity} {item.quantity === 1 ? "unit" : "units"} @ {formatCurrency(item.unit_cost, item.currency)}/unit
          </Text>
        </View>
        <View style={styles.cardAmount}>
          <Text style={[styles.amountText, { color: colors.error }]}>
            {formatCurrency(item.total_cost, item.currency)}
          </Text>
        </View>
      </View>

      <View style={[styles.metaSection, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Deleted: {formatDate(item.deleted_at)}
          </Text>
        </View>
        {item.deleted_by && (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Deleted by: {item.deleted_by.name}
            </Text>
          </View>
        )}
      </View>

      {item.audit_log && item.audit_log.length > 0 && (
        <View style={[styles.auditSection, { backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5" }]}>
          <Text style={[styles.auditTitle, { color: colors.text }]}>
            Audit Log
          </Text>
          {item.audit_log[0]?.reversed_allocation_details?.map((detail, idx) => (
            <View key={idx} style={styles.auditItem}>
              <Text style={[styles.auditText, { color: colors.textSecondary }]}>
                • Reversed allocation from sale: {formatCurrency(detail.allocated_amount, item.currency)} (qty: {detail.allocation_quantity})
              </Text>
              <Text style={[styles.auditDate, { color: colors.textMuted }]}>
                {formatDate(detail.reversed_at)}
              </Text>
            </View>
          ))}
          <Text style={[styles.auditSummary, { color: colors.primary }]}>
            Total allocations reversed: {item.audit_log[0]?.allocations_reversed || 0}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptySales = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="point-of-sale" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Deleted Sales
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Deleted sales will appear here
      </Text>
    </View>
  );

  const renderEmptyCosts = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Deleted Costs
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Deleted cost entries will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.headerButton, { backgroundColor: colors.cardBg }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Deleted Items
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.cardBg }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "sales" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab("sales")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "sales" ? "#1a1a1a" : colors.textSecondary,
              },
            ]}
          >
            Sales ({deletedSales.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "costs" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab("costs")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "costs" ? "#1a1a1a" : colors.textSecondary,
              },
            ]}
          >
            Costs ({deletedCosts.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === "sales" ? (
        loadingSales ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : deletedSales.length === 0 ? (
          renderEmptySales()
        ) : (
          <FlatList
            data={deletedSales}
            renderItem={renderDeletedSaleItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : loadingCosts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : deletedCosts.length === 0 ? (
        renderEmptyCosts()
      ) : (
        <FlatList
          data={deletedCosts}
          renderItem={renderDeletedCostItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  cardAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  metaSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  auditSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  auditItem: {
    marginBottom: 6,
  },
  auditText: {
    fontSize: 12,
  },
  auditDate: {
    fontSize: 10,
    marginTop: 2,
  },
  auditSummary: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
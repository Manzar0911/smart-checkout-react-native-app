import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const AdminInventoryScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();

  // Product selection state
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Inventory adjustment state
  const [actionType, setActionType] = useState('ADD');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  // History state
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await inventoryAPI.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      Alert.alert(t('error'), error.message || t('failed_load_products'));
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchHistory = async (page = 1, productId = null) => {
    setHistoryLoading(true);
    try {
      const response = await inventoryAPI.getHistory(page, 20, productId);
      if (page === 1) {
        setHistoryLogs(response.logs || []);
      } else {
        setHistoryLogs((prev) => [...prev, ...(response.logs || [])]);
      }
      setHistoryTotal(response.pagination?.total || 0);
      setHistoryPage(page);
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchText(product.name);
    setShowDropdown(false);
    // Fetch history filtered by this product
    fetchHistory(1, product.id);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) {
      Alert.alert(t('error'), t('select_product_first'));
      return;
    }

    const parsedQty = parseInt(quantity);
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert(t('error'), t('enter_valid_quantity'));
      return;
    }

    if (actionType === 'REMOVE' && parsedQty > selectedProduct.stockQuantity) {
      Alert.alert(
        t('error'),
        t('cannot_remove_stock', { qty: parsedQty, stock: selectedProduct.stockQuantity })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await inventoryAPI.updateStock({
        productId: selectedProduct.id,
        quantity: parsedQty,
        actionType,
      });

      // Update local selected product stock
      setSelectedProduct((prev) => ({
        ...prev,
        stockQuantity: response.newQuantity,
      }));

      // Update product in list
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, stockQuantity: response.newQuantity } : p
        )
      );

      Alert.alert(t('success'), response.message);
      setQuantity('');

      // Refresh history
      fetchHistory(1, selectedProduct.id);
    } catch (error) {
      Alert.alert(t('error'), error.message || t('failed_update_stock'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
    fetchHistory(1, selectedProduct?.id || null);
  }, [selectedProduct]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${mon} ${year}, ${hours}:${mins}`;
  };

  const dynamicStyles = getStyles(COLORS);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>{t('inventory')}</Text>
            <TouchableOpacity style={dynamicStyles.backBtn} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          >
            {/* ── Stock Adjustment Card ── */}
            <View style={dynamicStyles.formCard}>
              <View style={dynamicStyles.cardHeader}>
                <Ionicons name="layers-outline" size={22} color={COLORS.primary} />
                <Text style={dynamicStyles.cardHeaderTitle}>{t('adjust_stock')}</Text>
              </View>

              {/* Product Selector */}
              <Text style={dynamicStyles.label}>{t('select_product')}</Text>
              <View style={{ zIndex: 1000 }}>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder={t('type_to_search')}
                  placeholderTextColor={COLORS.textMuted}
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    setShowDropdown(true);
                    if (!text) setSelectedProduct(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && (
                  <View style={dynamicStyles.dropdown}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {productsLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <ActivityIndicator color={COLORS.primary} />
                        </View>
                      ) : filteredProducts.length === 0 ? (
                        <View style={{ padding: 15 }}>
                          <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>{t('no_products_found')}</Text>
                        </View>
                      ) : (
                        filteredProducts.map((prod) => (
                          <TouchableOpacity
                            key={prod.id}
                            style={dynamicStyles.dropdownItem}
                            onPress={() => handleSelectProduct(prod)}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={dynamicStyles.dropdownItemTitle}>{prod.name}</Text>
                                <Text style={dynamicStyles.dropdownItemSub}>{prod.brand} • {prod.weight}</Text>
                              </View>
                              <View style={dynamicStyles.stockBadge}>
                                <Text style={dynamicStyles.stockBadgeText}>{prod.stockQuantity}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Current Stock Display */}
              {selectedProduct && (
                <View style={dynamicStyles.currentStockContainer}>
                  <View style={dynamicStyles.currentStockBox}>
                    <Text style={dynamicStyles.currentStockLabel}>{t('current_stock')}</Text>
                    <Text style={dynamicStyles.currentStockValue}>{selectedProduct.stockQuantity}</Text>
                    <Text style={dynamicStyles.currentStockUnit}>{t('units')}</Text>
                  </View>
                </View>
              )}

              {/* Action Type Toggle */}
              <Text style={dynamicStyles.label}>{t('action_type')}</Text>
              <View style={dynamicStyles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.toggleBtn,
                    actionType === 'ADD' && dynamicStyles.toggleBtnActiveAdd,
                  ]}
                  onPress={() => setActionType('ADD')}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={actionType === 'ADD' ? COLORS.white : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      dynamicStyles.toggleBtnText,
                      actionType === 'ADD' && dynamicStyles.toggleBtnTextActive,
                    ]}
                  >
                    {t('add_stock')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.toggleBtn,
                    actionType === 'REMOVE' && dynamicStyles.toggleBtnActiveRemove,
                  ]}
                  onPress={() => setActionType('REMOVE')}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color={actionType === 'REMOVE' ? COLORS.white : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      dynamicStyles.toggleBtnText,
                      actionType === 'REMOVE' && dynamicStyles.toggleBtnTextActive,
                    ]}
                  >
                    {t('remove_stock')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity Input */}
              <Text style={dynamicStyles.label}>{t('quantity')}</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder={t('enter_quantity')}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              {/* Preview of result */}
              {selectedProduct && quantity && parseInt(quantity) > 0 && (
                <View style={dynamicStyles.previewContainer}>
                  <Text style={dynamicStyles.previewText}>
                    {selectedProduct.stockQuantity} →{' '}
                    <Text
                      style={{
                        color: actionType === 'ADD' ? COLORS.success : COLORS.error,
                        ...FONTS.bold,
                      }}
                    >
                      {actionType === 'ADD'
                        ? selectedProduct.stockQuantity + parseInt(quantity)
                        : Math.max(0, selectedProduct.stockQuantity - parseInt(quantity))}
                    </Text>
                    {' '}{t('units')}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={dynamicStyles.submitBtn}
                onPress={handleUpdateStock}
                disabled={loading}
              >
                <LinearGradient
                  colors={actionType === 'ADD' ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                  style={dynamicStyles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons
                        name={actionType === 'ADD' ? 'add-circle' : 'remove-circle'}
                        size={22}
                        color={COLORS.white}
                      />
                      <Text style={dynamicStyles.submitBtnText}>
                        {actionType === 'ADD' ? t('add_to_stock') : t('remove_from_stock')}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── History Section ── */}
            <View style={dynamicStyles.historySection}>
              <View style={dynamicStyles.cardHeader}>
                <Ionicons name="time-outline" size={22} color={COLORS.warning} />
                <Text style={dynamicStyles.cardHeaderTitle}>{t('adjustment_history')}</Text>
                {historyTotal > 0 && (
                  <View style={dynamicStyles.historyCountBadge}>
                    <Text style={dynamicStyles.historyCountText}>{historyTotal}</Text>
                  </View>
                )}
              </View>

              {selectedProduct && (
                <View style={dynamicStyles.historyFilterBar}>
                  <Text style={dynamicStyles.historyFilterText}>
                    {t('showing_for')}: {selectedProduct.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProduct(null);
                      setSearchText('');
                      fetchHistory(1, null);
                    }}
                  >
                    <Text style={{ color: COLORS.primary, ...FONTS.medium, fontSize: SIZES.sm }}>
                      {t('show_all')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {historyLoading && historyLogs.length === 0 ? (
                <View style={dynamicStyles.emptyState}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
              ) : historyLogs.length === 0 ? (
                <View style={dynamicStyles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
                  <Text style={dynamicStyles.emptyStateText}>{t('no_adjustments_yet')}</Text>
                </View>
              ) : (
                <>
                  {historyLogs.map((log) => (
                    <View key={log.id} style={dynamicStyles.historyCard}>
                      <View style={dynamicStyles.historyCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={dynamicStyles.historyProductName}>{log.productName}</Text>
                          <Text style={dynamicStyles.historyMeta}>
                            {t('by')} {log.adminName} • {formatDate(log.createdAt)}
                          </Text>
                        </View>
                        <View
                          style={[
                            dynamicStyles.actionBadge,
                            {
                              backgroundColor:
                                log.actionType === 'ADD'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                            },
                          ]}
                        >
                          <Ionicons
                            name={log.actionType === 'ADD' ? 'arrow-up' : 'arrow-down'}
                            size={14}
                            color={log.actionType === 'ADD' ? COLORS.success : COLORS.error}
                          />
                          <Text
                            style={[
                              dynamicStyles.actionBadgeText,
                              { color: log.actionType === 'ADD' ? COLORS.success : COLORS.error },
                            ]}
                          >
                            {log.actionType}
                          </Text>
                        </View>
                      </View>
                      <View style={dynamicStyles.historyCardBottom}>
                        <View style={dynamicStyles.qtyBox}>
                          <Text style={dynamicStyles.qtyLabel}>{t('previous')}</Text>
                          <Text style={dynamicStyles.qtyValue}>{log.previousQuantity}</Text>
                        </View>
                        <View style={dynamicStyles.qtyArrow}>
                          <Ionicons
                            name={log.actionType === 'ADD' ? 'add' : 'remove'}
                            size={16}
                            color={log.actionType === 'ADD' ? COLORS.success : COLORS.error}
                          />
                          <Text
                            style={[
                              dynamicStyles.qtyChanged,
                              { color: log.actionType === 'ADD' ? COLORS.success : COLORS.error },
                            ]}
                          >
                            {log.changedQuantity}
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
                        <View style={dynamicStyles.qtyBox}>
                          <Text style={dynamicStyles.qtyLabel}>{t('new')}</Text>
                          <Text style={[dynamicStyles.qtyValue, { color: COLORS.primary }]}>
                            {log.newQuantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Load More */}
                  {historyLogs.length < historyTotal && (
                    <TouchableOpacity
                      style={dynamicStyles.loadMoreBtn}
                      onPress={() => fetchHistory(historyPage + 1, selectedProduct?.id || null)}
                      disabled={historyLoading}
                    >
                      {historyLoading ? (
                        <ActivityIndicator color={COLORS.primary} />
                      ) : (
                        <Text style={dynamicStyles.loadMoreText}>{t('load_more')}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    gradient: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      marginBottom: 20,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
    scrollContent: { paddingBottom: 40 },

    // Form Card
    formCard: {
      marginHorizontal: 20,
      backgroundColor: COLORS.card,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      ...SHADOWS.medium,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 15,
    },
    cardHeaderTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
    label: {
      fontSize: SIZES.sm,
      color: COLORS.textSecondary,
      marginBottom: 6,
      marginTop: 12,
      ...FONTS.medium,
    },
    input: {
      backgroundColor: COLORS.surfaceLight,
      color: COLORS.textPrimary,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 14,
      fontSize: SIZES.md,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      ...FONTS.regular,
    },

    // Dropdown
    dropdown: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      ...SHADOWS.large,
      zIndex: 5000,
    },
    dropdownItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    dropdownItemTitle: { color: COLORS.textPrimary, ...FONTS.medium },
    dropdownItemSub: { color: COLORS.textMuted, fontSize: 12 },
    stockBadge: {
      backgroundColor: COLORS.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 10,
    },
    stockBadgeText: { color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.sm },

    // Current Stock
    currentStockContainer: {
      marginTop: 16,
      alignItems: 'center',
    },
    currentStockBox: {
      backgroundColor: COLORS.surfaceLight,
      paddingVertical: 16,
      paddingHorizontal: 30,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      width: '100%',
    },
    currentStockLabel: { color: COLORS.textMuted, fontSize: SIZES.sm, ...FONTS.medium },
    currentStockValue: {
      color: COLORS.textPrimary,
      fontSize: 36,
      ...FONTS.bold,
      marginVertical: 4,
    },
    currentStockUnit: { color: COLORS.textMuted, fontSize: SIZES.sm, ...FONTS.regular },

    // Toggle
    toggleContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: COLORS.surfaceLight,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
    },
    toggleBtnActiveAdd: {
      backgroundColor: COLORS.success,
      borderColor: COLORS.success,
    },
    toggleBtnActiveRemove: {
      backgroundColor: COLORS.error,
      borderColor: COLORS.error,
    },
    toggleBtnText: { color: COLORS.textMuted, ...FONTS.medium, fontSize: SIZES.md },
    toggleBtnTextActive: { color: COLORS.white },

    // Preview
    previewContainer: {
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 10,
      alignItems: 'center',
    },
    previewText: { color: COLORS.textSecondary, fontSize: SIZES.md, ...FONTS.medium },

    // Submit
    submitBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
    submitBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },

    // History Section
    historySection: {
      marginHorizontal: 20,
      marginTop: 24,
      backgroundColor: COLORS.card,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      ...SHADOWS.medium,
    },
    historyFilterBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginBottom: 12,
    },
    historyFilterText: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium, flex: 1 },
    historyCountBadge: {
      backgroundColor: COLORS.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      marginLeft: 'auto',
    },
    historyCountText: { color: COLORS.primary, fontSize: SIZES.xs, ...FONTS.bold },

    // History Cards
    historyCard: {
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
    },
    historyCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    historyProductName: { color: COLORS.textPrimary, ...FONTS.bold, fontSize: SIZES.md },
    historyMeta: { color: COLORS.textMuted, fontSize: 11, ...FONTS.regular, marginTop: 2 },
    actionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    actionBadgeText: { fontSize: SIZES.xs, ...FONTS.bold },
    historyCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    qtyBox: { alignItems: 'center' },
    qtyLabel: { color: COLORS.textMuted, fontSize: 10, ...FONTS.medium },
    qtyValue: { color: COLORS.textPrimary, fontSize: SIZES.lg, ...FONTS.bold },
    qtyArrow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    qtyChanged: { fontSize: SIZES.md, ...FONTS.bold },

    // Empty & Load More
    emptyState: { alignItems: 'center', paddingVertical: 30, gap: 10 },
    emptyStateText: { color: COLORS.textMuted, fontSize: SIZES.md, ...FONTS.medium },
    loadMoreBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 5,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 12,
    },
    loadMoreText: { color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.md },
  });

export default AdminInventoryScreen;

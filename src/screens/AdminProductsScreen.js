import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const AdminProductsScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProducts();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const unsubscribe = navigation.addListener('focus', fetchProducts);
    return unsubscribe;
  }, [navigation]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.products || []);
    } catch (error) {
      console.log('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedProducts = () => {
    let filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.brand.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortOption) {
      case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'stock-low': filtered.sort((a, b) => a.stockQuantity - b.stockQuantity); break;
      case 'stock-high': filtered.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
    }
    return filtered;
  };

  const dynamicStyles = getStyles(COLORS);

  const ProductItem = ({ item }) => (
    <TouchableOpacity 
      style={dynamicStyles.productCard} 
      onPress={() => navigation.navigate('AdminCreateProduct', { product: item })}
    >
      <View style={dynamicStyles.productInfo}>
        <Text style={dynamicStyles.productName}>{item.name}</Text>
        <Text style={dynamicStyles.productBrand}>{item.brand} • {item.weight || 'N/A'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={dynamicStyles.productPrice}>₹{item.price}</Text>
          {!item.isActive && (
            <View style={dynamicStyles.disabledBadge}>
              <Text style={dynamicStyles.disabledText}>{t('disabled')}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={dynamicStyles.stockContainer}>
        <View style={[dynamicStyles.stockBadge, { backgroundColor: item.stockQuantity > 10 ? COLORS.success + '22' : COLORS.error + '22' }]}>
          <Text style={[dynamicStyles.stockText, { color: item.stockQuantity > 10 ? COLORS.success : COLORS.error }]}>
            {t('stock')}: {item.stockQuantity}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>{t('products_stock')}</Text>
            <TouchableOpacity style={dynamicStyles.addBtn} onPress={() => navigation.navigate('AdminCreateProduct')}>
              <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.searchRow}>
            <View style={dynamicStyles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} style={dynamicStyles.searchIcon} />
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder={t('search_products')}
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={dynamicStyles.sortBtn} onPress={() => setShowSortDrawer(true)}>
              <Ionicons name="options-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={getSortedProducts()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ProductItem item={item} />}
              contentContainerStyle={dynamicStyles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={dynamicStyles.emptyText}>{t('no_products_found')}</Text>}
            />
          )}

          {/* Sort Drawer */}
          <Modal visible={showSortDrawer} transparent animationType="slide">
            <TouchableOpacity style={dynamicStyles.modalOverlay} onPress={() => setShowSortDrawer(false)} />
            <View style={dynamicStyles.sortDrawer}>
              <View style={dynamicStyles.drawerHeader}>
                <Text style={dynamicStyles.drawerTitle}>{t('sort_products')}</Text>
                <TouchableOpacity onPress={() => setShowSortDrawer(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              {[
                { id: 'name-asc', label: t('name_a_z'), icon: 'text-outline' },
                { id: 'name-desc', label: t('name_z_a'), icon: 'text-outline' },
                { id: 'price-low', label: t('price_low_high'), icon: 'trending-up-outline' },
                { id: 'price-high', label: t('price_high_low'), icon: 'trending-down-outline' },
                { id: 'stock-low', label: t('stock_low_high'), icon: 'cube-outline' },
                { id: 'stock-high', label: t('stock_high_low'), icon: 'cube-outline' },
              ].map(opt => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[dynamicStyles.sortOption, sortOption === opt.id && dynamicStyles.activeSortOption]}
                  onPress={() => { setSortOption(opt.id); setShowSortDrawer(false); }}
                >
                  <Ionicons name={opt.icon} size={20} color={sortOption === opt.id ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[dynamicStyles.sortOptionText, sortOption === opt.id && dynamicStyles.activeSortOptionText]}>{opt.label}</Text>
                  {sortOption === opt.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, color: COLORS.textPrimary, ...FONTS.regular },
  sortBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  productCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.small, alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold },
  productBrand: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  productPrice: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold },
  disabledBadge: { backgroundColor: COLORS.error + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 10 },
  disabledText: { color: COLORS.error, fontSize: 10, ...FONTS.bold },
  stockContainer: { alignItems: 'flex-end' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  stockText: { fontSize: 12, ...FONTS.bold },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50, ...FONTS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sortDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, ...SHADOWS.large },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  drawerTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  sortOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, gap: 15, borderRadius: 15 },
  activeSortOption: { backgroundColor: COLORS.primary + '10' },
  sortOptionText: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.medium },
  activeSortOptionText: { color: COLORS.primary, ...FONTS.bold },
});

export default AdminProductsScreen;

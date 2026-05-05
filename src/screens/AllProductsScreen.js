import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/products';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const AllProductsScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(COLORS);
  const { addItem, itemCount } = useCart();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState(Object.values(PRODUCTS));

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsAPI.getAll();
        if (data.products && data.products.length > 0) {
          setAllProducts(data.products);
        }
      } catch (e) {
        // Use fallback static data
      }
    };
    fetchProducts();
  }, []);
  
  const productList = allProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const ProductCard = ({ item }) => {
    const imageUrl = item.image ? item.image.split(',')[0] : 'https://via.placeholder.com/150';
    return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        {item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.brand}>{item.brand}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {item.discount > 0 && (
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (!user) {
              navigation.navigate('Login');
            } else {
              addItem(item);
            }
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, '#FF4500']}
            style={styles.addGradient}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('packaged_foods')}</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={COLORS.textPrimary} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Categories / Search Placeholder */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <Text style={styles.searchText}>{t('search_snacks_placeholder')}</Text>
        </View>

        <FlatList
          data={productList}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 10, ...FONTS.bold },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchText: { color: COLORS.textMuted, fontSize: SIZES.md },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    width: (width - 50) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  imageContainer: { width: '100%', height: 120, backgroundColor: COLORS.surfaceLighter },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { color: COLORS.white, fontSize: 10, ...FONTS.bold },
  cardContent: { padding: 12 },
  brand: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
  name: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  price: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold },
  originalPrice: { fontSize: SIZES.xs, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  addButton: { position: 'absolute', bottom: 12, right: 12 },
  addGradient: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

export default AllProductsScreen;

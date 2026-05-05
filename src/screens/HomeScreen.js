import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { productsAPI, offersAPI } from '../services/api';
import { OFFERS as FALLBACK_OFFERS, RECOMMENDATIONS as FALLBACK_RECOMMENDATIONS, PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { itemCount, cartTotal, addItem } = useCart();
  const { user } = useAuth();
  const { COLORS } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scanBtnScale = useRef(new Animated.Value(1)).current;
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const modalSlide = useRef(new Animated.Value(height)).current;

  // API data state
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [offers, setOffers] = useState(FALLBACK_OFFERS);
  const [recommendations, setRecommendations] = useState(FALLBACK_RECOMMENDATIONS);
  
  // Get welcome message
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  };
  const greeting = getGreeting();

  const dynamicStyles = getStyles(COLORS);

  useEffect(() => {
    // Fetch products and offers from API
    fetchData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse scan button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanBtnScale, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scanBtnScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, offRes] = await Promise.all([
        productsAPI.getAll(),
        offersAPI.getAll(),
      ]);
      if (prodRes.products) {
        const prodMap = {};
        prodRes.products.forEach(p => { prodMap[p.id] = p; });
        setProducts(prodMap);
        const tags = ['Trending', 'Most Popular', 'Classic'];
        const recs = prodRes.products.slice(0, 3).map((p, i) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          originalPrice: p.originalPrice,
          image: p.image,
          tag: tags[i] || 'Pick',
        }));
        setRecommendations(recs);
      }
      if (offRes.offers) {
        setOffers(offRes.offers);
      }
    } catch (error) {
      console.log('Using fallback data:', error.message);
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    Animated.spring(modalSlide, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const closeProductDetails = () => {
    Animated.timing(modalSlide, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowProductModal(false);
      setSelectedProduct(null);
    });
  };

  const QuickAction = ({ icon, label, color, onPress, delay }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    const itemSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemAnim, {
          toValue: 1,
          duration: 500,
          delay: delay || 0,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlide, {
          toValue: 0,
          duration: 500,
          delay: delay || 0,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View style={{ opacity: itemAnim, transform: [{ translateY: itemSlide }] }}>
        <TouchableOpacity
          style={dynamicStyles.quickAction}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={[dynamicStyles.quickActionIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={dynamicStyles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const OfferCard = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AllOffers')}
    >
      <LinearGradient
        colors={[item.color + 'CC', item.color + '88']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={dynamicStyles.offerCard}
      >
        <View style={dynamicStyles.offerBadge}>
          <Ionicons name="pricetag" size={14} color={COLORS.white} />
        </View>
        <Text style={dynamicStyles.offerTitle}>{item.title}</Text>
        <Text style={dynamicStyles.offerSubtitle}>{item.subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const RecommendationCard = ({ item, index }) => {
    const product = products[item.id] || item;
    const imageUrl = item.image ? item.image.split(',')[0] : 'https://via.placeholder.com/150';
    return (
      <TouchableOpacity 
        style={dynamicStyles.recCard} 
        activeOpacity={0.8}
        onPress={() => openProductDetails(product)}
      >
        <Image source={{ uri: imageUrl }} style={dynamicStyles.recImage} />
        <View style={dynamicStyles.recTagContainer}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.primary]}
            style={dynamicStyles.recTag}
          >
            <Text style={dynamicStyles.recTagText}>{item.tag}</Text>
          </LinearGradient>
        </View>
        <Text style={dynamicStyles.recName} numberOfLines={1}>{item.name}</Text>
        <Text style={dynamicStyles.recBrand}>{item.brand}</Text>
        <View style={dynamicStyles.recPriceRow}>
          <Text style={dynamicStyles.recPrice}>₹{item.price}</Text>
          <Text style={dynamicStyles.recOriginalPrice}>₹{item.originalPrice}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <Animated.View style={[dynamicStyles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={dynamicStyles.greeting}>{greeting}{user && user.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
              <Text style={dynamicStyles.headerTitle}>{t('premium_snacks')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={dynamicStyles.historyButton} 
                onPress={() => changeLanguage(language === 'en' ? 'hi' : 'en')}
              >
                <Text style={{ color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.md }}>
                  {language === 'en' ? 'हिं' : 'EN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.historyButton} onPress={() => {
                if (!user) {
                  navigation.navigate('Login');
                } else {
                  navigation.navigate('OrderHistory');
                }
              }}>
                <Ionicons name="time-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              {user ? (
                <TouchableOpacity style={dynamicStyles.historyButton} onPress={() => navigation.navigate('Profile')}>
                  <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={dynamicStyles.historyButton} onPress={() => navigation.navigate('Login')}>
                  <Ionicons name="log-in-outline" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.scrollContent}
          >
            {/* Scan Button Hero */}
            <Animated.View style={[dynamicStyles.scanHero, { opacity: fadeAnim }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Scanner')}>
                <Animated.View style={{ transform: [{ scale: scanBtnScale }] }}>
                  <LinearGradient colors={[COLORS.primary, '#FF4500']} style={dynamicStyles.scanButton}>
                    <View style={dynamicStyles.scanIconRing}>
                      <Ionicons name="scan" size={40} color={COLORS.white} />
                    </View>
                    <Text style={dynamicStyles.scanText}>{t('start_checkout')}</Text>
                    <Text style={dynamicStyles.scanSubText}>{t('snack_craving')}</Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Actions */}
            <View style={dynamicStyles.quickActions}>
              <QuickAction icon="scan-outline" label={t('scan')} color={COLORS.primary} onPress={() => navigation.navigate('Scanner')} delay={100} />
              <QuickAction icon="cart-outline" label={t('cart')} color={COLORS.secondary} onPress={() => navigation.navigate('Cart')} delay={200} />
              <QuickAction icon="gift-outline" label={t('offers')} color={COLORS.accent} onPress={() => navigation.navigate('AllOffers')} delay={300} />
              <QuickAction icon="document-text-outline" label={t('bills')} color={COLORS.success} onPress={() => navigation.navigate('OrderHistory')} delay={400} />
            </View>

            {/* Active Cart Banner */}
            {itemCount > 0 && (
              <TouchableOpacity 
                style={dynamicStyles.activeCart} 
                onPress={() => {
                  if (!user) {
                    navigation.navigate('Login');
                  } else {
                    navigation.navigate('Cart');
                  }
                }} 
                activeOpacity={0.85}
              >
                <LinearGradient colors={[COLORS.surfaceLight, COLORS.surfaceLighter]} style={dynamicStyles.activeCartGradient}>
                  <View style={dynamicStyles.activeCartLeft}>
                    <View style={dynamicStyles.activeCartIconBg}>
                      <Ionicons name="cart" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={dynamicStyles.activeCartTitle}>{t('snacks_in_cart', { count: itemCount })}</Text>
                      <Text style={dynamicStyles.activeCartTotal}>₹{cartTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Offers */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>{t('exclusive_deals')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllOffers')}>
                  <Text style={dynamicStyles.seeAll}>{t('see_all')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={offers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <OfferCard item={item} index={index} />}
                contentContainerStyle={dynamicStyles.offerList}
              />
            </View>

            {/* AI Recommendations */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <View style={dynamicStyles.aiHeader}>
                  <Ionicons name="sparkles" size={18} color={COLORS.accent} />
                  <Text style={dynamicStyles.sectionTitle}>{t('top_picks')}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AllProducts')}>
                  <Text style={dynamicStyles.seeAll}>{t('view_all')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recommendations}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <RecommendationCard item={item} index={index} />}
                contentContainerStyle={dynamicStyles.recList}
              />
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Product Details Modal */}
      <Modal visible={showProductModal} transparent animationType="none">
        <View style={dynamicStyles.modalOverlay}>
          <TouchableOpacity style={dynamicStyles.modalBackdrop} activeOpacity={1} onPress={closeProductDetails} />
          <Animated.View style={[dynamicStyles.productModal, { transform: [{ translateY: modalSlide }] }]}>
            <LinearGradient colors={[COLORS.surfaceLight, COLORS.surface]} style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHandle} />
              {selectedProduct && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={dynamicStyles.modalHeader}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={{ width: width - 40 }}>
                      {(selectedProduct.image ? selectedProduct.image.split(',') : ['https://via.placeholder.com/150']).map((imgUri, idx) => (
                        <Image key={idx} source={{ uri: imgUri }} style={dynamicStyles.modalImage} />
                      ))}
                    </ScrollView>
                    <View style={dynamicStyles.discountBadge}>
                      <Text style={dynamicStyles.discountText}>-{selectedProduct.discount || 0}%</Text>
                    </View>
                  </View>
                  <View style={dynamicStyles.modalInfo}>
                    <Text style={dynamicStyles.modalBrand}>{selectedProduct.brand}</Text>
                    <Text style={dynamicStyles.modalName}>{selectedProduct.name}</Text>
                    <View style={dynamicStyles.modalPriceRow}>
                      <Text style={dynamicStyles.modalPrice}>₹{selectedProduct.price}</Text>
                      <Text style={dynamicStyles.modalOriginalPrice}>₹{selectedProduct.originalPrice}</Text>
                    </View>
                    
                    <View style={dynamicStyles.detailsGrid}>
                      <View style={dynamicStyles.detailItem}>
                        <Ionicons name="leaf-outline" size={18} color={COLORS.secondary} />
                        <View>
                          <Text style={dynamicStyles.detailLabel}>{t('ingredients')}</Text>
                          <Text style={dynamicStyles.detailValue} numberOfLines={2}>{selectedProduct.ingredients || 'Natural ingredients and spices'}</Text>
                        </View>
                      </View>
                      <View style={dynamicStyles.detailItem}>
                        <Ionicons name="cube-outline" size={18} color={COLORS.accent} />
                        <View>
                          <Text style={dynamicStyles.detailLabel}>{t('packaging')}</Text>
                          <Text style={dynamicStyles.detailValue}>{selectedProduct.packaging || 'Pouch'}</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={dynamicStyles.modalAddBtn}
                      onPress={() => {
                        if (!user) {
                          setShowProductModal(false);
                          navigation.navigate('Login');
                        } else {
                          addItem(selectedProduct);
                          setShowProductModal(false);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.primary, '#FF4500']} style={dynamicStyles.addBtnGradient}>
                        <Ionicons name="cart" size={20} color={COLORS.white} />
                        <Text style={dynamicStyles.addBtnText}>{t('add_to_cart')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  headerTitle: { fontSize: SIZES.xxxl, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 2 },
  historyButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  scanHero: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 20 },
  scanButton: { width: width - 40, height: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...SHADOWS.large },
  scanIconRing: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  scanText: { fontSize: SIZES.xl, color: COLORS.white, ...FONTS.bold },
  scanSubText: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', ...FONTS.regular, marginTop: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  quickActionLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
  activeCart: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primaryGlow },
  activeCartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  activeCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeCartIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  activeCartTitle: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold },
  activeCartTotal: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.medium, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.semiBold },
  aiHeader: { flexDirection: 'row', alignItems: 'center' },
  seeAll: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.medium },
  offerList: { paddingHorizontal: 20, gap: 12 },
  offerCard: { width: 160, height: 100, borderRadius: 16, padding: 14, justifyContent: 'flex-end', marginRight: 12 },
  offerBadge: { position: 'absolute', top: 10, right: 10 },
  offerTitle: { fontSize: SIZES.md, color: COLORS.white, ...FONTS.bold },
  offerSubtitle: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.8)', ...FONTS.regular, marginTop: 2 },
  recList: { paddingHorizontal: 20, gap: 12 },
  recCard: { width: 150, backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 12 },
  recImage: { width: '100%', height: 100, backgroundColor: COLORS.surfaceLight },
  recTagContainer: { position: 'absolute', top: 8, left: 8 },
  recTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recTagText: { fontSize: 9, color: COLORS.white, ...FONTS.bold, letterSpacing: 0.5 },
  recName: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold, paddingHorizontal: 10, paddingTop: 10 },
  recBrand: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.regular, paddingHorizontal: 10, paddingTop: 2 },
  recPriceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, gap: 6 },
  recPrice: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold },
  recOriginalPrice: { fontSize: SIZES.xs, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  
  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  productModal: { height: height * 0.7, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  modalContent: { flex: 1 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: 15, marginBottom: 10 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalImage: { width: width - 40, height: 200, borderRadius: 20, backgroundColor: COLORS.surfaceLighter, resizeMode: 'contain' },
  discountBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: COLORS.white, ...FONTS.bold },
  modalInfo: { padding: 20 },
  modalBrand: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.bold, textTransform: 'uppercase', letterSpacing: 1 },
  modalName: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 4, marginBottom: 12 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  modalPrice: { fontSize: 32, color: COLORS.secondary, ...FONTS.bold },
  modalOriginalPrice: { fontSize: SIZES.lg, color: COLORS.textMuted, textDecorationLine: 'line-through', ...FONTS.medium },
  detailsGrid: { gap: 16, marginBottom: 30 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surfaceLight, padding: 16, borderRadius: 16 },
  detailLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: SIZES.sm, color: COLORS.textPrimary, ...FONTS.semiBold, marginTop: 4 },
  modalAddBtn: { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  addBtnText: { color: COLORS.white, fontSize: SIZES.lg, ...FONTS.bold },
});

export default HomeScreen;

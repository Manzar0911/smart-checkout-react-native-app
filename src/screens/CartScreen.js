import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { OFFERS } from '../data/products';
import { offersAPI, authAPI } from '../services/api';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const {
    items,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    applyCoupon,
    removeCoupon,
    coupon,
    cartTotal,
    cartOriginalTotal,
    cartItemsTotal,
    totalSavings,
    couponDiscount,
    customerInfo,
    setCustomerInfo,
  } = useCart();
  
  const { COLORS } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAdminOrEmployee = user?.role === 'admin' || user?.role === 'employee';

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [offers, setOffers] = useState(OFFERS);

  const handleApplyCoupon = async () => {
    const success = await applyCoupon(couponCode);
    if (!success) {
      setCouponError(t('invalid_coupon'));
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 2000);
    } else {
      setCouponCode('');
      setCouponError('');
    }
  };

  const handlePhoneChange = async (text) => {
    const phone = text.replace(/[^0-9]/g, '');
    setCustomerInfo(phone, customerInfo.name);
    
    if (phone.length === 10) {
      try {
        const data = await authAPI.getUserByPhone(phone);
        if (data.user && data.user.name) {
          setCustomerInfo(phone, data.user.name);
        }
      } catch (error) {
        // User not found, just let admin input name manually
      }
    }
  };

  const handleNameChange = (text) => {
    setCustomerInfo(customerInfo.phone, text);
  };

  const handleDecrement = (item) => {
    if (item.quantity === 1) {
      removeItem(item.id);
    } else {
      decrementQuantity(item.id);
    }
  };

  const showRemoveConfirm = (id) => {
    removeItem(id);
  };

  const dynamicStyles = getStyles(COLORS);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity 
            style={dynamicStyles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={dynamicStyles.headerCenter}>
            <Text style={dynamicStyles.headerTitle}>{t('my_cart')}</Text>
            <Text style={dynamicStyles.headerSubtitle}>{items.length} {t('snacks')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {items.length === 0 ? (
          /* Empty Cart */
          <View style={dynamicStyles.emptyCart}>
            <View style={dynamicStyles.emptyIconContainer}>
              <Ionicons name="cart-outline" size={60} color={COLORS.primary} />
            </View>
            <Text style={dynamicStyles.emptyTitle}>{t('cart_empty')}</Text>
            <Text style={dynamicStyles.emptySubtitle}>
              {t('cart_empty_subtitle')}
            </Text>
            <TouchableOpacity 
              style={dynamicStyles.scanNowBtn}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, '#FF4500']}
                style={dynamicStyles.scanNowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="scan" size={24} color={COLORS.white} />
                <Text style={dynamicStyles.scanNowText}>{t('scan_snack')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView 
              contentContainerStyle={dynamicStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Items List */}
              <View>
                {items.map((item) => (
                  <View key={item.id} style={dynamicStyles.cartItem}>
                    <Image source={{ uri: item.image ? item.image.split(',')[0] : 'https://via.placeholder.com/150' }} style={dynamicStyles.itemImage} />
                    <View style={dynamicStyles.itemDetails}>
                      <View style={dynamicStyles.itemTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={dynamicStyles.itemBrand}>{item.brand}</Text>
                          <Text style={dynamicStyles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={dynamicStyles.removeBtn}
                          onPress={() => showRemoveConfirm(item.id)}
                        >
                          <Ionicons name="close" size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={dynamicStyles.itemBottomRow}>
                        <View style={dynamicStyles.priceContainer}>
                          <Text style={dynamicStyles.itemPrice}>₹{item.price}</Text>
                          {item.originalPrice > item.price && (
                            <Text style={dynamicStyles.itemOriginalPrice}>
                              ₹{item.originalPrice}
                            </Text>
                          )}
                        </View>
                        
                        <View style={dynamicStyles.quantityControl}>
                          <TouchableOpacity 
                            style={dynamicStyles.qtyBtn}
                            onPress={() => handleDecrement(item)}
                          >
                            <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
                          </TouchableOpacity>
                          <Text style={dynamicStyles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity 
                            style={[dynamicStyles.qtyBtn, dynamicStyles.qtyBtnPlus]}
                            onPress={() => incrementQuantity(item.id)}
                          >
                            <Ionicons name="add" size={16} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Coupon Section */}
              <View style={dynamicStyles.couponSection}>
                <Text style={dynamicStyles.couponSectionTitle}>{t('promo_code')}</Text>
                
                {coupon ? (
                  <View style={dynamicStyles.appliedCoupon}>
                    <View style={dynamicStyles.couponInfo}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <View>
                        <Text style={dynamicStyles.appliedCode}>{coupon.code}</Text>
                        <Text style={dynamicStyles.appliedValue}>
                          {coupon.type === 'percent' 
                            ? `${coupon.value}% OFF` 
                            : `₹${coupon.value} OFF`} applied
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={removeCoupon}>
                      <Text style={dynamicStyles.removeCouponText}>{t('remove')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={dynamicStyles.couponInputRow}>
                      <TextInput
                        style={[
                          dynamicStyles.couponInput,
                          couponError ? dynamicStyles.couponInputError : null,
                        ]}
                        placeholder={t('enter_code')}
                        placeholderTextColor={COLORS.textMuted}
                        value={couponCode}
                        onChangeText={(text) => {
                          setCouponCode(text.toUpperCase());
                          setCouponError('');
                        }}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity 
                        style={dynamicStyles.applyBtn}
                        onPress={handleApplyCoupon}
                        disabled={!couponCode.trim()}
                      >
                        <Text style={dynamicStyles.applyBtnText}>{t('apply')}</Text>
                      </TouchableOpacity>
                    </View>
                    {couponError ? (
                      <Text style={dynamicStyles.errorText}>{couponError}</Text>
                    ) : null}

                    {/* Quick Offers List */}
                    <View style={dynamicStyles.quickOffersHeader}>
                      <Text style={dynamicStyles.quickOffersTitle}>{t('available_offers')}</Text>
                      <TouchableOpacity onPress={() => navigation.navigate('AllOffers')}>
                        <Text style={dynamicStyles.viewAllOffers}>{t('view_all')}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.quickOffersList}>
                      {OFFERS.map(offer => (
                        <TouchableOpacity 
                          key={offer.id} 
                          style={dynamicStyles.quickOfferChip}
                          onPress={() => applyCoupon(offer.code)}
                        >
                          <Text style={[dynamicStyles.quickOfferCode, { color: offer.color }]}>
                            {offer.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>

              {/* Savings Banner */}
              {totalSavings > 0 && (
                <Animated.View style={[dynamicStyles.savingsBanner, { opacity: fadeAnim }]}>
                  <LinearGradient
                    colors={[COLORS.secondarySoft, 'rgba(0, 212, 170, 0.05)']}
                    style={dynamicStyles.savingsGradient}
                  >
                    <View style={dynamicStyles.savingsLeft}>
                      <Ionicons name="sparkles" size={20} color={COLORS.secondary} />
                      <View>
                        <Text style={dynamicStyles.savingsTitle}>{t('total_savings')}</Text>
                        <Text style={dynamicStyles.savingsAmount}>₹{totalSavings.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Ionicons name="happy-outline" size={24} color={COLORS.secondary} />
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Add more items */}
              <TouchableOpacity
                style={dynamicStyles.addMoreBtn}
                onPress={() => navigation.navigate('Scanner')}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={dynamicStyles.addMoreText}>{t('add_more_snacks')}</Text>
              </TouchableOpacity>

            </ScrollView>

            {/* Bottom Checkout */}
            <View style={dynamicStyles.checkoutContainer}>
              <LinearGradient
                colors={[COLORS.surface + '00', COLORS.surface, COLORS.surface]}
                style={dynamicStyles.checkoutGradient}
              >
                <View style={dynamicStyles.checkoutInfo}>
                  <View style={dynamicStyles.checkoutRow}>
                    <Text style={dynamicStyles.checkoutLabel}>{t('original_price')}</Text>
                    <Text style={dynamicStyles.checkoutValue}>₹{cartOriginalTotal.toFixed(2)}</Text>
                  </View>
                  <View style={dynamicStyles.checkoutRow}>
                    <Text style={dynamicStyles.checkoutLabel}>{t('snack_savings')}</Text>
                    <Text style={[dynamicStyles.checkoutValue, { color: COLORS.secondary }]}>
                      -₹{(cartOriginalTotal - cartItemsTotal).toFixed(2)}
                    </Text>
                  </View>
                  {coupon && (
                    <View style={dynamicStyles.checkoutRow}>
                      <Text style={dynamicStyles.checkoutLabel}>{t('coupon_savings')}</Text>
                      <Text style={[dynamicStyles.checkoutValue, { color: COLORS.secondary }]}>
                        -₹{couponDiscount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={dynamicStyles.checkoutDivider} />
                  <View style={dynamicStyles.checkoutRow}>
                    <Text style={dynamicStyles.totalLabel}>{t('grand_total')}</Text>
                    <Text style={dynamicStyles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={dynamicStyles.checkoutBtn}
                  onPress={() => {
                    if (isAdminOrEmployee) {
                      setShowCustomerModal(true);
                    } else {
                      navigation.navigate('Payment');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#FF4500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={dynamicStyles.checkoutBtnGradient}
                  >
                    <Text style={dynamicStyles.checkoutBtnText}>{t('proceed_to_pay')}</Text>
                    <View style={dynamicStyles.checkoutBtnArrow}>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </>
        )}
      </LinearGradient>

      {/* Customer Info Modal for Admin/Employee */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="fade"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={dynamicStyles.modalContainer}
        >
          <View style={dynamicStyles.modalOverlay}>
            <View style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHeader}>
                <Ionicons name="person-circle-outline" size={30} color={COLORS.primary} />
                <Text style={dynamicStyles.modalTitle}>{t('customer_details')}</Text>
              </View>
              <Text style={dynamicStyles.modalSubtitle}>{t('customer_details_subtitle')}</Text>
              
              <TextInput
                style={dynamicStyles.customerInput}
                placeholder={t('customer_phone')}
                placeholderTextColor={COLORS.textMuted}
                value={customerInfo?.phone || ''}
                onChangeText={handlePhoneChange}
                keyboardType="numeric"
                maxLength={10}
              />
              <TextInput
                style={dynamicStyles.customerInput}
                placeholder={t('customer_name')}
                placeholderTextColor={COLORS.textMuted}
                value={customerInfo?.name || ''}
                onChangeText={handleNameChange}
              />
              
              <View style={dynamicStyles.modalActions}>
                <TouchableOpacity 
                  style={dynamicStyles.modalCancelBtn}
                  onPress={() => setShowCustomerModal(false)}
                >
                  <Text style={dynamicStyles.modalCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    dynamicStyles.modalProceedBtn,
                    (!customerInfo?.phone || customerInfo.phone.length < 10) && { opacity: 0.5 }
                  ]}
                  disabled={!customerInfo?.phone || customerInfo.phone.length < 10}
                  onPress={() => {
                    setShowCustomerModal(false);
                    navigation.navigate('Payment');
                  }}
                >
                  <Text style={dynamicStyles.modalProceedText}>{t('proceed')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  headerSubtitle: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.errorGlow },
  clearBtnText: { fontSize: SIZES.sm, color: COLORS.error, ...FONTS.semiBold },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: COLORS.surfaceLighter },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemBrand: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemName: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold, marginTop: 2 },
  removeBtn: { width: 24, height: 24, borderRadius: 8, backgroundColor: COLORS.surfaceLighter, alignItems: 'center', justifyContent: 'center' },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPrice: { fontSize: SIZES.lg, color: COLORS.primary, ...FONTS.bold },
  itemOriginalPrice: { fontSize: SIZES.sm, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 10, borderWidth: 1, borderColor: COLORS.cardBorder },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyBtnPlus: { backgroundColor: COLORS.primary, borderRadius: 9 },
  qtyText: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold, paddingHorizontal: 10 },
  itemSubtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  itemSubtotalLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.regular },
  itemSubtotal: { fontSize: SIZES.sm, color: COLORS.textPrimary, ...FONTS.semiBold },
  
  // Coupon
  couponSection: { backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  couponSectionTitle: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold, marginBottom: 12 },
  couponInputRow: { flexDirection: 'row', gap: 10 },
  couponInput: { flex: 1, height: 44, backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.cardBorder },
  couponInputError: { borderColor: COLORS.error },
  applyBtn: { paddingHorizontal: 20, height: 44, borderRadius: 8, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: COLORS.primary, ...FONTS.bold },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 6 },
  appliedCoupon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.success + '15', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.success + '33' },
  couponInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appliedCode: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold },
  appliedValue: { fontSize: 12, color: COLORS.success, ...FONTS.medium },
  removeCouponText: { fontSize: 12, color: COLORS.error, ...FONTS.semiBold },
  quickOffersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  quickOffersTitle: { fontSize: 12, color: COLORS.textSecondary, ...FONTS.medium },
  viewAllOffers: { fontSize: 12, color: COLORS.primary, ...FONTS.semiBold },
  quickOffersList: { flexDirection: 'row' },
  quickOfferChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  quickOfferCode: { fontSize: 12, ...FONTS.bold },

  savingsBanner: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0, 212, 170, 0.2)' },
  savingsGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  savingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savingsTitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular },
  savingsAmount: { fontSize: SIZES.xl, color: COLORS.secondary, ...FONTS.bold },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed' },
  addMoreText: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.medium },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.cardBorder },
  emptyTitle: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  emptySubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular, textAlign: 'center', marginBottom: 30 },
  scanNowBtn: { borderRadius: 16, overflow: 'hidden' },
  scanNowGradient: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 30, paddingVertical: 14 },
  scanNowText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
  checkoutContainer: { paddingBottom: 16 },
  checkoutGradient: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  checkoutInfo: { marginBottom: 16 },
  checkoutRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  checkoutLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  checkoutValue: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
  checkoutDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 8 },
  totalLabel: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  totalValue: { fontSize: SIZES.xxl, color: COLORS.primary, ...FONTS.bold },
  checkoutBtn: { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  checkoutBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  checkoutBtnText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
  checkoutBtnArrow: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  customerInfoSection: { marginBottom: 12, paddingHorizontal: 4 },
  customerInfoTitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 8 },
  customerInput: { height: 50, backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 12, ...FONTS.medium },

  // Modal Styles
  modalContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.large },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  modalSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.semiBold },
  modalProceedBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  modalProceedText: { fontSize: SIZES.md, color: COLORS.white, ...FONTS.bold },
});

export default CartScreen;

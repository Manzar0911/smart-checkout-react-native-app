import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, paymentAPI } from '../services/api';
import RazorpayCheckout from 'react-native-razorpay';

const { width, height } = Dimensions.get('window');

const PAYMENT_METHODS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    icon: 'logo-google',
    color: '#4285F4',
    upiId: 'user@okicici',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: 'phone-portrait-outline',
    color: '#5F259F',
    upiId: 'user@ybl',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: 'wallet-outline',
    color: '#00BAF2',
    upiId: 'user@paytm',
  },
];

const PaymentScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(COLORS);
  const {
    items,
    cartTotal,
    cartOriginalTotal,
    cartItemsTotal,
    totalSavings,
    couponDiscount,
    coupon,
    itemCount,
    setPaymentStatus,
    setReceipt,
    clearCart,
    customerInfo,
  } = useCart();
  const { user } = useAuth();
  const isAdminOrEmployee = user?.role === 'admin' || user?.role === 'employee';

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentState, setPaymentState] = useState('idle'); // idle | upi_input | processing | success | failed
  const [upiId, setUpiId] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.5)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const startProcessing = async () => {
    if (!selectedMethod || items.length === 0) return;

    if (selectedMethod.id === 'cash') {
      // Simulate cash payment
      setPaymentState('processing');
      setPaymentStatus('processing');

      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        spin.stop();
        handlePaymentSuccess('CASH_TXN_' + Math.random().toString(36).substring(2, 8).toUpperCase());
      }, 2800);
      return;
    }

    if (selectedMethod.id !== 'razorpay') {
      // Custom UPI Flow or Cash Flow
      if (selectedMethod.id !== 'cash' && paymentState === 'idle') {
        // Show UPI ID input interface first
        setPaymentState('upi_input');
        return;
      }

      // Proceed with simulated payment (Simulated UPI)
      setPaymentState('processing');
      setPaymentStatus('processing');

      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        spin.stop();
        const txPrefix = selectedMethod.id === 'cash' ? 'CASH_TXN_' : 'UPI_TXN_';
        handlePaymentSuccess(txPrefix + Math.random().toString(36).substring(2, 8).toUpperCase());
      }, 2800);
      return;
    }

    // Razorpay flow (if a method explicitly triggers Razorpay)
    setPaymentState('processing');
    setPaymentStatus('processing');
    
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();

    try {
      const orderRes = await paymentAPI.createOrder(cartTotal, 'INR', 'RCPT_' + Date.now());
      if (orderRes.success) {
        const options = {
          description: 'Jain Namkeen Payment',
          currency: 'INR',
          key: orderRes.key,
          amount: orderRes.order.amount,
          name: 'Jain Namkeen',
          order_id: orderRes.order.id,
          prefill: {
            email: user?.email || '',
            contact: user?.phone || '',
            name: user?.name || ''
          },
          theme: { color: COLORS.primary }
        };

        spin.stop();
        
        RazorpayCheckout.open(options).then((data) => {
          handlePaymentSuccess(data.razorpay_payment_id);
        }).catch((error) => {
          setPaymentState('idle');
          setPaymentStatus(null);
          // In case user cancels, error code is 0
          if(error.code !== 0) {
             alert(`Payment failed: ${error.description || 'Cancelled'}`);
          }
        });
      }
    } catch (error) {
      spin.stop();
      setPaymentState('idle');
      setPaymentStatus(null);
      alert('Failed to initiate payment gateway. Please try again.');
    }
  };

  const handlePaymentSuccess = async (txId) => {
    // Generate or use transaction ID
    const transactionId = txId || ('TXN' + Math.random().toString(36).substring(2, 12).toUpperCase());

    try {
      // Create order via API
      const response = await ordersAPI.create({
        items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
        subtotal: cartOriginalTotal,
        discount: (cartOriginalTotal - cartItemsTotal) + couponDiscount,
        couponCode: coupon ? coupon.code : null,
        total: cartTotal,
        paymentMethod: selectedMethod?.name || 'UPI',
        transactionId,
        customerPhone: customerInfo?.phone,
        customerName: customerInfo?.name,
      });

      const newReceipt = response.order || {
        id: 'RCP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        items: [...items],
        subtotal: cartOriginalTotal,
        snackSavings: cartOriginalTotal - cartItemsTotal,
        couponDiscount: couponDiscount,
        coupon: coupon ? coupon.code : null,
        total: cartTotal,
        itemCount: itemCount,
        paymentMethod: selectedMethod,
        transactionId,
      };

      setReceipt(newReceipt);
      clearCart();
    } catch (error) {
      // Fallback - still create receipt locally if API fails
      const newReceipt = {
        id: 'RCP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        items: [...items],
        subtotal: cartOriginalTotal,
        snackSavings: cartOriginalTotal - cartItemsTotal,
        couponDiscount: couponDiscount,
        coupon: coupon ? coupon.code : null,
        total: cartTotal,
        itemCount: itemCount,
        paymentMethod: selectedMethod,
        transactionId,
      };
      setReceipt(newReceipt);
      clearCart();
    }

    setPaymentState('success');
    setPaymentStatus('success');

    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 4,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (paymentState === 'upi_input') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setPaymentState('idle')}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('enter_upi_details')}</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <View style={styles.upiInputContainer}>
            <View style={styles.upiAppHeader}>
              <View style={[styles.methodIcon, { backgroundColor: selectedMethod?.color + '20', width: 60, height: 60, borderRadius: 20 }]}>
                <Ionicons name={selectedMethod?.icon} size={30} color={selectedMethod?.color} />
              </View>
              <Text style={styles.upiAppName}>{t('pay_via')} {selectedMethod?.name}</Text>
              <Text style={styles.upiAppAmount}>₹{cartTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t('upi_id')}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="at-circle-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. mobile@upi"
                  placeholderTextColor={COLORS.textMuted}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.inputHint}>{t('upi_hint')}</Text>
            </View>

            <View style={styles.payContainerStatic}>
              <TouchableOpacity
                style={[styles.payBtn, !upiId.includes('@') && styles.payBtnDisabled]}
                onPress={() => startProcessing()}
                disabled={!upiId.includes('@')}
              >
                <LinearGradient
                  colors={upiId.includes('@') ? [COLORS.primary, '#FF4500'] : [COLORS.textMuted, COLORS.textDark]}
                  style={styles.payBtnGradient}
                >
                  <Text style={styles.payBtnText}>{t('verify_pay_securely')}</Text>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (paymentState === 'processing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.centerGradient}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={styles.spinner}>
              <View style={styles.spinnerArc} />
              <Ionicons name="card" size={30} color={COLORS.primary} />
            </View>
          </Animated.View>
          <Text style={styles.processingTitle}>{t('paying')} ₹{cartTotal.toFixed(2)}</Text>
          <Text style={styles.processingSubtitle}>{t('contacting')} {selectedMethod?.name}...</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.securityText}>{t('secure_transaction')}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (paymentState === 'success') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.centerGradient}>
          <Animated.View style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />
          <Animated.View style={[styles.successContainer, { transform: [{ scale: successScale }] }]}>
            <LinearGradient colors={[COLORS.success, '#059669']} style={styles.successCircle}>
              <Ionicons name="checkmark" size={60} color={COLORS.white} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.successTitle}>{t('payment_received')}</Text>
          <Text style={styles.successAmount}>₹{cartTotal.toFixed(2)}</Text>
          <Text style={styles.successSubtitle}>{t('transaction_successful_via')} {selectedMethod?.name}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.receiptBtn} onPress={() => navigation.navigate('Receipt')} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.primary, '#FF4500']} style={styles.receiptBtnGradient}>
                <Ionicons name="receipt-outline" size={20} color={COLORS.white} />
                <Text style={styles.receiptBtnText}>{t('view_receipt')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('UserExitPass')}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.exitBtnText}>{t('get_exit_pass')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkout')}</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Order Summary */}
          <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
              <Text style={styles.summaryTitle}>{t('bill_summary')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('total_items_label')} ({itemCount})</Text>
              <Text style={styles.summaryValue}>₹{cartOriginalTotal.toFixed(2)}</Text>
            </View>
            {totalSavings > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('total_savings')}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>-₹{totalSavings.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t('amount_to_pay')}</Text>
              <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
          </Animated.View>

          {/* Payment Methods */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>{t('select_payment_method')}</Text>
            <Text style={styles.sectionSubtitle}>{t('seamless_payment')}</Text>
            {(isAdminOrEmployee ? [
              {
                id: 'cash',
                name: 'Cash',
                icon: 'cash-outline',
                color: '#10B981',
                upiId: 'Cash Payment',
              },
              ...PAYMENT_METHODS
            ] : PAYMENT_METHODS).map((method) => {
              const isSelected = selectedMethod?.id === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodCard, isSelected && { borderColor: method.color + '88', backgroundColor: method.color + '10' }]}
                  onPress={() => setSelectedMethod(method)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon} size={22} color={method.color} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodUpi}>{method.upiId}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && { borderColor: method.color }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: method.color }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.payContainer}>
          <TouchableOpacity
            style={[styles.payBtn, (!selectedMethod || items.length === 0) && styles.payBtnDisabled]}
            onPress={startProcessing}
            disabled={!selectedMethod || items.length === 0}
          >
            <LinearGradient
              colors={selectedMethod && items.length > 0 ? [COLORS.primary, '#FF4500'] : [COLORS.textMuted, COLORS.textDark]}
              style={styles.payBtnGradient}
            >
              <Text style={styles.payBtnText}>{t('pay_securely')} ₹{cartTotal.toFixed(2)}</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  centerGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  scrollContent: { paddingHorizontal: 20 },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: COLORS.cardBorder },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  summaryTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.semiBold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  summaryValue: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
  summaryDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10, borderStyle: 'dashed', borderRadius: 1 },
  totalLabel: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  totalValue: { fontSize: SIZES.xxl, color: COLORS.primary, ...FONTS.bold },
  sectionTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.semiBold, marginBottom: 4 },
  sectionSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 16 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.cardBorder },
  methodIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodInfo: { flex: 1, marginLeft: 14 },
  methodName: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold },
  methodUpi: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  payContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  payBtn: { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  payBtnDisabled: { opacity: 0.5 },
  payBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12 },
  payBtnText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
  spinner: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  spinnerArc: { position: 'absolute', top: -3, left: -3, width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'transparent', borderTopColor: COLORS.primary },
  processingTitle: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  processingSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 30 },
  progressBarContainer: { width: width * 0.6, height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden', marginBottom: 30 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securityText: { fontSize: 12, color: COLORS.textSecondary },
  ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.successGlow },
  successContainer: { marginBottom: 30 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(COLORS.success) },
  successTitle: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  successAmount: { fontSize: SIZES.hero, color: COLORS.success, ...FONTS.bold, marginBottom: 8 },
  successSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 40, textAlign: 'center', paddingHorizontal: 40 },
  successActions: { gap: 12, width: width * 0.7 },
  receiptBtn: { borderRadius: 16, overflow: 'hidden' },
  receiptBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  receiptBtnText: { fontSize: SIZES.md, color: COLORS.white, ...FONTS.bold },
  exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.secondaryGlow, backgroundColor: COLORS.secondarySoft },
  exitBtnText: { fontSize: SIZES.md, color: COLORS.secondary, ...FONTS.semiBold },
  upiInputContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  upiAppHeader: { alignItems: 'center', marginBottom: 40 },
  upiAppName: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.semiBold, marginTop: 16, marginBottom: 8 },
  upiAppAmount: { fontSize: SIZES.hero, color: COLORS.primary, ...FONTS.bold },
  inputWrapper: { marginBottom: 30 },
  inputLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  textInput: { flex: 1, fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.medium },
  inputHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, marginLeft: 4 },
  payContainerStatic: { marginTop: 'auto', paddingBottom: 40 },
});

export default PaymentScreen;

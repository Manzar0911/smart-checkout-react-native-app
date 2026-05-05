import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';

const POLL_INTERVAL_MS = 3000;

const { width } = Dimensions.get('window');

const ReceiptScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(COLORS);
  const { receipt, items, cartTotal, cartOriginalTotal, totalSavings, setVerified } = useCart();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const stampScale = useRef(new Animated.Value(0)).current;
  const [isBillVerified, setIsBillVerified] = useState(false);

  const pollingRef = useRef(null);
  const isMounted = useRef(true);

  const handleVerified = useCallback(() => {
    if (!isMounted.current) return;
    setIsBillVerified(true);
    setVerified(true);
    if (pollingRef.current) clearTimeout(pollingRef.current);
  }, [setVerified]);

  // Poll backend for verification status
  useEffect(() => {
    const orderId = receipt?.id;
    if (!orderId) return;

    const poll = async () => {
      if (!isMounted.current) return;
      try {
        const data = await ordersAPI.getById(orderId);
        const order = data?.order || data;
        if (order && (order.isVerified === true || order.verified === true || order.status === 'verified')) {
          handleVerified();
          return;
        }
      } catch (e) { /* ignore */ }
      if (isMounted.current) {
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      isMounted.current = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [receipt?.id, handleVerified]);

  useEffect(() => {
    Animated.sequence([
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
      ]),
      Animated.spring(stampScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      const receiptText = `
🧾 Smart Checkout Receipt
━━━━━━━━━━━━━━━━━
Receipt: ${receipt?.id || 'N/A'}
Date: ${receipt?.date || 'N/A'} | ${receipt?.time || 'N/A'}
━━━━━━━━━━━━━━━━━
${items.map((item) => `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}
━━━━━━━━━━━━━━━━━
Total: ₹${cartTotal.toFixed(2)}
Savings: ₹${totalSavings.toFixed(2)}
━━━━━━━━━━━━━━━━━
Paid via: ${receipt?.paymentMethod?.name || 'UPI'}
Transaction: ${receipt?.transactionId || 'N/A'}
      `.trim();

      await Share.share({ message: receiptText });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, '#0D1425']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('digital_receipt')}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.receiptCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Store Info */}
            <View style={styles.storeHeader}>
              <LinearGradient
                colors={[COLORS.primary, '#FF4500']}
                style={styles.storeLogo}
              >
                <Ionicons name="cart" size={24} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.storeName}>Smart Checkout</Text>
              <Text style={styles.storeAddress}>Retail Digital Receipt</Text>
            </View>

            {/* Paid Stamp */}
            <Animated.View
              style={[
                styles.paidStamp,
                { transform: [{ scale: stampScale }] },
              ]}
            >
              <Text style={styles.paidStampText}>PAID</Text>
            </Animated.View>

            {/* Receipt Meta */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('receipt_no')}</Text>
                <Text style={styles.metaValue}>{receipt?.id || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('date')}</Text>
                <Text style={styles.metaValue}>{receipt?.date || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('active_status')}</Text>
                <Text style={[styles.metaValue, { color: isBillVerified ? COLORS.success : COLORS.primary }]}>
                  {isBillVerified ? 'Verified ✓' : 'Paid'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('time')}</Text>
                <Text style={styles.metaValue}>{receipt?.time || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('payment')}</Text>
                <Text style={styles.metaValue}>
                  {receipt?.paymentMethod?.name || 'UPI'}
                </Text>
              </View>
            </View>

            {/* Dotted divider */}
            <View style={styles.dottedDivider}>
              {[...Array(30)].map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>

            {/* Items */}
            <View style={styles.itemsSection}>
              <View style={styles.itemsHeader}>
                <Text style={[styles.itemHeaderText, { flex: 2 }]}>{t('item')}</Text>
                <Text style={[styles.itemHeaderText, { flex: 0.5, textAlign: 'center' }]}>{t('qty')}</Text>
                <Text style={[styles.itemHeaderText, { flex: 1, textAlign: 'right' }]}>{t('amount')}</Text>
              </View>

              {items.map((item, index) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemRate}>@ ₹{item.price}</Text>
                  </View>
                  <Text style={[styles.itemQty, { flex: 0.5, textAlign: 'center' }]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.itemAmount, { flex: 1, textAlign: 'right' }]}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Dotted divider */}
            <View style={styles.dottedDivider}>
              {[...Array(30)].map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('subtotal')}</Text>
                <Text style={styles.totalValue}>₹{cartOriginalTotal.toFixed(2)}</Text>
              </View>
              {totalSavings > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('discount')}</Text>
                  <Text style={[styles.totalValue, { color: COLORS.secondary }]}>
                    -₹{totalSavings.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('service_fee')}</Text>
                <Text style={[styles.totalValue, { color: COLORS.secondary }]}>{t('free')}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>{t('total_paid')}</Text>
                <Text style={styles.grandTotalValue}>₹{cartTotal.toFixed(2)}</Text>
              </View>
            </View>

            {totalSavings > 0 && (
              <View style={styles.savingsBanner}>
                <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
                <Text style={styles.savingsText}>
                  {t('you_saved')} ₹{totalSavings.toFixed(2)} {t('on_this_order')}
                </Text>
              </View>
            )}

            {/* Transaction Info */}
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionLabel}>{t('transaction_id')}</Text>
              <Text style={styles.transactionValue}>
                {receipt?.transactionId || 'N/A'}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.footerText}>{t('thank_you_shopping')}</Text>
              <Text style={styles.footerSubtext}>
                Smart Checkout • {t('powered_by_ai')}
              </Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isBillVerified ? (
              /* Bill has been verified — show success banner + Go Home */
              <>
                <View style={styles.verifiedBanner}>
                  <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
                  <Text style={styles.verifiedBannerText}>{t('bill_verified_guard')} ✓</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Home')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.success, '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Ionicons name="home" size={20} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>{t('go_to_home')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              /* Not yet verified — show Exit Pass + Download */
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('UserExitPass')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#FF4500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Ionicons name="qr-code-outline" size={20} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>{t('get_exit_pass_qr')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={handleShare}
                >
                  <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.downloadBtnText}>{t('share_bill')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: SIZES.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  receiptCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusMd,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  storeName: {
    fontSize: SIZES.xxl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  storeAddress: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: 2,
  },
  paidStamp: {
    position: 'absolute',
    top: 20,
    right: 15,
    transform: [{ rotate: '15deg' }],
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  paidStampText: {
    fontSize: SIZES.lg,
    color: COLORS.success,
    ...FONTS.bold,
    letterSpacing: 3,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    width: '46%',
  },
  metaLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    ...FONTS.medium,
    marginTop: 2,
  },
  dottedDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  dot: {
    width: 4,
    height: 1,
    backgroundColor: COLORS.textMuted,
  },
  itemsSection: {
    marginBottom: 0,
  },
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  itemHeaderText: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    ...FONTS.medium,
  },
  itemRate: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: 1,
  },
  itemQty: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  itemAmount: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
  },
  totalsSection: {
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  totalValue: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    ...FONTS.medium,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  grandTotalLabel: {
    fontSize: SIZES.lg,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  grandTotalValue: {
    fontSize: SIZES.xxl,
    color: COLORS.primary,
    ...FONTS.bold,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 10,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.secondarySoft,
  },
  savingsText: {
    fontSize: SIZES.sm,
    color: COLORS.secondary,
    ...FONTS.medium,
  },
  transactionInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionValue: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  footerSubtext: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.regular,
    marginTop: 4,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  actionBtnText: {
    fontSize: SIZES.lg,
    color: COLORS.white,
    ...FONTS.bold,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
    backgroundColor: COLORS.primarySoft,
  },
  downloadBtnText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    ...FONTS.semiBold,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success + '60',
    marginBottom: 4,
  },
  verifiedBannerText: {
    fontSize: SIZES.md,
    color: COLORS.success,
    ...FONTS.bold,
  },
});

export default ReceiptScreen;

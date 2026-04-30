import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';

const { width } = Dimensions.get('window');

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

const UserExitPassScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const { receipt, setVerified } = useCart();

  const [isVerified, setIsVerifiedLocal] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const pollingRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    startPulse();
    startPolling();

    return () => {
      isMounted.current = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleVerified = useCallback(() => {
    if (!isMounted.current) return;
    setIsPolling(false);
    setIsVerifiedLocal(true);
    setVerified(true);
    if (pollingRef.current) clearTimeout(pollingRef.current);

    Animated.spring(successScale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [setVerified]);

  const startPolling = useCallback(() => {
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
      } catch (e) {
        // Network error - keep polling
      }
      if (isMounted.current) {
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, [receipt, handleVerified]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exit Pass</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {!isVerified ? (
            <>
              {/* Waiting state - show QR */}
              <View style={styles.instructionCard}>
                <Ionicons name="shield-outline" size={22} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Show this QR code to the security guard at the exit
                </Text>
              </View>

              <Animated.View style={[styles.qrWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={[COLORS.card, COLORS.surfaceLight]}
                  style={styles.qrCard}
                >
                  <View style={styles.qrInner}>
                    <QRCode
                      value={receipt?.id || 'NO-RECEIPT'}
                      size={200}
                      color="#000000"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.orderIdText}>{receipt?.id}</Text>
                </LinearGradient>
              </Animated.View>

              <View style={styles.pollingRow}>
                {isPolling ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.pollingText}>
                      Waiting for guard verification...
                    </Text>
                  </>
                ) : null}
              </View>

              <View style={styles.infoCards}>
                <View style={styles.infoItem}>
                  <Ionicons name="receipt-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabel}>Amount Paid</Text>
                  <Text style={styles.infoValue}>₹{receipt?.total?.toFixed(2) || '—'}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Ionicons name="cube-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabel}>Items</Text>
                  <Text style={styles.infoValue}>{receipt?.itemCount || '—'}</Text>
                </View>
              </View>
            </>
          ) : (
            /* Verified state */
            <View style={styles.verifiedContainer}>
              <Animated.View style={[styles.verifiedCircleWrap, { transform: [{ scale: successScale }] }]}>
                <LinearGradient colors={[COLORS.success, '#059669']} style={styles.verifiedCircle}>
                  <Ionicons name="shield-checkmark" size={64} color={COLORS.white} />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.verifiedTitle}>Bill Verified! ✓</Text>
              <Text style={styles.verifiedSubtitle}>
                Your exit has been approved by the security guard.
              </Text>

              <View style={styles.verifiedCard}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.vLabel}>Order ID</Text>
                  <Text style={styles.vValue}>{receipt?.id}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.verifiedRow}>
                  <Text style={styles.vLabel}>Amount Paid</Text>
                  <Text style={[styles.vValue, { color: COLORS.success }]}>
                    ₹{receipt?.total?.toFixed(2) || '—'}
                  </Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.verifiedRow}>
                  <Text style={styles.vLabel}>Status</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.success, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.homeBtnGradient}
                >
                  <Ionicons name="home" size={20} color={COLORS.white} />
                  <Text style={styles.homeBtnText}>Go to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
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
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },

  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
    width: '100%',
  },
  instructionText: {
    flex: 1,
    fontSize: SIZES.sm,
    color: COLORS.primary,
    ...FONTS.medium,
  },

  qrWrapper: {
    marginBottom: 20,
    ...SHADOWS.large,
  },
  qrCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  qrInner: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    letterSpacing: 0.5,
  },

  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    minHeight: 24,
  },
  pollingText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },

  infoCards: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoDivider: { width: 1, backgroundColor: COLORS.cardBorder, marginHorizontal: 8 },
  infoLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.regular, marginTop: 4 },
  infoValue: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },

  // Verified state
  verifiedContainer: { alignItems: 'center', width: '100%' },
  verifiedCircleWrap: { marginBottom: 24 },
  verifiedCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTitle: {
    fontSize: SIZES.xxxl,
    color: COLORS.success,
    ...FONTS.bold,
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  verifiedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 28,
  },
  verifiedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  vLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  vValue: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold },
  vDivider: { height: 1, backgroundColor: COLORS.cardBorder },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedBadgeText: { fontSize: SIZES.sm, color: COLORS.success, ...FONTS.semiBold },
  homeBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', ...SHADOWS.medium },
  homeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  homeBtnText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
});

export default UserExitPassScreen;

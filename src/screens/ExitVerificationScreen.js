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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { ordersAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const ExitVerificationScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [verificationState, setVerificationState] = useState('scanning'); // scanning | verifying | displaying | verified
  const [scannedOrderId, setScannedOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const verifiedScale = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (verificationState === 'scanning') {
      startScanAnimation();
    }
  }, [verificationState]);

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (verificationState !== 'scanning') return;
    setVerificationState('verifying');
    setScannedOrderId(data);

    try {
      const response = await ordersAPI.getOrderForVerification(data);
      if (response && response.order) {
        setOrderData(response.order);
        setVerificationState('displaying');
      } else {
        Alert.alert('Error', 'Order not found.', [
          { text: 'OK', onPress: () => setVerificationState('scanning') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not verify the order.', [
        { text: 'OK', onPress: () => setVerificationState('scanning') }
      ]);
    }
  };

  const handleVerifyBill = async () => {
    try {
      await ordersAPI.verifyOrder(scannedOrderId);
      setVerificationState('verified');
      Animated.spring(verifiedScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      Alert.alert('Error', 'Failed to verify bill.');
    }
  };

  const handleDone = () => {
    navigation.navigate('GuardPanel');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.white, marginBottom: 20 }}>We need camera permission to scan QR codes</Text>
        <TouchableOpacity style={styles.verifyBtn} onPress={requestPermission}>
          <Text style={styles.verifyBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Exit</Text>
          <View style={{ width: 40 }} />
        </View>

        {verificationState === 'scanning' || verificationState === 'verifying' ? (
          <View style={styles.scannerContainer}>
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={verificationState === 'scanning' ? handleBarcodeScanned : undefined}
            />
            
            <View style={styles.overlayContainer} pointerEvents="none">
              <View style={styles.scanFrame}>
                {verificationState === 'verifying' ? (
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: COLORS.white, marginTop: 10, ...FONTS.medium }}>Fetching Order...</Text>
                  </View>
                ) : (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 250]
                          })
                        }]
                      }
                    ]}
                  />
                )}
              </View>
              <Text style={styles.instructions}>
                Scan the customer's QR code from their receipt
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {verificationState === 'verified' ? (
              <Animated.View style={[styles.verifiedContainer, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.verifiedIconContainer, { transform: [{ scale: verifiedScale }] }]}>
                  <LinearGradient colors={[COLORS.success, '#059669']} style={styles.verifiedCircle}>
                    <Ionicons name="shield-checkmark" size={60} color={COLORS.white} />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.verifiedTitle}>Bill Verified!</Text>
                <Text style={styles.verifiedSubtitle}>Customer is clear to exit</Text>
                
                <View style={styles.verifiedCard}>
                  <View style={styles.verifiedRow}><Text style={styles.vLabel}>Receipt ID</Text><Text style={styles.vValue}>{orderData?.id}</Text></View>
                  <View style={styles.vDivider} />
                  <View style={styles.verifiedRow}><Text style={styles.vLabel}>Items</Text><Text style={styles.vValue}>{orderData?.itemCount} items</Text></View>
                  <View style={styles.vDivider} />
                  <View style={styles.verifiedRow}><Text style={styles.vLabel}>Amount Paid</Text><Text style={[styles.vValue, { color: COLORS.success }]}>₹{orderData?.total.toFixed(2)}</Text></View>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.success, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.doneBtnGradient}>
                    <Ionicons name="home" size={20} color={COLORS.white} />
                    <Text style={styles.doneBtnText}>Back to Dashboard</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.billCard}>
                  <View style={styles.billHeader}>
                    <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.billTitle}>Order Summary: {orderData?.id}</Text>
                  </View>
                  {orderData?.items.map((item, idx) => (
                    <View key={idx} style={styles.billItem}>
                      <Text style={styles.billItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.billItemQty}>x{item.quantity}</Text>
                      <Text style={styles.billItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={styles.billDivider} />
                  <View style={styles.billTotalRow}>
                    <Text style={styles.billTotalLabel}>Total Paid</Text>
                    <Text style={styles.billTotalValue}>₹{orderData?.total.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyBill} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.primary, '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyBtnGradient}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.verifyBtnText}>Verify Bill & Approve Exit</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ marginTop: 20, alignItems: 'center' }}
                  onPress={() => setVerificationState('scanning')}
                >
                  <Text style={{ color: COLORS.error, ...FONTS.bold, fontSize: SIZES.md }}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  scannerContainer: { flex: 1, overflow: 'hidden', borderRadius: 24, marginHorizontal: 20, marginBottom: 40 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 280, height: 280, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.primary },
  instructions: { color: COLORS.white, marginTop: 40, textAlign: 'center', opacity: 0.9, ...FONTS.medium, fontSize: SIZES.md },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  billCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  billTitle: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold },
  billItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  billItemName: { flex: 1, fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  billItemQty: { fontSize: SIZES.sm, color: COLORS.textMuted, marginRight: 12 },
  billItemPrice: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
  billDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10, borderStyle: 'dashed', borderRadius: 1 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billTotalLabel: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  billTotalValue: { fontSize: SIZES.xxl, color: COLORS.primary, ...FONTS.bold },
  verifyBtn: { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  verifyBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  verifyBtnText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
  verifiedContainer: { alignItems: 'center', paddingTop: 40 },
  verifiedIconContainer: { marginBottom: 24 },
  verifiedCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(COLORS.success) },
  verifiedTitle: { fontSize: SIZES.xxl, color: COLORS.success, ...FONTS.bold, marginBottom: 8 },
  verifiedSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 30 },
  verifiedCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 30 },
  verifiedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  vLabel: { fontSize: SIZES.md, color: COLORS.textSecondary },
  vValue: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semiBold },
  vDivider: { height: 1, backgroundColor: COLORS.cardBorder },
  doneBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  doneBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  doneBtnText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.bold },
});

export default ExitVerificationScreen;

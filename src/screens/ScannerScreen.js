import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS as STATIC_COLORS, FONTS, SIZES, SHADOWS } from '../theme';
import { useCart } from '../context/CartContext';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRandomProduct } from '../data/products';

const { width, height } = Dimensions.get('window');

const ScannerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addItem, itemCount } = useCart();
  const { user } = useAuth();
  const { COLORS } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productsList, setProductsList] = useState([]);

  // Fetch products list for scanning
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsAPI.getAll();
        if (data.products) setProductsList(data.products);
      } catch (e) {
        // Will use fallback
      }
    };
    fetchProducts();
  }, []);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerPulse = useRef(new Animated.Value(1)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    startScanAnimation();
    startCornerPulse();
  }, []);

  const startScanAnimation = () => {
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

  const startCornerPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(cornerPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (hasScanned) return;
    setHasScanned(true);
    setIsScanning(false);

    try {
      const response = await productsAPI.getByBarcode(data);
      if (response && response.product) {
        setScannedProduct(response.product);

        // Show success animation
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            // Hide success, show product modal
            Animated.parallel([
              Animated.timing(successScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(successOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
            showProduct();
          }, 800);
        });
      } else {
        Alert.alert('Not Found', 'Product not found in our database.', [
          { text: 'OK', onPress: () => { setHasScanned(false); setIsScanning(true); } }
        ]);
      }
    } catch (error) {
      Alert.alert('Not Found', 'Product not found in our database.', [
        { text: 'OK', onPress: () => { setHasScanned(false); setIsScanning(true); } }
      ]);
    }
  };

  const showProduct = () => {
    setShowProductModal(true);
    Animated.spring(modalSlide, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const hideProduct = () => {
    Animated.timing(modalSlide, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowProductModal(false);
      setIsScanning(true);
      setHasScanned(false);
    });
  };

  const dynamicStyles = getStyles(COLORS);

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Camera View */}
      <View style={StyleSheet.absoluteFillObject}>
        {!permission ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : !permission.granted ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
            <Text style={{ color: COLORS.white, fontSize: 16, textAlign: 'center', marginBottom: 20, ...FONTS.medium }}>We need your permission to show the camera</Text>
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }} onPress={requestPermission}>
              <Text style={{ color: COLORS.white, ...FONTS.bold }}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['code128', 'ean13', 'ean8', 'qr', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={isScanning && !hasScanned ? handleBarcodeScanned : undefined}
          />
        )}

          {/* Header Overlay */}
          <View style={[dynamicStyles.header, { paddingTop: insets.top || 40 }]}>
            <TouchableOpacity
              style={dynamicStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>

            <View style={dynamicStyles.headerCenter}>
              <Text style={dynamicStyles.headerTitle}>Scan Snack</Text>
              <Text style={dynamicStyles.headerSubtitle}>Align barcode within frame</Text>
            </View>

            <TouchableOpacity
              style={dynamicStyles.cartBtn}
              onPress={() => {
                if (!user) {
                  navigation.navigate('Login');
                } else {
                  navigation.navigate('Cart');
                }
              }}
            >
              <Ionicons name="cart-outline" size={28} color={COLORS.white} />
              {itemCount > 0 && (
                <View style={dynamicStyles.cartBadgeSmall}>
                  <Text style={dynamicStyles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Scanner Overlay UI */}
          <View style={dynamicStyles.overlayContainer} pointerEvents="none">
            <View style={dynamicStyles.scanFrame}>
              {/* Corner Indicators */}
              <Animated.View style={[dynamicStyles.corner, dynamicStyles.topLeft, { transform: [{ scale: cornerPulse }] }]} />
              <Animated.View style={[dynamicStyles.corner, dynamicStyles.topRight, { transform: [{ scale: cornerPulse }] }]} />
              <Animated.View style={[dynamicStyles.corner, dynamicStyles.bottomLeft, { transform: [{ scale: cornerPulse }] }]} />
              <Animated.View style={[dynamicStyles.corner, dynamicStyles.bottomRight, { transform: [{ scale: cornerPulse }] }]} />

              {/* Scanning Line */}
              {isScanning && (
                <Animated.View
                  style={[
                    dynamicStyles.scanLine,
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

              <Animated.View
                style={[
                  dynamicStyles.successOverlay,
                  { opacity: successOpacity, transform: [{ scale: successScale }] }
                ]}
              >
                <View style={dynamicStyles.successIconBg}>
                  <Ionicons name="checkmark" size={40} color={COLORS.white} />
                </View>
                <Text style={dynamicStyles.successText}>Scanned!</Text>
              </Animated.View>
            </View>

            <Animated.Text style={[dynamicStyles.instructions, { opacity: fadeIn }]}>
              Center the barcode in the frame to scan automatically
            </Animated.Text>
          </View>

          {/* Bottom Tools */}
          <Animated.View style={[dynamicStyles.bottomTools, { opacity: fadeIn }]}>
            <TouchableOpacity style={dynamicStyles.toolBtn}>
              <Ionicons name="flash-outline" size={24} color={COLORS.white} />
              <Text style={dynamicStyles.toolText}>Flash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.scanTriggerBtn}
              onPress={() => {
                setHasScanned(false);
                setIsScanning(true);
              }}
              disabled={isScanning}
            >
              <Ionicons name="barcode-outline" size={32} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.toolBtn}>
              <Ionicons name="image-outline" size={24} color={COLORS.white} />
              <Text style={dynamicStyles.toolText}>Gallery</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Product Details Modal */}
          <Modal
            visible={showProductModal}
            transparent
            animationType="none"
          >
            <View style={dynamicStyles.modalOverlay}>
              <TouchableOpacity
                style={dynamicStyles.modalBackdrop}
                activeOpacity={1}
                onPress={() => {
                  hideProduct();
                }}
              />
              <Animated.View style={[dynamicStyles.productModal, { transform: [{ translateY: modalSlide }] }]}>
                <LinearGradient colors={[COLORS.surfaceLight, COLORS.surface]} style={dynamicStyles.modalContent}>
                  {scannedProduct && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dynamicStyles.modalScroll}>
                      <View style={dynamicStyles.modalDragHandle} />

                      <View style={dynamicStyles.modalHeader}>
                        <Image source={{ uri: scannedProduct.image ? scannedProduct.image.split(',')[0] : 'https://via.placeholder.com/150' }} style={dynamicStyles.modalImage} />
                        {scannedProduct.discount > 0 && (
                          <View style={dynamicStyles.discountBadge}>
                            <Text style={dynamicStyles.discountText}>-{scannedProduct.discount}%</Text>
                          </View>
                        )}
                      </View>

                      <View style={dynamicStyles.modalInfo}>
                        <View style={dynamicStyles.modalTitleRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.modalBrand}>{scannedProduct.brand}</Text>
                            <Text style={dynamicStyles.modalName}>{scannedProduct.name}</Text>
                          </View>
                          <View style={dynamicStyles.veganBadge}>
                            <View style={[dynamicStyles.veganDot, { backgroundColor: scannedProduct.isVegan ? COLORS.success : COLORS.error }]} />
                          </View>
                        </View>

                        <View style={dynamicStyles.modalPriceRow}>
                          <Text style={dynamicStyles.modalCurrentPrice}>₹{scannedProduct.price}</Text>
                          {scannedProduct.originalPrice > scannedProduct.price && (
                            <Text style={dynamicStyles.modalOriginalPrice}>₹{scannedProduct.originalPrice}</Text>
                          )}
                        </View>

                        {/* Nutrition / Info Chips */}
                        <View style={dynamicStyles.chipsContainer}>
                          <View style={dynamicStyles.infoChip}>
                            <Ionicons name="flame-outline" size={14} color={COLORS.primary} />
                            <Text style={dynamicStyles.chipText}>{scannedProduct.calories || '240'} kcal</Text>
                          </View>
                          <View style={dynamicStyles.infoChip}>
                            <Ionicons name="scale-outline" size={14} color={COLORS.secondary} />
                            <Text style={dynamicStyles.chipText}>{scannedProduct.weight || '100g'}</Text>
                          </View>
                        </View>

                        <Text style={dynamicStyles.modalDesc}>
                          {scannedProduct.description || 'A delicious and crunchy snack perfect for any time of the day.'}
                        </Text>
                      </View>

                      <View style={dynamicStyles.modalActionsContainer}>
                        <TouchableOpacity
                          style={dynamicStyles.rescanBtn}
                          onPress={() => {
                            hideProduct();
                          }}
                        >
                          <Text style={dynamicStyles.rescanText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={dynamicStyles.addToCartBtn}
                          onPress={() => {
                            if (!user) {
                              hideProduct();
                              navigation.navigate('Login');
                            } else {
                              // Stock limit check
                              const stockLimit = scannedProduct.stock ?? scannedProduct.quantity_in_stock ?? Infinity;
                              if (stockLimit <= 0) {
                                Alert.alert('Out of Stock', 'This product is currently out of stock.');
                                return;
                              }
                              addItem(scannedProduct);
                              hideProduct();
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[COLORS.primary, '#FF4500']}
                            style={dynamicStyles.addToCartGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Ionicons name="cart" size={22} color={COLORS.white} />
                            <Text style={dynamicStyles.addToCartText}>Add to Cart</Text>
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
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 18, ...FONTS.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  backBtn: { padding: 8 },
  cartBtn: { padding: 8 },
  cartBadgeSmall: { position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.primary, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: COLORS.white, fontSize: 10, ...FONTS.bold },
  overlayContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 280, height: 280, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.primary, borderWidth: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, backgroundColor: COLORS.primary, borderRadius: 1 },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successText: { color: COLORS.white, fontSize: 18, ...FONTS.bold },
  instructions: { color: COLORS.white, marginTop: 40, textAlign: 'center', opacity: 0.7 },
  bottomTools: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 40, paddingHorizontal: 40 },
  toolBtn: { alignItems: 'center', gap: 4 },
  toolText: { color: COLORS.white, fontSize: 12 },
  scanTriggerBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(COLORS.primary) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  productModal: { height: '80%', backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  modalContent: { flex: 1, padding: 20 },
  modalScroll: { paddingBottom: 40 },
  modalDragHandle: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalImage: { width: 200, height: 200, resizeMode: 'contain' },
  discountBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  discountText: { color: COLORS.white, ...FONTS.bold },
  modalInfo: { gap: 10 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBrand: { color: COLORS.textSecondary, fontSize: 14 },
  modalName: { fontSize: 22, ...FONTS.bold, color: COLORS.text },
  veganBadge: { padding: 5 },
  veganDot: { width: 12, height: 12, borderRadius: 6 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalCurrentPrice: { fontSize: 20, ...FONTS.bold, color: COLORS.primary },
  modalOriginalPrice: { fontSize: 16, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  chipsContainer: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, gap: 5 },
  chipText: { fontSize: 12, color: COLORS.text },
  modalDesc: { color: COLORS.textSecondary, lineHeight: 20 },
  modalActionsContainer: { flexDirection: 'row', gap: 15, marginTop: 30 },
  rescanBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  rescanText: { ...FONTS.semiBold },
  addToCartBtn: { flex: 2 },
  addToCartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, gap: 8 },
  addToCartText: { color: COLORS.white, ...FONTS.bold },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
  gridLine: { position: 'absolute', backgroundColor: '#fff' },
  gridLineH: { left: 0, right: 0, height: 1 },
  gridLineV: { top: 0, bottom: 0, width: 1 },
});


export default ScannerScreen;

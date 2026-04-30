import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Barcode from 'react-native-barcode-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const AdminBarcodeScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [searchProductText, setSearchProductText] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [barcodeForm, setBarcodeForm] = useState({
    mfgDate: new Date(), expiryDate: new Date(), stockQuantity: '',
  });
  const [showMfgPicker, setShowMfgPicker] = useState(false);
  const [showExpPicker, setShowExpPicker] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.products || []);
    } catch (error) {
      console.log('Error fetching products', error);
    }
  };

  const handleGenerateBarcode = async () => {
    if (!selectedProductId || !barcodeForm.stockQuantity) {
      Alert.alert('Error', 'Please select a product and enter stock quantity.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...barcodeForm,
        mfgDate: barcodeForm.mfgDate.toISOString().split('T')[0],
        expiryDate: barcodeForm.expiryDate.toISOString().split('T')[0],
      };
      const response = await api.post(`/api/products/${selectedProductId}/barcode`, payload);
      setGeneratedBarcode(response.barcode);
      Alert.alert('Success', 'Stock updated. Barcode generated.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update stock.');
    } finally {
      setLoading(false);
    }
  };

  const getBarcodeHtml = (barcodeValue, productName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
        .label { text-align: center; padding: 20px; border: 2px dashed #ccc; border-radius: 12px; width: 320px; }
        .product-name { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
        .barcode-container { margin: 15px 0; }
        .barcode-number { font-size: 14px; letter-spacing: 3px; color: #555; margin-top: 8px; font-family: 'Courier New', monospace; }
        svg { max-width: 100%; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="label">
        <div class="product-name">${productName || 'Product'}</div>
        <div class="barcode-container"><svg id="barcode"></svg></div>
        <div class="barcode-number">${barcodeValue}</div>
      </div>
      <script>
        JsBarcode("#barcode", "${barcodeValue}", { format: "CODE128", width: 2, height: 80, displayValue: false });
      </script>
    </body>
    </html>
  `;

  const handlePrintBarcode = async () => {
    if (!generatedBarcode) return;
    try {
      const html = getBarcodeHtml(generatedBarcode, selectedProductName);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Print Error', 'Could not print barcode.');
    }
  };

  const handleShareBarcode = async () => {
    if (!generatedBarcode) return;
    try {
      const html = getBarcodeHtml(generatedBarcode, selectedProductName);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Share Error', 'Could not share barcode.');
    }
  };

  const dynamicStyles = getStyles(COLORS);

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>Generate Barcode</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={dynamicStyles.formCard}>
              <Text style={dynamicStyles.label}>Select Product</Text>
              <View style={{ zIndex: 1000 }}>
                <TextInput 
                  style={dynamicStyles.input} 
                  placeholder="Type to search product..." 
                  placeholderTextColor={COLORS.textMuted} 
                  value={searchProductText} 
                  onChangeText={(text) => {
                    setSearchProductText(text);
                    setShowProductDropdown(true);
                  }} 
                  onFocus={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && (
                  <View style={dynamicStyles.dropdown}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {products
                        .filter(p => p.name.toLowerCase().includes(searchProductText.toLowerCase()) || p.brand.toLowerCase().includes(searchProductText.toLowerCase()))
                        .map((prod) => (
                        <TouchableOpacity 
                          key={prod.id} 
                          style={dynamicStyles.dropdownItem} 
                          onPress={() => { 
                            setSelectedProductId(prod.id); 
                            setSelectedProductName(prod.name); 
                            setSearchProductText(prod.name); 
                            setShowProductDropdown(false); 
                          }}
                        >
                          <Text style={dynamicStyles.dropdownItemTitle}>{prod.name}</Text>
                          <Text style={dynamicStyles.dropdownItemSub}>{prod.brand} • {prod.weight}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={dynamicStyles.label}>Manufacturing Date</Text>
              <TouchableOpacity style={dynamicStyles.input} onPress={() => setShowMfgPicker(true)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textPrimary }}>{barcodeForm.mfgDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              {showMfgPicker && (
                <DateTimePicker
                  value={barcodeForm.mfgDate}
                  mode="date"
                  onChange={(event, date) => {
                    setShowMfgPicker(false);
                    if (date) setBarcodeForm({ ...barcodeForm, mfgDate: date });
                  }}
                />
              )}

              <Text style={dynamicStyles.label}>Expiry Date</Text>
              <TouchableOpacity style={dynamicStyles.input} onPress={() => setShowExpPicker(true)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textPrimary }}>{barcodeForm.expiryDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              {showExpPicker && (
                <DateTimePicker
                  value={barcodeForm.expiryDate}
                  mode="date"
                  onChange={(event, date) => {
                    setShowExpPicker(false);
                    if (date) setBarcodeForm({ ...barcodeForm, expiryDate: date });
                  }}
                />
              )}

              <Text style={dynamicStyles.label}>Stock Quantity to Add</Text>
              <TextInput 
                style={dynamicStyles.input} 
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.textMuted} 
                keyboardType="numeric" 
                value={barcodeForm.stockQuantity} 
                onChangeText={(t) => setBarcodeForm({ ...barcodeForm, stockQuantity: t })} 
              />

              <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleGenerateBarcode} disabled={loading}>
                <LinearGradient colors={['#3498db', '#2980b9']} style={dynamicStyles.submitBtnGradient}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>Generate & Update Stock</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {generatedBarcode && (
                <View style={dynamicStyles.barcodeResult}>
                  <Text style={dynamicStyles.barcodeLabel}>{selectedProductName}</Text>
                  <View style={dynamicStyles.qrContainer}>
                    <Barcode value={String(generatedBarcode)} format="CODE128" singleBarWidth={2} height={80} />
                  </View>
                  <Text style={dynamicStyles.barcodeNumber}>{generatedBarcode}</Text>
                  <View style={dynamicStyles.actionRow}>
                    <TouchableOpacity style={dynamicStyles.printBtn} onPress={handlePrintBarcode}>
                      <Ionicons name="print-outline" size={20} color={COLORS.white} />
                      <Text style={dynamicStyles.actionBtnText}>Print</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={dynamicStyles.shareBtn} onPress={handleShareBarcode}>
                      <Ionicons name="share-outline" size={20} color={COLORS.white} />
                      <Text style={dynamicStyles.actionBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  scrollContent: { paddingBottom: 40 },
  formCard: { marginHorizontal: 20, backgroundColor: COLORS.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.medium },
  label: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, ...FONTS.medium },
  input: { backgroundColor: COLORS.surfaceLight, color: COLORS.textPrimary, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: SIZES.md, borderWidth: 1, borderColor: COLORS.cardBorder, ...FONTS.regular },
  submitBtn: { marginTop: 30, borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  submitBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },
  dropdown: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.large, zIndex: 5000 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemTitle: { color: COLORS.textPrimary, ...FONTS.medium },
  dropdownItemSub: { color: COLORS.textMuted, fontSize: 12 },
  barcodeResult: { marginTop: 30, alignItems: 'center', padding: 20, backgroundColor: COLORS.surfaceLight, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  barcodeLabel: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 15 },
  qrContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, ...SHADOWS.small },
  barcodeNumber: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 10, letterSpacing: 2 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
  printBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, ...SHADOWS.small },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, ...SHADOWS.small },
  actionBtnText: { color: COLORS.white, ...FONTS.bold },
});

export default AdminBarcodeScreen;


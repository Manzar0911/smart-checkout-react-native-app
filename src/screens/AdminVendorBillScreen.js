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
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const AdminVendorBillScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendorForm, setVendorForm] = useState({ id: null, name: '', phone: '' });
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [vendorsList, setVendorsList] = useState([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorProducts, setVendorProducts] = useState([]); 
  const [billProductSearch, setBillProductSearch] = useState('');
  const [showBillProductDropdown, setShowBillProductDropdown] = useState(false);
  const [billProductQty, setBillProductQty] = useState('1');
  const [selectedBillProduct, setSelectedBillProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (vendorSearchText.length > 1) {
        api.get(`/api/vendors/search?q=${vendorSearchText}`)
           .then(res => setVendorsList(res || []))
           .catch(err => console.log(err));
      } else {
        setVendorsList([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [vendorSearchText]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.products || []);
    } catch (error) {
      console.log('Error fetching products', error);
    }
  };

  const handleAddProductToBill = () => {
    if (!selectedBillProduct || !billProductQty) {
      Alert.alert(t('error'), t('select_product_qty'));
      return;
    }
    const qty = parseInt(billProductQty);
    if (qty <= 0) return;
    
    if (qty > selectedBillProduct.stockQuantity) {
      Alert.alert(t('stock_limit_exceeded'), `${t('only')} ${selectedBillProduct.stockQuantity} ${t('units_available')}`);
      return;
    }
    
    setVendorProducts([...vendorProducts, { 
      id: selectedBillProduct.id, 
      name: selectedBillProduct.name, 
      price: selectedBillProduct.price, 
      quantity: qty 
    }]);
    
    setBillProductQty('1');
    setBillProductSearch('');
    setSelectedBillProduct(null);
  };

  const handleRemoveProductFromBill = (index) => {
    const newProducts = [...vendorProducts];
    newProducts.splice(index, 1);
    setVendorProducts(newProducts);
  };

  const generateGSTPDF = async (billDetails, items) => {
    const businessName = 'Gariox Technologies';
    const businessAddress = '123 Tech Avenue, Silicon Valley';
    const gstin = '22AAAAA0000A1Z5';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; }
          .text-right { text-align: right; }
          .total { font-weight: bold; background-color: #eee; }
        </style>
      </head>
      <body>
        <div class="header"><h1>${t('tax_invoice')}</h1></div>
        <p><strong>${businessName}</strong><br>${businessAddress}<br>GSTIN: ${gstin}</p>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <div><p>${t('billed_to')}:<br><strong>${billDetails.vendorName}</strong><br>Phone: ${billDetails.vendorPhone}</p></div>
          <div><p>${t('invoice_no')}: INV-${billDetails.id}<br>${t('date')}: ${new Date(billDetails.date).toLocaleDateString()}</p></div>
        </div>
        <table>
          <thead><tr><th>${t('s_no')}</th><th>${t('product')}</th><th>${t('qty')}</th><th>${t('rate')}</th><th>${t('total')}</th></tr></thead>
          <tbody>
            ${items.map((p, i) => `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.quantity}</td><td>${p.price}</td><td>${(p.price*p.quantity).toFixed(2)}</td></tr>`).join('')}
            <tr class="total"><td colspan="4" class="text-right">${t('grand_total')}</td><td>₹${billDetails.total.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const handleCreateVendorBill = async () => {
    if (!vendorForm.name || !vendorForm.phone || vendorProducts.length === 0) {
      Alert.alert(t('error'), t('fill_all_fields_products'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/vendors/bills', { vendor: vendorForm, products: vendorProducts });
      const total = vendorProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
      await generateGSTPDF({ id: response.billId, vendorName: vendorForm.name, vendorPhone: vendorForm.phone, date: new Date(), total }, vendorProducts);
      Alert.alert(t('success'), t('vendor_bill_created'), [{ text: t('ok'), onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert(t('error'), t('failed_to_create_bill'));
    } finally {
      setLoading(false);
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
            <Text style={dynamicStyles.headerTitle}>{t('create_vendor_bill')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={dynamicStyles.formCard}>
              <Text style={dynamicStyles.sectionTitle}>{t('vendor_information')}</Text>
              
              <Text style={dynamicStyles.label}>{t('vendor_name')}</Text>
              <View style={{ zIndex: 2000 }}>
                <TextInput 
                  style={dynamicStyles.input} 
                  placeholder={t('search_or_enter_vendor_name')} 
                  placeholderTextColor={COLORS.textMuted}
                  value={vendorSearchText} 
                  onChangeText={(t) => { 
                    setVendorSearchText(t); 
                    setVendorForm({ ...vendorForm, name: t }); 
                    setShowVendorDropdown(true); 
                  }} 
                  onFocus={() => setShowVendorDropdown(true)} 
                />
                {showVendorDropdown && vendorsList.length > 0 && (
                  <View style={dynamicStyles.dropdown}>
                    {vendorsList.map((v) => (
                      <TouchableOpacity 
                        key={v.id} 
                        style={dynamicStyles.dropdownItem} 
                        onPress={() => { 
                          setVendorForm({ id: v.id, name: v.name, phone: v.phone }); 
                          setVendorSearchText(v.name); 
                          setShowVendorDropdown(false); 
                        }}
                      >
                        <Text style={dynamicStyles.dropdownItemTitle}>{v.name}</Text>
                        <Text style={dynamicStyles.dropdownItemSub}>{v.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={dynamicStyles.label}>{t('vendor_phone')}</Text>
              <TextInput 
                style={dynamicStyles.input} 
                placeholder={t('enter_phone_number')}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad" 
                value={vendorForm.phone} 
                onChangeText={(t) => setVendorForm({ ...vendorForm, phone: t })} 
              />
              
              <View style={dynamicStyles.divider} />
              
              <Text style={dynamicStyles.sectionTitle}>{t('add_products_to_bill')}</Text>
              <View style={{ flexDirection: 'row', gap: 10, zIndex: 1000 }}>
                <View style={{ flex: 2 }}>
                  <TextInput 
                    style={dynamicStyles.input} 
                    placeholder={t('search_product')} 
                    placeholderTextColor={COLORS.textMuted}
                    value={billProductSearch} 
                    onChangeText={(t) => { 
                      setBillProductSearch(t); 
                      setShowBillProductDropdown(true); 
                    }} 
                    onFocus={() => setShowBillProductDropdown(true)} 
                  />
                  {showBillProductDropdown && (
                    <View style={dynamicStyles.dropdown}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {products.filter(p => p.name.toLowerCase().includes(billProductSearch.toLowerCase())).map((prod) => (
                          <TouchableOpacity 
                            key={prod.id} 
                            style={dynamicStyles.dropdownItem} 
                            onPress={() => { 
                              setSelectedBillProduct(prod); 
                              setBillProductSearch(prod.name); 
                              setShowBillProductDropdown(false); 
                            }}
                          >
                            <Text style={dynamicStyles.dropdownItemTitle}>{prod.name}</Text>
                            <Text style={dynamicStyles.dropdownItemSub}>₹{prod.price} • {t('stock')}: {prod.stockQuantity}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <TextInput 
                  style={[dynamicStyles.input, { flex: 1 }]} 
                  placeholder={t('qty')} 
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric" 
                  value={billProductQty} 
                  onChangeText={setBillProductQty} 
                />
              </View>
              
              <TouchableOpacity style={dynamicStyles.addProdBtn} onPress={handleAddProductToBill}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={dynamicStyles.addProdBtnText}>{t('add_product')}</Text>
              </TouchableOpacity>

              {vendorProducts.length > 0 && (
                <View style={dynamicStyles.billItemsList}>
                  <Text style={dynamicStyles.subSectionTitle}>{t('items_list')}</Text>
                  {vendorProducts.map((p, i) => (
                    <View key={i} style={dynamicStyles.billItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={dynamicStyles.billItemName}>{p.name}</Text>
                        <Text style={dynamicStyles.billItemMeta}>₹{p.price} x {p.quantity}</Text>
                      </View>
                      <Text style={dynamicStyles.billItemTotal}>₹{(p.price * p.quantity).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => handleRemoveProductFromBill(i)} style={dynamicStyles.removeBtn}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={dynamicStyles.grandTotalRow}>
                    <Text style={dynamicStyles.grandTotalLabel}>{t('grand_total')}</Text>
                    <Text style={dynamicStyles.grandTotalValue}>₹{vendorProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleCreateVendorBill} disabled={loading}>
                <LinearGradient colors={['#2ecc71', '#27ae60']} style={dynamicStyles.submitBtnGradient}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>{t('generate_bill_share')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
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
  sectionTitle: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 15 },
  subSectionTitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.bold, marginBottom: 10, marginTop: 10 },
  label: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, ...FONTS.medium },
  input: { backgroundColor: COLORS.surfaceLight, color: COLORS.textPrimary, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: SIZES.md, borderWidth: 1, borderColor: COLORS.cardBorder, ...FONTS.regular },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 20 },
  dropdown: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.large, zIndex: 5000 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemTitle: { color: COLORS.textPrimary, ...FONTS.medium },
  dropdownItemSub: { color: COLORS.textMuted, fontSize: 11 },
  addProdBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 15, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: COLORS.primary + '11', borderRadius: 8 },
  addProdBtnText: { color: COLORS.primary, ...FONTS.bold, fontSize: 14 },
  billItemsList: { marginTop: 20, backgroundColor: COLORS.surfaceLight, borderRadius: 16, padding: 15 },
  billItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  billItemName: { color: COLORS.textPrimary, ...FONTS.bold, fontSize: 14 },
  billItemMeta: { color: COLORS.textMuted, fontSize: 12 },
  billItemTotal: { color: COLORS.textPrimary, ...FONTS.bold, fontSize: 14, marginRight: 15 },
  removeBtn: { padding: 5 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 2, borderTopColor: COLORS.cardBorder },
  grandTotalLabel: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold },
  grandTotalValue: { fontSize: SIZES.lg, color: COLORS.primary, ...FONTS.bold },
  submitBtn: { marginTop: 30, borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
  submitBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },
});

export default AdminVendorBillScreen;


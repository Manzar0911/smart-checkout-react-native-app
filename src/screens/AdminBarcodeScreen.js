import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Barcode from 'react-native-barcode-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';
import {
  DATE_TYPES,
  DATE_TYPE_OPTIONS,
  MONTH_OPTIONS,
  generateYearRange,
  validateDateByType,
  compareFlexibleDates,
  formatDateByType,
} from '../utils/dateUtils';

const YEAR_LIST = generateYearRange();
const CURRENT_YEAR = new Date().getFullYear().toString();
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdminBarcodeScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [searchProductText, setSearchProductText] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Existing full-date picker state (preserved)
  const [barcodeForm, setBarcodeForm] = useState({
    mfgDate: new Date(), expiryDate: new Date(),
  });
  const [showMfgPicker, setShowMfgPicker] = useState(false);
  const [showExpPicker, setShowExpPicker] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState(null);

  // ─── Flexible Date Type State ───
  const [mfgDateType, setMfgDateType] = useState(DATE_TYPES.FULL_DATE);
  const [expDateType, setExpDateType] = useState(DATE_TYPES.FULL_DATE);

  // Month/Year picker values
  const [mfgMonth, setMfgMonth] = useState('');
  const [mfgYear, setMfgYear] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');

  // Modal picker state (replaces absolute-positioned dropdowns)
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    title: '',
    options: [],
    onSelect: null,
    selectedValue: '',
  });

  const yearListRef = useRef(null);

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

  // ─── Open the picker modal ───
  const openPickerModal = (title, options, selectedValue, onSelect) => {
    setPickerModal({
      visible: true,
      title,
      options,
      onSelect: (val) => {
        onSelect(val);
        setPickerModal(prev => ({ ...prev, visible: false }));
      },
      selectedValue,
    });
  };

  // ─── Build formatted date strings ───
  const getFormattedMfgDate = () => {
    switch (mfgDateType) {
      case DATE_TYPES.FULL_DATE:
        return formatDateByType(barcodeForm.mfgDate, DATE_TYPES.FULL_DATE);
      case DATE_TYPES.MONTH_YEAR:
        return mfgMonth && mfgYear ? `${mfgMonth}/${mfgYear}` : '';
      case DATE_TYPES.YEAR_ONLY:
        return mfgYear || '';
      default:
        return '';
    }
  };

  const getFormattedExpDate = () => {
    switch (expDateType) {
      case DATE_TYPES.FULL_DATE:
        return formatDateByType(barcodeForm.expiryDate, DATE_TYPES.FULL_DATE);
      case DATE_TYPES.MONTH_YEAR:
        return expMonth && expYear ? `${expMonth}/${expYear}` : '';
      case DATE_TYPES.YEAR_ONLY:
        return expYear || '';
      default:
        return '';
    }
  };

  const handleGenerateBarcode = async () => {
    if (!selectedProductId) {
      Alert.alert(t('error'), t('select_product_error'));
      return;
    }

    const formattedMfg = getFormattedMfgDate();
    const mfgValidation = validateDateByType(formattedMfg, mfgDateType);
    if (!mfgValidation.valid) {
      Alert.alert(t('error'), t(mfgValidation.error) || t('mfg_date_required'));
      return;
    }

    const formattedExp = getFormattedExpDate();
    const expValidation = validateDateByType(formattedExp, expDateType);
    if (!expValidation.valid) {
      Alert.alert(t('error'), t(expValidation.error) || t('exp_date_required'));
      return;
    }

    const comparison = compareFlexibleDates(formattedMfg, mfgDateType, formattedExp, expDateType);
    if (!comparison.valid) {
      Alert.alert(t('error'), t(comparison.error) || t('expiry_before_mfg'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mfgDate: formattedMfg,
        expiryDate: formattedExp,
        mfgDateType: mfgDateType,
        expiryDateType: expDateType,
      };
      const response = await api.post(`/api/products/${selectedProductId}/barcode`, payload);
      setGeneratedBarcode(response.barcode);
      Alert.alert(t('success'), t('barcode_generated'), [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert(t('error'), error.message || t('failed_update_stock'));
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
      Alert.alert(t('print_error'), t('cannot_print'));
    }
  };

  const handleShareBarcode = async () => {
    if (!generatedBarcode) return;
    try {
      const html = getBarcodeHtml(generatedBarcode, selectedProductName);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert(t('share_error'), t('cannot_share'));
    }
  };

  // ─── Get display label for month value ───
  const getMonthLabel = (val) => {
    if (!val) return '';
    const found = MONTH_OPTIONS.find(m => m.value === val);
    return found ? found.label : val;
  };

  // ─── Date Type Pill Selector ───
  const renderDateTypePills = (selectedType, onSelect) => (
    <View style={dynamicStyles.pillRow}>
      {DATE_TYPE_OPTIONS.map((opt) => {
        const isActive = selectedType === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[dynamicStyles.pill, isActive && dynamicStyles.pillActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[dynamicStyles.pillText, isActive && dynamicStyles.pillTextActive]}>
              {t(opt.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Selector Button (opens modal) ───
  const renderSelectorButton = (label, value, displayValue, options, onSelect) => (
    <TouchableOpacity
      style={dynamicStyles.input}
      onPress={() => openPickerModal(label, options, value, onSelect)}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: displayValue ? COLORS.textPrimary : COLORS.textMuted, ...FONTS.regular, fontSize: SIZES.md }}>
          {displayValue || label}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  // ─── Manufacturing Date Input ───
  const renderMfgDateInput = () => {
    switch (mfgDateType) {
      case DATE_TYPES.FULL_DATE:
        return (
          <>
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
          </>
        );
      case DATE_TYPES.MONTH_YEAR:
        return (
          <View style={dynamicStyles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderSelectorButton(t('select_month'), mfgMonth, getMonthLabel(mfgMonth), MONTH_OPTIONS, setMfgMonth)}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {renderSelectorButton(t('select_year'), mfgYear, mfgYear, YEAR_LIST.map(y => ({ label: y, value: y })), setMfgYear)}
            </View>
          </View>
        );
      case DATE_TYPES.YEAR_ONLY:
        return renderSelectorButton(t('select_year'), mfgYear, mfgYear, YEAR_LIST.map(y => ({ label: y, value: y })), setMfgYear);
      default:
        return null;
    }
  };

  // ─── Expiry Date Input ───
  const renderExpDateInput = () => {
    switch (expDateType) {
      case DATE_TYPES.FULL_DATE:
        return (
          <>
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
          </>
        );
      case DATE_TYPES.MONTH_YEAR:
        return (
          <View style={dynamicStyles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderSelectorButton(t('select_month'), expMonth, getMonthLabel(expMonth), MONTH_OPTIONS, setExpMonth)}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {renderSelectorButton(t('select_year'), expYear, expYear, YEAR_LIST.map(y => ({ label: y, value: y })), setExpYear)}
            </View>
          </View>
        );
      case DATE_TYPES.YEAR_ONLY:
        return renderSelectorButton(t('select_year'), expYear, expYear, YEAR_LIST.map(y => ({ label: y, value: y })), setExpYear);
      default:
        return null;
    }
  };

  const dynamicStyles = getStyles(COLORS);

  // ─── Compute initial scroll index for year list in modal ───
  const getInitialIndex = () => {
    if (!pickerModal.options || pickerModal.options.length === 0) return 0;
    const opts = pickerModal.options;
    // Find current year index
    const currentYearIdx = opts.findIndex(o => (typeof o === 'string' ? o : o.value) === CURRENT_YEAR);
    if (currentYearIdx > 0) return Math.max(0, currentYearIdx - 2);
    // Find selected value index
    if (pickerModal.selectedValue) {
      const selIdx = opts.findIndex(o => (typeof o === 'string' ? o : o.value) === pickerModal.selectedValue);
      if (selIdx > 0) return Math.max(0, selIdx - 2);
    }
    return 0;
  };

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
            <Text style={dynamicStyles.headerTitle}>{t('generate_barcode')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={dynamicStyles.formCard}>
              <Text style={dynamicStyles.label}>{t('select_product')}</Text>
              <View style={{ zIndex: 1000 }}>
                <TextInput 
                  style={dynamicStyles.input} 
                  placeholder={t('type_to_search')} 
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

              {/* ─── Manufacturing Date ─── */}
              <Text style={dynamicStyles.sectionLabel}>{t('manufacturing_date')}</Text>
              <Text style={dynamicStyles.subLabel}>{t('date_type')}</Text>
              {renderDateTypePills(mfgDateType, setMfgDateType)}
              <View style={{ marginTop: 8 }}>
                {renderMfgDateInput()}
              </View>

              {/* ─── Expiry Date ─── */}
              <Text style={dynamicStyles.sectionLabel}>{t('expiry_date')}</Text>
              <Text style={dynamicStyles.subLabel}>{t('date_type')}</Text>
              {renderDateTypePills(expDateType, setExpDateType)}
              <View style={{ marginTop: 8 }}>
                {renderExpDateInput()}
              </View>

              <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleGenerateBarcode} disabled={loading}>
                <LinearGradient colors={['#3498db', '#2980b9']} style={dynamicStyles.submitBtnGradient}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>{t('generate_barcode')}</Text>}
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
                      <Text style={dynamicStyles.actionBtnText}>{t('print')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={dynamicStyles.shareBtn} onPress={handleShareBarcode}>
                      <Ionicons name="share-outline" size={20} color={COLORS.white} />
                      <Text style={dynamicStyles.actionBtnText}>{t('share')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* ─── Full-Screen Picker Modal ─── */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={dynamicStyles.modalOverlay}>
          <TouchableOpacity 
            style={dynamicStyles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setPickerModal(prev => ({ ...prev, visible: false }))} 
          />
          <View style={dynamicStyles.modalSheet}>
            <View style={dynamicStyles.modalSheetHeader}>
              <View style={dynamicStyles.modalDragHandle} />
              <Text style={dynamicStyles.modalSheetTitle}>{pickerModal.title}</Text>
            </View>
            <FlatList
              data={pickerModal.options}
              keyExtractor={(item) => typeof item === 'string' ? item : item.value}
              initialScrollIndex={getInitialIndex()}
              getItemLayout={(data, index) => ({ length: 52, offset: 52 * index, index })}
              renderItem={({ item }) => {
                const val = typeof item === 'string' ? item : item.value;
                const label = typeof item === 'string' ? item : item.label;
                const isSelected = val === pickerModal.selectedValue;
                return (
                  <TouchableOpacity
                    style={[dynamicStyles.modalSheetItem, isSelected && dynamicStyles.modalSheetItemSelected]}
                    onPress={() => pickerModal.onSelect?.(val)}
                    activeOpacity={0.6}
                  >
                    <Text style={[dynamicStyles.modalSheetItemText, isSelected && dynamicStyles.modalSheetItemTextSelected]}>
                      {label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>
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
  sectionLabel: { fontSize: SIZES.md, color: COLORS.textPrimary, marginBottom: 4, marginTop: 20, ...FONTS.bold },
  subLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 6, marginTop: 4, ...FONTS.medium },
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

  // ─── Pill selector styles ───
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.medium },
  pillTextActive: { color: COLORS.white, ...FONTS.bold },

  // ─── Row inputs ───
  rowInputs: { flexDirection: 'row' },

  // ─── Bottom Sheet Modal ───
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  modalSheetHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalDragHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, marginBottom: 10, opacity: 0.4 },
  modalSheetTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  modalSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 15,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalSheetItemSelected: { backgroundColor: COLORS.primarySoft },
  modalSheetItemText: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.regular },
  modalSheetItemTextSelected: { color: COLORS.primary, ...FONTS.bold },
});

export default AdminBarcodeScreen;

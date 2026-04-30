import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const AdminPastBillsScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBills();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/vendors/bills');
      setBills(res || []);
    } catch (err) {
      console.log('Error fetching bills', err);
    } finally {
      setLoading(false);
    }
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
        <div class="header"><h1>TAX INVOICE</h1></div>
        <p><strong>${businessName}</strong><br>${businessAddress}<br>GSTIN: ${gstin}</p>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <div><p>Billed To:<br><strong>${billDetails.vendorName}</strong><br>Phone: ${billDetails.vendorPhone}</p></div>
          <div><p>Invoice No: INV-${billDetails.id}<br>Date: ${new Date(billDetails.date).toLocaleDateString()}</p></div>
        </div>
        <table>
          <thead><tr><th>S.No</th><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
          <tbody>
            ${items.map((p, i) => `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.quantity}</td><td>${p.price}</td><td>${(p.price*p.quantity).toFixed(2)}</td></tr>`).join('')}
            <tr class="total"><td colspan="4" class="text-right">Grand Total</td><td>₹${parseFloat(billDetails.total).toFixed(2)}</td></tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const handleOpenBill = async (bill) => {
    try {
      const items = await api.get(`/api/vendors/bills/${bill.id}/items`);
      await generateGSTPDF({
        id: bill.id,
        vendorName: bill.vendor_name,
        vendorPhone: bill.vendor_phone,
        date: bill.created_at,
        total: bill.total_amount
      }, items);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate bill.');
    }
  };

  const getSortedBills = () => {
    let filtered = bills.filter(b => 
      b.vendor_name?.toLowerCase().includes(search.toLowerCase()) || 
      b.id.toString().includes(search)
    );

    switch (sortOption) {
      case 'newest': filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'total-high': filtered.sort((a, b) => b.total_amount - a.total_amount); break;
      case 'total-low': filtered.sort((a, b) => a.total_amount - b.total_amount); break;
      case 'vendor-az': filtered.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name)); break;
    }
    return filtered;
  };

  const dynamicStyles = getStyles(COLORS);

  const BillItem = ({ item }) => (
    <TouchableOpacity style={dynamicStyles.billCard} onPress={() => handleOpenBill(item)}>
      <View style={dynamicStyles.billInfo}>
        <Text style={dynamicStyles.vendorName}>{item.vendor_name}</Text>
        <Text style={dynamicStyles.billMeta}>{new Date(item.created_at).toLocaleDateString()} • INV-{item.id}</Text>
      </View>
      <View style={dynamicStyles.totalContainer}>
        <Text style={dynamicStyles.billTotal}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
        <View style={dynamicStyles.viewBadge}>
          <Text style={dynamicStyles.viewText}>View PDF</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>Past Vendor Bills</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={dynamicStyles.searchRow}>
            <View style={dynamicStyles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} style={dynamicStyles.searchIcon} />
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Search vendor or invoice..."
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={dynamicStyles.sortBtn} onPress={() => setShowSortDrawer(true)}>
              <Ionicons name="options-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={getSortedBills()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <BillItem item={item} />}
              contentContainerStyle={dynamicStyles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={dynamicStyles.emptyText}>No bills found</Text>}
            />
          )}

          {/* Sort Drawer */}
          <Modal visible={showSortDrawer} transparent animationType="slide">
            <TouchableOpacity style={dynamicStyles.modalOverlay} onPress={() => setShowSortDrawer(false)} />
            <View style={dynamicStyles.sortDrawer}>
              <View style={dynamicStyles.drawerHeader}>
                <Text style={dynamicStyles.drawerTitle}>Sort Bills</Text>
                <TouchableOpacity onPress={() => setShowSortDrawer(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              {[
                { id: 'newest', label: 'Newest First', icon: 'calendar-outline' },
                { id: 'oldest', label: 'Oldest First', icon: 'calendar-outline' },
                { id: 'total-high', label: 'Total (High to Low)', icon: 'trending-down-outline' },
                { id: 'total-low', label: 'Total (Low to High)', icon: 'trending-up-outline' },
                { id: 'vendor-az', label: 'Vendor Name (A-Z)', icon: 'text-outline' },
              ].map(opt => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[dynamicStyles.sortOption, sortOption === opt.id && dynamicStyles.activeSortOption]}
                  onPress={() => { setSortOption(opt.id); setShowSortDrawer(false); }}
                >
                  <Ionicons name={opt.icon} size={20} color={sortOption === opt.id ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[dynamicStyles.sortOptionText, sortOption === opt.id && dynamicStyles.activeSortOptionText]}>{opt.label}</Text>
                  {sortOption === opt.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, color: COLORS.textPrimary, ...FONTS.regular },
  sortBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  billCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.small, alignItems: 'center' },
  billInfo: { flex: 1 },
  vendorName: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold },
  billMeta: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  totalContainer: { alignItems: 'flex-end' },
  billTotal: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold },
  viewBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  viewText: { color: COLORS.primary, fontSize: 12, ...FONTS.bold, marginRight: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50, ...FONTS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sortDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, ...SHADOWS.large },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  drawerTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  sortOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, gap: 15, borderRadius: 15 },
  activeSortOption: { backgroundColor: COLORS.primary + '10' },
  sortOptionText: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.medium },
  activeSortOptionText: { color: COLORS.primary, ...FONTS.bold },
});

export default AdminPastBillsScreen;

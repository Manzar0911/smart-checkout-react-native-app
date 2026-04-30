import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { height } = Dimensions.get('window');

const AdminOffersScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('title-asc');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchOffers();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const unsubscribe = navigation.addListener('focus', fetchOffers);
    return unsubscribe;
  }, [navigation]);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/api/offers/admin');
      setOffers(res || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedOffers = () => {
    let filtered = offers.filter(o => 
      o.title.toLowerCase().includes(search.toLowerCase()) || 
      o.code.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortOption) {
      case 'title-asc': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title-desc': filtered.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'value-high': filtered.sort((a, b) => b.discount_value - a.discount_value); break;
      case 'value-low': filtered.sort((a, b) => a.discount_value - b.discount_value); break;
    }
    return filtered;
  };

  const dynamicStyles = getStyles(COLORS);

  const OfferItem = ({ item }) => (
    <TouchableOpacity 
      style={dynamicStyles.offerCard}
      onPress={() => navigation.navigate('AdminCreateOffer', { offer: item })}
    >
      <View style={{ flex: 1 }}>
        <Text style={dynamicStyles.offerTitle}>{item.title}</Text>
        <Text style={dynamicStyles.offerCode}>{item.code} • {item.discount_type === 'percent' ? item.discount_value + '%' : '₹' + item.discount_value}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[dynamicStyles.statusBadge, { backgroundColor: item.is_active ? COLORS.success + '22' : COLORS.error + '22' }]}>
          <Text style={[dynamicStyles.statusText, { color: item.is_active ? COLORS.success : COLORS.error }]}>
            {item.is_active ? 'LIVE' : 'DISABLED'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginTop: 8 }} />
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
            <Text style={dynamicStyles.headerTitle}>Offers & Coupons</Text>
            <TouchableOpacity style={dynamicStyles.addBtn} onPress={() => navigation.navigate('AdminCreateOffer')}>
              <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.searchRow}>
            <View style={dynamicStyles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} style={dynamicStyles.searchIcon} />
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Search by title or code..."
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={dynamicStyles.sortBtn} onPress={() => setShowSortDrawer(true)}>
              <Ionicons name="options-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={getSortedOffers()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <OfferItem item={item} />}
              contentContainerStyle={dynamicStyles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={dynamicStyles.emptyText}>No offers found</Text>}
            />
          )}

          {/* Sort Drawer */}
          <Modal visible={showSortDrawer} transparent animationType="slide">
            <TouchableOpacity style={dynamicStyles.modalOverlay} onPress={() => setShowSortDrawer(false)} />
            <View style={dynamicStyles.sortDrawer}>
              <View style={dynamicStyles.drawerHeader}>
                <Text style={dynamicStyles.drawerTitle}>Sort Offers</Text>
                <TouchableOpacity onPress={() => setShowSortDrawer(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              {[
                { id: 'title-asc', label: 'Title (A-Z)', icon: 'text-outline' },
                { id: 'title-desc', label: 'Title (Z-A)', icon: 'text-outline' },
                { id: 'value-high', label: 'Highest Discount', icon: 'trending-up-outline' },
                { id: 'value-low', label: 'Lowest Discount', icon: 'trending-down-outline' },
              ].map(opt => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[dynamicStyles.sortOption, sortOption === opt.id && dynamicStyles.activeSortOption]}
                  onPress={() => { setSortOption(opt.id); setShowSortDrawer(false); }}
                >
                  <Ionicons name={opt.icon} size={20} color={sortOption === opt.id ? COLORS.secondary : COLORS.textSecondary} />
                  <Text style={[dynamicStyles.sortOptionText, sortOption === opt.id && dynamicStyles.activeSortOptionText]}>{opt.label}</Text>
                  {sortOption === opt.id && <Ionicons name="checkmark" size={20} color={COLORS.secondary} />}
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
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, color: COLORS.textPrimary, ...FONTS.regular },
  sortBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  offerCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.small, alignItems: 'center' },
  offerTitle: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold },
  offerCode: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, ...FONTS.bold },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50, ...FONTS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sortDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, ...SHADOWS.large },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  drawerTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  sortOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, gap: 15, borderRadius: 15 },
  activeSortOption: { backgroundColor: COLORS.secondary + '10' },
  sortOptionText: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.medium },
  activeSortOptionText: { color: COLORS.secondary, ...FONTS.bold },
});

export default AdminOffersScreen;

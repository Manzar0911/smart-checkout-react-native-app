import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { OFFERS } from '../data/products';
import { offersAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const AllOffersScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const { applyCoupon } = useCart();
  const [offers, setOffers] = useState(OFFERS);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await offersAPI.getAll();
        if (data.offers && data.offers.length > 0) {
          setOffers(data.offers);
        }
      } catch (e) {
        // Use fallback static data
      }
    };
    fetchOffers();
  }, []);

  const handleApply = async (code) => {
    const success = await applyCoupon(code);
    if (success) {
      navigation.navigate('Cart');
    }
  };

  const OfferItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.offerItem}
      activeOpacity={0.8}
      onPress={() => handleApply(item.code)}
    >
      <LinearGradient
        colors={[item.color, item.color + '88']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.offerGradient}
      >
        <View style={styles.offerContent}>
          <View style={styles.offerIcon}>
            <Ionicons name="pricetag" size={24} color={COLORS.white} />
          </View>
          <View style={styles.offerText}>
            <Text style={styles.offerTitle}>{item.title}</Text>
            <Text style={styles.offerSubtitle}>{item.subtitle}</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{item.code}</Text>
              <Text style={styles.applyLabel}>Tap to Apply</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Current Offers</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OfferItem item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.infoBox}>
              <Ionicons name="sparkles" size={18} color={COLORS.accent} />
              <Text style={styles.infoText}>Save more on your snacks today!</Text>
            </View>
          )}
        />
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
    paddingBottom: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoText: { color: COLORS.textSecondary, fontSize: SIZES.md, ...FONTS.medium },
  list: { paddingBottom: 40 },
  offerItem: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  offerGradient: { padding: 20 },
  offerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  offerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  offerText: { flex: 1 },
  offerTitle: { fontSize: SIZES.xl, color: COLORS.white, ...FONTS.bold },
  offerSubtitle: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  codeText: { color: COLORS.textPrimary, fontSize: SIZES.md, ...FONTS.bold, letterSpacing: 1 },
  applyLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, ...FONTS.semiBold },
});

export default AllOffersScreen;

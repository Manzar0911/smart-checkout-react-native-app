import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';

const { width } = Dimensions.get('window');

const OrderHistoryScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const { pastOrders } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersAPI.getAll();
      if (data.orders && data.orders.length > 0) {
        setOrders(data.orders);
      } else {
        // Fall back to local pastOrders
        setOrders(pastOrders);
      }
    } catch (error) {
      // Fall back to local pastOrders
      setOrders(pastOrders);
    } finally {
      setLoading(false);
    }
  }, [pastOrders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Also refresh when navigating back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation, fetchOrders]);

  const OrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => {
        // We set this as "receipt" in context and go to Receipt screen
        // But better to just navigate with params if needed. 
        // For this demo, let's assume we view it.
        navigation.navigate('Receipt', { orderId: item.id });
      }}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderIconBg}>
          <Ionicons name="receipt" size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderMeta}>{item.date} • {item.time}</Text>
        </View>
        <Text style={styles.orderAmount}>₹{item.total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderDivider} />
      
      <View style={styles.orderBottom}>
        <View style={styles.itemTags}>
          <View style={styles.itemCountTag}>
            <Text style={styles.tagText}>{item.itemCount} Items</Text>
          </View>
          <View style={styles.paymentTag}>
            <Text style={styles.tagText}>{item.paymentMethod.name}</Text>
          </View>
          {item.isVerified && (
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={10} color={COLORS.success} />
              <Text style={[styles.tagText, { color: COLORS.success, marginLeft: 2 }]}>Verified</Text>
            </View>
          )}
        </View>
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View Receipt</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </View>
      </View>
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
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="document-text-outline" size={60} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your shopping history will appear here</Text>
            <TouchableOpacity 
              style={styles.startBtn}
              onPress={() => navigation.navigate('Scanner')}
            >
              <LinearGradient colors={[COLORS.primary, '#FF4500']} style={styles.startGradient}>
                <Text style={styles.startText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderItem item={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.bold },
  orderMeta: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  orderAmount: { fontSize: SIZES.lg, color: COLORS.primary, ...FONTS.bold },
  orderDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 14,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTags: { flexDirection: 'row', gap: 8 },
  itemCountTag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentTag: {
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedTag: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: { fontSize: 10, color: COLORS.textPrimary, ...FONTS.medium },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewBtnText: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  emptySubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30 },
  startBtn: { borderRadius: 12, overflow: 'hidden' },
  startGradient: { paddingHorizontal: 30, paddingVertical: 12 },
  startText: { color: COLORS.textPrimary, fontSize: SIZES.md, ...FONTS.bold },
});

export default OrderHistoryScreen;

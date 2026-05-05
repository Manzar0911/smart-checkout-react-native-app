import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const AdminPanelScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { COLORS } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scanBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanBtnScale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(scanBtnScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'hi' : 'en');
  };

  const dynamicStyles = getStyles(COLORS);

  const GridCard = ({ icon, title, color, onPress }) => (
    <Animated.View style={[dynamicStyles.gridCardContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <View style={[dynamicStyles.gridCardBackground, { backgroundColor: color }]}>
          <View style={dynamicStyles.gridCardIconContainer}>
            <Ionicons name={icon} size={28} color={COLORS.white} />
          </View>
          <Text style={dynamicStyles.gridCardTitle} numberOfLines={2}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={[dynamicStyles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={dynamicStyles.greeting}>{getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👑</Text>
              <Text style={dynamicStyles.headerTitle}>{t('admin_dashboard')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Language Toggle Button */}
              <TouchableOpacity
                style={dynamicStyles.langToggle}
                onPress={toggleLanguage}
                activeOpacity={0.75}
              >
                <Ionicons name="language-outline" size={16} color={COLORS.primary} />
                <Text style={dynamicStyles.langToggleText}>
                  {language === 'en' ? 'हिं' : 'EN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.profileButton} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dynamicStyles.scrollContent}>
            
            {/* Scan Hero Button */}
            <Animated.View style={[dynamicStyles.scanHero, { opacity: fadeAnim }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Scanner')}>
                <Animated.View style={{ transform: [{ scale: scanBtnScale }] }}>
                  <LinearGradient colors={[COLORS.primary, '#FF4500']} style={dynamicStyles.scanButton}>
                    <View style={dynamicStyles.scanIconRing}>
                      <Ionicons name="scan" size={40} color={COLORS.white} />
                    </View>
                    <Text style={dynamicStyles.scanText}>{t('scan_audit')}</Text>
                    <Text style={dynamicStyles.scanSubText}>{t('verify_stock_details')}</Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>

            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>{t('management')}</Text>
            </View>

            <View style={dynamicStyles.gridContainer}>
              <GridCard 
                icon="cube-outline" 
                title={t('products')} 
                color={COLORS.primary} 
                onPress={() => navigation.navigate('AdminProducts')}
              />
              {user?.role === 'admin' && (
                <GridCard 
                  icon="gift-outline" 
                  title={t('offers')} 
                  color={COLORS.secondary} 
                  onPress={() => navigation.navigate('AdminOffers')}
                />
              )}
              {user?.role === 'admin' && (
                <GridCard 
                  icon="people-outline" 
                  title={t('users')} 
                  color={COLORS.accent} 
                  onPress={() => navigation.navigate('AdminUsers')}
                />
              )}
              <GridCard 
                icon="barcode-outline" 
                title={t('barcodes')} 
                color={COLORS.success} 
                onPress={() => navigation.navigate('AdminBarcode')}
              />
              {user?.role === 'admin' && (
                <GridCard 
                  icon="layers-outline" 
                  title={t('inventory')} 
                  color={'#0EA5E9'} 
                  onPress={() => navigation.navigate('AdminInventory')}
                />
              )}
              <GridCard 
                icon="document-text-outline" 
                title={t('new_bill')} 
                color={COLORS.info} 
                onPress={() => navigation.navigate('AdminVendorBill')}
              />
              <GridCard 
                icon="time-outline" 
                title={t('past_bills')} 
                color={COLORS.warning} 
                onPress={() => navigation.navigate('AdminPastBills')}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, marginTop: 10 },
  greeting: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular },
  headerTitle: { fontSize: SIZES.xxxl, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 2 },
  profileButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  langToggleText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    ...FONTS.bold,
  },
  scanHero: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 20 },
  scanButton: { width: width - 40, height: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...SHADOWS.large },
  scanIconRing: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  scanText: { fontSize: SIZES.xl, color: COLORS.white, ...FONTS.bold },
  scanSubText: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', ...FONTS.regular, marginTop: 4 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  gridCardContainer: { width: (width - 60) / 3, marginBottom: 10 },
  gridCardBackground: { alignItems: 'center', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 20, ...SHADOWS.small, height: 110, justifyContent: 'center' },
  gridCardIconContainer: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  gridCardTitle: { fontSize: SIZES.xs, color: COLORS.white, ...FONTS.bold, textAlign: 'center' },
});

export default AdminPanelScreen;

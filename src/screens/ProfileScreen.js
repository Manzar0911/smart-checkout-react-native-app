import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, completeProfile } = useAuth();
  const { clearCart } = useCart();
  const { isDarkMode, toggleTheme, COLORS } = useTheme();
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    // Clear local cart for next user
    if (clearCart) clearCart();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await completeProfile(name, user.email, address);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const dynamicStyles = getStyles(COLORS);

  return (
    <View style={dynamicStyles.container}>
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.container}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={dynamicStyles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t('my_profile')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
          {/* User Profile Card */}
          <View style={dynamicStyles.card}>
            <View style={dynamicStyles.avatarContainer}>
              <View style={dynamicStyles.avatarBg}>
                <Text style={dynamicStyles.avatarInitials}>
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
                </Text>
              </View>
            </View>

            {isEditing ? (
              <View style={dynamicStyles.editForm}>
                <Text style={dynamicStyles.label}>{t('full_name_label')}</Text>
                <TextInput
                  style={[dynamicStyles.input, { color: COLORS.textPrimary }]}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={dynamicStyles.label}>{t('billing_address')}</Text>
                <TextInput
                  style={[dynamicStyles.input, { color: COLORS.textPrimary, height: 80 }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
                <TouchableOpacity style={dynamicStyles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={dynamicStyles.saveBtnText}>{t('save_changes')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={dynamicStyles.infoSection}>
                <Text style={dynamicStyles.userName}>{user?.name || 'Jain Namkeen User'}</Text>
                <Text style={dynamicStyles.userPhone}>{user?.phone || t('no_phone')}</Text>
                {user?.email && <Text style={dynamicStyles.userEmail}>{user.email}</Text>}
                {user?.address && (
                  <View style={dynamicStyles.addressBox}>
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                    <Text style={dynamicStyles.userAddress}>{user.address}</Text>
                  </View>
                )}
                
                <TouchableOpacity style={dynamicStyles.editBtn} onPress={() => setIsEditing(true)}>
                  <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  <Text style={dynamicStyles.editBtnText}>{t('edit_profile')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Settings Section */}
          <Text style={dynamicStyles.sectionTitle}>{t('settings')}</Text>
          <View style={dynamicStyles.settingsCard}>
            <View style={dynamicStyles.settingRow}>
              <View style={dynamicStyles.settingLabelContainer}>
                <View style={[dynamicStyles.settingIcon, { backgroundColor: COLORS.secondarySoft }]}>
                  <Ionicons name="moon" size={20} color={COLORS.secondary} />
                </View>
                <Text style={dynamicStyles.settingText}>{t('dark_mode')}</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: COLORS.surfaceLighter, true: COLORS.primarySoft }}
                thumbColor={isDarkMode ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          </View>



          {/* Footer Actions */}
          <TouchableOpacity style={dynamicStyles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={dynamicStyles.logoutText}>{t('log_out')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  scrollContent: { padding: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  avatarContainer: { alignItems: 'center', marginTop: -40, marginBottom: 15 },
  avatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  avatarInitials: { fontSize: SIZES.xxl, color: COLORS.white, ...FONTS.bold },
  infoSection: { alignItems: 'center' },
  userName: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold },
  userPhone: { fontSize: SIZES.md, color: COLORS.textMuted, marginTop: 4 },
  userEmail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: COLORS.surfaceLight, padding: 10, borderRadius: 10 },
  userAddress: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium, flex: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.primaryGlow },
  editBtnText: { color: COLORS.primary, ...FONTS.bold },
  editForm: { marginTop: 10 },
  label: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: COLORS.white, ...FONTS.bold, fontSize: SIZES.md },
  sectionTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 16 },
  settingsCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 8, marginBottom: 24 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  settingLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingText: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.errorGlow, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.error + '44' },
  logoutText: { color: COLORS.error, ...FONTS.bold, fontSize: SIZES.md },
});

export default ProfileScreen;

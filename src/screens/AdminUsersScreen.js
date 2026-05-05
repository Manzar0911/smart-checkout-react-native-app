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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const AdminUsersScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUsers();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const unsubscribe = navigation.addListener('focus', fetchUsers);
    return unsubscribe;
  }, [navigation]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/auth/admin/users');
      setUsers(res || []);
    } catch (err) {
      console.log('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedUsers = () => {
    let filtered = users.filter(u => 
      u.name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortOption) {
      case 'name-asc': filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'name-desc': filtered.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
      case 'role': filtered.sort((a, b) => a.role.localeCompare(b.role)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
    }
    return filtered;
  };

  const dynamicStyles = getStyles(COLORS);

  const UserItem = ({ item }) => (
    <TouchableOpacity 
      style={dynamicStyles.userCard} 
      onPress={() => navigation.navigate('AdminCreateUser', { user: item })}
    >
      <View style={dynamicStyles.userInfo}>
        <Text style={dynamicStyles.userName}>{item.name || t('no_name')}</Text>
        <Text style={dynamicStyles.userMeta}>{item.phone} • {item.role.toUpperCase()}</Text>
        <Text style={dynamicStyles.userEmail}>{item.email}</Text>
      </View>
      <View style={dynamicStyles.statusContainer}>
        <View style={[dynamicStyles.statusBadge, { backgroundColor: item.is_profile_complete ? COLORS.success + '22' : COLORS.warning + '22' }]}>
          <Text style={[dynamicStyles.statusText, { color: item.is_profile_complete ? COLORS.success : COLORS.warning }]}>
            {item.is_profile_complete ? t('active') : t('pending')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} style={{ marginTop: 8 }} />
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
            <Text style={dynamicStyles.headerTitle}>{t('user_management')}</Text>
            <TouchableOpacity style={dynamicStyles.addBtn} onPress={() => navigation.navigate('AdminCreateUser')}>
              <Ionicons name="person-add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.searchRow}>
            <View style={dynamicStyles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} style={dynamicStyles.searchIcon} />
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder={t('search_users')}
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
              data={getSortedUsers()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <UserItem item={item} />}
              contentContainerStyle={dynamicStyles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={dynamicStyles.emptyText}>{t('no_users_found')}</Text>}
            />
          )}

          {/* Sort Drawer */}
          <Modal visible={showSortDrawer} transparent animationType="slide">
            <TouchableOpacity style={dynamicStyles.modalOverlay} onPress={() => setShowSortDrawer(false)} />
            <View style={dynamicStyles.sortDrawer}>
              <View style={dynamicStyles.drawerHeader}>
                <Text style={dynamicStyles.drawerTitle}>{t('sort_users')}</Text>
                <TouchableOpacity onPress={() => setShowSortDrawer(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              {[
                { id: 'name-asc', label: t('name_a_z'), icon: 'text-outline' },
                { id: 'name-desc', label: t('name_z_a'), icon: 'text-outline' },
                { id: 'role', label: t('role'), icon: 'people-outline' },
                { id: 'newest', label: t('newest_first'), icon: 'calendar-outline' },
                { id: 'oldest', label: t('oldest_first'), icon: 'calendar-outline' },
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
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, color: COLORS.textPrimary, ...FONTS.regular },
  sortBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.small, alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: SIZES.md + 2, color: COLORS.textPrimary, ...FONTS.bold },
  userMeta: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  userEmail: { fontSize: SIZES.sm - 2, color: COLORS.textSecondary, marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, ...FONTS.bold },
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

export default AdminUsersScreen;

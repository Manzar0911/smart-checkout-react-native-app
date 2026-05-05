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
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const AdminCreateUserScreen = ({ navigation, route }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const existingUser = route.params?.user;
  const isEditing = !!existingUser;

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: existingUser?.name || '',
    email: existingUser?.email || '',
    phone: existingUser?.phone || '',
    password: '',
    role: existingUser?.role || 'user'
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!userForm.name || !userForm.email || !userForm.phone || (!isEditing && !userForm.password)) {
      Alert.alert(t('error'), t('name_email_required') || 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api/auth/admin/users/${existingUser.id}`, userForm);
        Alert.alert(t('success'), t('user_updated'), [{ text: t('ok'), onPress: () => navigation.goBack() }]);
      } else {
        await api.post('/api/auth/admin/users', userForm);
        Alert.alert(t('success'), t('user_created'), [{ text: t('ok'), onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert(t('error'), error.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('delete_user'),
      t('delete_user_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await api.delete(`/api/auth/admin/users/${existingUser.id}`);
              Alert.alert(t('deleted') || 'Deleted', t('user_deleted'), [{ text: t('ok'), onPress: () => navigation.goBack() }]);
            } catch (err) {
              Alert.alert(t('error'), 'Failed to delete user.');
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
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
            <Text style={dynamicStyles.headerTitle}>{isEditing ? t('edit_user') : t('create_user')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={dynamicStyles.formCard}>
              <Text style={dynamicStyles.label}>{t('full_name')}</Text>
              <TextInput 
                style={dynamicStyles.input} 
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textMuted} 
                value={userForm.name} 
                onChangeText={(t) => setUserForm({ ...userForm, name: t })} 
              />

              <Text style={dynamicStyles.label}>{t('email_address')}</Text>
              <TextInput 
                style={dynamicStyles.input} 
                placeholder="Enter email"
                placeholderTextColor={COLORS.textMuted} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={userForm.email} 
                onChangeText={(t) => setUserForm({ ...userForm, email: t })} 
              />

              <Text style={dynamicStyles.label}>{t('phone_number')}</Text>
              <TextInput 
                style={dynamicStyles.input} 
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textMuted} 
                keyboardType="phone-pad" 
                value={userForm.phone} 
                onChangeText={(t) => setUserForm({ ...userForm, phone: t })} 
              />

              {!isEditing && (
                <>
                  <Text style={dynamicStyles.label}>{t('password')}</Text>
                  <TextInput 
                    style={dynamicStyles.input} 
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textMuted} 
                    secureTextEntry 
                    value={userForm.password} 
                    onChangeText={(t) => setUserForm({ ...userForm, password: t })} 
                  />
                </>
              )}

              <Text style={dynamicStyles.label}>{t('role')}</Text>
              <View style={{ zIndex: 1000 }}>
                <TouchableOpacity style={dynamicStyles.input} onPress={() => setShowRoleDropdown(!showRoleDropdown)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textPrimary }}>{userForm.role.toUpperCase()}</Text>
                    <Ionicons name={showRoleDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
                {showRoleDropdown && (
                  <View style={dynamicStyles.dropdown}>
                    {['user', 'admin', 'employee', 'guard'].map((role) => (
                      <TouchableOpacity 
                        key={role} 
                        style={dynamicStyles.dropdownItem} 
                        onPress={() => { 
                          setUserForm({ ...userForm, role }); 
                          setShowRoleDropdown(false); 
                        }}
                      >
                        <Text style={[dynamicStyles.dropdownItemTitle, userForm.role === role && { color: COLORS.primary }]}>
                          {role.toUpperCase()}
                        </Text>
                        {userForm.role === role && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleSubmit} disabled={loading}>
                <LinearGradient colors={['#3498db', '#2980b9']} style={dynamicStyles.submitBtnGradient}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>{isEditing ? t('edit_user') : t('create_user')}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity 
                  style={dynamicStyles.deleteBtn} 
                  onPress={handleDelete} 
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <ActivityIndicator color={COLORS.error} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
                      <Text style={dynamicStyles.deleteBtnText}>{t('delete_user')}</Text>
                    </>
                  )}
                </TouchableOpacity>
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
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.error + '44' },
  deleteBtnText: { color: COLORS.error, fontSize: SIZES.md, ...FONTS.bold },
  dropdown: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.large, zIndex: 5000 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemTitle: { color: COLORS.textPrimary, ...FONTS.medium },
});

export default AdminCreateUserScreen;


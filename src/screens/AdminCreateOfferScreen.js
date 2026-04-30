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
import { FONTS, SIZES, SHADOWS } from '../theme';

const AdminCreateOfferScreen = ({ navigation, route }) => {
  const { COLORS } = useTheme();
  const editingOffer = route.params?.offer;
  const isEdit = !!editingOffer;

  const [loading, setLoading] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: editingOffer?.title || '',
    subtitle: editingOffer?.subtitle || '',
    code: editingOffer?.code || '',
    discount_type: editingOffer?.discount_type || 'percent',
    discount_value: editingOffer?.discount_value?.toString() || '',
    color: editingOffer?.color || '#FF4500',
    is_active: editingOffer?.is_active !== undefined ? editingOffer.is_active : true
  });
  
  const [showOfferTypeDropdown, setShowOfferTypeDropdown] = useState(false);

  const handleSaveOffer = async () => {
    if (!offerForm.title || !offerForm.code || !offerForm.discount_value) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/offers/${editingOffer.id}`, offerForm);
        Alert.alert('Success', 'Offer updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await api.post('/api/offers', offerForm);
        Alert.alert('Success', 'Offer created successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save offer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = () => {
    Alert.alert(
      'Delete Offer',
      'Are you sure? This will remove the offer from the system.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/api/offers/${editingOffer.id}`);
              Alert.alert('Deleted', 'Offer removed.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch (error) {
              Alert.alert('Error', 'Delete failed.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = getStyles(COLORS);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={dynamicStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient colors={[COLORS.background, COLORS.surface]} style={dynamicStyles.gradient}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={dynamicStyles.header}>
              <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={dynamicStyles.headerTitle}>{isEdit ? 'Edit Offer' : 'Create Offer'}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={dynamicStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.formCard}>
                <Text style={dynamicStyles.label}>Offer Title</Text>
                <TextInput style={dynamicStyles.input} placeholder="e.g., Summer Sale" placeholderTextColor={COLORS.textMuted} value={offerForm.title} onChangeText={(t) => setOfferForm({ ...offerForm, title: t })} />

                <Text style={dynamicStyles.label}>Subtitle</Text>
                <TextInput style={dynamicStyles.input} placeholder="e.g., Flat 50% Off" placeholderTextColor={COLORS.textMuted} value={offerForm.subtitle} onChangeText={(t) => setOfferForm({ ...offerForm, subtitle: t })} />

                <Text style={dynamicStyles.label}>Coupon Code</Text>
                <TextInput style={[dynamicStyles.input, { textTransform: 'uppercase' }]} placeholder="e.g., SUMMER50" placeholderTextColor={COLORS.textMuted} value={offerForm.code} onChangeText={(t) => setOfferForm({ ...offerForm, code: t.toUpperCase() })} />

                <Text style={dynamicStyles.label}>Discount Type</Text>
                <View style={{ zIndex: 1000 }}>
                  <TouchableOpacity style={dynamicStyles.input} onPress={() => setShowOfferTypeDropdown(!showOfferTypeDropdown)}>
                    <Text style={{ color: COLORS.textPrimary }}>{offerForm.discount_type.toUpperCase()}</Text>
                  </TouchableOpacity>
                  {showOfferTypeDropdown && (
                    <View style={dynamicStyles.dropdown}>
                      {['percent', 'fixed'].map((type) => (
                        <TouchableOpacity 
                          key={type} 
                          style={dynamicStyles.dropdownItem} 
                          onPress={() => { setOfferForm({ ...offerForm, discount_type: type }); setShowOfferTypeDropdown(false); }}
                        >
                          <Text style={dynamicStyles.dropdownItemTitle}>{type.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={dynamicStyles.label}>Discount Value</Text>
                <TextInput style={dynamicStyles.input} placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={offerForm.discount_value} onChangeText={(t) => setOfferForm({ ...offerForm, discount_value: t })} />

                <Text style={dynamicStyles.label}>Card Color</Text>
                <TextInput style={dynamicStyles.input} placeholder="e.g., #FF4500" placeholderTextColor={COLORS.textMuted} value={offerForm.color} onChangeText={(t) => setOfferForm({ ...offerForm, color: t })} />

                {isEdit && (
                  <View style={dynamicStyles.toggleRow}>
                    <Text style={dynamicStyles.label}>Active Status</Text>
                    <TouchableOpacity 
                      style={[dynamicStyles.toggleBtn, { backgroundColor: offerForm.is_active ? COLORS.success : COLORS.error }]}
                      onPress={() => setOfferForm({ ...offerForm, is_active: !offerForm.is_active })}
                    >
                      <Text style={dynamicStyles.toggleText}>{offerForm.is_active ? 'ENABLED' : 'DISABLED'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleSaveOffer} disabled={loading}>
                  <LinearGradient colors={['#e91e63', '#c2185b']} style={dynamicStyles.submitBtnGradient}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>{isEdit ? 'Update Offer' : 'Create Offer'}</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {isEdit && (
                  <TouchableOpacity style={dynamicStyles.deleteBtn} onPress={handleDeleteOffer} disabled={loading}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    <Text style={dynamicStyles.deleteBtnText}>Delete Offer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </View>
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
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 10, gap: 8 },
  deleteBtnText: { color: COLORS.error, fontSize: SIZES.md, ...FONTS.bold },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  toggleBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  toggleText: { color: '#fff', fontSize: 10, ...FONTS.bold },
  dropdown: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.large, zIndex: 5000 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemTitle: { color: COLORS.textPrimary, ...FONTS.medium },
});

export default AdminCreateOfferScreen;

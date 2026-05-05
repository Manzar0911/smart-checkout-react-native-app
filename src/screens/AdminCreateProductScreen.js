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
import * as ImagePicker from 'expo-image-picker';
import api, { uploadAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { Image } from 'react-native';

const AdminCreateProductScreen = ({ navigation, route }) => {
  const { COLORS } = useTheme();
  const { t } = useLanguage();
  const editingProduct = route.params?.product;
  const isEdit = !!editingProduct;

  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: editingProduct?.name || '',
    brand: editingProduct?.brand || '',
    price: editingProduct?.price?.toString() || '',
    originalPrice: editingProduct?.originalPrice?.toString() || '',
    categoryName: editingProduct?.category || '',
    categoryId: editingProduct?.categoryId || null,
    weight: editingProduct?.weight || '',
    image: editingProduct?.image || '',
    isActive: editingProduct?.isActive !== undefined ? editingProduct.isActive : true,
  });
  
  const [localImages, setLocalImages] = useState([]);
  const [existingImages, setExistingImages] = useState(editingProduct?.image ? editingProduct.image.split(',') : []);

  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.categories || []);
    } catch (error) {
      console.log('Error fetching categories', error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveLocalImage = (index) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      Alert.alert(t('error'), t('fill_name_price'));
      return;
    }
    setLoading(true);
    try {
      let finalImages = [...existingImages];

      if (localImages.length > 0) {
        const uploadResult = await uploadAPI.uploadImages(localImages);
        if (uploadResult && uploadResult.urls) {
          finalImages = [...finalImages, ...uploadResult.urls];
        }
      }

      const finalProductForm = {
        ...productForm,
        image: finalImages.join(','),
      };

      if (isEdit) {
        await api.put(`/api/products/${editingProduct.id}`, finalProductForm);
        Alert.alert(t('success'), t('product_updated'), [
          { text: t('ok'), onPress: () => navigation.goBack() }
        ]);
      } else {
        await api.post('/api/products', finalProductForm);
        Alert.alert(t('success'), t('product_added'), [
          { text: t('ok'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert(t('error'), error.message || t('failed_save_product'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      t('delete_product'),
      t('delete_product_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/api/products/${editingProduct.id}`);
              Alert.alert(t('deleted'), t('product_deleted'), [
                { text: t('ok'), onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert(t('error'), t('failed_delete_product'));
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
              <Text style={dynamicStyles.headerTitle}>{isEdit ? t('edit_product') : t('add_new_product')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dynamicStyles.scrollContent}>
              <View style={dynamicStyles.formCard}>
                <Text style={dynamicStyles.label}>{t('name')}</Text>
                <TextInput style={dynamicStyles.input} placeholderTextColor={COLORS.textMuted} value={productForm.name} onChangeText={(t) => setProductForm({ ...productForm, name: t })} />

                <Text style={dynamicStyles.label}>{t('brand')}</Text>
                <TextInput style={dynamicStyles.input} placeholderTextColor={COLORS.textMuted} value={productForm.brand} onChangeText={(t) => setProductForm({ ...productForm, brand: t })} />

                <Text style={dynamicStyles.label}>{t('price')} (₹)</Text>
                <TextInput style={dynamicStyles.input} placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={productForm.price} onChangeText={(t) => setProductForm({ ...productForm, price: t })} />

                <Text style={dynamicStyles.label}>{t('original_price_label')} (₹)</Text>
                <TextInput style={dynamicStyles.input} placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={productForm.originalPrice} onChangeText={(t) => setProductForm({ ...productForm, originalPrice: t })} />

                <Text style={dynamicStyles.label}>{t('category')}</Text>
                <View style={{ zIndex: 3000 }}>
                  <TextInput 
                    style={dynamicStyles.input} 
                    placeholder={t('search_category')} 
                    placeholderTextColor={COLORS.textMuted} 
                    value={productForm.categoryName} 
                    onChangeText={(t) => {
                      setProductForm({ ...productForm, categoryName: t, categoryId: null });
                      setShowCategoryDropdown(true);
                    }} 
                    onFocus={() => setShowCategoryDropdown(true)}
                  />
                  {showCategoryDropdown && productForm.categoryName.length > 0 && (
                    <View style={dynamicStyles.dropdown}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                        {categories
                          .filter(cat => cat.name.toLowerCase().includes(productForm.categoryName.toLowerCase()))
                          .map((cat) => (
                          <TouchableOpacity 
                            key={cat.id} 
                            style={dynamicStyles.dropdownItem} 
                            onPress={() => { 
                              setProductForm({ ...productForm, categoryId: cat.id, categoryName: cat.name });
                              setShowCategoryDropdown(false); 
                            }}
                          >
                            <Text style={dynamicStyles.dropdownItemTitle}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={dynamicStyles.label}>{t('weight')}</Text>
                <TextInput style={dynamicStyles.input} placeholder="e.g. 1kg or 100gm" placeholderTextColor={COLORS.textMuted} value={productForm.weight} onChangeText={(t) => setProductForm({ ...productForm, weight: t })} />

                <Text style={dynamicStyles.label}>{t('product_images')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                  {existingImages.map((uri, index) => (
                    <View key={`ext-${index}`} style={dynamicStyles.imagePreviewContainer}>
                      <Image source={{ uri }} style={dynamicStyles.imagePreview} />
                      <TouchableOpacity style={dynamicStyles.removeImageBtn} onPress={() => handleRemoveExistingImage(index)}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {localImages.map((img, index) => (
                    <View key={`loc-${index}`} style={dynamicStyles.imagePreviewContainer}>
                      <Image source={{ uri: img.uri }} style={dynamicStyles.imagePreview} />
                      <TouchableOpacity style={dynamicStyles.removeImageBtn} onPress={() => handleRemoveLocalImage(index)}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={dynamicStyles.addImageBtn} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={30} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 5 }}>{t('add_photo')}</Text>
                  </TouchableOpacity>
                </ScrollView>

                {isEdit && (
                  <View style={dynamicStyles.toggleRow}>
                    <Text style={dynamicStyles.label}>{t('active_status')}</Text>
                    <TouchableOpacity 
                      style={[dynamicStyles.toggleBtn, { backgroundColor: productForm.isActive ? COLORS.success : COLORS.error }]}
                      onPress={() => setProductForm({ ...productForm, isActive: !productForm.isActive })}
                    >
                      <Text style={dynamicStyles.toggleText}>{productForm.isActive ? t('active') : t('disabled')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={dynamicStyles.submitBtn} onPress={handleSaveProduct} disabled={loading}>
                  <LinearGradient colors={[COLORS.primary, '#FF4500']} style={dynamicStyles.submitBtnGradient}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={dynamicStyles.submitBtnText}>{isEdit ? t('update_product') : t('create_product')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {isEdit && (
                  <TouchableOpacity style={dynamicStyles.deleteBtn} onPress={handleDeleteProduct} disabled={loading}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    <Text style={dynamicStyles.deleteBtnText}>{t('delete_product')}</Text>
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
  imagePreviewContainer: { marginRight: 15, position: 'relative' },
  imagePreview: { width: 80, height: 80, borderRadius: 10, backgroundColor: COLORS.surfaceLight },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: 'white', borderRadius: 12 },
  addImageBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceLight },
});

export default AdminCreateProductScreen;

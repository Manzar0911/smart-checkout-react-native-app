import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const CompleteProfileScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const { completeProfile, user } = useAuth();
  const { t } = useLanguage();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      setError(t('name_required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await completeProfile(name.trim(), email.trim(), address.trim());
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setError(err.message || t('profile_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, '#0D1425']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={styles.title}>{t('welcome_excl')}</Text>
              <Text style={styles.subtitle}>{t('complete_profile_subtitle')}</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Name */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('full_name_required')}
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={(val) => { setName(val); setError(''); }}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('email_optional')}
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(val) => { setEmail(val); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Address */}
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={[styles.inputIcon, { marginTop: 14 }]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t('billing_address_optional')}
                  placeholderTextColor={COLORS.textMuted}
                  value={address}
                  onChangeText={(val) => { setAddress(val); setError(''); }}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleCompleteProfile}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#FF4500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>{t('complete_profile')}</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  formContainer: {},
  title: {
    fontSize: SIZES.xxxl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginBottom: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.errorGlow,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '33',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    ...FONTS.medium,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    color: COLORS.textPrimary,
    fontSize: SIZES.md,
    ...FONTS.regular,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    ...SHADOWS.medium,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    ...FONTS.bold,
  },
});

export default CompleteProfileScreen;

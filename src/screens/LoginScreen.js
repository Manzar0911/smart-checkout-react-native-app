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

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const { login, sendOtp, verifyOtp } = useAuth();
  const { t } = useLanguage();
  
  // States: 'phone' or 'email'
  const [loginMethod, setLoginMethod] = useState('phone');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
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
      ]),
    ]).start();
  }, []);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError(t('valid_phone_error'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(phone.trim());
      // For dev purposes only - we log the OTP. In prod, sent via SMS.
      console.log('OTP Sent:', res);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || t('failed_send_otp'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 4) {
      setError(t('valid_otp_error'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyOtp(phone.trim(), otp.trim());
      if (data.isNewUser || (data.user && !data.user.isProfileComplete)) {
        navigation.reset({ index: 0, routes: [{ name: 'CompleteProfile' }] });
      } else if (data.user?.role === 'admin' || data.user?.role === 'employee') {
        navigation.reset({ index: 0, routes: [{ name: 'AdminPanel' }] });
      } else if (data.user?.role === 'guard') {
        navigation.reset({ index: 0, routes: [{ name: 'GuardPanel' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      setError(err.message || t('invalid_otp'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('email_password_required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(email.trim(), password);
      if (!data.user.isProfileComplete) {
        navigation.reset({ index: 0, routes: [{ name: 'CompleteProfile' }] });
      } else if (data.user?.role === 'admin' || data.user?.role === 'employee') {
        navigation.reset({ index: 0, routes: [{ name: 'AdminPanel' }] });
      } else if (data.user?.role === 'guard') {
        navigation.reset({ index: 0, routes: [{ name: 'GuardPanel' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      setError(err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (method) => {
    setLoginMethod(method);
    setError('');
    setOtpSent(false);
    setOtp('');
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
            {/* Header / SKIP */}
            <Animated.View style={{ opacity: fadeAnim, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.skipText}>{t('skip_for_now')}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </Animated.View>

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <LinearGradient colors={[COLORS.primary, '#FF4500']} style={styles.logoGradient}>
                <Ionicons name="cart" size={40} color={COLORS.white} />
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
              <Text style={styles.titleSmart}>SMART</Text>
              <Text style={styles.titleCheckout}>CHECKOUT</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={styles.welcomeText}>{t('welcome')}</Text>
              <Text style={styles.subtitleText}>{t('sign_in_subtitle')}</Text>

              {/* Login Method Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]}
                  onPress={() => toggleMethod('phone')}
                >
                  <Ionicons name="call-outline" size={18} color={loginMethod === 'phone' ? COLORS.textPrimary : COLORS.textMuted} />
                  <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>{t('phone')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]}
                  onPress={() => toggleMethod('email')}
                >
                  <Ionicons name="mail-outline" size={18} color={loginMethod === 'email' ? COLORS.textPrimary : COLORS.textMuted} />
                  <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>{t('email')}</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* PHONE OTP FLOW */}
              {loginMethod === 'phone' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <Text style={{ color: COLORS.textMuted, marginRight: 8 }}>+91</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('phone_number')}
                      placeholderTextColor={COLORS.textMuted}
                      value={phone}
                      onChangeText={(val) => { setPhone(val); setError(''); setOtpSent(false); }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!otpSent}
                    />
                    {otpSent && (
                      <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.editBtn}>
                         <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {otpSent && (
                    <View style={styles.inputContainer}>
                      <Ionicons name="keypad-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t('enter_otp')}
                        placeholderTextColor={COLORS.textMuted}
                        value={otp}
                        onChangeText={(val) => { setOtp(val); setError(''); }}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, '#FF4500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginBtnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.loginBtnText}>{otpSent ? t('verify_otp') : t('send_otp')}</Text>
                          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* EMAIL PASSWORD FLOW */}
              {loginMethod === 'email' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('email_address')}
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={(val) => { setEmail(val); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('password')}
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={(val) => { setPassword(val); setError(''); }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleEmailLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, '#FF4500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginBtnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.loginBtnText}>{t('sign_in')}</Text>
                          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Signup Link */}
                  <View style={styles.signupRow}>
                    <Text style={styles.signupLabel}>{t('no_account')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.signupLink}>{t('create_account')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  skipText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    ...FONTS.medium,
  },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  titleSmart: {
    fontSize: 32,
    ...FONTS.extraBold,
    color: COLORS.textPrimary,
    letterSpacing: 6,
  },
  titleCheckout: {
    fontSize: 14,
    ...FONTS.light,
    color: COLORS.primary,
    letterSpacing: 10,
    marginTop: -2,
  },
  formContainer: {},
  welcomeText: {
    fontSize: SIZES.xxl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  toggleText: {
    color: COLORS.textMuted,
    fontSize: SIZES.md,
    ...FONTS.medium,
  },
  toggleTextActive: {
    color: COLORS.textPrimary,
    ...FONTS.bold,
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
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    color: COLORS.textPrimary,
    fontSize: SIZES.md,
    ...FONTS.regular,
  },
  editBtn: { padding: 8 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    ...SHADOWS.medium,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    ...FONTS.bold,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupLabel: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    ...FONTS.regular,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    ...FONTS.bold,
  },
});

export default LoginScreen;

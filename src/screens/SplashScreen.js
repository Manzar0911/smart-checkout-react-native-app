import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const styles = getStyles(COLORS);
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the ring
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Dots animation
    const dots = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    );

    // Main animation sequence
    Animated.sequence([
      // Ring appears
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Title appears
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle appears
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pulse.start();
      dots.start();
    });

    // Progress bar animation
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: false,
    }).start();

    // Navigate after splash
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        if (user?.role === 'admin' || user?.role === 'employee') {
          navigation.replace('AdminPanel');
        } else if (user?.role === 'guard') {
          navigation.replace('GuardPanel');
        } else {
          navigation.replace('Home');
        }
      } else {
        navigation.replace('Login');
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, '#0D1425', '#0A0E1A']}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
        <View style={[styles.decorCircle, styles.decorCircle3]} />

        {/* Animated Ring */}
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: Animated.multiply(ringScale, pulseAnim) }],
              opacity: ringOpacity,
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.logoGradient}
          >
            <Ionicons name="cart" size={48} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleSmart}>SMART</Text>
          <Text style={styles.titleCheckout}>CHECKOUT</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Next-Gen Retail Experience
        </Animated.Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.dotsContainer}>
            <Animated.Text style={[styles.dot, { opacity: dotOpacity1 }]}>●</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: dotOpacity2 }]}>●</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: dotOpacity3 }]}>●</Animated.Text>
          </View>
        </View>

        {/* Bottom branding */}
        <Animated.Text style={[styles.branding, { opacity: subtitleOpacity }]}>
          Powered by AI
        </Animated.Text>
      </LinearGradient>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.05)',
  },
  decorCircle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.3,
    left: -width * 0.25,
  },
  decorCircle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.4,
    right: -width * 0.3,
    borderColor: 'rgba(0, 212, 170, 0.05)',
  },
  decorCircle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.2,
    right: -width * 0.4,
    borderColor: 'rgba(123, 104, 238, 0.05)',
  },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: COLORS.primaryGlow,
    position: 'absolute',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...{
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSmart: {
    fontSize: 42,
    ...FONTS.extraBold,
    color: COLORS.textPrimary,
    letterSpacing: 8,
  },
  titleCheckout: {
    fontSize: 20,
    ...FONTS.light,
    color: COLORS.primary,
    letterSpacing: 12,
    marginTop: -5,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    letterSpacing: 2,
    marginTop: 12,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    width: width * 0.6,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    fontSize: 6,
    color: COLORS.primary,
  },
  branding: {
    position: 'absolute',
    bottom: 50,
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    ...FONTS.regular,
    letterSpacing: 3,
  },
});

export default SplashScreen;

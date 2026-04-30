import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, SIZES, SHADOWS } from '../theme';

const GuardPanelScreen = ({ navigation }) => {
  const { COLORS } = useTheme();
  const { user, logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);



  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View>
              <Text style={[styles.greeting, { color: COLORS.textSecondary }]}>
                Good Day, {user?.name ? user.name.split(' ')[0] : 'Guard'}
              </Text>
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Guard Dashboard</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.profileButton, { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.cardBorder }]} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, opacity: fadeAnim }]}>
            <Ionicons name="shield-checkmark-outline" size={80} color={COLORS.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: SIZES.xl, ...FONTS.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 10 }}>
              Security Panel
            </Text>
            <Text style={{ fontSize: SIZES.md, ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center' }}>
              Your features will appear here. Monitor checkouts and scan exit receipts to ensure security.
            </Text>
            
            <TouchableOpacity 
              style={{ marginTop: 40, width: '100%', borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium }}
              onPress={() => navigation.navigate('ExitVerification')}
            >
              <LinearGradient colors={[COLORS.primary, '#FF4500']} style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: SIZES.lg, ...FONTS.bold }}>Verify Exit Receipts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 24 },
  greeting: { fontSize: SIZES.md, ...FONTS.regular },
  headerTitle: { fontSize: SIZES.xxxl, ...FONTS.bold, marginTop: 2 },
  profileButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  logoutButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

export default GuardPanelScreen;

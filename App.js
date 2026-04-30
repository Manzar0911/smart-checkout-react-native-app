import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import ExitVerificationScreen from '../screens/ExitVerificationScreen';
import UserExitPassScreen from '../screens/UserExitPassScreen';
import AllProductsScreen from '../screens/AllProductsScreen';
import AllOffersScreen from '../screens/AllOffersScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import GuardPanelScreen from '../screens/GuardPanelScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import AdminCreateProductScreen from '../screens/AdminCreateProductScreen';
import AdminOffersScreen from '../screens/AdminOffersScreen';
import AdminCreateOfferScreen from '../screens/AdminCreateOfferScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminCreateUserScreen from '../screens/AdminCreateUserScreen';
import AdminBarcodeScreen from '../screens/AdminBarcodeScreen';
import AdminVendorBillScreen from '../screens/AdminVendorBillScreen';
import AdminPastBillsScreen from '../screens/AdminPastBillsScreen';
import AdminInventoryScreen from '../screens/AdminInventoryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0A0E1A' },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Receipt"
          component={ReceiptScreen}
          options={{ animation: 'fade_from_bottom' }}
        />
        <Stack.Screen
          name="ExitVerification"
          component={ExitVerificationScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="UserExitPass"
          component={UserExitPassScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="AllProducts"
          component={AllProductsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AllOffers"
          component={AllOffersScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AdminPanel"
          component={AdminPanelScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="GuardPanel"
          component={GuardPanelScreen}
          options={{ animation: 'slide_from_right' }}
        />
        
        {/* Admin Sub-Screens */}
        <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
        <Stack.Screen name="AdminCreateProduct" component={AdminCreateProductScreen} />
        <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
        <Stack.Screen name="AdminCreateOffer" component={AdminCreateOfferScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminCreateUser" component={AdminCreateUserScreen} />
        <Stack.Screen name="AdminBarcode" component={AdminBarcodeScreen} />
        <Stack.Screen name="AdminVendorBill" component={AdminVendorBillScreen} />
        <Stack.Screen name="AdminPastBills" component={AdminPastBillsScreen} />
        <Stack.Screen name="AdminInventory" component={AdminInventoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

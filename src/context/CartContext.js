import React, { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { offersAPI, cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      const stockLimit = action.payload.stock ?? action.payload.quantity_in_stock ?? Infinity;
      if (existingIndex >= 0) {
        const currentQty = state.items[existingIndex].quantity;
        if (currentQty >= stockLimit) return state; // Already at stock limit
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: currentQty + 1,
        };
        return { ...state, items: updatedItems };
      }
      if (stockLimit <= 0) return state; // Out of stock
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case 'INCREMENT': {
      const updatedItems = state.items.map((item) => {
        if (item.id !== action.payload) return item;
        const stockLimit = item.stock ?? item.quantity_in_stock ?? Infinity;
        if (item.quantity >= stockLimit) return item; // Cap at stock
        return { ...item, quantity: item.quantity + 1 };
      });
      return { ...state, items: updatedItems };
    }
    case 'DECREMENT': {
      const updatedItems = state.items
        .map((item) =>
          item.id === action.payload
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
      return { ...state, items: updatedItems };
    }
    case 'CLEAR_CART':
      return { ...state, items: [], coupon: null };
    case 'SET_PAYMENT_STATUS':
      return { ...state, paymentStatus: action.payload };
    case 'SET_VERIFIED':
      return { ...state, isVerified: action.payload };
    case 'SET_RECEIPT':
      return { ...state, receipt: action.payload };
    case 'APPLY_COUPON':
      return { ...state, coupon: action.payload };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null };
    case 'ADD_ORDER':
      return { ...state, pastOrders: [action.payload, ...state.pastOrders] };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_CUSTOMER_INFO':
      return { ...state, customerInfo: action.payload };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  paymentStatus: null, // null | 'processing' | 'success' | 'failed'
  isVerified: false,
  receipt: null,
  coupon: null, // e.g. { code: 'FLAT50', type: 'fixed', value: 50 }
  pastOrders: [],
  customerInfo: { phone: '', name: '' },
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isLoggedIn } = useAuth();
  const isInitialMount = useRef(true);
  const isSyncing = useRef(false);
  const hasFetched = useRef(false);

  // Load cart from backend on login
  useEffect(() => {
    const loadCart = async () => {
      if (isLoggedIn) {
        try {
          const backendItems = await cartAPI.get();
          if (backendItems && backendItems.length > 0) {
            // We could merge here, but for simplicity let's replace
            // or merge if local cart has items
            dispatch({ type: 'SET_ITEMS', payload: backendItems });
          }
          hasFetched.current = true;
        } catch (error) {
          console.error('Failed to load cart from backend:', error);
          // Even if it fails, we set it to true to allow local changes to be saved
          // Or we could keep it false to prevent overwriting. 
          // Setting it to true here allows the user to still use the cart locally.
          hasFetched.current = true;
        }
      } else {
        dispatch({ type: 'CLEAR_CART' });
        hasFetched.current = false;
        isInitialMount.current = true; // Reset initial mount so next login skip works
      }
    };

    loadCart();
  }, [isLoggedIn]);

  // Sync cart to backend on changes
  useEffect(() => {
    // Skip if not logged in or not yet fetched from backend
    if (!isLoggedIn || !hasFetched.current) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const syncCart = async () => {
      if (isLoggedIn && !isSyncing.current) {
        try {
          isSyncing.current = true;
          await cartAPI.sync(state.items);
        } catch (error) {
          console.error('Failed to sync cart to backend:', error);
        } finally {
          isSyncing.current = false;
        }
      }
    };

    // Small delay to debounce sync calls
    const timer = setTimeout(syncCart, 1000);
    return () => clearTimeout(timer);
  }, [state.items, isLoggedIn]);

  const cartOriginalTotal = useMemo(() => {
    return state.items.reduce(
      (total, item) => total + item.originalPrice * item.quantity,
      0
    );
  }, [state.items]);

  const cartItemsTotal = useMemo(() => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [state.items]);

  const couponDiscount = useMemo(() => {
    if (!state.coupon) return 0;
    if (state.coupon.type === 'fixed') {
      return state.coupon.value;
    } else if (state.coupon.type === 'percent') {
      return cartItemsTotal * (state.coupon.value / 100);
    }
    return 0;
  }, [state.coupon, cartItemsTotal]);

  const cartTotal = useMemo(() => {
    const total = cartItemsTotal - couponDiscount;
    return total > 0 ? total : 0;
  }, [cartItemsTotal, couponDiscount]);

  const totalSavings = useMemo(() => {
    return (cartOriginalTotal - cartItemsTotal) + couponDiscount;
  }, [cartOriginalTotal, cartItemsTotal, couponDiscount]);

  const itemCount = useMemo(() => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  }, [state.items]);

  const addItem = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const increment = (id) => {
    dispatch({ type: 'INCREMENT', payload: id });
  };

  // Alias expected by CartScreen
  const incrementQuantity = increment;

  const decrement = (id) => {
    dispatch({ type: 'DECREMENT', payload: id });
  };

  // Alias expected by CartScreen
  const decrementQuantity = decrement;

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: { phone: '', name: '' } });
  };

  const setPaymentStatus = (status) => {
    dispatch({ type: 'SET_PAYMENT_STATUS', payload: status });
  };

  const setVerified = (status) => {
    dispatch({ type: 'SET_VERIFIED', payload: status });
  };

  const setReceipt = (receipt) => {
    dispatch({ type: 'SET_RECEIPT', payload: receipt });
    if (receipt) {
      dispatch({ type: 'ADD_ORDER', payload: receipt });
    }
  };

  const setCustomerInfo = (phone, name) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: { phone, name } });
  };



  const applyCoupon = async (code) => {
    try {
      const data = await offersAPI.validateCoupon(code);
      if (data.valid && data.coupon) {
        dispatch({ type: 'APPLY_COUPON', payload: { code: data.coupon.code, type: data.coupon.type, value: data.coupon.value } });
        return true;
      }
      return false;
    } catch (error) {
      // Coupon invalid
      return false;
    }
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        cartTotal,
        cartOriginalTotal,
        cartItemsTotal,
        totalSavings,
        couponDiscount,
        itemCount,
        addItem,
        removeItem,
        increment,
        incrementQuantity,
        decrement,
        decrementQuantity,
        clearCart,
        setPaymentStatus,
        setVerified,
        setReceipt,
        applyCoupon,
        removeCoupon,
        setCustomerInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

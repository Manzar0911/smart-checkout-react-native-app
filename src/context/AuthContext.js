import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setToken, getToken, clearToken } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

const initialState = {
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: true, // true while checking stored token
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for stored token on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Verify token is still valid
        const data = await authAPI.getMe();
        dispatch({
          type: 'LOGIN',
          payload: { user: data.user, token },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      // Token expired or invalid
      await clearToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    await setToken(data.token);
    dispatch({
      type: 'LOGIN',
      payload: { user: data.user, token: data.token },
    });
    return data;
  };

  const signup = async (name, email, phone, password, address) => {
    const data = await authAPI.signup(name, email, phone, password, address);
    await setToken(data.token);
    dispatch({
      type: 'LOGIN',
      payload: { user: data.user, token: data.token },
    });
    return data;
  };

  const sendOtp = async (phone) => {
    return await authAPI.sendOtp(phone);
  };

  const verifyOtp = async (phone, otp) => {
    const data = await authAPI.verifyOtp(phone, otp);
    await setToken(data.token);
    dispatch({
      type: 'LOGIN',
      payload: { user: data.user, token: data.token },
    });
    return data;
  };

  const completeProfile = async (name, email, address) => {
    const data = await authAPI.completeProfile(name, email, address);
    dispatch({
      type: 'SET_USER',
      payload: data.user,
    });
    return data;
  };

  const logout = async () => {
    await clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        checkAuth,
        sendOtp,
        verifyOtp,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

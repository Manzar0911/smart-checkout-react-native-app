import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's IP if testing on physical device
// Production: 'https://smart-checkout-app-apis.onrender.com'
// const BASE_URL = 'http://192.168.31.171:5000';
// const BASE_URL = 'https://329a-152-59-34-244.ngrok-free.app';
const BASE_URL = 'https://smart-checkout-app-apis.onrender.com';

const TOKEN_KEY = 'smart_self_checkout_auth_token';

// --- Token management ---
let cachedToken = null;

export const setToken = async (token) => {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

export const getToken = async () => {
  if (cachedToken) return cachedToken;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  cachedToken = token;
  return token;
};

export const clearToken = async () => {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// --- API helper ---
const apiCall = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Request failed' };
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network error
    throw { status: 0, message: 'Network error. Please check your connection.' };
  }
};

const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => apiCall(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
};

export default api;

// --- Auth API ---
export const authAPI = {
  // Email/Phone password auth
  signup: (name, email, phone, password, address) =>
    apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, address }),
    }),

  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // OTP flow
  sendOtp: (phone) =>
    apiCall('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone, otp) =>
    apiCall('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  completeProfile: (name, email, address) =>
    apiCall('/api/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ name, email, address }),
    }),

  getMe: () => apiCall('/api/auth/me'),
  getUserByPhone: (phone) => apiCall(`/api/auth/phone/${phone}`),
};

// --- Products API ---
export const productsAPI = {
  getAll: () => apiCall('/api/products'),
  getByBarcode: (barcode) => apiCall(`/api/products/${barcode}`),
  create: (data) => api.post('/api/products', data),
  generateBarcode: (id, data) => api.post(`/api/products/${id}/barcode`, data),
  mapBarcode: (data) => api.post('/api/products/map-barcode', data),
  updateBarcode: (barcode, data) => api.put(`/api/products/barcode/${barcode}`, data),
  deleteBarcode: (barcode) => api.delete(`/api/products/barcode/${barcode}`),
  getBarcodeList: (page = 1, limit = 50) => apiCall(`/api/products/barcodes/list?page=${page}&limit=${limit}`),
};

// --- Offers API ---
export const offersAPI = {
  getAll: () => apiCall('/api/offers'),
  validateCoupon: (code) =>
    apiCall('/api/offers/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

// --- Orders API ---
export const ordersAPI = {
  create: (orderData) =>
    apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getAll: () => apiCall('/api/orders'),
  getById: (id) => apiCall(`/api/orders/${id}`),
  getOrderForVerification: (id) => apiCall(`/api/orders/verify/${id}`),
  verifyOrder: (id) => apiCall(`/api/orders/verify/${id}`, { method: 'PUT' }),
};

// --- Cart API ---
export const cartAPI = {
  get: () => apiCall('/api/cart'),
  sync: (items) =>
    apiCall('/api/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  clear: () => apiCall('/api/cart', { method: 'DELETE' }),
};

// --- Categories API ---
export const categoriesAPI = {
  getAll: () => apiCall('/api/categories'),
};

// --- Payment API ---
export const paymentAPI = {
  createOrder: (amount, currency = 'INR', receipt = '') =>
    apiCall('/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, receipt }),
    }),
  verify: (data) =>
    apiCall('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Upload API ---
export const uploadAPI = {
  uploadImages: async (images) => {
    const token = await getToken();
    const formData = new FormData();
    images.forEach((img, index) => {
      formData.append('images', {
        uri: img.uri,
        name: `image_${index}.jpg`,
        type: 'image/jpeg',
      });
    });

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  }
};

// --- Inventory API ---
export const inventoryAPI = {
  getProducts: () => apiCall('/api/inventory/products'),
  updateStock: (data) => api.post('/api/inventory/update', data),
  getHistory: (page = 1, limit = 20, productId = null) =>
    apiCall(`/api/inventory/history?page=${page}&limit=${limit}${productId ? `&productId=${productId}` : ''}`),
};

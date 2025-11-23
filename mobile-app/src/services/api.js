import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình API endpoint
const API_URL = 'http://localhost:3000'; // Thay đổi thành URL server của bạn

// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, xóa và yêu cầu đăng nhập lại
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  // Đăng ký user mới
  register: async (username, password, email) => {
    const response = await api.post('/api/auth/register', {
      username,
      password,
      email,
    });
    return response.data;
  },

  // Đăng nhập
  login: async (username, password) => {
    const response = await api.post('/api/auth/login-auth', {
      username,
      password,
    });
    return response.data;
  },
};

// Token APIs
export const tokenAPI = {
  // Đăng ký push token
  registerToken: async (token, deviceInfo) => {
    const response = await api.post('/api/tokens/login', {
      token,
      deviceInfo,
    });
    return response.data;
  },

  // Hủy đăng ký push token
  unregisterToken: async (token) => {
    const response = await api.post('/api/tokens/logout', {
      token,
    });
    return response.data;
  },

  // Lấy danh sách tokens của user
  getMyTokens: async () => {
    const response = await api.get('/api/tokens/my-tokens');
    return response.data;
  },
};

export default api;

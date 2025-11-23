import React, { createContext, useState, useContext, useEffect } from 'react';
import StorageService from '../services/storage';
import { authAPI } from '../services/api';
import NotificationService from '../services/notification';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Kiểm tra authentication status khi app khởi động
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await StorageService.getAuthToken();
      const userData = await StorageService.getUserData();

      if (token && userData) {
        setAuthToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập
   * Luồng 1: Admin Đăng nhập và Đăng ký Thiết bị
   */
  const login = async (username, password) => {
    try {
      // Bước 1: Đăng nhập với server
      const response = await authAPI.login(username, password);
      
      // Bước 2: Lưu token và user data
      await StorageService.saveAuthToken(response.token);
      await StorageService.saveUserData(response.user);
      
      setAuthToken(response.token);
      setUser(response.user);

      // Bước 3: Đăng ký push notification
      try {
        await NotificationService.registerForPushNotifications();
      } catch (notifError) {
        console.error('Error registering push notifications:', notifError);
        // Không throw error vì đăng nhập vẫn thành công
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Đăng nhập thất bại',
      };
    }
  };

  /**
   * Đăng xuất
   * Luồng 3: Admin Đăng xuất
   */
  const logout = async () => {
    try {
      // Bước 1: Hủy đăng ký push token
      try {
        await NotificationService.unregisterPushToken();
      } catch (notifError) {
        console.error('Error unregistering push token:', notifError);
        // Tiếp tục logout dù có lỗi
      }

      // Bước 2: Xóa dữ liệu local
      await StorageService.clearAll();

      // Bước 3: Reset state
      setAuthToken(null);
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Đăng xuất thất bại',
      };
    }
  };

  /**
   * Đăng ký
   */
  const register = async (username, password, email) => {
    try {
      await authAPI.register(username, password, email);
      
      // Tự động đăng nhập sau khi đăng ký thành công
      return await login(username, password);
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Đăng ký thất bại',
      };
    }
  };

  const value = {
    user,
    authToken,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

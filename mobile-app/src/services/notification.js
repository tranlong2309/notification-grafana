import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import StorageService from './storage';
import { tokenAPI } from './api';

// Cấu hình cách hiển thị notification khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Đăng ký nhận push notifications
   * Luồng 1: Lấy ExpoPushToken và đăng ký với server
   */
  async registerForPushNotifications() {
    let token;

    try {
      // Kiểm tra xem có phải thiết bị thật không
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Kiểm tra và yêu cầu quyền
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.error('Failed to get push notification permissions');
        return null;
      }

      // Lấy Expo Push Token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Thay bằng project ID từ app.json
      })).data;

      console.log('Expo Push Token:', token);

      // Cấu hình notification channel cho Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Lưu token vào storage
      await StorageService.savePushToken(token);

      // Đăng ký token với API server
      await this.registerTokenWithServer(token);

      this.expoPushToken = token;
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  }

  /**
   * Đăng ký token với API server
   */
  async registerTokenWithServer(token) {
    try {
      const deviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
      };

      await tokenAPI.registerToken(token, deviceInfo);
      console.log('Token registered with server successfully');
    } catch (error) {
      console.error('Error registering token with server:', error);
      throw error;
    }
  }

  /**
   * Hủy đăng ký push token
   * Luồng 3: Hủy đăng ký khi logout
   */
  async unregisterPushToken() {
    try {
      const token = await StorageService.getPushToken();
      
      if (token) {
        // Hủy đăng ký với server
        await tokenAPI.unregisterToken(token);
        console.log('Token unregistered from server successfully');
      }

      // Xóa token khỏi storage
      await StorageService.removePushToken();
      
      // Hủy các listeners
      this.removeNotificationListeners();
      
      this.expoPushToken = null;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }

  /**
   * Thiết lập listeners cho notifications
   */
  setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    // Listener khi nhận notification (app đang mở)
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        
        // Lưu notification vào storage
        this.saveNotificationToHistory(notification);
        
        // Callback
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listener khi user tương tác với notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        
        // Callback
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      }
    );
  }

  /**
   * Xóa notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Lưu notification vào lịch sử
   */
  async saveNotificationToHistory(notification) {
    try {
      const notifications = await StorageService.getNotifications();
      
      const newNotification = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        timestamp: new Date().toISOString(),
      };

      notifications.unshift(newNotification);

      // Giới hạn 100 notifications
      if (notifications.length > 100) {
        notifications.length = 100;
      }

      await StorageService.saveNotifications(notifications);
    } catch (error) {
      console.error('Error saving notification to history:', error);
    }
  }

  /**
   * Lấy danh sách notifications từ storage
   */
  async getNotificationHistory() {
    try {
      return await StorageService.getNotifications();
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Xóa lịch sử notifications
   */
  async clearNotificationHistory() {
    try {
      await StorageService.clearNotifications();
    } catch (error) {
      console.error('Error clearing notification history:', error);
      throw error;
    }
  }

  /**
   * Hiển thị local notification (để test)
   */
  async scheduleLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Hiển thị ngay lập tức
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();

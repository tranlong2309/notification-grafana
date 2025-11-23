import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import NotificationService from '../services/notification';

export default function HomeScreen() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Setup notification listeners
    NotificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return () => {
      // Cleanup listeners
      NotificationService.removeNotificationListeners();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const history = await NotificationService.getNotificationHistory();
      setNotifications(history);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationReceived = (notification) => {
    // Reload danh sách khi có notification mới
    loadNotifications();
  };

  const handleNotificationResponse = (response) => {
    // Xử lý khi user tap vào notification
    console.log('User tapped notification:', response);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc muốn xóa tất cả thông báo?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.clearNotificationHistory();
              setNotifications([]);
              Alert.alert('Thành công', 'Đã xóa lịch sử thông báo');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa lịch sử');
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      await NotificationService.scheduleLocalNotification(
        'Test Notification',
        'Đây là thông báo test từ app',
        { test: true }
      );
      Alert.alert('Thành công', 'Đã gửi thông báo test');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi thông báo test');
    }
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleString('vi-VN')}
        </Text>
      </View>
      <Text style={styles.notificationBody} numberOfLines={3}>
        {item.body}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>Chưa có thông báo nào</Text>
      <TouchableOpacity
        style={styles.testButton}
        onPress={handleTestNotification}
      >
        <Text style={styles.testButtonText}>Gửi thông báo test</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearButton}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

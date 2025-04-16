import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notifications with alarm sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: 'max',
  }),
});

const SNOOZE_DURATION = 10; // 10 minutes
const MAX_SNOOZES = 2;

export const NotificationService = {
  // Store notification data with snooze count
  async storeNotificationData(notificationId, medicationId) {
    try {
      const key = `notification_${notificationId}`;
      const data = {
        medicationId,
        snoozesLeft: MAX_SNOOZES,
        lastSnoozeTime: null,
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing notification data:', error);
    }
  },

  // Get notification data
  async getNotificationData(notificationId) {
    try {
      const key = `notification_${notificationId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting notification data:', error);
      return null;
    }
  },

  // Update snooze count
  async updateSnoozeCount(notificationId) {
    try {
      const data = await this.getNotificationData(notificationId);
      if (!data) {
        return { snoozesLeft: 0, success: false };
      }

      if (data.snoozesLeft <= 0) {
        return { snoozesLeft: 0, success: false };
      }

      data.snoozesLeft -= 1;
      data.lastSnoozeTime = new Date().toISOString();
      await AsyncStorage.setItem(`notification_${notificationId}`, JSON.stringify(data));
      
      return { snoozesLeft: data.snoozesLeft, success: true };
    } catch (error) {
      console.error('Error updating snooze count:', error);
      return { snoozesLeft: 0, success: false };
    }
  },

  // Schedule a medication reminder
  async scheduleMedicationReminder(medication) {
    if (Platform.OS === 'web') {
      console.log('Notifications are not supported on web platform');
      return;
    }

    try {
      const times = medication.frequency.split(',').map(time => time.trim());
      const notifications = [];
      
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        // Calculate next occurrence of this time
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed for today, schedule for tomorrow
        if (scheduledTime < new Date()) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 Medication Reminder',
            body: `Time to take ${medication.name} - ${medication.dosage}`,
            data: {
              type: 'medication-reminder',
              medicationId: medication._id,
              time: time,
              name: medication.name,
              dosage: medication.dosage,
            },
            sound: true,
            priority: 'max',
            vibrate: [0, 250, 250, 250],
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });

        await this.storeNotificationData(notificationId, medication._id);
        notifications.push(notificationId);
      }
      
      // Store all notification IDs for this medication
      await AsyncStorage.setItem(
        `medication_notifications_${medication._id}`,
        JSON.stringify(notifications)
      );
      
      return true;
    } catch (error) {
      console.error('Error scheduling medication reminder:', error);
      return false;
    }
  },

  // Snooze a notification
  async snoozeNotification(notificationId) {
    if (Platform.OS === 'web') {
      console.log('Notifications are not supported on web platform');
      return { success: true };
    }

    try {
      // Check and update snooze count
      const snoozeResult = await this.updateSnoozeCount(notificationId);
      if (!snoozeResult.success) {
        return { 
          success: false, 
          message: 'Maximum snoozes reached (2 times). Please take your medication.' 
        };
      }

      // Get the original notification
      const notification = await Notifications.getNotificationAsync(notificationId);
      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      // Schedule a new notification for 10 minutes later
      const newNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          ...notification.request.content,
          title: '🔔 Snoozed Reminder',
          body: `${notification.request.content.body} (Snooze ${2 - snoozeResult.snoozesLeft}/2)`,
        },
        trigger: { seconds: SNOOZE_DURATION * 60 },
      });

      // Store data for the new notification
      await this.storeNotificationData(newNotificationId, notification.request.content.data.medicationId);

      return { 
        success: true, 
        snoozesLeft: snoozeResult.snoozesLeft,
        newNotificationId
      };
    } catch (error) {
      console.error('Error snoozing notification:', error);
      return { success: false, message: error.message };
    }
  },

  // Mark medication as taken
  async markMedicationAsTaken(notificationId) {
    if (Platform.OS === 'web') {
      console.log('Notifications are not supported on web platform');
      return { success: true };
    }

    try {
      // Get notification data to clean up storage
      const data = await this.getNotificationData(notificationId);
      if (data) {
        await AsyncStorage.removeItem(`notification_${notificationId}`);
      }

      // Cancel the notification
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      return { success: false, message: error.message };
    }
  },

  // Cancel all notifications for a medication
  async cancelMedicationNotifications(medicationId) {
    if (Platform.OS === 'web') {
      console.log('Notifications are not supported on web platform');
      return true;
    }

    try {
      // Get all notification IDs for this medication
      const notificationIds = JSON.parse(
        await AsyncStorage.getItem(`medication_notifications_${medicationId}`)
      );

      if (notificationIds) {
        // Cancel each notification and clean up storage
        await Promise.all(notificationIds.map(async (id) => {
          await Notifications.cancelScheduledNotificationAsync(id);
          await AsyncStorage.removeItem(`notification_${id}`);
        }));
        
        // Clean up medication notifications storage
        await AsyncStorage.removeItem(`medication_notifications_${medicationId}`);
      }
      return true;
    } catch (error) {
      console.error('Error canceling medication notifications:', error);
      return false;
    }
  },
}; 
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notifications';

export default function NotificationHandler() {
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions!');
        return;
      }

      // Initialize notification service
      console.log('Initializing notification service...');
      await NotificationService.initialize();
      console.log('Notification service initialized');

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        }),
      });

      // Set up notification categories for iOS
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('medication-reminder', [
          {
            identifier: 'mark-taken',
            buttonTitle: 'Mark as Taken',
            options: {
              isAuthenticationRequired: false,
              isDestructive: false,
            },
          },
          {
            identifier: 'snooze',
            buttonTitle: 'Snooze (30s)',
            options: {
              isAuthenticationRequired: false,
              isDestructive: false,
            },
          },
          {
            identifier: 'mark-missed',
            buttonTitle: 'Mark as Not Taken',
            options: {
              isAuthenticationRequired: false,
              isDestructive: true,
            },
          },
        ]);
      }

      // Set up notification response handler
      const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const { notification } = response;
        const { data } = notification.request.content;
        
        if (data.type === 'medication-reminder') {
          const actionIdentifier = response.actionIdentifier;
          let result;
          
          switch (actionIdentifier) {
            case 'mark-taken':
              result = await NotificationService.markMedicationAsTaken(notification.request.identifier);
              if (result.success) {
                Alert.alert('Medication Status', result.message);
              } else {
                Alert.alert('Error', result.message || 'Failed to mark medication as taken');
              }
              break;
            case 'snooze':
              result = await NotificationService.snoozeNotification(notification.request.identifier);
              if (result.success) {
                Alert.alert('Snooze', result.message);
              } else {
                Alert.alert('Error', result.message || 'Failed to snooze medication');
              }
              break;
            case 'mark-missed':
              result = await NotificationService.markMedicationAsMissed(notification.request.identifier);
              if (result.success) {
                Alert.alert('Medication Status', result.message);
              } else {
                Alert.alert('Error', result.message || 'Failed to mark medication as missed');
              }
              break;
            default:
              // Handle default tap
              showMedicationReminderDialog(notification);
              break;
          }
        }
      });

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const showMedicationReminderDialog = async (notification) => {
    const { data } = notification.request.content;
    
    // Show alert dialog
    Alert.alert(
      'Medication Reminder',
      `Time to take ${data.name}`,
      [
        {
          text: 'Mark as Taken',
          onPress: async () => {
            const result = await NotificationService.markMedicationAsTaken(notification.request.identifier);
            if (result.success) {
              Alert.alert('Medication Status', result.message);
            } else {
              Alert.alert('Error', result.message || 'Failed to mark medication as taken');
            }
          },
        },
        {
          text: 'Snooze (30s)',
          onPress: async () => {
            const result = await NotificationService.snoozeNotification(notification.request.identifier);
            if (result.success) {
              Alert.alert('Snooze', result.message);
            } else {
              Alert.alert('Error', result.message || 'Failed to snooze medication');
            }
          },
        },
        {
          text: 'Mark as Not Taken',
          onPress: async () => {
            const result = await NotificationService.markMedicationAsMissed(notification.request.identifier);
            if (result.success) {
              Alert.alert('Medication Status', result.message);
            } else {
              Alert.alert('Error', result.message || 'Failed to mark medication as missed');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return null;
} 
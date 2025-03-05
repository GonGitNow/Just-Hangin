import * as Notifications from 'expo-notifications';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { UserProfile, NotificationType } from '../types';

export class NotificationService {
  /**
   * Send a notification about a new hangout
   * @param creatorId ID of the user who created the hangout
   * @param targetUserId ID of the user to notify
   * @param pinId ID of the created pin
   * @param title Title of the hangout
   * @param isPersonalInvite Whether this is a personal invite or a general friend notification
   */
  static async sendNewHangoutNotification(
    creatorId: string,
    targetUserId: string,
    pinId: string,
    title: string,
    isPersonalInvite: boolean
  ): Promise<void> {
    try {
      // Get the target user's profile to check notification preferences
      const userRef = doc(firestore, 'users', targetUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('User not found:', targetUserId);
        return;
      }
      
      const userData = userDoc.data() as UserProfile;
      const notificationPrefs = userData.preferences?.notifications;
      
      // Check if notifications are enabled and the specific type is enabled
      if (!notificationPrefs?.enabled) return;
      if (isPersonalInvite && !notificationPrefs.personalInvites) return;
      if (!isPersonalInvite && !notificationPrefs.friendHangouts) return;
      
      // Get creator's name
      const creatorRef = doc(firestore, 'users', creatorId);
      const creatorDoc = await getDoc(creatorRef);
      const creatorName = creatorDoc.exists() ? creatorDoc.data().displayName : 'Someone';
      
      // Send the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isPersonalInvite ? 'New Hangout Invitation' : 'New Friend Hangout',
          body: isPersonalInvite
            ? `${creatorName} invited you to "${title}"`
            : `${creatorName} created a new hangout: "${title}"`,
          data: {
            type: NotificationType.NEW_PIN,
            pinId,
            creatorId,
          },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending hangout notification:', error);
    }
  }

  /**
   * Send notifications to all users who should be notified about a new hangout
   * @param creatorId ID of the user who created the hangout
   * @param pinId ID of the created pin
   * @param title Title of the hangout
   * @param visibleTo Array of user IDs who can see the pin
   * @param selectedFriends Array of user IDs who were specifically selected
   */
  static async sendHangoutNotifications(
    creatorId: string,
    pinId: string,
    title: string,
    visibleTo: string[],
    selectedFriends: string[]
  ): Promise<void> {
    try {
      // Send notifications to all visible users
      for (const userId of visibleTo) {
        if (userId === creatorId) continue; // Don't notify the creator
        
        // Check if this user was specifically selected
        const isPersonalInvite = selectedFriends.includes(userId);
        
        await this.sendNewHangoutNotification(
          creatorId,
          userId,
          pinId,
          title,
          isPersonalInvite
        );
      }
    } catch (error) {
      console.error('Error sending hangout notifications:', error);
    }
  }
} 
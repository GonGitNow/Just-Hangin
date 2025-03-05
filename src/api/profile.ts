import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { UserProfile } from '../types';

/**
 * Create a new user profile
 * @param userId User ID
 * @param profileData User profile data
 */
export const createUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const userData = {
      id: userId,
      displayName: profileData.displayName || '',
      email: profileData.email || '',
      photoURL: profileData.photoURL || '',
      location: profileData.location || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      privacySettings: profileData.privacySettings || {
        shareLocationWithFriends: true,
        allowFriendRequests: true,
        showActiveStatus: true,
      },
    };
    
    await setDoc(userRef, userData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get a user profile by ID
 * @param userId User ID
 * @returns User profile or null if not found
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      id: userDoc.id,
      displayName: userData.displayName || '',
      email: userData.email || '',
      photoURL: userData.photoURL || '',
      location: userData.location || '',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      lastActive: userData.lastActive?.toDate() || new Date(),
      preferences: userData.preferences || {
        darkMode: false,
        notifications: true,
      },
      privacySettings: userData.privacySettings || {
        shareLocationWithFriends: true,
        allowFriendRequests: true,
        showActiveStatus: true,
      },
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update a user profile
 * @param userId User ID
 * @param profileData Profile data to update
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile does not exist');
    }
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Add fields to update
    if (profileData.displayName !== undefined) {
      updateData.displayName = profileData.displayName;
    }
    
    if (profileData.photoURL !== undefined) {
      updateData.photoURL = profileData.photoURL;
    }
    
    if (profileData.location !== undefined) {
      updateData.location = profileData.location;
    }
    
    if (profileData.privacySettings !== undefined) {
      updateData.privacySettings = profileData.privacySettings;
    }

    if (profileData.preferences !== undefined) {
      updateData.preferences = profileData.preferences;
    }
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user's last active timestamp
 * @param userId User ID
 */
export const updateLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last active status:', error);
    throw error;
  }
};

/**
 * Update user's privacy settings
 * @param userId User ID
 * @param privacySettings Privacy settings to update
 */
export const updatePrivacySettings = async (
  userId: string,
  privacySettings: Partial<UserProfile['privacySettings']>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile does not exist');
    }
    
    const userData = userDoc.data();
    const currentSettings = userData.privacySettings || {
      shareLocationWithFriends: true,
      allowFriendRequests: true,
      showActiveStatus: true,
    };
    
    const updatedSettings = {
      ...currentSettings,
      ...privacySettings,
    };
    
    await updateDoc(userRef, {
      privacySettings: updatedSettings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }
};

/**
 * Search for users by display name
 * @param searchQuery Search query string
 * @param currentUserId Current user ID (to exclude from results)
 * @param limit Maximum number of results to return
 * @returns Array of user profiles
 */
export const searchUsersByName = async (
  searchQuery: string,
  currentUserId: string,
  resultLimit: number = 10
): Promise<UserProfile[]> => {
  try {
    // Firebase doesn't support case-insensitive search natively
    // This is a simple implementation that searches for names starting with the query
    // For a production app, consider using Algolia or a similar search service
    const searchQueryLower = searchQuery.toLowerCase();
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const matchingUsers: UserProfile[] = [];
    
    usersSnapshot.forEach((doc) => {
      if (doc.id === currentUserId) return;
      
      const userData = doc.data();
      const displayName = (userData.displayName || '').toLowerCase();
      
      if (displayName.includes(searchQueryLower)) {
        matchingUsers.push({
          id: doc.id,
          displayName: userData.displayName || '',
          email: userData.email || '',
          photoURL: userData.photoURL || '',
          location: userData.location || '',
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastActive: userData.lastActive?.toDate() || new Date(),
          privacySettings: userData.privacySettings || {
            shareLocationWithFriends: true,
            allowFriendRequests: true,
            showActiveStatus: true,
          },
        });
      }
    });
    
    // Sort by relevance (exact match first, then starts with, then includes)
    matchingUsers.sort((a, b) => {
      const aName = a.displayName.toLowerCase();
      const bName = b.displayName.toLowerCase();
      
      if (aName === searchQueryLower && bName !== searchQueryLower) return -1;
      if (bName === searchQueryLower && aName !== searchQueryLower) return 1;
      
      if (aName.startsWith(searchQueryLower) && !bName.startsWith(searchQueryLower)) return -1;
      if (bName.startsWith(searchQueryLower) && !aName.startsWith(searchQueryLower)) return 1;
      
      return aName.localeCompare(bName);
    });
    
    return matchingUsers.slice(0, resultLimit);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Delete a user's profile from Firestore
 * @param userId The ID of the user whose profile should be deleted
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}; 
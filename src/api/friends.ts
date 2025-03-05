import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Friendship, FriendRequest, User, FriendshipStatus } from '../types';

/**
 * Send a friend request
 * @param currentUserId Current user ID
 * @param friendId Friend user ID
 */
export const sendFriendRequest = async (
  currentUserId: string,
  friendId: string
): Promise<void> => {
  try {
    // Create friendship document ID (always in alphabetical order to ensure uniqueness)
    const friendshipId = [currentUserId, friendId].sort().join('_');
    
    // Check if friendship already exists
    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);
    
    if (friendshipDoc.exists()) {
      throw new Error('Friendship already exists');
    }
    
    // Create friendship document
    await setDoc(friendshipRef, {
      id: friendshipId,
      users: [currentUserId, friendId],
      senderId: currentUserId,
      receiverId: friendId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 * @param requestId Friend request ID
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    // Get friendship document
    const friendshipRef = doc(db, 'friendships', requestId);
    const friendshipDoc = await getDoc(friendshipRef);
    
    if (!friendshipDoc.exists()) {
      throw new Error('Friend request does not exist');
    }
    
    // Update friendship status
    await updateDoc(friendshipRef, {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject a friend request
 * @param requestId Friend request ID
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  try {
    // Get friendship document
    const friendshipRef = doc(db, 'friendships', requestId);
    const friendshipDoc = await getDoc(friendshipRef);
    
    if (!friendshipDoc.exists()) {
      throw new Error('Friend request does not exist');
    }
    
    // Update friendship status
    await updateDoc(friendshipRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Remove a friend
 * @param currentUserId Current user ID
 * @param friendId Friend user ID
 */
export const removeFriend = async (
  currentUserId: string,
  friendId: string
): Promise<void> => {
  try {
    // Create friendship document ID (always in alphabetical order to ensure uniqueness)
    const friendshipId = [currentUserId, friendId].sort().join('_');
    
    // Get friendship document
    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);
    
    if (!friendshipDoc.exists()) {
      throw new Error('Friendship does not exist');
    }
    
    // Delete friendship document
    await deleteDoc(friendshipRef);
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

/**
 * Get all friends for a user
 * @param userId User ID
 * @returns Array of friend user IDs
 */
export const getFriends = async (userId: string): Promise<string[]> => {
  try {
    // Query friendships where the user is involved and status is accepted
    const q1 = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'accepted')
    );
    
    const friendshipsSnapshot = await getDocs(q1);
    const friendIds: string[] = [];
    
    // Extract friend IDs
    friendshipsSnapshot.forEach((doc) => {
      const friendship = doc.data();
      const users = friendship.users || [];
      const friendId = users.find((id: string) => id !== userId);
      if (friendId) {
        friendIds.push(friendId);
      }
    });
    
    return friendIds;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

/**
 * Get all friend requests for a user
 * @param userId User ID
 * @returns Array of friend requests
 */
export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    // Query friendships where the user is the receiver and status is pending
    const q = query(
      collection(db, 'friendships'),
      where('receiverId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const friendshipsSnapshot = await getDocs(q);
    const friendRequests: FriendRequest[] = [];
    
    // Extract friend requests
    for (const docSnapshot of friendshipsSnapshot.docs) {
      const friendship = docSnapshot.data();
      
      // Get sender's profile for display info
      const senderRef = doc(db, 'users', friendship.senderId);
      const senderDoc = await getDoc(senderRef);
      const senderData = senderDoc.data();
      
      friendRequests.push({
        id: docSnapshot.id,
        senderId: friendship.senderId,
        receiverId: friendship.receiverId,
        status: friendship.status,
        createdAt: friendship.createdAt?.toDate() || new Date(),
        updatedAt: friendship.updatedAt?.toDate() || new Date(),
        photoURL: senderData?.photoURL || '',
        displayName: senderData?.displayName || '',
      });
    }
    
    return friendRequests;
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw error;
  }
};

/**
 * Search for users by display name
 * @param query Search query
 * @param currentUserId Current user ID (to exclude from results)
 * @returns Array of users matching the query
 */
export const searchUsers = async (
  searchQuery: string,
  currentUserId: string
): Promise<User[]> => {
  try {
    // Query users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    
    // Filter users by display name (case insensitive)
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (
        doc.id !== currentUserId &&
        userData.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        users.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          profilePicture: userData.profilePicture || '',
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastActive: userData.lastActive?.toDate() || new Date(),
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Check friendship status between two users
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Friendship status or null if no friendship exists
 */
export const checkFriendshipStatus = async (
  userId1: string,
  userId2: string
): Promise<FriendshipStatus | null> => {
  try {
    // Create friendship document ID (always in alphabetical order to ensure uniqueness)
    const friendshipId = [userId1, userId2].sort().join('_');
    
    // Get friendship document
    const friendshipDoc = await getDoc(doc(db, 'friendships', friendshipId));
    
    if (!friendshipDoc.exists()) {
      return null;
    }
    
    const friendshipData = friendshipDoc.data();
    return friendshipData.status as FriendshipStatus;
  } catch (error) {
    console.error('Error checking friendship status:', error);
    throw error;
  }
}; 
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { LocationPin, PinCreationData } from '../types';
import { NotificationService } from '../services/NotificationService';

/**
 * Create a new location pin
 * @param userId User ID of the creator
 * @param pinData Pin data
 * @returns ID of the created pin
 */
export const createPin = async (
  userId: string,
  pinData: PinCreationData
): Promise<string> => {
  try {
    // Create pin document in Firestore
    const pinsCollection = collection(db, 'locationPins');
    
    const pinDoc = {
      createdBy: userId,
      location: pinData.location,
      title: pinData.title,
      note: pinData.note,
      address: pinData.address || null,
      hangoutTime: Timestamp.fromDate(pinData.hangoutTime),
      expiresAt: Timestamp.fromDate(pinData.expiresAt),
      visibleTo: pinData.visibleTo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(pinsCollection, pinDoc);
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });

    // Send notifications to friends
    await NotificationService.sendHangoutNotifications(
      userId,
      docRef.id,
      pinData.title,
      pinData.visibleTo,
      pinData.selectedFriends || []
    );
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating pin:', error);
    throw error;
  }
};

/**
 * Update an existing location pin
 * @param pinId Pin ID
 * @param pinData Pin data to update
 */
export const updatePin = async (
  pinId: string,
  pinData: Partial<PinCreationData>
): Promise<void> => {
  try {
    const pinRef = doc(db, 'locationPins', pinId);
    const pinDoc = await getDoc(pinRef);
    
    if (!pinDoc.exists()) {
      throw new Error('Pin does not exist');
    }
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Add fields to update
    if (pinData.title !== undefined) {
      updateData.title = pinData.title;
    }
    
    if (pinData.note !== undefined) {
      updateData.note = pinData.note;
    }
    
    if (pinData.location !== undefined) {
      updateData.location = pinData.location;
    }
    
    if (pinData.address !== undefined) {
      updateData.address = pinData.address;
    }
    
    if (pinData.hangoutTime !== undefined) {
      updateData.hangoutTime = Timestamp.fromDate(pinData.hangoutTime);
    }
    
    if (pinData.expiresAt !== undefined) {
      updateData.expiresAt = Timestamp.fromDate(pinData.expiresAt);
    }
    
    if (pinData.visibleTo !== undefined) {
      updateData.visibleTo = pinData.visibleTo;
    }
    
    await updateDoc(pinRef, updateData);
  } catch (error) {
    console.error('Error updating pin:', error);
    throw error;
  }
};

/**
 * Delete a location pin
 * @param pinId Pin ID
 */
export const deletePin = async (pinId: string): Promise<void> => {
  try {
    const pinRef = doc(db, 'locationPins', pinId);
    await deleteDoc(pinRef);
  } catch (error) {
    console.error('Error deleting pin:', error);
    throw error;
  }
};

/**
 * Get a single pin by ID
 * @param pinId Pin ID
 * @returns Pin data or null if not found
 */
export const getPinById = async (pinId: string): Promise<LocationPin | null> => {
  try {
    const pinRef = doc(db, 'locationPins', pinId);
    const pinDoc = await getDoc(pinRef);
    
    if (!pinDoc.exists()) {
      return null;
    }
    
    const pinData = pinDoc.data();
    
    return {
      id: pinDoc.id,
      createdBy: pinData.createdBy,
      location: pinData.location,
      title: pinData.title,
      note: pinData.note,
      hangoutTime: pinData.hangoutTime.toDate(),
      expiresAt: pinData.expiresAt.toDate(),
      visibleTo: pinData.visibleTo,
      createdAt: pinData.createdAt.toDate(),
      updatedAt: pinData.updatedAt.toDate(),
      checkedInUsers: pinData.checkedInUsers || [],
    };
  } catch (error) {
    console.error('Error getting pin:', error);
    return null;
  }
};

/**
 * Get all pins visible to a user
 * @param userId User ID
 * @returns Array of pins
 */
export const getPinsVisibleToUser = async (userId: string): Promise<LocationPin[]> => {
  try {
    console.log(`DIAGNOSTIC: getPinsVisibleToUser called for user ${userId}`);
    
    // First, get pins where the user is in the visibleTo array
    const visibleToQuery = query(
      collection(db, 'locationPins'),
      where('visibleTo', 'array-contains', userId)
    );
    
    // Second, get pins where the user is the creator
    const createdByQuery = query(
      collection(db, 'locationPins'),
      where('createdBy', '==', userId)
    );
    
    console.log(`DIAGNOSTIC: Executing Firestore queries for user ${userId}`);
    
    // Execute both queries
    const [visibleToSnapshot, createdBySnapshot] = await Promise.all([
      getDocs(visibleToQuery),
      getDocs(createdByQuery)
    ]);
    
    console.log(`DIAGNOSTIC: Query results - visibleTo: ${visibleToSnapshot.size}, createdBy: ${createdBySnapshot.size}`);
    
    // Create a map to deduplicate pins
    const pinsMap = new Map<string, LocationPin>();
    
    // Process pins visible to the user
    visibleToSnapshot.forEach((doc) => {
      const pinData = doc.data();
      console.log(`DIAGNOSTIC: Processing visibleTo pin ${doc.id} - ${pinData.title}`);
      
      try {
        pinsMap.set(doc.id, {
          id: doc.id,
          createdBy: pinData.createdBy,
          location: pinData.location,
          title: pinData.title,
          note: pinData.note,
          hangoutTime: pinData.hangoutTime.toDate(),
          expiresAt: pinData.expiresAt.toDate(),
          visibleTo: pinData.visibleTo,
          createdAt: pinData.createdAt.toDate(),
          updatedAt: pinData.updatedAt.toDate(),
          checkedInUsers: pinData.checkedInUsers || [],
        });
      } catch (error) {
        console.error(`DIAGNOSTIC: Error processing visibleTo pin ${doc.id}:`, error);
      }
    });
    
    // Process pins created by the user
    createdBySnapshot.forEach((doc) => {
      if (!pinsMap.has(doc.id)) {
        const pinData = doc.data();
        console.log(`DIAGNOSTIC: Processing createdBy pin ${doc.id} - ${pinData.title}`);
        
        try {
          pinsMap.set(doc.id, {
            id: doc.id,
            createdBy: pinData.createdBy,
            location: pinData.location,
            title: pinData.title,
            note: pinData.note,
            hangoutTime: pinData.hangoutTime.toDate(),
            expiresAt: pinData.expiresAt.toDate(),
            visibleTo: pinData.visibleTo,
            createdAt: pinData.createdAt.toDate(),
            updatedAt: pinData.updatedAt.toDate(),
            checkedInUsers: pinData.checkedInUsers || [],
          });
        } catch (error) {
          console.error(`DIAGNOSTIC: Error processing createdBy pin ${doc.id}:`, error);
        }
      }
    });
    
    // Convert map to array
    const pins = Array.from(pinsMap.values());
    console.log(`DIAGNOSTIC: Returning ${pins.length} total pins for user ${userId}`);
    return pins;
  } catch (error) {
    console.error('DIAGNOSTIC: Error in getPinsVisibleToUser:', error);
    throw error;
  }
};

/**
 * Get all pins created by a user
 * @param userId User ID
 * @returns Array of pins
 */
export const getPinsByUser = async (userId: string): Promise<LocationPin[]> => {
  try {
    // Query pins where the user is the creator
    const q = query(
      collection(db, 'locationPins'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const pinsSnapshot = await getDocs(q);
    const pins: LocationPin[] = [];
    
    pinsSnapshot.forEach((doc) => {
      const pinData = doc.data();
      
      pins.push({
        id: doc.id,
        createdBy: pinData.createdBy,
        location: pinData.location,
        title: pinData.title,
        note: pinData.note,
        hangoutTime: pinData.hangoutTime.toDate(),
        expiresAt: pinData.expiresAt.toDate(),
        visibleTo: pinData.visibleTo,
        createdAt: pinData.createdAt.toDate(),
        updatedAt: pinData.updatedAt.toDate(),
      });
    });
    
    return pins;
  } catch (error) {
    console.error('Error getting user pins:', error);
    throw error;
  }
};

/**
 * Get active pins (not expired) visible to a user
 * @param userId User ID
 * @returns Array of active pins
 */
export const getActivePins = async (userId: string): Promise<LocationPin[]> => {
  try {
    console.log(`DIAGNOSTIC: getActivePins called for user ${userId}`);
    const now = new Date();
    console.log(`DIAGNOSTIC: Current time: ${now.toISOString()}`);
    
    // Get all pins visible to the user (including ones they created)
    const allPins = await getPinsVisibleToUser(userId);
    console.log(`DIAGNOSTIC: Total pins fetched in getActivePins: ${allPins.length}`);
    
    // Filter out expired pins
    const activePins = allPins.filter(pin => {
      // Ensure we have a proper Date object for comparison
      let expiresAtDate: Date;
      
      if (pin.expiresAt instanceof Date) {
        expiresAtDate = pin.expiresAt;
      } else if (typeof pin.expiresAt === 'string') {
        expiresAtDate = new Date(pin.expiresAt);
      } else if (pin.expiresAt && typeof (pin.expiresAt as any).toDate === 'function') {
        // Handle Firestore Timestamp objects
        expiresAtDate = (pin.expiresAt as any).toDate();
      } else {
        console.error('Invalid expiresAt format:', pin.expiresAt);
        return false; // Filter out pins with invalid dates
      }
      
      console.log(`DIAGNOSTIC: Checking pin ${pin.id} expiration:`, {
        expiresAt: expiresAtDate.toISOString(),
        now: now.toISOString(),
        isExpired: expiresAtDate.getTime() <= now.getTime(),
        isUserPin: pin.createdBy === userId
      });
      
      // IMPORTANT: If this pin was created by the current user, always include it
      // This ensures the user's own pins are always visible
      if (pin.createdBy === userId) {
        console.log(`DIAGNOSTIC: Including user's own pin ${pin.id} regardless of expiration`);
        return true;
      }
      
      // Keep pins that have not expired yet
      return expiresAtDate.getTime() > now.getTime();
    });
    
    console.log(`DIAGNOSTIC: Filtered to ${activePins.length} active pins`);
    return activePins;
  } catch (error) {
    console.error('DIAGNOSTIC: Error in getActivePins:', error);
    throw error;
  }
};

/**
 * Get pins for a specific friend visible to the current user
 * @param userId Current user ID
 * @param friendId Friend user ID
 * @returns Array of pins
 */
export const getFriendPins = async (
  userId: string,
  friendId: string
): Promise<LocationPin[]> => {
  try {
    // Query pins where the friend is the creator and the current user is in visibleTo
    const q = query(
      collection(db, 'locationPins'),
      where('createdBy', '==', friendId),
      where('visibleTo', 'array-contains', userId)
    );
    
    const pinsSnapshot = await getDocs(q);
    const pins: LocationPin[] = [];
    
    pinsSnapshot.forEach((doc) => {
      const pinData = doc.data();
      
      pins.push({
        id: doc.id,
        createdBy: pinData.createdBy,
        location: pinData.location,
        title: pinData.title,
        note: pinData.note,
        hangoutTime: pinData.hangoutTime.toDate(),
        expiresAt: pinData.expiresAt.toDate(),
        visibleTo: pinData.visibleTo,
        createdAt: pinData.createdAt.toDate(),
        updatedAt: pinData.updatedAt.toDate(),
      });
    });
    
    return pins;
  } catch (error) {
    console.error('Error getting friend pins:', error);
    throw error;
  }
};

/**
 * Check in to a pin
 * @param pinId Pin ID
 * @param userId User ID
 */
export const checkInToPin = async (
  pinId: string,
  userId: string
): Promise<void> => {
  try {
    const pinRef = doc(db, 'locationPins', pinId);
    const pinDoc = await getDoc(pinRef);
    
    if (!pinDoc.exists()) {
      throw new Error('Pin does not exist');
    }
    
    const pinData = pinDoc.data();
    const checkedInUsers = pinData.checkedInUsers || [];
    
    // Only add user if not already checked in
    if (!checkedInUsers.includes(userId)) {
      await updateDoc(pinRef, {
        checkedInUsers: [...checkedInUsers, userId],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error checking in to pin:', error);
    throw error;
  }
};

/**
 * Check out from a pin
 * @param pinId Pin ID
 * @param userId User ID
 */
export const checkOutFromPin = async (
  pinId: string,
  userId: string
): Promise<void> => {
  try {
    const pinRef = doc(db, 'locationPins', pinId);
    const pinDoc = await getDoc(pinRef);
    
    if (!pinDoc.exists()) {
      throw new Error('Pin does not exist');
    }
    
    const pinData = pinDoc.data();
    const checkedInUsers = pinData.checkedInUsers || [];
    
    // Remove user from checked in list
    const updatedCheckedInUsers = checkedInUsers.filter(
      (id: string) => id !== userId
    );
    
    await updateDoc(pinRef, {
      checkedInUsers: updatedCheckedInUsers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error checking out from pin:', error);
    throw error;
  }
}; 
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase.config';
import { User, UserCredentials, UserRegistration, RegisterCredentials } from '../types';

/**
 * Register a new user with email and password
 * @param userData User registration data
 * @returns The user ID
 */
export const registerWithEmailPassword = async (userData: RegisterCredentials): Promise<string> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Update display name
    await updateProfile(firebaseUser, {
      displayName: userData.displayName,
    });
    
    // Create user document in Firestore
    const userDoc = {
      id: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: '',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };
    
    await setDoc(doc(firestore, 'users', firebaseUser.uid), userDoc);
    
    return firebaseUser.uid;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login a user with email and password
 * @param email User email
 * @param password User password
 */
export const loginWithEmailPassword = async (email: string, password: string): Promise<void> => {
  try {
    // Sign in with Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active timestamp if user exists in Firestore
    if (auth.currentUser) {
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param email User email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Update user profile in Firebase Auth
 * @param profileData Profile data to update
 */
export const updateUserProfile = async (
  profileData: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is logged in');
    }
    
    await updateProfile(auth.currentUser, profileData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user email
 * @param email New email
 */
export const updateEmail = async (email: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is logged in');
    }
    
    await firebaseUpdateEmail(auth.currentUser, email);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

/**
 * Update user password
 * @param password New password
 */
export const updatePassword = async (password: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is logged in');
    }
    
    await firebaseUpdatePassword(auth.currentUser, password);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Get current user data from Firestore
 * @returns Current user data or null if not logged in
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }
    
    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    const userData = userDoc.data();
    
    if (!userData) {
      return null;
    }
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      profilePicture: userData.profilePicture || '',
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastActive: userData.lastActive?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Delete the current user's account
 */
export const deleteUser = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is logged in');
    }
    
    await auth.currentUser.delete();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}; 
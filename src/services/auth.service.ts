import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase.config';

/**
 * Service for handling Firebase Authentication operations
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * @param email User's email
   * @param password User's password
   * @param displayName User's display name
   * @returns Promise resolving to UserCredential
   */
  static async registerUser(
    email: string, 
    password: string, 
    displayName: string
  ): Promise<UserCredential> {
    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        
        // Create a user document in Firestore
        await this.createUserDocument(userCredential.user, { displayName });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
  
  /**
   * Sign in an existing user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to UserCredential
   */
  static async loginUser(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   * @returns Promise<void>
   */
  static async logoutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out user:', error);
      throw error;
    }
  }
  
  /**
   * Send a password reset email to the user
   * @param email User's email
   * @returns Promise<void>
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
  
  /**
   * Create a user document in Firestore
   * @param user Firebase User object
   * @param additionalData Additional user data
   * @returns Promise<void>
   */
  private static async createUserDocument(
    user: User, 
    additionalData: { displayName: string }
  ): Promise<void> {
    if (!user.uid) return;
    
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: additionalData.displayName,
        createdAt: new Date(),
        lastActive: new Date(),
        photoURL: user.photoURL || null,
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }
  
  /**
   * Get the current authenticated user
   * @returns User | null
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
} 
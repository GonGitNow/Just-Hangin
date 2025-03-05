import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase.config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { AuthUser, UserProfile } from '../types';
import * as profileApi from '../api/profile';

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  isAuthInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string, username: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserPreferences: (preferences: any) => Promise<void>;
  getFriends: () => Promise<UserProfile[]>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeAuth, setUnsubscribeAuth] = useState<(() => void) | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const authUser = {
              uid: user.uid,
              email: user.email || '',
              username: userData.username,
              photoURL: userData.photoURL,
              preferences: userData.preferences || {},
              friends: userData.friends || []
            };
            setCurrentUser(authUser);

            // Set user profile
            const profile: UserProfile = {
              id: user.uid,
              username: userData.username || '',
              email: user.email || '',
              photoURL: userData.photoURL || null,
              preferences: userData.preferences || {},
              friends: userData.friends || [],
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            };
            setUserProfile(profile);
          } else {
            // If user document doesn't exist, create it
            const newUserData = {
              email: user.email,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL,
              createdAt: new Date(),
              updatedAt: new Date(),
              preferences: {},
              friends: []
            };
            
            await setDoc(doc(db, 'users', user.uid), newUserData);
            
            const authUser = {
              uid: user.uid,
              email: user.email || '',
              username: newUserData.username,
              photoURL: newUserData.photoURL,
              preferences: newUserData.preferences,
              friends: newUserData.friends
            };
            setCurrentUser(authUser);

            // Set user profile
            const profile: UserProfile = {
              id: user.uid,
              username: newUserData.username,
              email: user.email || '',
              photoURL: newUserData.photoURL || null,
              preferences: newUserData.preferences,
              friends: newUserData.friends,
              createdAt: newUserData.createdAt,
              updatedAt: newUserData.updatedAt
            };
            setUserProfile(profile);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Failed to initialize authentication');
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setIsAuthInitialized(true);
      }
    });

    setUnsubscribeAuth(() => unsubscribe);

    // Cleanup function
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  const register = async (email: string, password: string, username: string): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      clearError();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        username,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {},
        friends: []
      });

      return userCredential;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Failed to logout');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });

      // Update local state
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const updateUserPreferences = async (preferences: any): Promise<void> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        preferences,
        updatedAt: new Date()
      });

      // Update local state
      setCurrentUser(prev => prev ? { ...prev, preferences } : null);
    } catch (error) {
      console.error('Preferences update error:', error);
      throw error;
    }
  };

  const getFriends = async (): Promise<UserProfile[]> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const friendsRef = collection(db, 'users');
      const q = query(friendsRef, where('__name__', 'in', currentUser.friends));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  };

  const addFriend = async (friendId: string): Promise<void> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', friendId);

      // Update both users' friend lists
      await updateDoc(userRef, {
        friends: [...currentUser.friends, friendId],
        updatedAt: new Date()
      });

      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        await updateDoc(friendRef, {
          friends: [...(friendData.friends || []), currentUser.uid],
          updatedAt: new Date()
        });
      }

      // Update local state
      setCurrentUser(prev => prev ? {
        ...prev,
        friends: [...prev.friends, friendId]
      } : null);
    } catch (error) {
      console.error('Add friend error:', error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', friendId);

      // Update both users' friend lists
      await updateDoc(userRef, {
        friends: currentUser.friends.filter(id => id !== friendId),
        updatedAt: new Date()
      });

      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        await updateDoc(friendRef, {
          friends: (friendData.friends || []).filter((id: string) => id !== currentUser.uid),
          updatedAt: new Date()
        });
      }

      // Update local state
      setCurrentUser(prev => prev ? {
        ...prev,
        friends: prev.friends.filter(id => id !== friendId)
      } : null);
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAuthInitialized,
        isLoading,
        error,
        register,
        login,
        logout,
        clearError,
        updateProfile,
        updateUserPreferences,
        getFriends,
        addFriend,
        removeFriend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
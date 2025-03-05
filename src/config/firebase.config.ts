import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables from Expo Constants
const {
  EXPO_PUBLIC_API_KEY,
  EXPO_PUBLIC_AUTH_DOMAIN,
  EXPO_PUBLIC_PROJECT_ID,
  EXPO_PUBLIC_STORAGE_BUCKET,
  EXPO_PUBLIC_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_APP_ID,
  EXPO_PUBLIC_MEASUREMENT_ID
} = Constants.expoConfig?.extra || {};

// Fallback to process.env if Constants doesn't have the values
const API_KEY = EXPO_PUBLIC_API_KEY || process.env.EXPO_PUBLIC_API_KEY || process.env.API_KEY;
const AUTH_DOMAIN = EXPO_PUBLIC_AUTH_DOMAIN || process.env.EXPO_PUBLIC_AUTH_DOMAIN || process.env.AUTH_DOMAIN;
const PROJECT_ID = EXPO_PUBLIC_PROJECT_ID || process.env.EXPO_PUBLIC_PROJECT_ID || process.env.PROJECT_ID;
const STORAGE_BUCKET = EXPO_PUBLIC_STORAGE_BUCKET || process.env.EXPO_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET;
const MESSAGING_SENDER_ID = EXPO_PUBLIC_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID || process.env.MESSAGING_SENDER_ID;
const APP_ID = EXPO_PUBLIC_APP_ID || process.env.EXPO_PUBLIC_APP_ID || process.env.APP_ID;
const MEASUREMENT_ID = EXPO_PUBLIC_MEASUREMENT_ID || process.env.EXPO_PUBLIC_MEASUREMENT_ID || process.env.MEASUREMENT_ID;

// Firebase configuration
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

// Log configuration for debugging (remove in production)
console.log('Firebase Config:', {
  apiKey: API_KEY ? '✓ Set' : '✗ Missing',
  authDomain: AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
  projectId: PROJECT_ID ? '✓ Set' : '✗ Missing',
  storageBucket: STORAGE_BUCKET ? '✓ Set' : '✗ Missing',
  messagingSenderId: MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing',
  appId: APP_ID ? '✓ Set' : '✗ Missing',
  measurementId: MEASUREMENT_ID ? '✓ Set' : '✗ Missing'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err: Error & { code?: string }) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('The current browser doesn\'t support persistence');
    }
  });

export { app }; 
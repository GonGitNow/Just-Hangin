// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: Date;
  lastActive?: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  displayName: string;
}

// Friendship Types
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  users: string[]; // Array of two user IDs
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  photoURL?: string;
  displayName?: string;
}

// Location Pin Types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface PinCreationData {
  title: string;
  note: string;
  location: LocationCoordinates;
  address?: string; // Optional address of the location
  hangoutTime: Date;
  expiresAt: Date;
  visibleTo: string[]; // Array of user IDs who can see this pin
  selectedFriends?: string[]; // Array of user IDs who were specifically selected/invited
}

export interface Comment {
  id: string;
  pinId: string;
  userId: string;
  text: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

export interface LocationPin {
  id: string;
  title: string;
  note: string;
  location: LocationCoordinates;
  address?: string; // Optional address of the location
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  hangoutTime: Date;
  expiresAt: Date;
  visibleTo: string[];
  checkedInUsers?: string[]; // Array of user IDs who have checked in
  comments?: Comment[]; // Comments on this pin
}

// Map Types
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapFilters {
  showOnlyActive: boolean;
  friendIds: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Notification Types
export enum NotificationType {
  NEW_PIN = 'NEW_PIN',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  PIN_REMINDER = 'PIN_REMINDER'
}

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  relatedId?: string; // ID of the pin or friendship
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

// Auth Context Types
export interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextActions {
  login: (credentials: UserCredentials) => Promise<void>;
  register: (userData: UserRegistration) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export type AuthContextType = AuthContextState & AuthContextActions;

// Map Context Types
export interface MapContextState {
  currentRegion: Region | null;
  selectedPin: LocationPin | null;
  pins: LocationPin[];
  isLoading: boolean;
  filters: MapFilters;
}

export interface MapContextActions {
  setRegion: (region: Region) => void;
  selectPin: (pin: LocationPin | null) => void;
  createPin: (pinData: PinCreationData) => Promise<string>;
  updatePin: (pinId: string, pinData: Partial<PinCreationData>) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  loadPins: () => Promise<void>;
  updateFilters: (filters: Partial<MapFilters>) => void;
}

export type MapContextType = MapContextState & MapContextActions;

// User related types
export interface UserPreferences {
  darkMode: boolean;
  notifications: {
    enabled: boolean;
    personalInvites: boolean;
    friendHangouts: boolean;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  photoURL: string | null;
  preferences: Record<string, any>;
  friends: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Authentication related types
export interface AuthUser {
  uid: string;
  email: string | null;
  username: string;
  photoURL: string | null;
  preferences: Record<string, any>;
  friends: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
}

// Navigation related types
export interface RouteParams {
  [key: string]: any;
}

// App state related types
export interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  userProfile: UserProfile | null;
  error: string | null;
}

// Theme related types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  disabled: string;
  placeholder: string;
  accent: string;
  highlight: string;
  deepSpace: string;
  white: string;
  darkBackground: string;
  lightText: string;
  overlay: string;
  cardShadow: string;
  gradientStart: string;
  gradientEnd: string;
}

export interface ThemeSpacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface ThemeBorderRadius {
  s: number;
  m: number;
  l: number;
  xl: number;
  full: number;
}

export interface ThemeShadow {
  light: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  dark: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  button: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadow: ThemeShadow;
} 
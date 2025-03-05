// Authentication routes
export const AUTH = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
};

// Main app routes
export const MAIN = {
  MAP_TAB: 'MapTab',
  FRIENDS_TAB: 'FriendsTab',
  PROFILE_TAB: 'ProfileTab',
};

// Map stack routes
export const MAP = {
  MAP: 'Map',
  PIN_DETAILS: 'PinDetails',
  CREATE_PIN: 'CreatePin',
  FRIENDS_HANGOUTS: 'FriendsHangouts',
  MY_HANGOUTS: 'MyHangouts',
};

// Friends stack routes
export const FRIENDS = {
  FRIENDS_LIST: 'FriendsList',
  FRIEND_REQUESTS: 'FriendRequests',
  SEARCH_USERS: 'SearchUsers',
  FRIEND_PROFILE: 'FriendProfile',
};

// Profile stack routes
export const PROFILE = {
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  SETTINGS: 'Settings',
  PRIVACY_SETTINGS: 'PrivacySettings',
};

// Export all routes as a single object
export const ROUTES = {
  AUTH,
  MAIN,
  MAP,
  FRIENDS,
  PROFILE,
}; 
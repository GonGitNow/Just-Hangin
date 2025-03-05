import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ROUTES } from '../constants/routes';

// Import screens
// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main app screens
import MapScreen from '../screens/map/MapScreen';
import PinDetailsScreen from '../screens/map/PinDetailsScreen';
import CreatePinScreen from '../screens/map/CreatePinScreen';
import FriendsHangoutsScreen from '../screens/map/FriendsHangoutsScreen';
import MyHangoutsScreen from '../screens/map/MyHangoutsScreen';

import FriendsScreen from '../screens/friends/FriendsScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import SearchUsersScreen from '../screens/friends/SearchUsersScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import PrivacySettingsScreen from '../screens/profile/PrivacySettingsScreen';

// Define stack navigators
const AuthStack = createStackNavigator();
const MapStack = createStackNavigator();
const FriendsStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const MainTab = createBottomTabNavigator();

// Auth navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <AuthStack.Screen name={ROUTES.AUTH.REGISTER} component={RegisterScreen} />
      <AuthStack.Screen name={ROUTES.AUTH.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Map stack navigator
const MapNavigator = () => {
  const { appTheme } = useApp();
  const colors = appTheme.colors;

  return (
    <MapStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      }}
    >
      <MapStack.Screen 
        name={ROUTES.MAP.MAP} 
        component={MapScreen} 
        options={{ headerShown: false }}
      />
      <MapStack.Screen 
        name={ROUTES.MAP.PIN_DETAILS} 
        component={PinDetailsScreen}
        options={{ title: 'Pin Details' }}
      />
      <MapStack.Screen 
        name={ROUTES.MAP.CREATE_PIN} 
        component={CreatePinScreen}
        options={{ title: 'Create Pin' }}
      />
      <MapStack.Screen 
        name={ROUTES.MAP.FRIENDS_HANGOUTS} 
        component={FriendsHangoutsScreen}
        options={{ title: 'Friends\' Hangouts' }}
      />
      <MapStack.Screen
        name={ROUTES.MAP.MY_HANGOUTS}
        component={MyHangoutsScreen}
        options={{ title: 'My Hangouts' }}
      />
    </MapStack.Navigator>
  );
};

// Friends stack navigator
const FriendsNavigator = () => {
  const { appTheme } = useApp();
  const colors = appTheme.colors;

  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      }}
    >
      <FriendsStack.Screen 
        name={ROUTES.FRIENDS.FRIENDS_LIST} 
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <FriendsStack.Screen 
        name={ROUTES.FRIENDS.FRIEND_REQUESTS} 
        component={FriendRequestsScreen}
        options={{ title: 'Friend Requests' }}
      />
      <FriendsStack.Screen 
        name={ROUTES.FRIENDS.SEARCH_USERS} 
        component={SearchUsersScreen}
        options={{ title: 'Find Friends' }}
      />
      <FriendsStack.Screen 
        name={ROUTES.FRIENDS.FRIEND_PROFILE} 
        component={FriendProfileScreen}
        options={{ title: 'Friend Profile' }}
      />
    </FriendsStack.Navigator>
  );
};

// Profile stack navigator
const ProfileNavigator = () => {
  const { appTheme } = useApp();
  const colors = appTheme.colors;

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      }}
    >
      <ProfileStack.Screen 
        name={ROUTES.PROFILE.PROFILE} 
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <ProfileStack.Screen 
        name={ROUTES.PROFILE.EDIT_PROFILE} 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen 
        name={ROUTES.PROFILE.SETTINGS} 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen 
        name={ROUTES.PROFILE.PRIVACY_SETTINGS} 
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy Settings' }}
      />
    </ProfileStack.Navigator>
  );
};

// Main tab navigator
const MainNavigator = () => {
  const { appTheme } = useApp();
  const colors = appTheme.colors;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === ROUTES.MAIN.MAP_TAB) {
            iconName = 'map'; // Always use solid icon
          } else if (route.name === ROUTES.MAIN.FRIENDS_TAB) {
            iconName = 'people'; // Always use solid icon
          } else if (route.name === ROUTES.MAIN.PROFILE_TAB) {
            iconName = 'person'; // Always use solid icon
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen 
        name={ROUTES.MAIN.MAP_TAB} 
        component={MapNavigator} 
        options={{ title: 'Map' }} 
      />
      <MainTab.Screen 
        name={ROUTES.MAIN.FRIENDS_TAB} 
        component={FriendsNavigator} 
        options={{ title: 'Friends' }} 
      />
      <MainTab.Screen 
        name={ROUTES.MAIN.PROFILE_TAB} 
        component={ProfileNavigator} 
        options={{ title: 'Profile' }} 
      />
    </MainTab.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const { currentUser } = useAuth();

  return currentUser ? <MainNavigator /> : <AuthNavigator />;
};

export default AppNavigator; 
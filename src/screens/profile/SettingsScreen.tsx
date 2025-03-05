import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, lightTheme, darkTheme } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { UserPreferences } from '../../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.m,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.m,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  versionContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    opacity: 0.5,
  },
});

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    userProfile, 
    isLoading, 
    updatePassword, 
    updateProfile,
    deleteAccount 
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const colors = theme.colors;
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.preferences?.notifications?.enabled ?? true
  );
  const [personalInvitesEnabled, setPersonalInvitesEnabled] = useState(
    userProfile?.preferences?.notifications?.personalInvites ?? true
  );
  const [friendHangoutsEnabled, setFriendHangoutsEnabled] = useState(
    userProfile?.preferences?.notifications?.friendHangouts ?? true
  );
  const [darkModeEnabled, setDarkModeEnabled] = useState(
    userProfile?.preferences?.darkMode ?? false
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    Alert.prompt(
      'Change Password',
      'Enter your current password:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsChangingPassword(false)
        },
        {
          text: 'Next',
          onPress: (password) => {
            if (password) {
              setCurrentPassword(password);
              Alert.prompt(
                'New Password',
                'Enter your new password:',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setIsChangingPassword(false)
                  },
                  {
                    text: 'Next',
                    onPress: (newPass) => {
                      if (newPass) {
                        setNewPassword(newPass);
                        Alert.prompt(
                          'Confirm Password',
                          'Confirm your new password:',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                              onPress: () => setIsChangingPassword(false)
                            },
                            {
                              text: 'Change',
                              onPress: async (confirmPass) => {
                                if (confirmPass && confirmPass === newPass) {
                                  try {
                                    await updatePassword(newPass);
                                    Alert.alert('Success', 'Password updated successfully');
                                    setIsChangingPassword(false);
                                  } catch (error: any) {
                                    Alert.alert('Error', error.message || 'Failed to update password');
                                  }
                                } else {
                                  Alert.alert('Error', 'Passwords do not match');
                                }
                              }
                            }
                          ]
                        );
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              await deleteAccount();
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const handlePrivacySettings = () => {
    navigation.navigate(ROUTES.PROFILE.PRIVACY_SETTINGS);
  };

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      setDarkModeEnabled(value);
      const newPreferences: UserPreferences = {
        darkMode: value,
        notifications: {
          enabled: notificationsEnabled,
          personalInvites: personalInvitesEnabled,
          friendHangouts: friendHangoutsEnabled,
        },
      };
      await updateProfile({
        preferences: newPreferences,
      });
      setTheme(value ? darkTheme : lightTheme);
    } catch (error) {
      console.error('Error updating dark mode:', error);
      setDarkModeEnabled(!value); // Revert on error
      Alert.alert('Error', 'Failed to update dark mode setting');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      if (!value) {
        // If notifications are disabled, disable all sub-settings
        setPersonalInvitesEnabled(false);
        setFriendHangoutsEnabled(false);
      }
      const newPreferences: UserPreferences = {
        darkMode: darkModeEnabled,
        notifications: {
          enabled: value,
          personalInvites: value ? personalInvitesEnabled : false,
          friendHangouts: value ? friendHangoutsEnabled : false,
        },
      };
      await updateProfile({
        preferences: newPreferences,
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notifications setting');
    }
  };

  const handlePersonalInvitesToggle = async (value: boolean) => {
    try {
      setPersonalInvitesEnabled(value);
      const newPreferences: UserPreferences = {
        darkMode: darkModeEnabled,
        notifications: {
          enabled: notificationsEnabled,
          personalInvites: value,
          friendHangouts: friendHangoutsEnabled,
        },
      };
      await updateProfile({
        preferences: newPreferences,
      });
    } catch (error) {
      console.error('Error updating personal invites setting:', error);
      setPersonalInvitesEnabled(!value);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const handleFriendHangoutsToggle = async (value: boolean) => {
    try {
      setFriendHangoutsEnabled(value);
      const newPreferences: UserPreferences = {
        darkMode: darkModeEnabled,
        notifications: {
          enabled: notificationsEnabled,
          personalInvites: personalInvitesEnabled,
          friendHangouts: value,
        },
      };
      await updateProfile({
        preferences: newPreferences,
      });
    } catch (error) {
      console.error('Error updating friend hangouts setting:', error);
      setFriendHangoutsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };
  
  const handleAbout = () => {
    Alert.alert(
      'About Just Hangin',
      'Just Hangin is a mobile app that allows you to share your hangout locations with friends. Drop pins on a map with notes and time information, and choose which friends can see your hangout spots.\n\nVersion: 1.0.0',
      [{ text: 'OK' }]
    );
  };
  
  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at support@justhangin.app',
      [{ text: 'OK' }]
    );
  };
  
  if (isLoading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Ionicons name="key-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handlePrivacySettings}
          >
            <Ionicons name="shield-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={[styles.settingText, { color: colors.error }]}>
              {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={[styles.settingItem, { borderBottomColor: colors.border, paddingLeft: spacing.xl }]}>
                <Ionicons name="person-outline" size={20} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Personal Invites</Text>
                <Switch
                  value={personalInvitesEnabled}
                  onValueChange={handlePersonalInvitesToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.settingItem, { borderBottomColor: colors.border, paddingLeft: spacing.xl }]}>
                <Ionicons name="people-outline" size={20} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Friend Hangouts</Text>
                <Switch
                  value={friendHangoutsEnabled}
                  onValueChange={handleFriendHangoutsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
          
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleHelp}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleAbout}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text }]}>Just Hangin v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen; 
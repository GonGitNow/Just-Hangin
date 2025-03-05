import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { userProfile, currentUser, logout, isLoading } = useAuth();

  const handleEditProfile = () => {
    navigation.navigate(ROUTES.PROFILE.EDIT_PROFILE);
  };

  const handleSettings = () => {
    navigation.navigate(ROUTES.PROFILE.SETTINGS);
  };

  const handlePrivacySettings = () => {
    navigation.navigate(ROUTES.PROFILE.PRIVACY_SETTINGS);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {userProfile.photoURL ? (
            <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {userProfile.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.displayName}>{userProfile.displayName}</Text>
        <Text style={styles.email}>{userProfile.email}</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSettings}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handlePrivacySettings}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="shield-outline" size={24} color={colors.text} />
            <Text style={styles.menuItemText}>Privacy Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Just Hangin v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: spacing.m,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: 48,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: spacing.m,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  menuSection: {
    marginTop: spacing.m,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.m,
  },
  logoutButton: {
    marginTop: spacing.m,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: colors.error,
  },
  versionContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.5,
  },
});

export default ProfileScreen; 
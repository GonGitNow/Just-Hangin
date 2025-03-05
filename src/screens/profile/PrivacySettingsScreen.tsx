import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import * as profileApi from '../../api/profile';

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile, isLoading } = useAuth();
  
  const [shareLocationWithFriends, setShareLocationWithFriends] = useState(
    userProfile?.privacySettings?.shareLocationWithFriends ?? true
  );
  const [allowFriendRequests, setAllowFriendRequests] = useState(
    userProfile?.privacySettings?.allowFriendRequests ?? true
  );
  const [showActiveStatus, setShowActiveStatus] = useState(
    userProfile?.privacySettings?.showActiveStatus ?? true
  );
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!userProfile) return;
    
    try {
      setIsSaving(true);
      
      await profileApi.updatePrivacySettings(userProfile.id, {
        shareLocationWithFriends,
        allowFriendRequests,
        showActiveStatus,
      });
      
      Alert.alert('Success', 'Privacy settings updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setIsSaving(false);
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          <Text style={styles.sectionDescription}>
            Control who can see your information and how your data is shared.
          </Text>
        </View>
        
        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Share Location with Friends</Text>
              <Text style={styles.settingDescription}>
                Allow your friends to see your hangout pins on the map
              </Text>
            </View>
            <Switch
              value={shareLocationWithFriends}
              onValueChange={setShareLocationWithFriends}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Allow Friend Requests</Text>
              <Text style={styles.settingDescription}>
                Let other users send you friend requests
              </Text>
            </View>
            <Switch
              value={allowFriendRequests}
              onValueChange={setAllowFriendRequests}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Show Active Status</Text>
              <Text style={styles.settingDescription}>
                Let friends see when you're active on the app
              </Text>
            </View>
            <Switch
              value={showActiveStatus}
              onValueChange={setShowActiveStatus}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          <Text style={styles.infoText}>
            Your privacy is important to us. We only share your information with the people you choose.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  settingsContainer: {
    padding: spacing.m,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.m,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  infoSection: {
    flexDirection: 'row',
    padding: spacing.m,
    backgroundColor: colors.card,
    margin: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.s,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    alignItems: 'center',
    margin: spacing.m,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrivacySettingsScreen; 
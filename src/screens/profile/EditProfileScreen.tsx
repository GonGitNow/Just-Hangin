import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase.config';
import { clearProfilePictureCache } from '../../components/CustomMarker';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile, updateProfile, isLoading, currentUser } = useAuth();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library was denied');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          setIsUploading(true);
          
          // Get the selected image URI
          const uri = result.assets[0].uri;
          console.log('Selected image URI:', uri);
          
          // Create a blob from the image URI
          const response = await fetch(uri);
          const blob = await response.blob();
          console.log('Created blob of size:', blob.size);
          
          // Upload to Firebase Storage
          if (currentUser) {
            const fileName = `profile_${currentUser.uid}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `profileImages/${currentUser.uid}/${fileName}`);
            console.log('Uploading to Firebase Storage path:', `profileImages/${currentUser.uid}/${fileName}`);
            
            // Upload the blob
            const uploadResult = await uploadBytes(storageRef, blob);
            console.log('Upload successful, metadata:', uploadResult.metadata);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            console.log('Download URL:', downloadURL);
            
            // Set the photo URL to the Firebase Storage URL
            setPhotoURL(downloadURL);
            
            // Clear the profile picture cache for this user
            if (currentUser) {
              clearProfilePictureCache(currentUser.uid);
            }
            
            // Update Firebase Auth profile
            if (currentUser) {
              await updateProfile({ photoURL: downloadURL });
            }
            
            // Show success message
            Alert.alert('Success', 'Profile picture uploaded successfully');
          } else {
            console.error('No current user found');
            Alert.alert('Error', 'User not authenticated');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + (error instanceof Error ? error.message : String(error)));
      setIsUploading(false);
    }
  };
  
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      await updateProfile({
        displayName,
        location,
        photoURL,
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handlePickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              maxLength={30}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              maxLength={50}
            />
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    position: 'relative',
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
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen; 
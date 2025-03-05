import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing, ActivityIndicator } from 'react-native';
import { Marker } from 'react-native-maps';
import { LocationPin } from '../types';
import { colors, shadow, borderRadius } from '../constants/theme';
import * as profileApi from '../api/profile';
import { processImageUri, createImageSource } from '../utils/imageUtils';

// Cache for profile pictures to avoid repeated API calls
const profilePictureCache: Record<string, string | null> = {};

// Helper function to check if a date is in the past
const isDateInPast = (date: string | Date | null): boolean => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() <= Date.now();
};

// Helper function to clear the profile picture cache for a user
export const clearProfilePictureCache = (userId: string) => {
  delete profilePictureCache[userId];
};

interface CustomMarkerProps {
  pin: LocationPin;
  onPress: (pin: LocationPin) => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ pin, onPress }) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [tracksChanges, setTracksChanges] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const isExpired = pin.expiresAt ? isDateInPast(pin.expiresAt) : false;
  const hasStartTimePassed = pin.hangoutTime ? isDateInPast(pin.hangoutTime) : true;

  // Fetch profile picture
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchCreatorProfile = async () => {
      try {
        if (!pin.createdBy) {
          console.log('No creator ID provided for pin');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setImageError(false);
        
        // Check if we have a cached profile picture
        if (profilePictureCache[pin.createdBy] !== undefined) {
          console.log(`Using cached profile picture for user ${pin.createdBy}:`, profilePictureCache[pin.createdBy]);
          setProfilePicture(profilePictureCache[pin.createdBy]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetching profile for user ${pin.createdBy}`);
        const profile = await profileApi.getUserProfile(pin.createdBy);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (profile?.photoURL) {
            // Process the image URI
            const processedUri = processImageUri(profile.photoURL);
            console.log(`Processed URI for user ${pin.createdBy}:`, processedUri);
            
            if (processedUri) {
              // Test if the image is accessible
              try {
                const response = await fetch(processedUri);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                setProfilePicture(processedUri);
                // Cache the profile picture
                profilePictureCache[pin.createdBy] = processedUri;
              } catch (error) {
                console.error(`Error testing image accessibility for user ${pin.createdBy}:`, error);
                handleImageError();
              }
            } else {
              handleImageError();
            }
          } else {
            handleImageError();
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error fetching profile for pin ${pin.id}:`, error);
        if (isMounted) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying profile fetch (attempt ${retryCount}/${maxRetries})`);
            setTimeout(fetchCreatorProfile, 1000 * retryCount); // Exponential backoff
          } else {
            handleImageError();
            setIsLoading(false);
          }
        }
      }
    };

    fetchCreatorProfile();
    
    return () => {
      isMounted = false;
    };
  }, [pin.createdBy]);

  // Start pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  // Determine marker color based on pin status
  const getMarkerColor = () => {
    if (isExpired) return colors.disabled;
    if (hasStartTimePassed) return colors.success;
    return colors.primary;
  };

  const markerColor = getMarkerColor();
  
  // Handle image loading error
  const handleImageError = () => {
    console.log(`Error loading profile image for pin ${pin.id}`);
    setImageError(true);
    setProfilePicture(null);
    if (pin.createdBy) {
      clearProfilePictureCache(pin.createdBy);
    }
  };

  // Create image source
  const imageSource = profilePicture ? createImageSource(profilePicture) : undefined;

  // Disable view change tracking after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksChanges(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: pin.location.latitude,
        longitude: pin.location.longitude,
      }}
      title={pin.title}
      description={pin.note}
      onPress={() => onPress(pin)}
      tracksViewChanges={tracksChanges}
      zIndex={isExpired ? 1 : (hasStartTimePassed ? 3 : 2)}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.markerWrapper}>
          <View style={[styles.markerBorder, { borderColor: markerColor }]}>
            {isLoading ? (
              <View style={[styles.defaultMarker, { backgroundColor: colors.darkBackground }]}>
                <ActivityIndicator size="small" color={markerColor} />
              </View>
            ) : imageError || !imageSource ? (
              <View style={[styles.defaultMarker, { backgroundColor: markerColor }]}>
                <Text style={styles.markerInitial}>{pin.title.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image 
                  source={imageSource} 
                  style={styles.profileImage} 
                  resizeMode="cover"
                  onError={handleImageError}
                />
              </View>
            )}
          </View>
          <View style={[styles.markerPointer, { backgroundColor: markerColor }]} />
        </View>
      </Animated.View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...shadow,
  },
  defaultMarker: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInitial: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  markerPointer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4,
  },
});

export default CustomMarker; 
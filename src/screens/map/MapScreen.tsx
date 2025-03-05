import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Animated, Easing, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, shadow } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { LocationPin, ThemeColors } from '../../types';
import CustomMarker from '../../components/CustomMarker';
import CosmicWavesBackground from '../../components/CosmicWavesBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { isDateInPast } from '../../utils/dateTime';

// Custom modern vibrant map style
const warmSunsetMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1a1a2e"  // Deep navy (matching background)
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"  // White text for better visibility
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#16213e"  // Slightly lighter navy (matching card)
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#9b59b6"  // Purple (matching secondary)
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#16213e"  // Slightly lighter navy (matching card)
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0f3460"  // Deeper navy (matching darkBackground)
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"  // White text for POIs
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0f3460"  // Deeper navy (matching darkBackground)
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#00cec9"  // Teal (matching highlight)
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4a69bd"  // Medium blue (matching border)
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"  // White text for roads
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3498db"  // Bright blue (matching primary)
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#9b59b6"  // Purple (matching secondary)
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e84393"  // Pink (matching accent)
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2ecc71"  // Emerald green (matching success)
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#00cec9"  // Teal (matching highlight)
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"  // White text for water bodies
      }
    ]
  }
];

// Define the LocationCoordinates interface if it's not imported
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Define RootStackParamList type locally to fix the import error
type RootStackParamList = {
  [key: string]: any; // Use index signature instead of computed property names
};

interface MapScreenProps {
  theme: any;
}

// Add at the top with other constants
const customShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
};

const MapScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { currentUser, isAuthInitialized } = useAuth();
  const {
    pins,
    createPin,
    selectedPin,
    isLoading: isPinsLoading,
    error: mapContextError,
    setSelectedLocation,
    setSelectedPin,
    refreshPins,
    getUserLocation,
    isAuthStable,
  } = useMap();

  // Local state for user location and loading
  const [userLocation, setUserLocationLocal] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoadingLocal] = useState(true);
  const [selectedLocation, setSelectedLocationLocal] = useState<LocationCoordinates | null>(null);
  const [locationSelected, setLocationSelectedLocal] = useState(false);
  const [showLocationHelp, setShowLocationHelpLocal] = useState(false);
  const [mapReady, setMapReadyLocal] = useState(false);
  const [noLocationSelected, setNoLocationSelectedLocal] = useState(false);
  const [mapRegion, setMapRegionLocal] = useState<Region | null>(null);
  const [markerKey, setMarkerKey] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [crazyMode, setCrazyMode] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const radarRotate = useRef(new Animated.Value(0)).current;
  const crazyRotate1 = useRef(new Animated.Value(0)).current;
  const crazyRotate2 = useRef(new Animated.Value(0)).current;
  const crazyRotate3 = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const mapRef = useRef<MapView>(null);

  // Initialize user location when component mounts
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setIsLoadingLocal(true);
        const location = await getUserLocation();
        
        if (location) {
          console.log("User location initialized:", location);
          setUserLocationLocal(location);
          setMapRegionLocal({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
          });
        }
      } catch (error) {
        console.error("Error initializing location:", error);
        setError("Failed to initialize location");
      } finally {
        setIsLoadingLocal(false);
      }
    };
    
    initializeLocation();
  }, []);

  // Load pins when auth is stable and map is ready
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthStable || !mapReady) return;

      try {
        await refreshPins();
      } catch (error) {
        console.error("Error during initial pin refresh:", error);
        setError("Failed to load pins");
      }
    };
    
    loadInitialData();
    
    // Set up a refresh interval for pins (every 60 seconds)
    const intervalId = setInterval(() => {
      if (isAuthStable) {
        refreshPins();
      }
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthStable, mapReady]);

  // Show loading state while auth is initializing
  if (!isAuthInitialized) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          refreshPins();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Update pins when they change
  useEffect(() => {
    // No need for diagnostic logs here
  }, [pins]);
  
  // Add a useEffect to refresh pins when map is ready
  useEffect(() => {
    if (mapReady && currentUser && pins.length === 0) {
      refreshPins();
    }
  }, [mapReady, currentUser]);

  // Only update marker key when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setMarkerKey(Date.now());
    }
  }, [selectedLocation]);

  // Show help message only once when map is ready
  useEffect(() => {
    if (mapReady && !showLocationHelp) {
      // Show the help message with a slight delay after the map is ready
      const timer = setTimeout(() => {
        setShowLocationHelpLocal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mapReady]);

  // Simplify animations to fix errors
  useEffect(() => {
    // Simple pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Simple rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Radar rotation animation
    Animated.loop(
      Animated.timing(radarRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);
  
  // Calculate rotation for selected location indicator
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Add these interpolated values for the radar
  const radarRotation = radarRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Update animations for crazy mode
  useEffect(() => {
    if (crazyMode) {
      // Stop any existing animations
      pulseAnim.stopAnimation();
      crazyRotate1.stopAnimation();
      crazyRotate2.stopAnimation();
      crazyRotate3.stopAnimation();
      opacityAnim.stopAnimation();

      // Fade in smoothly
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Multiple rotating gradients
      Animated.loop(
        Animated.parallel([
          Animated.timing(crazyRotate1, {
            toValue: 1,
            duration: 30000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(crazyRotate2, {
            toValue: 1,
            duration: 25000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(crazyRotate3, {
            toValue: 1,
            duration: 20000,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();

    } else {
      // Fade out smoothly
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseAnim.stopAnimation();
      crazyRotate1.stopAnimation();
      crazyRotate2.stopAnimation();
      crazyRotate3.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [crazyMode]);

  const handleMapReady = () => {
    setMapReadyLocal(true);
    
    // Center on user location if available
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  const handleRegionChange = (region: Region) => {
    setMapRegionLocal(region);
  };

  const handleMarkerPress = (pin: LocationPin) => {
    setSelectedPin(pin);
    navigation.navigate(ROUTES.MAP.PIN_DETAILS, { pinId: pin.id });
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocationLocal(coordinate);
    setShowLocationHelpLocal(false);
    
    // Show a confirmation message
    setLocationSelectedLocal(true);
    setTimeout(() => setLocationSelectedLocal(false), 2000);
  };

  const handleCreatePin = () => {
    if (selectedLocation) {
      console.log("Creating pin at location:", selectedLocation);
      setSelectedLocation(selectedLocation); // Set the selected location in the context
      navigation.navigate(ROUTES.MAP.CREATE_PIN, { 
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        }
      });
    } else {
      // Show a notification that location needs to be selected
      setNoLocationSelectedLocal(true);
      setTimeout(() => setNoLocationSelectedLocal(false), 2000);
    }
  };

  const handleMyLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }
      
      setIsLoadingLocal(true);
      
      // Get current location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      console.log("Got user location:", userCoords);
      setUserLocationLocal(userCoords);
      
      // Animate to the user's location
      mapRef.current?.animateToRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleFriendsHangouts = () => {
    navigation.navigate(ROUTES.MAP.FRIENDS_HANGOUTS as never);
  };

  const handleMyHangouts = () => {
    navigation.navigate(ROUTES.MAP.MY_HANGOUTS as never);
  };

  const handleRefreshPins = () => {
    refreshPins();
    setMarkerKey(Date.now()); // Force marker re-render
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },
  loadingText: {
    marginTop: spacing.m,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    marginTop: spacing.m,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.m,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  topButtonsContainer: {
    position: 'absolute',
    top: spacing.l,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.s,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  callout: {
    padding: spacing.s,
    borderRadius: borderRadius.s,
    backgroundColor: colors.card,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  calloutText: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  helpContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    padding: 16,
    ...shadow.medium,
    alignItems: 'center',
  },
  helpText: {
    color: colors.text,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  gotItButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.m,
    alignSelf: 'center',
  },
  gotItButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: borderRadius.s,
    alignItems: 'center',
    marginTop: 8,
  },
  dismissText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  confirmationContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    padding: 16,
    ...shadow,
  },
  confirmationText: {
    color: colors.text,
    marginBottom: 8,
  },
  hangoutsButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.m,
    ...shadow.medium,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  myHangoutsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.m,
    ...shadow.medium,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  hangoutsButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  selectedLocationOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationInner: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  mapControlsContainer: {
    position: 'absolute',
    right: 16,
    top: 100,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
      backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
      elevation: 5,
      ...customShadow,
    } as ViewStyle,
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  radarContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    pointerEvents: 'none',
    bottom: 120,
    right: 20,
    zIndex: 10,
    opacity: 0.7,
  },
  radarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.primary,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  warningContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 61, 0, 0.8)',
    borderRadius: borderRadius.m,
    padding: 16,
    ...shadow,
  },
  warningText: {
    color: colors.text,
    marginBottom: 8,
  },
    mapContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      overflow: 'hidden',
    } as ViewStyle,
    createPinButton: {
      position: 'absolute',
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      pointerEvents: 'auto',
      bottom: 20,
      right: 20,
      zIndex: 2,
      opacity: 1,
    } as ViewStyle,
    createPinButtonInner: {
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: 30,
      borderWidth: 2,
      borderStyle: 'solid',
      borderTopColor: colors.primary,
      borderLeftColor: colors.primary,
      borderRightColor: colors.primary,
      borderBottomColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    } as ViewStyle,
    headerContainer: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    } as ViewStyle,
    headerText: {
      color: colors.text,
      fontWeight: 'bold',
    } as TextStyle,
    floatingButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    } as ViewStyle,
    gradientButton: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
    crazyModeActive: {
      borderWidth: 2,
      borderColor: colors.accent,
    } as ViewStyle,
    crazyOverlay: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    } as ViewStyle,
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <CosmicWavesBackground intensity="medium" />
      </View>
      {(!isLoading && mapRegion) ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={warmSunsetMapStyle}
          initialRegion={mapRegion}
          onMapReady={handleMapReady}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          loadingEnabled={true}
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.background}
          onPoiClick={(event) => {
            const { coordinate, name } = event.nativeEvent;
            setSelectedLocationLocal(coordinate);
            setShowLocationHelpLocal(false);
            setLocationSelectedLocal(true);
            setTimeout(() => setLocationSelectedLocal(false), 2000);
          }}
        >
          {/* Display pins - filtered to exclude expired hangouts */}
          {pins
            .filter(pin => {
              const expiresAt = pin.expiresAt instanceof Date 
                ? pin.expiresAt 
                : new Date(pin.expiresAt || new Date());
              return !isDateInPast(expiresAt);
            })
            .map((pin) => (
              <CustomMarker
                key={`pin-${pin.id}-${markerKey}`}
                pin={pin}
                onPress={handleMarkerPress}
              />
            ))}
          
          {/* Display selected location marker */}
          {selectedLocation && (
            <Marker
              key={`selected-${markerKey}`}
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              pinColor={colors.secondary}
              title="Selected Location"
              description="Tap 'Add' to create a pin here"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>Selected Location</Text>
                  <Text style={styles.calloutText}>Tap the + button to create a hangout</Text>
                </View>
              </Callout>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}

      {/* Simplified psychedelic overlay effects */}
      <View style={styles.overlayContainer} pointerEvents="none">
        {/* Radar sweep - simplified */}
        <View style={styles.radarContainer}>
          <Animated.View
            style={[
              styles.radarSweep,
              {
                transform: [
                  { rotate: radarRotation },
                ],
              },
            ]}
          />
          
          {/* Removing the radar grid lines */}
        </View>
      </View>

      {/* Top navigation buttons */}
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.hangoutsButton} onPress={handleFriendsHangouts}>
          <Text style={styles.hangoutsButtonText}>Friends' Hangouts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.myHangoutsButton} onPress={handleMyHangouts}>
          <Text style={styles.hangoutsButtonText}>My Hangouts</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom action buttons */}
      <View style={styles.bottomButtonsContainer}>
        {/* Map controls */}
        <View style={styles.mapControlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMyLocation}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRefreshPins}
          >
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Crazy mode button */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            crazyMode && styles.crazyModeActive
          ]}
          onPress={() => setCrazyMode(!crazyMode)}
        >
          <LinearGradient
            colors={crazyMode ? [colors.accent, colors.primary] : [colors.primary, colors.secondary]}
            style={styles.gradientButton}
          >
            <Ionicons
              name={crazyMode ? "flash" : "flash-outline"}
              size={32}
              color={colors.background}
            />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Add pin button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreatePin}
        >
          <Ionicons name="add" size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Location selection confirmation */}
      {locationSelected && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>Location selected!</Text>
        </View>
      )}
      
      {/* No location selected warning */}
      {noLocationSelected && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Please select a location first</Text>
        </View>
      )}
      
      {/* Location help message */}
      {showLocationHelp && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Tap on the map to select a location</Text>
          <TouchableOpacity 
            style={styles.gotItButton}
            onPress={() => setShowLocationHelpLocal(false)}
          >
            <Text style={styles.gotItButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Crazy mode overlay */}
      {crazyMode && (
        <View style={styles.crazyOverlay}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
              }
            ]}
          >
            {/* First rotating gradient layer */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    {
                      rotate: crazyRotate1.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }
                  ],
                }
              ]}
            >
              <LinearGradient
                colors={[colors.primary + '80', colors.accent + '80', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Second rotating gradient layer */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    {
                      rotate: crazyRotate2.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['360deg', '0deg'],
                      })
                    }
                  ],
                }
              ]}
            >
              <LinearGradient
                colors={[colors.secondary + '80', colors.primary + '80', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Third rotating gradient layer */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    {
                      rotate: crazyRotate3.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-360deg'],
                      })
                    }
                  ],
                }
              ]}
            >
              <LinearGradient
                colors={['#FF149380', '#FF450080', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default MapScreen; 
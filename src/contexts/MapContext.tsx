import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationCoordinates, LocationPin, PinCreationData } from '../types';
import * as pinsApi from '../api/pins';
import { useAuth } from './AuthContext';
import debounce from 'lodash/debounce';

interface MapContextState {
  userLocation: LocationCoordinates | null;
  selectedLocation: LocationCoordinates | null;
  pins: LocationPin[];
  selectedPin: LocationPin | null;
  isLoading: boolean;
  error: string | null;
  isAuthStable: boolean;
}

interface MapContextActions {
  setUserLocation: (location: LocationCoordinates) => void;
  setSelectedLocation: (location: LocationCoordinates | null) => void;
  setSelectedPin: (pin: LocationPin | null) => void;
  createPin: (pinData: PinCreationData) => Promise<string>;
  updatePin: (pinId: string, pinData: Partial<LocationPin>) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  refreshPins: () => Promise<void>;
  getUserLocation: () => Promise<LocationCoordinates | null>;
}

const MapContext = createContext<(MapContextState & MapContextActions) | null>(null);

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthInitialized } = useAuth();
  
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [pins, setPins] = useState<LocationPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthStable, setIsAuthStable] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Create a debounced version of the pin refresh function
  const debouncedRefreshPins = useCallback(
    debounce(async () => {
      if (!currentUser || !isAuthInitialized) {
        console.log("DIAGNOSTIC: Auth not stable, skipping pin refresh");
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all pins visible to the user
        const allPins = await pinsApi.getPinsVisibleToUser(currentUser.uid);
        const activePins = await pinsApi.getActivePins(currentUser.uid);
        
        // Set pins in state
        setPins(activePins);
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('Error refreshing pins:', err);
        setError('Failed to refresh pins');
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          console.log(`Retrying pin refresh (attempt ${retryCount + 1}/${maxRetries})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => debouncedRefreshPins(), 1000 * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        setIsLoading(false);
      }
    }, 1000), // 1 second debounce
    [currentUser, isAuthInitialized, retryCount]
  );

  // Request location permissions and get initial user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        const userCoords: LocationCoordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(userCoords);
      } catch (err: any) {
        console.error('Error getting location:', err);
        setError('Failed to get your location');
      }
    })();
  }, []);

  // Load pins when auth state is stable
  useEffect(() => {
    if (isAuthInitialized) {
      setIsAuthStable(true);
      if (currentUser) {
        console.log("DIAGNOSTIC: Auth stable and user present, refreshing pins for:", currentUser.uid);
        debouncedRefreshPins();
      } else {
        console.log("DIAGNOSTIC: Auth stable but no user, clearing pins");
        setPins([]);
      }
    } else {
      setIsAuthStable(false);
    }
  }, [currentUser, isAuthInitialized]);

  const getUserLocation = async (): Promise<LocationCoordinates | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      const userCoords: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      console.log("MapContext getUserLocation:", userCoords);
      setUserLocation(userCoords);
      return userCoords;
    } catch (err: any) {
      console.error('Error getting location:', err);
      setError('Failed to get your location');
      return null;
    }
  };

  const refreshPins = async () => {
    await debouncedRefreshPins();
  };

  const createPin = async (pinData: PinCreationData): Promise<string> => {
    if (!currentUser) {
      throw new Error('User must be logged in to create pins');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const pinId = await pinsApi.createPin(currentUser.uid, pinData);
      
      // Refresh pins after creating a new one
      await refreshPins();
      
      return pinId;
    } catch (err: any) {
      console.error('Error creating pin:', err);
      setError('Failed to create pin');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePin = async (
    pinId: string,
    pinData: Partial<LocationPin>
  ): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to update pins');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await pinsApi.updatePin(pinId, pinData);
      
      // Refresh pins after updating
      await refreshPins();
      
      // Update selected pin if it's the one being edited
      if (selectedPin && selectedPin.id === pinId) {
        const updatedPin = await pinsApi.getPinById(pinId);
        setSelectedPin(updatedPin);
      }
    } catch (err: any) {
      console.error('Error updating pin:', err);
      setError('Failed to update pin');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePin = async (pinId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to delete pins');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await pinsApi.deletePin(pinId);
      
      // Refresh pins after deleting
      await refreshPins();
      
      // Clear selected pin if it's the one being deleted
      if (selectedPin && selectedPin.id === pinId) {
        setSelectedPin(null);
      }
    } catch (err: any) {
      console.error('Error deleting pin:', err);
      setError('Failed to delete pin');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MapContext.Provider
      value={{
        userLocation,
        selectedLocation,
        pins,
        selectedPin,
        isLoading,
        error,
        isAuthStable,
        setUserLocation,
        setSelectedLocation,
        setSelectedPin,
        createPin,
        updatePin,
        deletePin,
        refreshPins,
        getUserLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}; 
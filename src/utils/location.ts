import * as Location from 'expo-location';
import { Region } from '../types';

/**
 * Request location permissions from the user
 * @returns True if permissions were granted
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

/**
 * Get the current user location
 * @returns Location coordinates or null if not available
 */
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Create a map region object centered on the given coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param latitudeDelta Latitude delta (zoom level)
 * @param longitudeDelta Longitude delta (zoom level)
 * @returns Region object
 */
export const createRegion = (
  latitude: number,
  longitude: number,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01
): Region => {
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

/**
 * Calculate the distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Get the address from coordinates using reverse geocoding
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Address string or null if not available
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      return null;
    }
    
    const geocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (geocode && geocode.length > 0) {
      const location = geocode[0];
      const addressParts = [];
      
      if (location.name) addressParts.push(location.name);
      if (location.street) {
        const streetAddress = location.streetNumber 
          ? `${location.streetNumber} ${location.street}`
          : location.street;
        addressParts.push(streetAddress);
      }
      if (location.city) addressParts.push(location.city);
      if (location.region) addressParts.push(location.region);
      if (location.postalCode) addressParts.push(location.postalCode);
      if (location.country) addressParts.push(location.country);
      
      return addressParts.filter(Boolean).join(', ');
    }
    
    return null;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return null;
  }
}; 
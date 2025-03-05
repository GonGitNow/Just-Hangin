/**
 * Utility functions for handling images
 */

/**
 * Validates and processes an image URI to ensure it works across different environments
 * @param uri The image URI to validate
 * @returns The original URI if valid, or null if invalid
 */
export const processImageUri = (uri: string | null | undefined): string | null => {
  if (!uri) {
    console.log('processImageUri: URI is null or undefined');
    return null;
  }
  
  console.log('processImageUri: Processing URI:', uri);
  
  // Accept both HTTP/HTTPS URLs and file:// URIs
  if (uri.startsWith('http')) {
    console.log('processImageUri: Valid HTTP URI');
    return uri;
  }
  
  if (uri.startsWith('file://')) {
    console.log('processImageUri: Valid file:// URI');
    return uri;
  }
  
  // For development builds, sometimes the URI might be a local path without the file:// prefix
  if (uri.startsWith('/data/')) {
    const processedUri = `file://${uri}`;
    console.log('processImageUri: Converted local path to file:// URI:', processedUri);
    return processedUri;
  }
  
  // For content:// URIs (Android content provider)
  if (uri.startsWith('content://')) {
    console.log('processImageUri: Valid content:// URI');
    return uri;
  }
  
  // For relative paths
  if (uri.startsWith('/')) {
    const processedUri = `file://${uri}`;
    console.log('processImageUri: Converted relative path to file:// URI:', processedUri);
    return processedUri;
  }
  
  // For Firebase Storage URLs that might be encoded
  if (uri.includes('firebasestorage.googleapis.com')) {
    try {
      const decodedUri = decodeURIComponent(uri);
      console.log('processImageUri: Decoded Firebase Storage URL:', decodedUri);
      return decodedUri;
    } catch (error) {
      console.log('processImageUri: Error decoding Firebase Storage URL:', error);
      return uri;
    }
  }
  
  // For data URLs
  if (uri.startsWith('data:')) {
    console.log('processImageUri: Valid data URL');
    return uri;
  }
  
  // For Firebase Storage URLs that might be missing the https:// prefix
  if (uri.startsWith('firebasestorage.googleapis.com')) {
    const processedUri = `https://${uri}`;
    console.log('processImageUri: Added https:// prefix to Firebase Storage URL:', processedUri);
    return processedUri;
  }
  
  console.log('processImageUri: Invalid image URI:', uri);
  return null;
};

/**
 * Creates a source object for React Native Image component
 * @param uri The image URI
 * @returns A source object for the Image component, or undefined if the URI is invalid
 */
export const createImageSource = (uri: string | null | undefined): { uri: string } | undefined => {
  const processedUri = processImageUri(uri);
  if (!processedUri) {
    console.log('createImageSource: Failed to create source object - invalid URI');
    return undefined;
  }
  
  console.log('createImageSource: Created source object with URI:', processedUri);
  return { uri: processedUri };
}; 
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, shadow } from '../../constants/theme';
import { formatDate, formatTime, isDateInPast } from '../../utils/dateTime';
import * as pinsApi from '../../api/pins';
import * as profileApi from '../../api/profile';
import * as commentsApi from '../../api/comments';
import { UserProfile, Comment } from '../../types';
import CommentItem from '../../components/CommentItem';
import { createImageSource } from '../../utils/imageUtils';
import { ROUTES } from '../../constants/routes';

type RootStackParamList = {
  [key: string]: any;
};

const PinDetailsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
  const { selectedPin, deletePin, isLoading, refreshPins, setSelectedPin } = useMap();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInProfiles, setCheckedInProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [localPin, setLocalPin] = useState(selectedPin);

  const loadCheckedInProfiles = async () => {
    if (!localPin?.checkedInUsers?.length) {
      setCheckedInProfiles([]);
      return;
    }

    setIsLoadingProfiles(true);
    try {
      const profiles = await Promise.all(
        localPin.checkedInUsers.map(async (userId) => {
          try {
            const profile = await profileApi.getUserProfile(userId);
            return profile;
          } catch (error) {
            console.error(`Error fetching profile for ${userId}:`, error);
            return null;
          }
        })
      );
      
      const validProfiles = profiles.filter(Boolean) as UserProfile[];
      console.log('Loaded profiles:', validProfiles);
      setCheckedInProfiles(validProfiles);
    } catch (error) {
      console.error('Error loading checked-in profiles:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const loadComments = async () => {
    if (!localPin) return;
    
    setIsLoadingComments(true);
    try {
      const pinComments = await commentsApi.getCommentsByPin(localPin.id);
      setComments(pinComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Update local pin when selectedPin changes
  useEffect(() => {
    setLocalPin(selectedPin);
  }, [selectedPin]);

  useEffect(() => {
    loadCheckedInProfiles();
    loadComments();
  }, [localPin?.id, localPin?.checkedInUsers]);

  // Early return if no selected pin
  if (!selectedPin) {
    navigation.navigate(ROUTES.MAP.MAP);
    return null;
  }

  // Process dates
  const hangoutTime = localPin?.hangoutTime instanceof Date 
    ? localPin.hangoutTime 
    : new Date(localPin?.hangoutTime || new Date());
  
  const expiresAt = localPin?.expiresAt instanceof Date 
    ? localPin.expiresAt 
    : new Date(localPin?.expiresAt || new Date());
  
  const currentTime = new Date();
  
  // Debug logs
  console.log('Hangout Time:', hangoutTime);
  console.log('Expires At:', expiresAt);
  console.log('Current Time:', currentTime);
  console.log('Checked In Users:', localPin?.checkedInUsers);
  
  // Update logic: A hangout is only considered "past" when it reaches expiration time
  const isExpired = isDateInPast(expiresAt);
  
  // We'll keep track of whether the start time has passed for UI messaging purposes
  const hasStartTimePassed = isDateInPast(hangoutTime);
  
  console.log('Has Start Time Passed:', hasStartTimePassed);
  console.log('Is Expired:', isExpired);
  
  const isOwner = currentUser?.uid === localPin?.createdBy;
  const isUserCheckedIn = localPin?.checkedInUsers?.includes(currentUser?.uid || '') || false;

  const handleDelete = () => {
    if (!localPin) return;
    
    Alert.alert(
      'Delete Pin',
      'Are you sure you want to delete this pin?',
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
              setIsDeleting(true);
              await deletePin(localPin.id);
              navigation.navigate(ROUTES.MAP.MAP);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pin. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCheckInToggle = async () => {
    if (!currentUser || !localPin) return;
    
    setIsCheckingIn(true);
    try {
      if (isUserCheckedIn) {
        // Check out
        await pinsApi.checkOutFromPin(localPin.id, currentUser.uid);
        
        // Update local state immediately for better UX
        const updatedCheckedInUsers = localPin.checkedInUsers?.filter(id => id !== currentUser.uid) || [];
        setLocalPin({
          ...localPin,
          checkedInUsers: updatedCheckedInUsers
        });
      } else {
        // Check in
        await pinsApi.checkInToPin(localPin.id, currentUser.uid);
        
        // Update local state immediately for better UX
        const updatedCheckedInUsers = [...(localPin.checkedInUsers || []), currentUser.uid];
        setLocalPin({
          ...localPin,
          checkedInUsers: updatedCheckedInUsers
        });
      }
      
      // Refresh pins to update the global state
      await refreshPins();
      
      // Get the updated pin data from the server
      const updatedPin = await pinsApi.getPinById(localPin.id);
      
      // Update both the local state and the context state
      setLocalPin(updatedPin);
      setSelectedPin(updatedPin);
      
      // Force reload checked-in profiles
      await loadCheckedInProfiles();
      
      console.log('Check-in/out successful, updated pin:', updatedPin);
    } catch (error) {
      console.error('Check-in/out error:', error);
      Alert.alert('Error', `Failed to ${isUserCheckedIn ? 'check out from' : 'check in to'} this hangout.`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !commentText.trim() || !localPin) return;
    
    setIsAddingComment(true);
    try {
      await commentsApi.addComment(localPin.id, currentUser.uid, commentText.trim());
      setCommentText('');
      await loadComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCommentDeleted = async () => {
    await loadComments();
  };

  const handleGetDirections = () => {
    if (!localPin) return;
    
    const { latitude, longitude } = localPin.location;
    const label = encodeURIComponent(localPin.title);
    
    // Create URLs for different platforms
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latitude},${longitude}&dirflg=d`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${label})&dirflg=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web URL if native maps app can't be opened
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      }
    }).catch(err => {
      console.error('An error occurred while opening maps:', err);
      Alert.alert('Error', 'Could not open maps application.');
    });
  };

  const renderCheckedInUser = ({ item }: { item: UserProfile }) => (
    <View style={styles.checkedInUser}>
      {item.photoURL && createImageSource(item.photoURL) ? (
        <View style={styles.profileImageContainer}>
          <Image 
            source={createImageSource(item.photoURL)!} 
            style={styles.profileImage} 
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.profileInitial}>
          <Text style={styles.initialText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.checkedInName}>{item.displayName}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{localPin?.title}</Text>
            {isOwner && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={styles.infoText}>
                {formatDate(hangoutTime)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.infoText}>
                {formatTime(hangoutTime)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="hourglass-outline" size={20} color={colors.text} />
              <Text style={styles.infoText}>
                Expires: {formatDate(expiresAt)} at {formatTime(expiresAt)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.text} />
              {localPin?.address ? (
                <Text style={styles.infoText}>
                  {localPin.address}
                </Text>
              ) : (
                <Text style={styles.infoText}>
                  {localPin?.location.latitude.toFixed(6)}, {localPin?.location.longitude.toFixed(6)}
                </Text>
              )}
            </View>
          </View>
          
          {/* Get Directions Button */}
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={handleGetDirections}
          >
            <Ionicons name="navigate-outline" size={20} color={colors.lightText} />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Note:</Text>
            <Text style={styles.noteText}>{localPin?.note}</Text>
          </View>

          {/* Status message */}
          {isExpired ? (
            <View style={styles.statusBanner}>
              <Text style={styles.expiredText}>This hangout has expired</Text>
            </View>
          ) : hasStartTimePassed ? (
            <View style={styles.statusBanner}>
              <Text style={styles.activeText}>This hangout is active until {formatDate(expiresAt)} at {formatTime(expiresAt)}</Text>
            </View>
          ) : (
            <View style={styles.statusBanner}>
              <Text style={styles.upcomingText}>This hangout starts at {formatTime(hangoutTime)}</Text>
            </View>
          )}

          <View style={styles.checkedInSection}>
            <Text style={styles.sectionTitle}>
              Who's Here {checkedInProfiles.length > 0 ? `(${checkedInProfiles.length})` : ''}
            </Text>
            
            {isLoadingProfiles ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
            ) : checkedInProfiles.length > 0 ? (
              <FlatList
                data={checkedInProfiles}
                renderItem={renderCheckedInUser}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noCheckedInText}>
                No one has checked in yet. Be the first!
              </Text>
            )}
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </Text>
            
            {isLoadingComments ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
            ) : (
              <>
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUser?.uid || ''}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))
                ) : (
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to comment!
                  </Text>
                )}
              </>
            )}

            {!isExpired && currentUser && (
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.addCommentButton,
                    (!commentText.trim() || isAddingComment) ? styles.disabledButton : null
                  ]}
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || isAddingComment}
                >
                  {isAddingComment ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Ionicons name="send" size={20} color={colors.background} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Check-in button - only show if not expired */}
          {!isExpired && (
            <View style={styles.checkInContainer}>
              <TouchableOpacity
                style={[
                  styles.checkInButton,
                  isUserCheckedIn ? styles.checkedInButton : null,
                  isCheckingIn ? styles.disabledButton : null
                ]}
                onPress={handleCheckInToggle}
                disabled={isCheckingIn}
              >
                {isCheckingIn ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <View style={styles.checkInButtonContent}>
                    <Ionicons
                      name={isUserCheckedIn ? "checkmark-circle" : "radio-button-off"}
                      size={24}
                      color={colors.background}
                    />
                    <Text style={styles.checkInText}>
                      {isUserCheckedIn ? "Checked In" : "Check In"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: spacing.s,
    padding: spacing.xs,
  },
  infoContainer: {
    marginBottom: spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.s,
  },
  noteContainer: {
    marginTop: spacing.m,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  checkInContainer: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  checkInButton: {
    flexDirection: 'row',
    padding: spacing.m,
    borderRadius: borderRadius.m,
    backgroundColor: colors.primary,
    minWidth: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedInButton: {
    backgroundColor: colors.success,
  },
  checkInText: {
    color: colors.background,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    fontSize: 16,
  },
  checkedInSection: {
    marginTop: spacing.l,
  },
  commentsSection: {
    marginTop: spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.m,
  },
  checkedInUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  profileInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: spacing.s,
    ...shadow.light,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  initialText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 18,
  },
  checkedInName: {
    fontSize: 16,
    color: colors.text,
  },
  noCheckedInText: {
    color: colors.text,
    fontStyle: 'italic',
  },
  noCommentsText: {
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.m,
  },
  loadingIndicator: {
    marginVertical: spacing.m,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.m,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.m,
    padding: spacing.s,
    paddingTop: spacing.s,
    minHeight: 40,
    maxHeight: 100,
    marginRight: spacing.s,
    color: colors.text,
  },
  addCommentButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusBanner: {
    marginTop: spacing.m,
    padding: spacing.s,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.s,
    alignItems: 'center',
  },
  expiredText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  activeText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  upcomingText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    marginVertical: spacing.m,
  },
  directionsButtonText: {
    color: colors.lightText,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: spacing.xs,
  },
});

export default PinDetailsScreen; 
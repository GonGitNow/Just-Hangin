import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../contexts/FriendsContext';
import { useMap } from '../../contexts/MapContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { UserProfile, LocationPin } from '../../types';
import * as pinsApi from '../../api/pins';
import { formatDate, formatTime } from '../../utils/dateTime';
import { ROUTES } from '../../constants/routes';

// Consider a user online if they were active in the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

type ParamList = {
  FriendProfile: {
    friendId: string;
  };
};

const FriendProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, 'FriendProfile'>>();
  const navigation = useNavigation<any>();
  const { friendId } = route.params;
  const { friends, removeFriend } = useFriends();
  const { setSelectedPin } = useMap();
  
  const [friend, setFriend] = useState<UserProfile | null>(null);
  const [friendPins, setFriendPins] = useState<LocationPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserOnline = (lastActive: Date) => {
    const now = new Date().getTime();
    const lastActiveTime = lastActive.getTime();
    return now - lastActiveTime <= ONLINE_THRESHOLD_MS;
  };

  useEffect(() => {
    const loadFriendData = async () => {
      try {
        setIsLoading(true);
        
        // Find friend in friends list
        const foundFriend = friends.find(f => f.id === friendId);
        if (foundFriend) {
          setFriend(foundFriend);
          
          // Load friend's pins that are visible to current user
          const pins = await pinsApi.getFriendPins(foundFriend.id, friendId);
          setFriendPins(pins);
        } else {
          setError('Friend not found');
        }
      } catch (err) {
        console.error('Error loading friend data:', err);
        setError('Failed to load friend data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFriendData();
  }, [friendId, friends]);

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend?.displayName} from your friends?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRemoving(true);
              await removeFriend(friendId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  const handleViewPin = (pin: LocationPin) => {
    setSelectedPin(pin);
    navigation.navigate(ROUTES.MAIN.MAP_TAB, {
      screen: ROUTES.MAP.PIN_DETAILS
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Friend not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {friend.photoURL ? (
            <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {friend.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {friend.privacySettings?.showActiveStatus && friend.lastActive && isUserOnline(friend.lastActive) && (
            <View style={styles.activeIndicator} />
          )}
        </View>
        
        <Text style={styles.displayName}>{friend.displayName}</Text>
        
        {friend.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.text} />
            <Text style={styles.locationText}>{friend.location}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemoveFriend}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="person-remove" size={16} color="#fff" />
              <Text style={styles.removeButtonText}>Remove Friend</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hangout Pins</Text>
      </View>
      
      {friendPins.length === 0 ? (
        <View style={styles.emptyPinsContainer}>
          <Ionicons name="map-outline" size={40} color={colors.text} />
          <Text style={styles.emptyPinsText}>No hangout pins to show</Text>
        </View>
      ) : (
        friendPins.map(pin => (
          <TouchableOpacity
            key={pin.id}
            style={styles.pinItem}
            onPress={() => handleViewPin(pin)}
          >
            <View style={styles.pinHeader}>
              <Text style={styles.pinTitle}>{pin.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </View>
            
            <View style={styles.pinDetails}>
              <View style={styles.pinDetail}>
                <Ionicons name="calendar-outline" size={16} color={colors.text} />
                <Text style={styles.pinDetailText}>
                  {formatDate(pin.hangoutTime)}
                </Text>
              </View>
              
              <View style={styles.pinDetail}>
                <Ionicons name="time-outline" size={16} color={colors.text} />
                <Text style={styles.pinDetailText}>
                  {formatTime(pin.hangoutTime)}
                </Text>
              </View>
            </View>
            
            {pin.note && (
              <Text style={styles.pinNote} numberOfLines={2}>
                {pin.note}
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.m,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: 40,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.background,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  removeButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    padding: spacing.m,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyPinsContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyPinsText: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.m,
  },
  pinItem: {
    margin: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  pinDetails: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  pinDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  pinDetailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  pinNote: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
});

export default FriendProfileScreen; 
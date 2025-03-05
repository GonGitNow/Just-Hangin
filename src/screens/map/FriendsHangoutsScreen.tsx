import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../contexts/FriendsContext';
import { useMap } from '../../contexts/MapContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { LocationPin, UserProfile } from '../../types';
import { formatDate, formatTime, formatRelativeDate } from '../../utils/dateTime';
import * as pinsApi from '../../api/pins';

const FriendsHangoutsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { currentUser } = useAuth();
  const { friends } = useFriends();
  const { setSelectedPin } = useMap();

  const [friendsHangouts, setFriendsHangouts] = useState<Array<LocationPin & { creatorProfile?: UserProfile }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriendsHangouts = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get all pins visible to the current user
      const allPins = await pinsApi.getPinsVisibleToUser(currentUser.uid);
      
      // Filter pins that are created by friends and not expired
      const now = new Date();
      const friendsPins = allPins.filter(pin => 
        friends.some(friend => friend.id === pin.createdBy) && 
        pin.expiresAt > now
      );

      // Sort pins by hangout time (soonest first)
      friendsPins.sort((a, b) => a.hangoutTime.getTime() - b.hangoutTime.getTime());

      // Add creator profile to each pin
      const pinsWithProfiles = friendsPins.map(pin => {
        const creatorProfile = friends.find(friend => friend.id === pin.createdBy);
        return { ...pin, creatorProfile };
      });

      setFriendsHangouts(pinsWithProfiles);
    } catch (err) {
      console.error('Error loading friends hangouts:', err);
      setError('Failed to load friends hangouts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriendsHangouts();
  }, [currentUser, friends]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriendsHangouts();
  };

  const handlePinPress = (pin: LocationPin) => {
    setSelectedPin(pin);
    navigation.navigate(ROUTES.MAP.PIN_DETAILS);
  };

  const renderHangoutItem = ({ item }: { item: LocationPin & { creatorProfile?: UserProfile } }) => {
    const isToday = new Date(item.hangoutTime).toDateString() === new Date().toDateString();
    const isTomorrow = new Date(item.hangoutTime).toDateString() === new Date(Date.now() + 86400000).toDateString();
    
    let dateLabel = formatDate(item.hangoutTime);
    if (isToday) dateLabel = 'Today';
    if (isTomorrow) dateLabel = 'Tomorrow';

    return (
      <TouchableOpacity 
        style={styles.hangoutCard}
        onPress={() => handlePinPress(item)}
      >
        <View style={styles.hangoutHeader}>
          <View style={styles.creatorInfo}>
            {item.creatorProfile?.photoURL ? (
              <Image 
                source={{ uri: item.creatorProfile.photoURL }} 
                style={styles.creatorAvatar} 
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorAvatarInitial}>
                  {item.creatorProfile?.displayName?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName}>
              {item.creatorProfile?.displayName || 'Unknown'}
            </Text>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.expiryText}>
              Expires {formatRelativeDate(item.expiresAt)}
            </Text>
          </View>
        </View>

        <View style={styles.hangoutContent}>
          <Text style={styles.hangoutTitle}>{item.title}</Text>
          {item.note ? (
            <Text style={styles.hangoutNote} numberOfLines={2}>{item.note}</Text>
          ) : null}
        </View>

        <View style={styles.hangoutFooter}>
          <View style={styles.hangoutTime}>
            <Ionicons name="time-outline" size={16} color={colors.text} />
            <Text style={styles.hangoutTimeText}>
              {dateLabel} at {formatTime(item.hangoutTime)}
            </Text>
          </View>
          <View style={styles.hangoutLocation}>
            <Ionicons name="location-outline" size={16} color={colors.text} />
            <Text style={styles.hangoutLocationText}>
              View on map
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading friends' hangouts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friendsHangouts}
        renderItem={renderHangoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.text} />
            <Text style={styles.emptyTitle}>No Hangouts Found</Text>
            <Text style={styles.emptyText}>
              Your friends haven't created any hangouts yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate(ROUTES.MAP.MAP)}
            >
              <Text style={styles.createButtonText}>Create Your Own Hangout</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
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
  loadingText: {
    marginTop: spacing.m,
    color: colors.text,
  },
  listContent: {
    padding: spacing.m,
  },
  hangoutCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    marginBottom: spacing.m,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  hangoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.xs,
  },
  creatorAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  creatorAvatarInitial: {
    color: colors.background,
    fontWeight: 'bold',
  },
  creatorName: {
    color: colors.text,
    fontWeight: 'bold',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  expiryText: {
    fontSize: 12,
    color: colors.text,
  },
  hangoutContent: {
    marginBottom: spacing.m,
  },
  hangoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hangoutNote: {
    color: colors.text,
  },
  hangoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hangoutTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hangoutTimeText: {
    marginLeft: spacing.xs,
    color: colors.text,
    fontSize: 13,
  },
  hangoutLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hangoutLocationText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.l,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
  },
  createButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: spacing.m,
    left: spacing.m,
    right: spacing.m,
    backgroundColor: colors.error,
    padding: spacing.m,
    borderRadius: borderRadius.m,
  },
  errorText: {
    color: colors.background,
    textAlign: 'center',
  },
});

export default FriendsHangoutsScreen; 
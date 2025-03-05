import React, { useEffect } from 'react';
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
import { useFriends } from '../../contexts/FriendsContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { UserProfile } from '../../types';

// Consider a user online if they were active in the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { friends, refreshFriends, isLoading, error } = useFriends();

  useEffect(() => {
    refreshFriends();
  }, []);

  const handleRefresh = () => {
    refreshFriends();
  };

  const navigateToFriendRequests = () => {
    navigation.navigate(ROUTES.FRIENDS.FRIEND_REQUESTS);
  };

  const navigateToSearchUsers = () => {
    navigation.navigate(ROUTES.FRIENDS.SEARCH_USERS);
  };

  const navigateToFriendProfile = (friend: UserProfile) => {
    navigation.navigate(ROUTES.FRIENDS.FRIEND_PROFILE, { friendId: friend.id });
  };

  const isUserOnline = (lastActive: Date) => {
    const now = new Date().getTime();
    const lastActiveTime = lastActive.getTime();
    return now - lastActiveTime <= ONLINE_THRESHOLD_MS;
  };

  const renderFriendItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => navigateToFriendProfile(item)}
    >
      <View style={styles.avatarContainer}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.privacySettings?.showActiveStatus && item.lastActive && isUserOnline(item.lastActive) && (
          <View style={styles.activeIndicator} />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        {item.location && (
          <Text style={styles.friendLocation}>{item.location}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToFriendRequests}
        >
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.headerButtonText}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToSearchUsers}
        >
          <Ionicons name="search" size={20} color={colors.primary} />
          <Text style={styles.headerButtonText}>Find Friends</Text>
        </TouchableOpacity>
      </View>

      {isLoading && friends.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={colors.text} />
          <Text style={styles.emptyText}>You don't have any friends yet</Text>
          <TouchableOpacity
            style={styles.findFriendsButton}
            onPress={navigateToSearchUsers}
          >
            <Text style={styles.findFriendsButtonText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s,
  },
  headerButtonText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: spacing.m,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    marginBottom: spacing.m,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.m,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  friendLocation: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  findFriendsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
  },
  findFriendsButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: spacing.m,
    backgroundColor: colors.error,
    margin: spacing.m,
    borderRadius: borderRadius.m,
  },
  errorText: {
    color: colors.background,
    textAlign: 'center',
  },
});

export default FriendsScreen; 
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../contexts/FriendsContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { FriendRequest } from '../../types';

const FriendRequestsScreen: React.FC = () => {
  const { 
    friendRequests, 
    refreshFriendRequests, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    isLoading, 
    error 
  } = useFriends();
  
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    refreshFriendRequests();
  }, []);

  const handleRefresh = () => {
    refreshFriendRequests();
  };

  const handleAccept = async (requestId: string) => {
    try {
      setProcessingIds(prev => [...prev, requestId]);
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted');
    } catch (err) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingIds(prev => [...prev, requestId]);
      await rejectFriendRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
    } catch (err) {
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingIds.includes(item.id);
    const firstLetter = item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U';
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {firstLetter}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{item.displayName || 'Unknown User'}</Text>
            <Text style={styles.requestTime}>
              Sent a friend request
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="close" size={20} color={colors.error} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Ionicons name="checkmark" size={20} color={colors.success} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && friendRequests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : friendRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={colors.text} />
          <Text style={styles.emptyText}>No friend requests</Text>
        </View>
      ) : (
        <FlatList
          data={friendRequests}
          renderItem={renderRequestItem}
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
  listContainer: {
    padding: spacing.m,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    marginBottom: spacing.m,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
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
  nameContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  requestTime: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s,
  },
  acceptButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
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

export default FriendRequestsScreen; 
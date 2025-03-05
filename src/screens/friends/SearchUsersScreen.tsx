import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../contexts/FriendsContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { UserProfile } from '../../types';

const SearchUsersScreen: React.FC = () => {
  const { 
    searchUsers, 
    searchResults, 
    sendFriendRequest, 
    clearSearchResults, 
    isLoading, 
    error 
  } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      Alert.alert('Error', 'Please enter at least 2 characters to search');
      return;
    }
    
    await searchUsers(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearchResults();
  };

  const handleSendRequest = async (userId: string) => {
    try {
      setProcessingIds(prev => [...prev, userId]);
      await sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent');
    } catch (err) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isProcessing = processingIds.includes(item.id);
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
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
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{item.displayName}</Text>
            {item.location && (
              <Text style={styles.location}>{item.location}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleSendRequest(item.id)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="person-add" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={isLoading || searchQuery.trim().length < 2}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading && searchResults.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color={colors.text} />
          <Text style={styles.emptyText}>
            {searchQuery.trim().length > 0
              ? 'No users found'
              : 'Search for users to add as friends'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing.m,
    marginRight: spacing.s,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: spacing.m,
  },
  userItem: {
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
  location: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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

export default SearchUsersScreen; 
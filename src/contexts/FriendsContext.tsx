import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, FriendRequest } from '../types';
import * as friendsApi from '../api/friends';
import * as profileApi from '../api/profile';
import { useAuth } from './AuthContext';

interface FriendsContextState {
  friends: UserProfile[];
  friendRequests: FriendRequest[];
  searchResults: UserProfile[];
  isLoading: boolean;
  error: string | null;
}

interface FriendsContextActions {
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  clearSearchResults: () => void;
  clearError: () => void;
}

type FriendsContextType = FriendsContextState & FriendsContextActions;

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const useFriends = (): FriendsContextType => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load friends and friend requests when user changes
  useEffect(() => {
    if (currentUser) {
      refreshFriends();
      refreshFriendRequests();
    } else {
      setFriends([]);
      setFriendRequests([]);
    }
  }, [currentUser]);

  const refreshFriends = async (): Promise<void> => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const friendIds = await friendsApi.getFriends(currentUser.uid);
      
      // Fetch profile data for each friend
      const friendProfiles: UserProfile[] = [];
      
      for (const friendId of friendIds) {
        const profile = await profileApi.getUserProfile(friendId);
        if (profile) {
          friendProfiles.push(profile);
        }
      }
      
      setFriends(friendProfiles);
    } catch (err: any) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFriendRequests = async (): Promise<void> => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const requests = await friendsApi.getFriendRequests(currentUser.uid);
      setFriendRequests(requests);
    } catch (err: any) {
      console.error('Error fetching friend requests:', err);
      setError('Failed to load friend requests');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to send friend requests');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await friendsApi.sendFriendRequest(currentUser.uid, userId);
      
      // Refresh friend requests after sending a new one
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to accept friend requests');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await friendsApi.acceptFriendRequest(requestId);
      
      // Refresh friends and friend requests after accepting
      await refreshFriends();
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError('Failed to accept friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to reject friend requests');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await friendsApi.rejectFriendRequest(requestId);
      
      // Refresh friend requests after rejecting
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error rejecting friend request:', err);
      setError('Failed to reject friend request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User must be logged in to remove friends');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await friendsApi.removeFriend(currentUser.uid, friendId);
      
      // Refresh friends after removing
      await refreshFriends();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string): Promise<void> => {
    if (!currentUser || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await profileApi.searchUsersByName(query, currentUser.uid);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearchResults = (): void => {
    setSearchResults([]);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: FriendsContextType = {
    friends,
    friendRequests,
    searchResults,
    isLoading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
    refreshFriends,
    refreshFriendRequests,
    clearSearchResults,
    clearError,
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}; 
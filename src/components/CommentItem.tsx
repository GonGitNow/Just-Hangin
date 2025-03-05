import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, UserProfile } from '../types';
import { colors, spacing, borderRadius, shadow, commonStyles } from '../constants/theme';
import * as profileApi from '../api/profile';
import * as commentsApi from '../api/comments';
import { formatRelativeDate } from '../utils/dateTime';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { createImageSource } from '../utils/imageUtils';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onCommentDeleted: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUserId,
  onCommentDeleted
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsProfileLoading(true);
        const profile = await profileApi.getUserProfile(comment.userId);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [comment.userId]);

  const isCommentOwner = currentUserId === comment.userId;

  const handleDeleteComment = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
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
              setIsLoading(true);
              await commentsApi.deleteComment(comment.id);
              onCommentDeleted();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Format the comment date
  const formatCommentDate = () => {
    if (!comment.createdAt) return '';
    return formatRelativeDate(comment.createdAt instanceof Date ? comment.createdAt : comment.createdAt.toDate());
  };
  
  // Get time ago string
  const timeAgo = comment.createdAt instanceof Date 
    ? formatDistanceToNow(comment.createdAt, { addSuffix: true }) 
    : formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true });

  // Get initials for avatar
  const getInitials = () => {
    if (!userProfile?.displayName) return '?';
    
    const nameParts = userProfile.displayName.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return userProfile.displayName[0].toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {isProfileLoading ? (
            <View style={styles.profileInitial}>
              <ActivityIndicator size="small" color={colors.background} />
            </View>
          ) : userProfile?.photoURL && createImageSource(userProfile.photoURL) ? (
            <View style={styles.profileImageContainer}>
              <Image 
                source={createImageSource(userProfile.photoURL)!} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.profileInitial}>
              <Text style={styles.initialText}>
                {userProfile?.displayName.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.nameTimeContainer}>
            <Text style={styles.userName}>{userProfile?.displayName || 'Unknown User'}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>
        
        {isCommentOwner && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteComment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
    ...shadow.light,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInitial: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    ...shadow.light,
  },
  profileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
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
    fontSize: 14,
  },
  userName: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 14,
  },
  timeAgo: {
    color: colors.disabled,
    fontSize: 12,
  },
  commentText: {
    color: colors.text,
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: spacing.xl + 4, // Align with the profile picture
  },
  deleteButton: {
    padding: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    ...shadow.light,
  },
  nameTimeContainer: {
    marginLeft: spacing.s,
  },
});

export default CommentItem; 
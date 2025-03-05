import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, shadow } from '../../constants/theme';
import { LocationPin } from '../../types';
import * as pinsApi from '../../api/pins';
import { formatDate, formatTime, isDateInPast } from '../../utils/dateTime';
import { ROUTES } from '../../constants/routes';

const MyHangoutsScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<any>();
  const { currentUser } = useAuth();
  const { pins, isLoading: isPinsLoading, error: pinsError, refreshPins } = useMap();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [myPins, setMyPins] = useState<LocationPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.m,
    },
    loadingText: {
      marginTop: spacing.m,
      fontSize: 16,
      color: colors.text,
    },
    listContent: {
      padding: spacing.m,
      paddingBottom: spacing.xxl * 2,
    },
    hangoutItem: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.m,
      marginBottom: spacing.m,
      overflow: 'hidden',
      ...shadow.medium,
    },
    headerGradient: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.m,
      position: 'relative',
    },
    expiredHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.m,
      backgroundColor: colors.disabled,
      position: 'relative',
    },
    hangoutContent: {
      padding: spacing.m,
    },
    activeEventItem: {
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50', // Green color for active events
    },
    expiredItem: {
      opacity: 0.7,
      borderLeftWidth: 4,
      borderLeftColor: colors.disabled,
    },
    hangoutTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.background,
      flex: 1,
      marginRight: spacing.xl * 2,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    hangoutDetails: {
      marginBottom: spacing.m,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.s,
    },
    detailText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: spacing.s,
    },
    noteContainer: {
      backgroundColor: colors.background,
      padding: spacing.s,
      borderRadius: borderRadius.s,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    noteText: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
    },
    statusBadge: {
      position: 'absolute',
      top: '50%',
      right: spacing.xl * 3.5,
      transform: [{ translateY: -10 }],
      backgroundColor: '#4CAF50',
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs / 2,
      borderRadius: borderRadius.s,
      ...shadow.light,
    },
    upcomingBadge: {
      backgroundColor: colors.primary,
    },
    expiredBadge: {
      backgroundColor: colors.error,
    },
    statusText: {
      fontSize: 12,
      color: colors.background,
      fontWeight: 'bold',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      marginTop: spacing.xl,
    },
    emptyImage: {
      width: 200,
      height: 200,
      marginBottom: spacing.m,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.s,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.l,
      lineHeight: 22,
    },
    createButton: {
      marginTop: spacing.m,
      ...shadow.button,
    },
    gradientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.m,
      borderRadius: borderRadius.m,
    },
    createButtonText: {
      color: colors.background,
      fontWeight: 'bold',
      marginLeft: spacing.xs,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: 'center',
      marginVertical: spacing.m,
      maxWidth: '80%',
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      borderRadius: borderRadius.m,
      ...shadow.button,
    },
    retryButtonText: {
      color: colors.background,
      fontWeight: 'bold',
    },
    floatingButton: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.xl,
      ...shadow.dark,
    },
    gradientFab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const loadMyHangouts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentUser) return;
      
      const pins = await pinsApi.getPinsByUser(currentUser.uid);
      
      // Sort pins by hangout time (most recent first)
      const sortedPins = [...pins].sort((a, b) => {
        return new Date(b.hangoutTime).getTime() - new Date(a.hangoutTime).getTime();
      });
      
      setMyPins(sortedPins);
      
      // Animate the list in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error loading hangouts:', err);
      setError('Failed to load hangouts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMyHangouts();
  }, [currentUser]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fadeAnim.setValue(0);
    loadMyHangouts();
  };

  const handlePinPress = (pin: LocationPin) => {
    navigation.navigate(ROUTES.MAP.PIN_DETAILS as never);
  };

  const handleDeletePin = async (pinId: string) => {
    Alert.alert(
      'Delete Hangout',
      'Are you sure you want to delete this hangout?',
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
              await pinsApi.deletePin(pinId);
              await loadMyHangouts();
              await refreshPins();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete hangout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditPin = (pin: LocationPin) => {
    navigation.navigate(ROUTES.MAP.CREATE_PIN, { 
      editMode: true,
      pin: pin
    });
  };

  const renderHangoutItem = ({ item, index }: { item: LocationPin, index: number }) => {
    // Update logic: A hangout is only considered "past" when it reaches expiration time
    const isExpired = isDateInPast(item.expiresAt);
    
    // We'll keep track of whether the start time has passed for UI messaging purposes
    const hasStartTimePassed = isDateInPast(item.hangoutTime);
    
    const checkedInCount = item.checkedInUsers?.length || 0;
    
    // Calculate animation delay based on index
    const animationDelay = index * 100;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.hangoutItem,
            hasStartTimePassed && !isExpired && styles.activeEventItem,
            isExpired && styles.expiredItem,
          ]}
          onPress={() => handlePinPress(item)}
          disabled={isExpired}
          activeOpacity={0.7}
        >
          {!isExpired ? (
            <LinearGradient
              colors={hasStartTimePassed ? ['#4CAF50', '#2E7D32'] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <Text style={styles.hangoutTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {hasStartTimePassed && !isExpired && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              )}
              {!hasStartTimePassed && !isExpired && (
                <View style={[styles.statusBadge, styles.upcomingBadge]}>
                  <Text style={styles.statusText}>Upcoming</Text>
                </View>
              )}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPin(item)}
                >
                  <Ionicons name="pencil" size={18} color={colors.background} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePin(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.background} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.expiredHeader}>
              <Text style={styles.hangoutTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, styles.expiredBadge]}>
                <Text style={styles.statusText}>Expired</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePin(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.hangoutContent}>
            <View style={styles.hangoutDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color={isExpired ? colors.disabled : colors.primary} />
                <Text style={styles.detailText}>{formatDate(item.hangoutTime)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={isExpired ? colors.disabled : colors.primary} />
                <Text style={styles.detailText}>{formatTime(item.hangoutTime)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={18} color={isExpired ? colors.disabled : colors.primary} />
                <Text style={styles.detailText}>
                  {checkedInCount} {checkedInCount === 1 ? 'person' : 'people'} checked in
                </Text>
              </View>
            </View>

            {item.note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteText} numberOfLines={2}>
                  {item.note}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your hangouts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMyHangouts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myPins}
        renderItem={renderHangoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={100} color={colors.primary} />
            <Text style={styles.emptyTitle}>No Hangouts Yet</Text>
            <Text style={styles.emptyText}>You haven't created any hangouts yet. Create one to get started!</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate(ROUTES.MAP.CREATE_PIN)}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.background} />
                <Text style={styles.createButtonText}>Create a Hangout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate(ROUTES.MAP.CREATE_PIN)}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.gradientFab}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default MyHangoutsScreen; 
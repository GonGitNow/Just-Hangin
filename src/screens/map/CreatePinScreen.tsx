import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMap } from '../../contexts/MapContext';
import { useFriends } from '../../contexts/FriendsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { formatDate, formatTime } from '../../utils/dateTime';
import { getAddressFromCoordinates } from '../../utils/location';
import { LocationCoordinates, LocationPin } from '../../types';
import { ROUTES } from '../../constants/routes';

const CreatePinScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  const { selectedLocation, createPin, updatePin, isLoading } = useMap();
  const { friends } = useFriends();

  // Get edit mode and pin data from route params
  const { editMode, pin } = route.params as { editMode?: boolean; pin?: LocationPin };

  const [title, setTitle] = useState(editMode && pin ? pin.title : '');
  const [note, setNote] = useState(editMode && pin ? pin.note : '');
  const [hangoutTime, setHangoutTime] = useState(editMode && pin ? new Date(pin.hangoutTime) : new Date());
  const [expiresAt, setExpiresAt] = useState(editMode && pin ? new Date(pin.expiresAt) : (() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  })());
  const [selectedFriends, setSelectedFriends] = useState<string[]>(editMode && pin ? pin.visibleTo : []);
  const [shareWithAllFriends, setShareWithAllFriends] = useState(editMode && pin ? pin.visibleTo.length === friends.length : false);
  const [showHangoutDatePicker, setShowHangoutDatePicker] = useState(false);
  const [showHangoutTimePicker, setShowHangoutTimePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showExpiryTimePicker, setShowExpiryTimePicker] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string | null>(editMode && pin ? pin.address || null : null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Use either the location from the pin (in edit mode) or the selected location
  const pinLocation = editMode && pin ? pin.location : selectedLocation;

  if (!pinLocation) {
    Alert.alert(
      'No Location Selected',
      'Please select a location on the map first by tapping where you want to place your pin.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    return null;
  }

  // Fetch address when location changes
  useEffect(() => {
    const fetchAddress = async () => {
      if (pinLocation && !locationAddress) {
        setIsLoadingAddress(true);
        try {
          const address = await getAddressFromCoordinates(
            pinLocation.latitude,
            pinLocation.longitude
          );
          setLocationAddress(address);
        } catch (error) {
          console.error('Error fetching address:', error);
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };
    
    fetchAddress();
  }, [pinLocation]);

  const handleSavePin = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your hangout');
      return;
    }

    if (!pinLocation) {
      Alert.alert('Error', 'Please select a location for your hangout');
      return;
    }

    if (!shareWithAllFriends && selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to share your hangout with');
      return;
    }

    try {
      const visibleTo = shareWithAllFriends 
        ? friends.map(friend => friend.id)
        : selectedFriends;

      const pinData = {
        title: title.trim(),
        note: note.trim(),
        location: pinLocation,
        address: locationAddress || undefined,
        hangoutTime,
        expiresAt,
        visibleTo,
        selectedFriends: shareWithAllFriends ? [] : selectedFriends,
      };

      if (editMode && pin) {
        await updatePin(pin.id, pinData);
        Alert.alert('Success', 'Your hangout has been updated!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createPin(pinData);
        Alert.alert('Success', 'Your hangout has been created!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving pin:', error);
      Alert.alert('Error', `Failed to ${editMode ? 'update' : 'create'} hangout. Please try again.`);
    }
  };

  const handleChangeLocation = () => {
    navigation.goBack();
    Alert.alert(
      'Change Location',
      'Tap anywhere on the map to select a new location for your pin.',
      [{ text: 'OK' }]
    );
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleHangoutDateChange = (event: any, selectedDate?: Date) => {
    setShowHangoutDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(hangoutTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setHangoutTime(newDate);
    }
  };

  const handleHangoutTimeChange = (event: any, selectedTime?: Date) => {
    setShowHangoutTimePicker(false);
    if (selectedTime) {
      const newTime = new Date(hangoutTime);
      newTime.setHours(selectedTime.getHours());
      newTime.setMinutes(selectedTime.getMinutes());
      setHangoutTime(newTime);
    }
  };

  const handleExpiryDateChange = (event: any, selectedDate?: Date) => {
    setShowExpiryDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(expiresAt);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setExpiresAt(newDate);
    }
  };

  const handleExpiryTimeChange = (event: any, selectedTime?: Date) => {
    setShowExpiryTimePicker(false);
    if (selectedTime) {
      const newTime = new Date(expiresAt);
      newTime.setHours(selectedTime.getHours());
      newTime.setMinutes(selectedTime.getMinutes());
      setExpiresAt(newTime);
    }
  };

  // Format coordinates for display
  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Create a Hangout</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a title for your hangout"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationInfo}>
                {pinLocation && (
                  <>
                    <Text style={styles.locationCoordinates}>
                      {formatCoordinate(pinLocation.latitude)}, {formatCoordinate(pinLocation.longitude)}
                    </Text>
                    {isLoadingAddress ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.addressLoader} />
                    ) : locationAddress ? (
                      <Text style={styles.locationAddress}>{locationAddress}</Text>
                    ) : null}
                  </>
                )}
              </View>
              <TouchableOpacity
                style={styles.changeLocationButton}
                onPress={handleChangeLocation}
              >
                <Text style={styles.changeLocationButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />

          <Text style={styles.label}>Hangout Time</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowHangoutDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={styles.dateTimeText}>{formatDate(hangoutTime)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowHangoutTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.dateTimeText}>{formatTime(hangoutTime)}</Text>
            </TouchableOpacity>
          </View>

          {showHangoutDatePicker && (
            <DateTimePicker
              value={hangoutTime}
              mode="date"
              display="default"
              onChange={handleHangoutDateChange}
              minimumDate={new Date()}
            />
          )}

          {showHangoutTimePicker && (
            <DateTimePicker
              value={hangoutTime}
              mode="time"
              display="default"
              onChange={handleHangoutTimeChange}
            />
          )}

          <Text style={styles.label}>Expires At</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowExpiryDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={styles.dateTimeText}>{formatDate(expiresAt)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowExpiryTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.dateTimeText}>{formatTime(expiresAt)}</Text>
            </TouchableOpacity>
          </View>

          {showExpiryDatePicker && (
            <DateTimePicker
              value={expiresAt}
              mode="date"
              display="default"
              onChange={handleExpiryDateChange}
              minimumDate={new Date()}
            />
          )}

          {showExpiryTimePicker && (
            <DateTimePicker
              value={expiresAt}
              mode="time"
              display="default"
              onChange={handleExpiryTimeChange}
            />
          )}

          <Text style={styles.label}>Share with Friends</Text>
          {friends.length === 0 ? (
            <Text style={styles.noFriendsText}>You don't have any friends yet.</Text>
          ) : (
            <>
              <View style={styles.shareAllContainer}>
                <TouchableOpacity
                  style={[
                    styles.shareAllButton,
                    shareWithAllFriends && styles.selectedShareAllButton,
                  ]}
                  onPress={() => {
                    setShareWithAllFriends(!shareWithAllFriends);
                    if (!shareWithAllFriends) {
                      setSelectedFriends([]); // Clear individual selections when sharing with all
                    }
                  }}
                >
                  <Ionicons 
                    name={shareWithAllFriends ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={shareWithAllFriends ? colors.background : colors.text} 
                  />
                  <Text
                    style={[
                      styles.shareAllText,
                      shareWithAllFriends && styles.selectedShareAllText,
                    ]}
                  >
                    Share with All Friends
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.friendsContainer}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriends.includes(friend.id) && styles.selectedFriendItem,
                    ]}
                    onPress={() => {
                      if (!shareWithAllFriends) {
                        toggleFriendSelection(friend.id);
                      }
                    }}
                    disabled={shareWithAllFriends}
                  >
                    <Text
                      style={[
                        styles.friendName,
                        selectedFriends.includes(friend.id) && styles.selectedFriendName,
                      ]}
                    >
                      {friend.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              (!title.trim() || (!shareWithAllFriends && selectedFriends.length === 0)) && styles.disabledButton,
            ]}
            onPress={handleSavePin}
            disabled={isLoading || !title.trim() || (!shareWithAllFriends && selectedFriends.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.createButtonText}>Create Pin</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.m,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  formContainer: {
    padding: spacing.m,
  },
  formGroup: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.s,
    padding: spacing.m,
    marginBottom: spacing.m,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.s,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  locationInfo: {
    flex: 1,
  },
  locationCoordinates: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  changeLocationButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.s,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
  },
  changeLocationButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.s,
    padding: spacing.m,
    flex: 0.48,
  },
  dateTimeText: {
    marginLeft: spacing.s,
    color: colors.text,
  },
  friendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.m,
  },
  friendItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    margin: spacing.xs,
  },
  selectedFriendItem: {
    backgroundColor: colors.primary,
  },
  friendName: {
    color: colors.text,
  },
  selectedFriendName: {
    color: colors.background,
  },
  noFriendsText: {
    color: colors.text,
    marginBottom: spacing.m,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
  createButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressLoader: {
    marginTop: spacing.xs,
  },
  shareAllContainer: {
    marginBottom: spacing.m,
  },
  shareAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.m,
    padding: spacing.m,
  },
  selectedShareAllButton: {
    backgroundColor: colors.primary,
  },
  shareAllText: {
    marginLeft: spacing.s,
    fontSize: 16,
    color: colors.text,
  },
  selectedShareAllText: {
    color: colors.background,
  },
});

export default CreatePinScreen; 
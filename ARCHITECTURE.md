# Just Hangin - App Architecture

## Overview

Just Hangin is a mobile application that allows users to share their hangout locations with friends. Users can drop pins on a map with notes and time information, and choose which friends can see their hangout spots.

## Tech Stack

- **Frontend**: React Native with Expo
  - React Navigation for screen management
  - react-native-maps for map functionality
  - Expo Location for device location services
  - Expo Notifications for push notifications

- **Backend**: Firebase
  - Firebase Authentication for user management
  - Firestore for database
  - Firebase Cloud Functions for server-side logic
  - Firebase Cloud Messaging for notifications

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Application                        │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │ Auth Module │   │ Map Module  │   │ Friend Management   │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
│                                                                 │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐ │
│  │ Pin Management      │   │ Notification System             │ │
│  └─────────────────────┘   └─────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Backend                          │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │ Auth        │   │ Firestore   │   │ Cloud Functions     │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cloud Messaging                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### User
```
{
  id: string,
  email: string,
  displayName: string,
  profilePicture: string,
  createdAt: timestamp,
  lastActive: timestamp
}
```

### Friendship
```
{
  id: string,
  user1Id: string,
  user2Id: string,
  status: "pending" | "accepted" | "rejected",
  requestedBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### LocationPin
```
{
  id: string,
  createdBy: string,
  location: {
    latitude: number,
    longitude: number,
    address: string (optional)
  },
  title: string,
  note: string,
  hangoutTime: timestamp,
  expiresAt: timestamp,
  visibleTo: string[], // array of user IDs
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Key Components

### Authentication Module
- Sign up/login screens
- Password reset
- Profile management

### Map Module
- Interactive map view
- Current location tracking
- Pin display with filtering options
- Pin creation interface

### Friend Management
- Friend search
- Friend request system
- Friend list management
- Privacy settings

### Pin Management
- Create, edit, delete pins
- Set visibility permissions
- Set expiration time
- View pin details

### Notification System
- Push notifications for new pins
- Friend request notifications
- Upcoming hangout reminders

## Security Considerations

- Authentication using Firebase Auth
- Data access rules in Firestore to ensure users can only access authorized data
- Client-side validation with server-side verification
- Secure storage of sensitive information

## Performance Considerations

- Pagination for loading pins and friend lists
- Geohashing for efficient location queries
- Caching strategies for offline functionality
- Optimized map rendering with clustering for multiple pins

## Future Expansion Possibilities

- Group creation for easier sharing with multiple friends
- Event planning with RSVP functionality
- Photo sharing at locations
- Integration with calendar apps
- Real-time chat functionality 
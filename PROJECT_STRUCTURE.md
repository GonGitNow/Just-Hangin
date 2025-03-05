# Just Hangin - Project Structure

## Overview
Just Hangin is a mobile application that allows users to create and join hangout events on a map. Users can check in to events, leave comments, and manage their hangouts.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Just Hangin App                                │
└───────────────────┬─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Firebase Backend                               │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ Authentication│    │  Firestore   │    │   Storage    │               │
│  │   (Auth)      │    │  (Database)  │    │  (Images)    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
                    ▲
                    │
┌───────────────────┴─────────────────────────────────────────────────────┐
│                           React Native App                               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Navigation Structure                       │   │
│  │                                                                   │   │
│  │  ┌─────────────┐     ┌─────────────┐      ┌─────────────┐        │   │
│  │  │   Map Tab   │     │ Friends Tab │      │ Profile Tab │        │   │
│  │  └─────────────┘     └─────────────┘      └─────────────┘        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Core Components                           │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │ CustomMarker│  │ CommentItem │  │ UserProfile │  │ PinCard  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Context Providers                         │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ AuthContext │  │ MapContext  │  │ ThemeContext│               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                            API Layer                              │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │   pins.ts   │  │  users.ts   │  │ comments.ts │  │ friends.ts│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                           Utils & Helpers                         │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │  dateTime.ts│  │ validation.ts│  │ formatting.ts│              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── api/                  # API integration with Firebase
│   ├── comments.ts       # Comments API functions
│   ├── friends.ts        # Friends API functions
│   ├── pins.ts           # Pins/Hangouts API functions
│   └── users.ts          # User profile API functions
│
├── components/           # Reusable UI components
│   ├── CommentItem.tsx   # Individual comment display
│   ├── CustomMarker.tsx  # Map marker component
│   ├── UserProfile.tsx   # User profile display
│   └── ...
│
├── constants/            # App constants
│   ├── routes.ts         # Navigation route names
│   └── theme.ts          # UI theme (colors, spacing, etc.)
│
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Authentication state management
│   ├── MapContext.tsx    # Map state management
│   └── ThemeContext.tsx  # Theme state management
│
├── navigation/           # Navigation configuration
│   └── AppNavigator.tsx  # Main navigation structure
│
├── screens/              # App screens
│   ├── auth/             # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   │
│   ├── map/              # Map-related screens
│   │   ├── MapScreen.tsx
│   │   ├── PinDetailsScreen.tsx
│   │   ├── CreatePinScreen.tsx
│   │   ├── MyHangoutsScreen.tsx
│   │   └── FriendsHangoutsScreen.tsx
│   │
│   ├── friends/          # Friend-related screens
│   │   ├── FriendsScreen.tsx
│   │   ├── FriendRequestsScreen.tsx
│   │   ├── SearchUsersScreen.tsx
│   │   └── FriendProfileScreen.tsx
│   │
│   └── profile/          # User profile screens
│       ├── ProfileScreen.tsx
│       ├── EditProfileScreen.tsx
│       ├── SettingsScreen.tsx
│       └── PrivacySettingsScreen.tsx
│
├── types/                # TypeScript type definitions
│   └── index.ts          # Shared type definitions
│
└── utils/                # Utility functions
    ├── dateTime.ts       # Date/time formatting utilities
    ├── validation.ts     # Form validation utilities
    └── formatting.ts     # Text formatting utilities
```

## Data Flow

1. **User Authentication**:
   - Users authenticate via Firebase Auth
   - User data is stored in Firestore
   - AuthContext manages authentication state throughout the app

2. **Map Interaction**:
   - MapScreen displays pins from Firestore
   - Users can create pins via CreatePinScreen
   - Pin details are viewed in PinDetailsScreen
   - Users can check in to pins and leave comments

3. **Social Features**:
   - Users can send/accept friend requests
   - Friends' hangouts are displayed in FriendsHangoutsScreen
   - User profiles can be viewed and edited

## Key Components

- **CustomMarker**: Displays pins on the map with visual indicators for status
- **CommentItem**: Displays individual comments with user info and timestamps
- **PinDetailsScreen**: Shows details about a hangout, allows check-ins and comments
- **MyHangoutsScreen**: Lists all hangouts created by the current user

## State Management

The app uses React Context for global state management:

- **AuthContext**: Manages user authentication state
- **MapContext**: Manages map-related state (selected pin, map region, etc.)
- **ThemeContext**: Manages app theme settings

## API Integration

Firebase services are accessed through dedicated API modules:

- **pins.ts**: CRUD operations for hangout pins
- **users.ts**: User profile operations
- **comments.ts**: Comment operations for hangouts
- **friends.ts**: Friend relationship management

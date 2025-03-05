# Just Hangin - Directory Structure

```
just-hangin/
├── app.json                 # Expo configuration
├── App.tsx                  # Entry point
├── babel.config.js          # Babel configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
├── assets/                  # Static assets
│   ├── fonts/               # Custom fonts
│   ├── images/              # Images and icons
│   └── animations/          # Lottie animations
│
├── src/                     # Source code
│   ├── api/                 # API and service integrations
│   │   ├── firebase.ts      # Firebase configuration
│   │   ├── auth.ts          # Authentication services
│   │   ├── pins.ts          # Pin management services
│   │   ├── friends.ts       # Friend management services
│   │   └── notifications.ts # Notification services
│   │
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Generic components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── map/             # Map-specific components
│   │   │   ├── MapView.tsx
│   │   │   ├── PinMarker.tsx
│   │   │   ├── PinInfoCard.tsx
│   │   │   └── ...
│   │   ├── auth/            # Authentication components
│   │   ├── friends/         # Friend-related components
│   │   └── pins/            # Pin-related components
│   │
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication context
│   │   ├── MapContext.tsx   # Map state context
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hooks
│   │   ├── useMap.ts        # Map-related hooks
│   │   ├── usePins.ts       # Pin management hooks
│   │   └── ...
│   │
│   ├── navigation/          # Navigation configuration
│   │   ├── AppNavigator.tsx # Main app navigation
│   │   ├── AuthNavigator.tsx # Auth flow navigation
│   │   └── ...
│   │
│   ├── screens/             # App screens
│   │   ├── auth/            # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── ...
│   │   ├── map/             # Map screens
│   │   │   ├── MapScreen.tsx
│   │   │   ├── CreatePinScreen.tsx
│   │   │   └── ...
│   │   ├── friends/         # Friend management screens
│   │   │   ├── FriendListScreen.tsx
│   │   │   ├── FriendRequestsScreen.tsx
│   │   │   └── ...
│   │   └── profile/         # Profile screens
│   │       ├── ProfileScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── ...
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── user.types.ts
│   │   ├── pin.types.ts
│   │   ├── friend.types.ts
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── dateTime.ts      # Date/time helpers
│   │   ├── location.ts      # Location helpers
│   │   ├── validation.ts    # Form validation
│   │   └── ...
│   │
│   ├── constants/           # App constants
│   │   ├── colors.ts        # Color palette
│   │   ├── theme.ts         # Theme configuration
│   │   ├── routes.ts        # Route names
│   │   └── ...
│   │
│   └── config/              # App configuration
│       ├── firebase.config.ts # Firebase config
│       └── ...
│
├── firebase/                # Firebase backend code
│   ├── firestore.rules      # Firestore security rules
│   ├── functions/           # Cloud Functions
│   │   ├── index.ts         # Functions entry point
│   │   ├── auth/            # Auth-related functions
│   │   ├── notifications/   # Notification functions
│   │   └── ...
│   └── storage.rules        # Storage security rules
│
└── docs/                    # Documentation
    ├── ARCHITECTURE.md      # Architecture overview
    ├── PROJECT_PLAN.md      # Project plan
    └── API_DOCS.md          # API documentation
```

## Key Directories Explained

### `/src/api`
Contains all the service integrations, particularly Firebase services. Each file encapsulates a specific domain of functionality (auth, pins, friends, etc.).

### `/src/components`
Reusable UI components organized by domain. Common components are generic and used across the app, while domain-specific components are grouped accordingly.

### `/src/contexts`
React contexts for state management across the application. These provide a way to share state between components without prop drilling.

### `/src/hooks`
Custom React hooks that encapsulate reusable logic. These hooks abstract away complex operations and provide a clean API for components.

### `/src/navigation`
Navigation configuration using React Navigation. Includes navigators for different parts of the app (main app, auth flow, etc.).

### `/src/screens`
The actual screens of the application, organized by domain. Each screen is a container component that composes smaller components.

### `/src/types`
TypeScript type definitions for the application. These ensure type safety and provide documentation for data structures.

### `/firebase`
Backend code for Firebase, including security rules and Cloud Functions. This is separate from the React Native code but part of the same repository for easier management. 
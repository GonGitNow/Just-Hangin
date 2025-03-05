# Just Hangin

A social location-based app that helps you connect with friends and discover new places to hang out.

## Features

- Real-time location sharing
- Create and discover hangout spots
- Friend management system
- Push notifications for friend activities
- Dark/Light theme support
- Profile customization
- Interactive map interface

## Tech Stack

- React Native with Expo
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- React Navigation
- React Native Maps
- Expo Notifications
- Context API for state management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/just-hangin.git
cd just-hangin
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```
EXPO_PUBLIC_API_KEY=your_api_key
EXPO_PUBLIC_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_PROJECT_ID=your_project_id
EXPO_PUBLIC_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_APP_ID=your_app_id
EXPO_PUBLIC_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm start
```

## Building for Production

### Android APK
```bash
eas build -p android --profile production
```

### iOS IPA
```bash
eas build -p ios --profile production
```

## Project Structure

```
just-hangin/
├── src/
│   ├── api/          # API and service integrations
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   ├── navigation/   # Navigation configuration
│   ├── screens/      # App screens
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   ├── constants/    # App constants
│   └── config/       # App configuration
├── assets/           # Static assets
└── firebase/         # Firebase backend code
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)
- [React Navigation](https://reactnavigation.org/) 
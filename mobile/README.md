# LoboHub Mobile - React Native App

React Native version of the LoboHub family management application.

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Expo CLI: `npm install -g @expo/cli`
- For Android: Android Studio and Android SDK
- For iOS: Xcode (macOS only)

### Installation
```bash
cd mobile
npm install
```

### Development

#### Start Development Server
```bash
npm start
```

This opens Expo DevTools. You can then:
- Press 'a' for Android emulator
- Press 'i' for iOS simulator  
- Scan QR code with Expo Go app on physical device

#### Run on Specific Platform
```bash
# Android
npm run android

# iOS  
npm run ios

# Web (for testing)
npm run web
```

### Configuration

#### Backend URL
Update the `BASE_URL` in `src/services/api.ts`:
- Development: `http://localhost:5000/api` (local)
- Production: `https://your-replit-app.replit.app/api`

#### App Configuration
Edit `app.json` to customize:
- App name and description
- Icons and splash screen
- Bundle identifiers
- Permissions

### Building for Production

#### Android APK
```bash
eas build --platform android
```

#### iOS App
```bash
eas build --platform ios
```

### Features Implemented

✅ **Authentication** - Login/Register with secure token storage
✅ **Dashboard** - Family overview with quick actions
✅ **Tasks** - Create, view, and manage family tasks
✅ **Shopping Lists** - Categorized shopping with smart organization  
✅ **Budget** - View transactions and budget overview
✅ **AI Assistant** - Voice input ready, chat interface

### Features Coming Soon

🔄 **Voice Recognition** - Full speech-to-text implementation
🔄 **Push Notifications** - Task reminders and family updates
🔄 **Offline Sync** - Work without internet connection
🔄 **Calendar** - Family calendar with event management
🔄 **Chat** - Real-time family messaging

### Architecture

- **Navigation**: React Navigation with bottom tabs
- **UI**: React Native Paper (Material Design)
- **State**: TanStack Query for server state
- **Storage**: Expo SecureStore for tokens
- **API**: Axios with same backend as web app

### Platform Differences from Web

- Native navigation gestures
- Material Design components
- Secure credential storage
- Better voice input (when implemented)
- Push notifications support
- Offline capabilities

### Development Notes

- API calls use the same endpoints as web version
- Authentication flows identically to web app
- All business logic remains the same
- UI adapted for mobile interaction patterns
# LoboHub Mobile - React Native App

A complete offline-first family management mobile app with AI-powered features.

## Features

- **100% Offline Operation**: All data stored locally using AsyncStorage
- **Family Sharing**: Peer-to-peer sharing via invite codes and file export/import
- **AI-Powered Features**: Task recommendations, budget advisor, meal planning
- **Complete Feature Set**: Tasks, Lists, Budget, Calendar, Chat, Devotional, Events
- **Material Design UI**: React Native Paper components
- **Cross-Platform**: iOS and Android support

## System Requirements

- **Node.js**: v20.19.4 or higher (CRITICAL - lower versions will not work)
- **npm**: v10+ or Yarn
- **Expo CLI**: Latest version
- **Mobile Device**: Android or iOS with Expo Go app

## Installation Instructions

### 1. Check Node.js Version
```bash
node --version
# Must show v20.19.4 or higher
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Start Development Server
```bash
npm run expo
# or
npx expo start --go
```

### 4. Run on Device
1. Install Expo Go on your phone
2. Scan QR code from terminal
3. App will load with full offline functionality

## App Architecture

### Data Storage
- **Local Database**: AsyncStorage with JSON serialization
- **Family Data**: Stored in device-specific family databases
- **Offline-First**: No backend dependency, works without internet

### Family Sharing System
- **Invite Codes**: Generate 6-digit codes to invite family members
- **Data Export**: Export family data as JSON files
- **Data Import**: Import shared family data from files
- **Peer-to-Peer**: No central server required

### AI Integration
- **Task Recommender**: Personalized task suggestions
- **Budget Advisor**: Financial planning with AI insights  
- **Meal Planner**: Smart meal recommendations
- **Devotional Generator**: Daily spiritual content
- **Event Assistant**: Automated event planning

## Key Components

### Core Screens
- `DashboardScreen`: Family overview and quick actions
- `TasksScreen`: Task management with AI recommendations
- `ListsScreen`: Shopping and todo lists
- `BudgetScreen`: Financial tracking with AI advisor
- `CalendarScreen`: Events and scheduling
- `ChatScreen`: Family messaging
- `MealPlanningScreen`: AI-powered meal planning
- `DevotionalScreen`: Daily spiritual content
- `EventsScreen`: Event planning assistance

### Services
- `localDatabase.ts`: AsyncStorage data management
- `offlineApi.ts`: API simulation for offline operation
- `aiServices.ts`: AI feature implementations

### Navigation
- Bottom tab navigation with Material Design
- Stack navigation for detailed screens
- Native transitions and gestures

## Troubleshooting

### Node.js Version Error
```
Error: Unsupported engine { required: { node: '>= 20.19.4' } }
```
**Solution**: Upgrade Node.js to v20.19.4 or higher

### Metro Bundle Error
```
Error: Cannot find module 'metro-core'
```
**Solution**: Ensure all dependencies installed with correct Node.js version

### Expo Start Fails
**Solution**: 
1. Clear cache: `npx expo start --clear`
2. Reinstall: `rm -rf node_modules && npm install`
3. Check Node.js version meets requirements

## Deployment

### Building for Production
```bash
# Android
npm run build:android

# iOS  
npm run build:ios
```

### App Store Distribution
1. Configure `app.json` with your app details
2. Set up EAS Build: `npm install -g @expo/eas-cli`
3. Build: `eas build --platform all`
4. Submit to stores: `eas submit`

## Development Notes

- **Self-Contained**: No backend server required
- **Privacy-First**: All data stays on device
- **Cross-Platform**: Single codebase for iOS and Android
- **Native Performance**: True React Native with native navigation
- **Material Design**: Consistent UI across platforms

## Support

For technical issues:
1. Ensure Node.js v20.19.4+ is installed
2. Check all dependencies are properly installed
3. Clear Expo cache if needed
4. Verify device has Expo Go app installed

---

**Note**: This mobile app was designed to work completely independently from the web version, with its own local data storage and family sharing system.
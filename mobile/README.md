# EASE Mobile App

React Native mobile app for EASE built with Expo.

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## Backend Connection

Make sure the NestJS backend is running:
```bash
cd ..
npm run start:dev
```

The app connects to `http://localhost:3000/api` by default.

**For physical devices**: Update `mobile/src/constants/config.ts` with your computer's IP address:
```typescript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
```

## Known Issues & Troubleshooting

### TypeError: Cannot call a class as a function

If you encounter this error:

1. **Clear Metro bundler cache**:
   ```bash
   npx expo start --clear
   ```

2. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Try on a physical device** instead of simulator:
   - Install Expo Go on your phone
   - Scan the QR code
   - Make sure your phone and computer are on the same network

4. **Check for conflicting packages**:
   - Ensure `react-native-mmkv` is NOT installed (we use AsyncStorage)
   - Run `npm list react-native-mmkv` - should show "empty"

### Network Request Failed

If API calls fail:
- Check backend is running on `http://localhost:3000`
- For physical devices, use your computer's IP instead of `localhost`
- Check firewall settings

## Project Structure

```
mobile/
├── src/
│   ├── navigation/     # React Navigation setup
│   ├── screens/        # All app screens
│   ├── services/       # API and storage services
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript types
│   └── constants/      # Configuration
└── App.tsx             # Root component
```

## Features

- ✅ Authentication (Signup/Login)
- ✅ JWT token management
- ✅ Goal creation
- ✅ Program generation
- ✅ Today's plan view
- ✅ Progress tracking
- ✅ Offline data caching

## Tech Stack

- **Expo** - React Native framework
- **React Navigation** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **SecureStore** - Secure token storage
- **TypeScript** - Type safety

## Development

### Running on iOS Simulator
```bash
npx expo start
# Press 'i'
```

### Running on Android Emulator
```bash
npx expo start
# Press 'a'
```

### Debugging
```bash
npx expo start
# Press 'j' to open debugger
```

## Building for Production

This app uses Expo Go for development. For production:

1. **Create development build**:
   ```bash
   npx expo prebuild
   ```

2. **Build with EAS**:
   ```bash
   npm install -g eas-cli
   eas build --platform ios
   eas build --platform android
   ```

See [Expo documentation](https://docs.expo.dev/build/introduction/) for more details.

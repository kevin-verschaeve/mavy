export default {
  expo: {
    name: 'mavy',
    slug: 'mavy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true,
      package: 'com.keversc.mavy'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      '@react-native-community/datetimepicker'
    ],
    extra: {
      eas: {
        projectId: '2dfe9ebf-5f57-43b0-a220-451e647521b3'
      },
      tursoUrl: process.env.TURSO_URL,
      tursoAuthToken: process.env.TURSO_AUTH_TOKEN
    }
  }
};

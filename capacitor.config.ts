import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.umaklink.app',
  appName: 'project-pbl-softeng',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    hostname: 'localhost',
    androidScheme: 'http',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;

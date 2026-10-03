import type { CapacitorConfig } from '@capacitor/cli';

// This app is server-rendered (Next.js server actions + a Postgres-backed
// store), not a static export — so instead of bundling built HTML into the
// app, the native shell loads the live site directly over the network, the
// same way a browser would. `webDir` below is required by Capacitor's CLI
// but is unused at runtime once `server.url` is set.
//
// IMPORTANT: once maximizeteam.ca is verified and set as the Production
// Domain in Vercel, change `server.url` below to "https://maximizeteam.ca"
// and rebuild — otherwise the app will keep loading the vercel.app address
// even after the web domain switch.
const config: CapacitorConfig = {
  appId: 'com.maximizeteam.app',
  appName: 'iHome Max',
  webDir: 'public',
  server: {
    url: 'https://maximizeteam.ca',
    androidScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#0a1830',
  ios: {
    backgroundColor: '#0a1830',
  },
  android: {
    backgroundColor: '#0a1830',
  },
  // Keeps the native splash screen (navy background, set above) on screen
  // until the web app explicitly hides it (see components/NativeSplashHide.tsx),
  // instead of Capacitor dismissing it on its own after a few seconds. This
  // is what fixes the "blank unresponsive screen" App Store rejection: the
  // app used to hand off from splash to an empty WebView immediately, before
  // the live site had finished loading over the network.
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a1830',
    },
  },
};

export default config;

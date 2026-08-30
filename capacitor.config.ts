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
  appName: 'MAXimize',
  webDir: 'public',
  server: {
    url: 'https://maximize-app1.vercel.app',
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
};

export default config;

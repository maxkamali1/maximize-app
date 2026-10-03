"use client";

import { useEffect } from "react";

// Keeps the native splash screen on top of the WKWebView until this layout
// has actually mounted in the browser/webview, instead of handing off to a
// blank screen the instant the native shell starts (which is what was
// happening before: Capacitor's default splash disappears almost
// immediately, exposing an empty WebView for as long as the live site takes
// to respond — long enough on a cold start that Apple's reviewer saw it as
// an unresponsive, broken app).
//
// Outside the native app (a normal browser visit to the website) this does
// nothing: `Capacitor.isNativePlatform()` is false there, so the dynamic
// imports below never even resolve the native plugin bridge.
//
// Requires `plugins.SplashScreen.launchAutoHide: false` in
// capacitor.config.ts — otherwise Capacitor hides the splash on its own
// timer and this component has nothing to do.
export function NativeSplashHide() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;

      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

# Getting MAXimize into the App Store and Google Play

## What's been set up

This project now has a native app "shell" around the existing website, using a
tool called Capacitor. It doesn't rebuild the app — it just wraps the live
site (`https://maximize-app1.vercel.app`) in a real iOS/Android app so it can
be listed on the stores. That's the standard approach for a server-rendered
app like this one (it uses Next.js server actions and a Postgres database, so
it can't be exported as static files bundled into the app).

What's already done for you:

- `capacitor.config.ts` — app name "MAXimize", bundle ID `com.maximizeteam.app`,
  pointed at the live site.
- `android/` — a complete, ready-to-open Android Studio project.
- `ios/` — a complete, ready-to-open Xcode project.
- App icon and splash screen generated for both platforms (navy background
  with a simple house mark, matching the site's hero colors). This is a
  placeholder — swap it for a real logo before submitting if you have one.

**One important switch to make later:** once `maximizeteam.ca` is verified
and set as the Production Domain in Vercel, open `capacitor.config.ts`,
change `server.url` to `"https://maximizeteam.ca"`, then run `npx cap sync`
and rebuild both apps. Otherwise the app will keep loading the vercel.app
address even after the site itself has moved to the new domain.

## A real risk worth knowing before you invest time in this

Apple's App Store review (Guideline 4.2, "Minimum Functionality") sometimes
rejects apps that are just a website in a wrapper with nothing else native
about them. There's no guarantee this passes review as-is on the first try.
Things that improve the odds: the icon/splash already added, an offline
fallback screen, and eventually push notifications for lead updates. Google
Play is considerably more lenient about this and is the easier one to get
approved.

## I can't build or submit these for you

This session runs in a cloud sandbox with no Android SDK and no Mac —
building the actual installable app has to happen on your own machine (or a
teammate's). Here's what each platform needs:

### Android (easier — no Mac required)

1. Install **Android Studio** (free): https://developer.android.com/studio
2. Open the `android/` folder in this project as an Android Studio project.
   Let it finish syncing Gradle (first time takes a few minutes).
3. `Build → Generate Signed Bundle / APK` → choose **Android App Bundle**.
   You'll create a signing key the first time — **save that keystore file and
   its password somewhere safe**; you need the exact same one for every future
   update, and there's no recovery if you lose it.
4. Create a **Google Play Console** account: https://play.google.com/console
   (one-time $25 registration fee).
5. In Play Console, create a new app, fill in the store listing (description,
   screenshots — Android Studio can generate these from the emulator,
   privacy policy URL, content rating questionnaire), upload the `.aab` file
   from step 3, and submit for review. Review is typically same-day to a
   few days.

### iOS (requires a Mac)

1. You'll need a Mac with **Xcode** installed (free from the Mac App Store).
2. Enroll in the **Apple Developer Program**: https://developer.apple.com/programs/
   ($99/year — required to submit to the App Store, no way around this cost).
3. Open `ios/App/App.xcworkspace` (not the `.xcodeproj`) in Xcode.
4. In the project's Signing & Capabilities tab, select your Apple Developer
   team and let Xcode manage signing.
5. `Product → Archive`, then use the Organizer window to upload the build to
   **App Store Connect** (https://appstoreconnect.apple.com).
6. In App Store Connect, create the app listing (description, screenshots —
   Xcode's simulator can generate these, privacy policy URL, age rating),
   attach the uploaded build, and submit for review. Apple's review usually
   takes 1–3 days; expect at least one round of back-and-forth if it gets
   flagged under Guideline 4.2 above.

## Before either submission

Both stores will ask for a **privacy policy URL** — this app collects lead
info (name, contact info, messages) via forms, so you'll need a real one.
Say the word if you'd like help drafting one.

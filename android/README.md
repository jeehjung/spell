# Spell for Android

This Android WebView app packages the current root `index.html` into the APK. HTML, Tailwind CSS and Font Awesome are bundled locally, so the saved decks and study/test UI do not depend on a web server or CDN.

## Offline behavior

- Saved wordbooks, study progress and the Gemini API key are kept in this app's WebView local storage on this device.
- Android backup is disabled; there is no cloud sync.
- Existing saved decks, flashcards and spelling tests work without internet.
- Gemini photo recognition and online dictionary lookup require internet. Offline text-to-speech depends on the Android device's installed voice data.
- Uninstalling the app removes its local data.

## Build locally

Requirements: JDK 17, Android SDK platform/build-tools 35, Gradle 8.9, and Node.js 20+.

From the repository root:

```sh
cd android
npm install
npm run build:assets
gradle --no-daemon assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Download a built APK

Each push affecting `android/**` or the root `index.html` triggers the **Build Android APK** GitHub Actions workflow. Open the repository's Actions tab, select the latest successful run, and download the `spell-android-debug-apk` artifact. Unzip it and install `app-debug.apk` on Android. Android may ask you to allow installation from the app used to open the APK.

The debug APK is for direct installation/testing, not Google Play publishing.

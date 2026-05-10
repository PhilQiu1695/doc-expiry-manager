# Release checklist (pre–EAS / store)

Use this before `eas build` and store submission. Tick items when done.

## Config & identifiers

- [ ] **`app.json`**: Confirm **`ios.bundleIdentifier`** and **`android.package`** (`com.docexpiry.manager`) match the IDs registered in **Apple Developer** and **Google Play**. Change both if you use your own domain-style ID.
- [ ] **Versioning**: `expo.version` / `package.json` version align with **`ios.buildNumber`** and **`android.versionCode`**. Bump **buildNumber** (iOS) and **versionCode** (Android) for each store upload, even if `version` stays the same.
- [ ] **Icons & splash**: `./assets/icon.png`, `splash-icon.png`, `adaptive-icon.png`, `favicon.png` are final art (no placeholders). iOS expects a proper **1024×1024** icon via EAS/App Store Connect workflow as required.
- [ ] **`eas init`**: Run once so **`extra.eas.projectId`** is written into config (if you use EAS). Without it, link the project in Expo dashboard as documented.

## Notifications (SDK 54 / `expo-notifications`)

- [ ] **Plugin**: `expo-notifications` is configured in `app.json` **`plugins`** with **`enableBackgroundRemoteNotifications`: false** (local reminders only; no remote push in this app).
- [ ] **Android**: `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` help **calendar-accurate** scheduled reminders; Google Play may ask you to **declare exact alarm use** in the Play Console if applicable.
- [ ] **Physical device**: Schedule a **test notification** (home screen → “Test alert in 5 seconds”) after granting permission.

## Privacy & stores

- [ ] **Privacy policy URL**: Publish `docs/PRIVACY_POLICY.md` (or a copy) at a **public HTTPS URL**. Add contact details in that file.
- [ ] **App Store Connect / Play Console**: Paste the privacy policy URL; answer questionnaires (data collection, notifications, etc.) consistently with local-only storage.

## Sanity pass (manual QA)

Complete on a **physical** phone (simulators miss some notification behavior).

| Area | Check |
|------|--------|
| **Locales** | Switch **English** and **简体中文** in Settings; titles and dates look correct. |
| **Theme** | Toggle **Light / Dark / System**; list, editor, and settings remain readable. |
| **Notifications denied** | Deny notifications in OS settings → open app → “Test alert” should fail gracefully (existing alert). |
| **Notifications allowed** | Grant permission → test alert fires ~5s later. |
| **List** | Swipe → Delete → confirm removes row; order stays **by expiry**. |
| **Editor** | Create doc → Save → appears in list; edit → Save; delete from editor works. |
| **Regression** | Cold start, low battery mode (Android): reminders may be deferred by OS — note for support. |

## Build commands (reference)

```bash
npx expo-doctor
eas build --platform ios --profile production
eas build --platform android --profile production
```

Adjust profile names if you add custom profiles in `eas.json`.

# Base2 TV Play Store Upload Guide

## Application

- App name: Base2 TV
- Package name: `ug.base2tv.app`
- Version name: `1.0`
- Version code: `1`
- Website: https://base2tv.ug
- Release type: production-signed Android release

## Files and Their Uses

### `Base2-TV-production-signed.aab`

This is the main Google Play upload file. Upload it in:

`Play Console -> Base2 TV -> Test and release -> Production -> Create new release`

Google Play requires an Android App Bundle (`.aab`) for a new production release.

### `Base2-TV-production-signed.apk`

This is for installing and testing the release on an Android phone. It is not the normal file for publishing a new Google Play release.

### `Base2-TV-upload-key.jks`

This is the Android upload keystore. Keep it private and backed up. It is needed to sign future updates. Do not upload it to GitHub, the web server, or Play Console.

### `Base2-TV-upload-key-credentials.txt`

This contains the keystore password, alias, and key password. Keep it private. Do not commit or upload it.

### `assetlinks.json`

Upload this file to the website server at exactly:

`https://base2tv.ug/.well-known/assetlinks.json`

The URL must return the JSON file directly with HTTP 200. It must not redirect to the homepage or return `index.html`.

## Play Console Steps

1. Open Google Play Console.
2. Create or select the Base2 TV app.
3. Use app name `Base2 TV`.
4. Set the default language and app category.
5. Complete the store listing: description, icon, feature graphic, screenshots, and contact email.
6. Complete the App content forms: privacy policy, ads declaration, app access, target audience, content rating, and Data safety.
7. Upload `Base2-TV-production-signed.aab` under a testing track first, preferably Internal testing.
8. Add test users and install the app from the generated Play testing link.
9. Confirm the app opens Base2 TV correctly and that live stream, navigation, login, and API requests work.
10. Promote the tested release to Production and submit it for review.

## Important Security Notes

- Never lose the upload keystore. Future updates must use the same app identity and signing setup.
- Never upload the `.jks` file or credentials text file to GitHub or the website.
- The app package is `ug.base2tv.app`; do not change it after publishing.
- Increase the Android version code for every future Play release.
- The app loads the live site at `https://base2tv.ug`, so website availability and mobile responsiveness affect the app.

## Before Publishing

Verify this URL in Chrome:

`https://base2tv.ug/.well-known/assetlinks.json`

It must show the JSON object containing package name `ug.base2tv.app` and the production certificate fingerprint. If it shows the website homepage, upload the file to the server again using the exact `.well-known/assetlinks.json` path.

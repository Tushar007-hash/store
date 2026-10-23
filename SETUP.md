# Phase 2 setup (about 15 minutes)

You need a free Google account and a free Cloudinary account.

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and click **Add project**. Name it (for example `oakhaus`). You can turn Google Analytics off.
2. In the project, click the **</>** (Web) icon to register a web app. Skip "Firebase Hosting" for now.
3. Copy the `firebaseConfig` values it shows you into `js/firebase-config.js` (replace every `PASTE_...`).

## 2. Turn on the database
1. **Build > Firestore Database > Create database**.
2. Choose a location near your customers (for India, `asia-south1` Mumbai).
3. Choose **Production mode** (the rules in step 4 will open reads for products only).

## 3. Turn on admin login and create your admin account
1. **Build > Authentication > Get started > Email/Password > Enable > Save**.
2. Open the **Users** tab > **Add user**. Enter your email and a strong password. This is your admin login.
3. Copy that user's **User UID** from the table.

## 4. Publish the security rules (important)
1. Open `firestore.rules` and replace `PASTE_ADMIN_UID` with the UID you copied.
2. In **Firestore Database > Rules**, paste the whole file and click **Publish**.

The rules make products readable by everyone but writable only by your account.

## 5. Image uploads with Cloudinary
1. Create a free account at https://cloudinary.com and note your **Cloud name** (on the dashboard).
2. **Settings > Upload > Upload presets > Add upload preset**.
3. Set **Signing mode** to **Unsigned**, set a folder (for example `oakhaus`), and under allowed formats pick jpg, png, webp. Save, then copy the **preset name**.
4. Put the cloud name and preset name in `js/firebase-config.js`. Never use your API secret in this project.

## 6. Run the site (a local server is required)
Phase 1 worked by double-clicking `index.html`. From Phase 2 on, Firebase needs the site to run from a web address, so use one of:
- **VS Code**: install the "Live Server" extension, right-click `index.html`, **Open with Live Server**.
- **Python**: open a terminal in the project folder and run `python -m http.server 8000`, then visit http://localhost:8000

## 7. Use it
- Open `/admin/login.html`, sign in with the email and password from step 3.
- Click **Add sample products** to fill the store quickly, or **Add product** to create your own.
- Open the main site: your products appear for everyone.

## Troubleshooting
- **"Permission denied" when saving**: the UID in the published rules does not match your admin user.
- **"Could not load products"**: Firestore is not created yet, or the rules were not published.
- **Login says wrong email or password**: create the user in Authentication > Users first.
- **Images will not upload**: check the cloud name, and that the preset is set to **Unsigned**.
- **Deployed site cannot sign in**: add your domain under Authentication > Settings > Authorized domains.

## Good to know
- Deleting a product does not delete its images from Cloudinary (you can clean them up in the Cloudinary dashboard).
- Anyone who finds your Cloudinary preset name could upload files to your account, so keep the preset limited to images and a size limit.

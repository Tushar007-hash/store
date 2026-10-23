// 1) Paste your Firebase web-app config here (Firebase console > Project settings > Your apps > Web app).
//    These values are safe to be public. Your Firestore security rules protect the data.
const FIREBASE_CONFIG = {
 apiKey: "AIzaSyCVzhM0F-Zrp9wg9d_UTbNogjSkFkjjWYQ",
    authDomain: "oakhaus-store.firebaseapp.com",
    projectId: "oakhaus-store",
    storageBucket: "oakhaus-store.firebasestorage.app",
    messagingSenderId: "659632715140",
    appId: "1:659632715140:web:6bfdfbc595bfaefb6cd9d1",
    measurementId: "G-TXR1DWG43W"
};

// 2) Cloudinary (product image uploads). Use an UNSIGNED upload preset. Never put your API secret here.
const CLOUDINARY = {
  cloudName: "vwt3tqdv",
  uploadPreset: "oakhaus_unsigned",
};

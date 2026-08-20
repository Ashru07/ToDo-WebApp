import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let messaging;

try {
  // Only initialize if we have the config
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here') {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { messaging };

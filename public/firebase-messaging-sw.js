importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// We have to hardcode or fetch the config here because import.meta.env doesn't work in SW out of the box
// For this tutorial, we initialize with empty object, but you MUST replace these with your config
const firebaseConfig = {
  // USER: You must paste your config here for background notifications to work
  apiKey: "AIzaSyC12I3npGHNfwg39GgOCzItKJRdZ8_4cWk",
  authDomain: "to-do-web-app-3439d.firebaseapp.com",
  projectId: "to-do-web-app-3439d",
  storageBucket: "to-do-web-app-3439d.firebasestorage.app",
  messagingSenderId: "583100788853",
  appId: "1:583100788853:web:bd14527135c851caf6083c"
};

try {
  if (firebaseConfig.apiKey !== "REPLACE_ME") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (e) {
  console.log('Firebase SW init failed:', e);
}

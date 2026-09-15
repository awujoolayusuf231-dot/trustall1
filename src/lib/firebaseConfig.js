import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDX-XgxZm4RwVNNdZMYwZK-wN5jPgA7u2k",
  authDomain: "trustall-technology-limited.firebaseapp.com",
  projectId: "trustall-technology-limited",
  storageBucket: "trustall-technology-limited.firebasestorage.app",
  messagingSenderId: "155302285805",
  appId: "1:155302285805:web:c6ec674dd11ce5c32b17e4",
  measurementId: "G-015W3L4NF3"
};

const app = initializeApp(firebaseConfig);
let messaging = null;

try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn("Firebase messaging is unavailable; continuing without push notifications.", error);
}

export const VAPID_KEY = "BOGlF29lkU6HASWzCLOZRo7VstOQsMlAsxf72FWB5gmYL2cAezJWjx87uaEbz9v-hVqvZJ1rZ7IHZSB5UdyzC-Q";

export { app, messaging, getToken, onMessage };

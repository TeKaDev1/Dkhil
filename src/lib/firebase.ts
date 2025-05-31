import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXhnT5AWMmJnQMDRFTlE5hdtKbjB4nxNw",
  authDomain: "dkhil-32644.firebaseapp.com",
  projectId: "dkhil-32644",
  storageBucket: "dkhil-32644.firebasestorage.app",
  messagingSenderId: "37336137805",
  appId: "1:37336137805:web:b4a3eae4650a7e87405c04",
  measurementId: "G-92BRXN0F8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app)

export { app, auth };

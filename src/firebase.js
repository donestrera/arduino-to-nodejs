// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWzAPorJb9P4rILjvFV7vgrAi8Fnc76aM",
  authDomain: "alarm-system-security.firebaseapp.com",
  projectId: "alarm-system-security",
  storageBucket: "alarm-system-security.firebasestorage.app",
  messagingSenderId: "41741903798",
  appId: "1:41741903798:web:7db7454c095470c6818317",
  measurementId: "G-FFCF1KCGFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

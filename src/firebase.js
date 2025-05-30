// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "gawulo-68eda.firebaseapp.com",
  projectId: "gawulo-68eda",
  storageBucket: "gawulo-68eda.firebasestorage.app",
  messagingSenderId: "646218619128",
  appId: "1:646218619128:web:5f53f94076f359bd18430d",
  measurementId: "G-1EN7FQ7G44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
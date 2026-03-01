// THIS IS ONLY A PLACEHOLDER!!!!!
// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAkjgdnkFY96xnAXcnsr2SEeuF82ruuylE",
  authDomain: "linaw-b46e4.firebaseapp.com",
  projectId: "linaw-b46e4",
  storageBucket: "linaw-b46e4.firebasestorage.app",
  messagingSenderId: "590449207145",
  appId: "1:590449207145:web:bc810150345ae947be3ff8",
  measurementId: "G-D6BFZVVF8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
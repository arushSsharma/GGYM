// js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBRKEiC8QBT6h97HbodT6UuGszO-0A2S5Q",
  authDomain: "ggym-94149.firebaseapp.com",
  projectId: "ggym-94149",
  storageBucket: "ggym-94149.firebasestorage.app",
  messagingSenderId: "926047752692",
  appId: "1:926047752692:web:4e5356f2d70259017729a1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
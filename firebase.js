// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// TEMPATKAN CONFIG KAMU DI SINI
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAgHWf3VJNMrdZda_H15D_b90GsD-zuaw",
  authDomain: "neechat-6f32d.firebaseapp.com",
  databaseURL: "https://neechat-6f32d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "neechat-6f32d",
  storageBucket: "neechat-6f32d.firebasestorage.app",
  messagingSenderId: "742208134579",
  appId: "1:742208134579:web:92fbf3b41911abdd7fffc6",
  measurementId: "G-6JTXZJRPY3"
};

// Initialize
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

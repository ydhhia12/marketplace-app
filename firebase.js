// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAAgHWf3VJNMrdZda_H15D_b90GsD-zuaw",
  authDomain: "neechat-6f32d.firebaseapp.com",
  databaseURL: "https://neechat-6f32d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "neechat-6f32d",
  storageBucket: "neechat-6f32d.appspot.com",
  messagingSenderId: "742208134579",
  appId: "1:742208134579:web:92fbf3b41911abdd7fffc6",
  measurementId: "G-6JTXZJRPY3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Realtime Database
export const db = getDatabase(app);

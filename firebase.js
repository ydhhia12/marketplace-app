// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// TEMPATKAN CONFIG KAMU DI SINI
const firebaseConfig = {
  apiKey: "ISI_PUNYA_KAMU",
  authDomain: "ISI_PUNYA_KAMU",
  projectId: "ISI_PUNYA_KAMU",
  databaseURL: "ISI_PUNYA_KAMU",
  storageBucket: "ISI_PUNYA_KAMU",
  messagingSenderId: "ISI_PUNYA_KAMU",
  appId: "ISI_PUNYA_KAMU"
};

// Initialize
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

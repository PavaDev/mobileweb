import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5AOuMFQ6oqtHMDkjXYlLXE9aGQEx3lSs",
  authDomain: "mobileweb-5d5b2.firebaseapp.com",
  projectId: "mobileweb-5d5b2",
  storageBucket: "mobileweb-5d5b2.firebasestorage.app",
  messagingSenderId: "820308646180",
  appId: "1:820308646180:web:7257d5ace41bbcad05fbb1",
  measurementId: "G-CJ65MZ9GCJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
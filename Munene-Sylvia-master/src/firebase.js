import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYKnfNZvv-lEcdFDRUSYGFtp8qYR2c8Hc",
  authDomain: "event-booking-1e59e.firebaseapp.com",
  databaseURL: "https://event-booking-1e59e-default-rtdb.firebaseio.com",
  projectId: "event-booking-1e59e",
  storageBucket: "event-booking-1e59e.firebasestorage.app",
  messagingSenderId: "745293230160",
  appId: "1:745293230160:web:749a5a15c3d57ffebca155",
  measurementId: "G-B5YVLXYJR6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

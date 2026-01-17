
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdB5oZB1I2cY7Igt0-nIQweepy26HHuVY",
  authDomain: "tasksms-225d1.firebaseapp.com",
  databaseURL: "https://tasksms-225d1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tasksms-225d1",
  storageBucket: "tasksms-225d1.firebasestorage.app",
  messagingSenderId: "651996836198",
  appId: "1:651996836198:web:f7a5e56a207d42df9818a7"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsGJ7_ue8YCrh8cOsqBmv5bEW9BWhu7oU",
  authDomain: "coachnow-725fb.firebaseapp.com",
  projectId: "coachnow-725fb",
  storageBucket: "coachnow-725fb.firebasestorage.app",
  messagingSenderId: "1059672988320",
  appId: "1:1059672988320:web:e6204f6161fae1bfac07c5",
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth };
export default app;

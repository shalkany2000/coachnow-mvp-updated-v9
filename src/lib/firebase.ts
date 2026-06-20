import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Demo Firebase config - in production replace with real credentials
const firebaseConfig = {
  apiKey: "AIzaSyDemo-CoachNow-Firebase-Key-Replace",
  authDomain: "coachnow-demo.firebaseapp.com",
  projectId: "coachnow-demo",
  storageBucket: "coachnow-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db };
export default app;

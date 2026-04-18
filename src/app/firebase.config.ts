// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDjZ5Z7kf4ABM_SRbdVIrkmspNysO43inY',
  authDomain: 'crud-practice-4862b.firebaseapp.com',
  projectId: 'crud-practice-4862b',
  storageBucket: 'crud-practice-4862b.firebasestorage.app',
  messagingSenderId: '72997638286',
  appId: '1:72997638286:web:571814b8b0c9a4886c39df',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

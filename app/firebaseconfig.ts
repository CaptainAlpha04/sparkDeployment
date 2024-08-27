
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCL293fwlTPhOaz3SpCOGLFH5NHFwWpPsI",
  authDomain: "spark-web-85bd2.firebaseapp.com",
  projectId: "spark-web-85bd2",
  storageBucket: "spark-web-85bd2.appspot.com",
  messagingSenderId: "439055851914",
  appId: "1:439055851914:web:9f58503dd0fff85fd96873",
  measurementId: "G-L3L3V1DNLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
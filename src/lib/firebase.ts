import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Debug: Check if config is loaded
console.log("Firebase config check:", {
  apiKey: firebaseConfig.apiKey ? "✓ Loaded" : "✗ Missing",
  authDomain: firebaseConfig.authDomain ? "✓ Loaded" : "✗ Missing",
  projectId: firebaseConfig.projectId ? "✓ Loaded" : "✗ Missing",
})

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

console.log("Firebase initialized successfully")

export default app

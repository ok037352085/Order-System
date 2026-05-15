import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD-8ze99uT5z2imKuE-H0ZJQLObGOISE-o",
  authDomain: "breakfast-order-838f5.firebaseapp.com",
  projectId: "breakfast-order-838f5",
  storageBucket: "breakfast-order-838f5.firebasestorage.app",
  messagingSenderId: "336602224489",
  appId: "1:336602224489:web:1d08da8fcc993559e80ff8",
  measurementId: "G-2KJ58F25LK"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

/**
 * Firebase singleton — Books shares the oriz-app Firebase project so a
 * logged-in user is logged in across every *.oriz.in subdomain.
 *
 * Lazy proxy pattern (copied verbatim from oriz-home/src/lib/firebase.ts):
 * `getApps()[0] ?? initializeApp(config)` plus deferred `getAuth()` /
 * `getFirestore()` so server-side prerender of pages that import a React
 * island doesn't crash when env vars are missing on the build runner —
 * only the BROWSER needs the auth instance.
 */
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

function getApp(): FirebaseApp {
  if (_app) return _app
  _app = getApps()[0] ?? initializeApp(config)
  return _app
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, p) {
    if (!_auth) _auth = getAuth(getApp())
    return Reflect.get(_auth, p)
  },
}) as Auth

export const db: Firestore = new Proxy({} as Firestore, {
  get(_t, p) {
    if (!_db) _db = getFirestore(getApp())
    return Reflect.get(_db, p)
  },
}) as Firestore

export const app: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_t, p) {
    return Reflect.get(getApp(), p)
  },
}) as FirebaseApp

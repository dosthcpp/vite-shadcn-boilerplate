import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, onSnapshot, setDoc, getDoc, writeBatch } from 'firebase/firestore';

// Configure via Vite envs in .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

export function getDB() {
  if (!app) app = initializeApp(firebaseConfig as any);
  if (!db) {
    try {
      // Auto-detect long polling to avoid 400 issues behind proxies/AD blockers
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }) as any;
    } catch {
      db = getFirestore(app);
    }
  }
  return db!;
}

export async function subscribeSchedule(userId: string, onData: (payload: any) => void) {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) onData(snap.data());
  });
  // Ensure doc exists
  const cur = await getDoc(ref);
  if (!cur.exists()) await setDoc(ref, { tasks: [], progress: [], dailyChecks: [], updatedAt: Date.now() });
  return unsub;
}

export async function getScheduleOnce(userId: string): Promise<any | null> {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function pushSnapshot(userId: string, payload: { tasks: any[]; progress: any[]; dailyChecks: any[] }, source: { deviceId: string }) {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  await setDoc(ref, { ...payload, updatedAt: Date.now(), source }, { merge: true });
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('device-id') || '';
    if (!id && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      id = (crypto as any).randomUUID();
      localStorage.setItem('device-id', id);
    } else if (!id) {
      id = String(Math.random()).slice(2);
      localStorage.setItem('device-id', id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

export async function pushProgressOnly(userId: string, progress: any[], source: { deviceId: string }) {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  await setDoc(ref, { progress, updatedAt: Date.now(), source }, { merge: true });
}

export async function pushDailyChecksOnly(userId: string, dailyChecks: any[], source: { deviceId: string }) {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  await setDoc(ref, { dailyChecks, updatedAt: Date.now(), source }, { merge: true });
}

export async function pushDaySettingsOnly(userId: string, daySettings: { date: string; totalHours: number }[], source: { deviceId: string }) {
  const database = getDB();
  const ref = doc(database, 'schedules', userId);
  await setDoc(ref, { daySettings, updatedAt: Date.now(), source }, { merge: true });
}

export async function batchUpdateTasks(userId: string, records: { id: string; date: string }[]) {
  const database = getDB();
  const batch = writeBatch(database);
  const ref = doc(database, 'schedules', userId);
  // For simplicity, just set the whole snapshot (caller should provide full tasks)
  // Left here for potential per-task subcollection approach.
  await setDoc(ref, { updatedAt: Date.now() }, { merge: true });
}



import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { ExpenseRecord, FirebaseConfigOptions, UserProfile, MessLedger } from '../types';
import defaultRawConfig from '../../firebase-config.js';

const STORAGE_KEY_CUSTOM_CONFIG = 'messmate_custom_firebase_config';
const STORAGE_KEY_LOCAL_USER = 'messmate_local_user';
const STORAGE_KEY_LOCAL_DATA = 'messmate_local_expenses';
const STORAGE_KEY_LOCAL_MESSES = 'messmate_local_messes';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentUser: UserProfile | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if config has valid non-placeholder values
export function isConfigValid(cfg?: Partial<FirebaseConfigOptions>): boolean {
  if (!cfg) return false;
  const key = cfg.apiKey?.trim();
  const proj = cfg.projectId?.trim();
  if (!key || !proj) return false;
  if (key === 'YOUR_API_KEY_HERE' || proj === 'YOUR_PROJECT_ID') return false;
  return key.length > 5 && proj.length > 2;
}

export function getActiveFirebaseConfig(): FirebaseConfigOptions | null {
  // 1. Check user override in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isConfigValid(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved firebase config', e);
  }

  // 2. Check default config from firebase-config.js
  if (isConfigValid(defaultRawConfig as FirebaseConfigOptions)) {
    return defaultRawConfig as FirebaseConfigOptions;
  }

  // 3. Check Vite env vars
  const envConfig: FirebaseConfigOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
  if (isConfigValid(envConfig)) {
    return envConfig;
  }

  return null;
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseServices() {
  const config = getActiveFirebaseConfig();
  if (!config) {
    return { isConfigured: false, app: null, auth: null, db: null };
  }

  try {
    if (!firebaseAppInstance) {
      if (getApps().length > 0) {
        firebaseAppInstance = getApp();
      } else {
        firebaseAppInstance = initializeApp(config);
      }
    }

    if (!firebaseAuthInstance && firebaseAppInstance) {
      firebaseAuthInstance = getAuth(firebaseAppInstance);
    }

    if (!firestoreInstance && firebaseAppInstance) {
      try {
        // Enable offline persistence with modern cache settings
        firestoreInstance = initializeFirestore(firebaseAppInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        firestoreInstance = getFirestore(firebaseAppInstance);
      }
    }

    return {
      isConfigured: true,
      app: firebaseAppInstance,
      auth: firebaseAuthInstance,
      db: firestoreInstance,
    };
  } catch (err) {
    console.error('Failed to initialize Firebase SDK:', err);
    return { isConfigured: false, app: null, auth: null, db: null };
  }
}

// Local mock data handlers for offline/demo mode when Firebase credentials are not yet pasted
function getLocalExpenses(userId: string): Record<string, ExpenseRecord> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_LOCAL_DATA}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local expenses', e);
  }
  return {};
}

function saveLocalExpenses(userId: string, data: Record<string, ExpenseRecord>) {
  try {
    localStorage.setItem(`${STORAGE_KEY_LOCAL_DATA}_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local expenses', e);
  }
}

export function getLocalMesses(userId: string): MessLedger[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_LOCAL_MESSES}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to read local messes', e);
  }
  const defaultMess: MessLedger = {
    id: 'default',
    name: 'Main Mess',
    description: 'Primary hostel mess ledger',
    icon: '🍲',
    color: 'amber',
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
  saveLocalMesses(userId, [defaultMess]);
  return [defaultMess];
}

export function saveLocalMesses(userId: string, messes: MessLedger[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_LOCAL_MESSES}_${userId}`, JSON.stringify(messes));
  } catch (e) {
    console.error('Failed to save local messes', e);
  }
}

function getLocalMessExpenses(userId: string, messId: string = 'default'): Record<string, ExpenseRecord> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_LOCAL_DATA}_${userId}_${messId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local mess expenses', e);
  }
  // Fallback to legacy default expenses if messId is default
  if (messId === 'default') {
    return getLocalExpenses(userId);
  }
  return {};
}

function saveLocalMessExpenses(userId: string, messId: string = 'default', data: Record<string, ExpenseRecord>) {
  try {
    localStorage.setItem(`${STORAGE_KEY_LOCAL_DATA}_${userId}_${messId}`, JSON.stringify(data));
    if (messId === 'default') {
      saveLocalExpenses(userId, data);
    }
  } catch (e) {
    console.error('Failed to save local mess expenses', e);
  }
}


// Authentication API
export async function signUpUser(email: string, pass: string): Promise<UserProfile> {
  const { isConfigured, auth } = getFirebaseServices();
  if (isConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
    };
  }

  // Local storage mode
  const localUser: UserProfile = {
    uid: `usr_${btoa(email).replace(/=/g, '').slice(0, 12)}`,
    email,
    displayName: email.split('@')[0],
  };
  localStorage.setItem(STORAGE_KEY_LOCAL_USER, JSON.stringify(localUser));
  return localUser;
}

export async function signInUser(email: string, pass: string): Promise<UserProfile> {
  const { isConfigured, auth } = getFirebaseServices();
  if (isConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
    };
  }

  // Local storage mode
  const localUser: UserProfile = {
    uid: `usr_${btoa(email).replace(/=/g, '').slice(0, 12)}`,
    email,
    displayName: email.split('@')[0],
  };
  localStorage.setItem(STORAGE_KEY_LOCAL_USER, JSON.stringify(localUser));
  return localUser;
}

export async function logOutUser(): Promise<void> {
  const { isConfigured, auth } = getFirebaseServices();
  if (isConfigured && auth) {
    await signOut(auth);
  }
  localStorage.removeItem(STORAGE_KEY_LOCAL_USER);
}

export function subscribeAuthState(callback: (user: UserProfile | null) => void): () => void {
  const { isConfigured, auth } = getFirebaseServices();
  if (isConfigured && auth) {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        callback(null);
      }
    });
  }

  // Local storage check
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCAL_USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up previous demo user if present
      if (parsed?.email === 'student@university.edu') {
        localStorage.removeItem(STORAGE_KEY_LOCAL_USER);
        callback(null);
      } else {
        callback(parsed);
      }
    } else {
      callback(null);
    }
  } catch {
    callback(null);
  }
  return () => {};
}

// Multiple Messes (Ledgers) API
export function subscribeUserMesses(
  userId: string,
  onData: (messes: MessLedger[]) => void,
  currentUser: UserProfile | null
): Unsubscribe {
  const { isConfigured, db } = getFirebaseServices();

  // 1. Immediately emit local messes so UI never lags or shows empty
  const emitLocalMesses = () => {
    const list = getLocalMesses(userId);
    onData(list);
  };
  emitLocalMesses();

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.userId === userId) {
      emitLocalMesses();
    }
  };

  window.addEventListener('messmate_messes_updated', handleUpdate);
  window.addEventListener('storage', emitLocalMesses);

  let firestoreUnsub: Unsubscribe = () => {};

  // 2. If Firebase is active, listen to remote changes
  if (isConfigured && db) {
    const collectionPath = `users/${userId}/messes`;
    try {
      const q = collection(db, 'users', userId, 'messes');
      firestoreUnsub = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            // Auto-seed initial default mess if user has no mess documents
            const defaultMess: MessLedger = {
              id: 'default',
              name: 'Main Mess',
              description: 'Primary hostel mess ledger',
              icon: '🍲',
              color: 'amber',
              isDefault: true,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, 'users', userId, 'messes', 'default'), {
                id: 'default',
                name: defaultMess.name,
                description: defaultMess.description,
                icon: defaultMess.icon,
                color: defaultMess.color,
                isDefault: true,
                createdAt: defaultMess.createdAt,
              });
            } catch (err) {
              console.warn('Auto-seed default mess to Firestore notice:', err);
            }
            const local = getLocalMesses(userId);
            if (!local.some((m) => m.id === 'default')) {
              local.unshift(defaultMess);
              saveLocalMesses(userId, local);
            }
            onData(local);
            return;
          }

          const list: MessLedger[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Partial<MessLedger>;
            list.push({
              id: d.id,
              name: data.name || 'Mess Ledger',
              description: data.description || '',
              monthlyBudget: data.monthlyBudget ? Number(data.monthlyBudget) : undefined,
              icon: data.icon || '🍲',
              color: data.color || 'amber',
              isDefault: data.isDefault || d.id === 'default',
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          // Also merge any locally created messes
          const local = getLocalMesses(userId);
          local.forEach((localMess) => {
            if (!list.some((m) => m.id === localMess.id)) {
              list.push(localMess);
            }
          });

          // Sort default first, then alphabetically
          list.sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return a.name.localeCompare(b.name);
          });

          saveLocalMesses(userId, list);
          onData(list);
        },
        (error) => {
          console.warn('Firestore messes onSnapshot error, maintaining local storage:', error);
          emitLocalMesses();
        }
      );
    } catch (err) {
      console.warn('Failed to listen to messes in Firestore:', err);
    }
  }

  return () => {
    firestoreUnsub();
    window.removeEventListener('messmate_messes_updated', handleUpdate);
    window.removeEventListener('storage', emitLocalMesses);
  };
}

export async function createMessLedger(
  userId: string,
  data: {
    name: string;
    description?: string;
    monthlyBudget?: number;
    icon?: string;
    color?: string;
  },
  currentUser: UserProfile | null
): Promise<MessLedger> {
  const messId = `mess_${Date.now()}`;
  const trimmedName = data.name.trim() || 'New Mess';
  const newMess: MessLedger = {
    id: messId,
    name: trimmedName,
    description: data.description?.trim() || '',
    icon: data.icon || '🍲',
    color: data.color || 'amber',
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  const parsedBudget = Number(data.monthlyBudget);
  if (!isNaN(parsedBudget) && parsedBudget > 0) {
    newMess.monthlyBudget = parsedBudget;
  }

  // 1. Immediately persist locally and notify listeners
  const current = getLocalMesses(userId);
  if (!current.some((m) => m.id === messId)) {
    current.push(newMess);
    saveLocalMesses(userId, current);
  }
  window.dispatchEvent(new CustomEvent('messmate_messes_updated', { detail: { userId } }));

  // 2. Sync to Firestore without any undefined fields
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      const docData: Record<string, any> = {
        id: messId,
        name: newMess.name,
        description: newMess.description,
        icon: newMess.icon,
        color: newMess.color,
        isDefault: false,
        createdAt: newMess.createdAt,
      };
      if (newMess.monthlyBudget !== undefined) {
        docData.monthlyBudget = newMess.monthlyBudget;
      }

      await setDoc(doc(db, 'users', userId, 'messes', messId), docData);
    } catch (err) {
      console.warn('Firestore createMessLedger sync notice (saved locally):', err);
    }
  }

  return newMess;
}

export async function deleteMessLedger(
  userId: string,
  messId: string,
  currentUser: UserProfile | null
): Promise<void> {
  if (messId === 'default') {
    throw new Error('Default mess cannot be deleted. You can clear its records instead.');
  }

  // 1. Delete locally first
  const current = getLocalMesses(userId).filter((m) => m.id !== messId);
  saveLocalMesses(userId, current);
  try {
    localStorage.removeItem(`${STORAGE_KEY_LOCAL_DATA}_${userId}_${messId}`);
  } catch {}
  window.dispatchEvent(new CustomEvent('messmate_messes_updated', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));

  // 2. Sync deletion to Firestore if configured
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      const expensesCol = collection(db, 'users', userId, 'messes', messId, 'expenses');
      const expensesSnap = await getDocs(expensesCol);
      const batchPromises = expensesSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(batchPromises);

      await deleteDoc(doc(db, 'users', userId, 'messes', messId));
    } catch (err) {
      console.warn('Firestore deleteMessLedger sync notice (deleted locally):', err);
    }
  }
}

// Database CRUD: users/{userId}/messes/{messId}/expenses/{date}
export async function saveMealExpense(
  userId: string,
  date: string,
  breakfast: number,
  lunch: number,
  dinner: number,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Promise<ExpenseRecord> {
  const b = Math.max(0, Number(breakfast) || 0);
  const l = Math.max(0, Number(lunch) || 0);
  const d = Math.max(0, Number(dinner) || 0);
  const dailyTotal = b + l + d;

  const nowIso = new Date().toISOString();
  const record: ExpenseRecord = {
    date,
    breakfast: b,
    lunch: l,
    dinner: d,
    dailyTotal,
    messId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    const path = `users/${userId}/messes/${messId}/expenses/${date}`;
    try {
      const expenseRef = doc(db, 'users', userId, 'messes', messId, 'expenses', date);
      await setDoc(expenseRef, record, { merge: true });

      // If default mess, also write to legacy collection so old and new structures stay synced
      if (messId === 'default') {
        const legacyRef = doc(db, 'users', userId, 'expenses', date);
        await setDoc(legacyRef, record, { merge: true });
      }

      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path, currentUser);
    }
  }

  // Local mode persistence
  const records = getLocalMessExpenses(userId, messId);
  records[date] = {
    ...record,
    createdAt: records[date]?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  saveLocalMessExpenses(userId, messId, records);

  // Dispatch custom storage event for instant UI update
  window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));
  return records[date];
}

export async function deleteMealExpense(
  userId: string,
  date: string,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Promise<void> {
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    const path = `users/${userId}/messes/${messId}/expenses/${date}`;
    try {
      const expenseRef = doc(db, 'users', userId, 'messes', messId, 'expenses', date);
      await deleteDoc(expenseRef);
      if (messId === 'default') {
        try {
          await deleteDoc(doc(db, 'users', userId, 'expenses', date));
        } catch {}
      }
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path, currentUser);
    }
  }

  // Local mode
  const records = getLocalMessExpenses(userId, messId);
  if (records[date]) {
    delete records[date];
    saveLocalMessExpenses(userId, messId, records);
    window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));
  }
}

export async function clearAllExpenses(
  userId: string,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Promise<void> {
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    const collectionPath = `users/${userId}/messes/${messId}/expenses`;
    try {
      const q = collection(db, 'users', userId, 'messes', messId, 'expenses');
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(batchPromises);

      if (messId === 'default') {
        const legacyQ = collection(db, 'users', userId, 'expenses');
        const legacySnap = await getDocs(legacyQ);
        await Promise.all(legacySnap.docs.map((d) => deleteDoc(d.ref)));
      }
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionPath, currentUser);
    }
  }

  // Local mode
  saveLocalMessExpenses(userId, messId, {});
  window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));
}

export function subscribeUserExpenses(
  userId: string,
  onData: (records: ExpenseRecord[]) => void,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Unsubscribe {
  const { isConfigured, db } = getFirebaseServices();

  if (isConfigured && db) {
    const collectionPath = `users/${userId}/messes/${messId}/expenses`;
    try {
      const q = collection(db, 'users', userId, 'messes', messId, 'expenses');
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          // If default mess has no records in messes/default/expenses, check legacy collection
          if (snapshot.empty && messId === 'default') {
            try {
              const legacySnap = await getDocs(collection(db, 'users', userId, 'expenses'));
              if (!legacySnap.empty) {
                const list: ExpenseRecord[] = [];
                legacySnap.forEach((d) => {
                  const data = d.data() as ExpenseRecord;
                  list.push({
                    date: data.date || d.id,
                    breakfast: Number(data.breakfast) || 0,
                    lunch: Number(data.lunch) || 0,
                    dinner: Number(data.dinner) || 0,
                    dailyTotal: Number(data.dailyTotal) || (Number(data.breakfast) || 0) + (Number(data.lunch) || 0) + (Number(data.dinner) || 0),
                    messId: 'default',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                  });
                });
                list.sort((a, b) => b.date.localeCompare(a.date));
                onData(list);
                return;
              }
            } catch {}
          }

          const list: ExpenseRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as ExpenseRecord;
            list.push({
              date: data.date || d.id,
              breakfast: Number(data.breakfast) || 0,
              lunch: Number(data.lunch) || 0,
              dinner: Number(data.dinner) || 0,
              dailyTotal: Number(data.dailyTotal) || (Number(data.breakfast) || 0) + (Number(data.lunch) || 0) + (Number(data.dinner) || 0),
              messId,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          });
          // Sort newest records first
          list.sort((a, b) => b.date.localeCompare(a.date));
          onData(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, collectionPath, currentUser);
        }
      );
      return unsubscribe;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collectionPath, currentUser);
      return () => {};
    }
  }

  // Local mode listener
  const emitLocalData = () => {
    const local = getLocalMessExpenses(userId, messId);
    const list = Object.values(local).sort((a, b) => b.date.localeCompare(a.date));
    onData(list);
  };

  emitLocalData();

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.userId === userId && (!custom.detail?.messId || custom.detail?.messId === messId)) {
      emitLocalData();
    }
  };

  window.addEventListener('messmate_expenses_updated', handleUpdate);
  window.addEventListener('storage', emitLocalData);

  return () => {
    window.removeEventListener('messmate_expenses_updated', handleUpdate);
    window.removeEventListener('storage', emitLocalData);
  };
}

export function saveCustomFirebaseConfig(config: FirebaseConfigOptions) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_CONFIG, JSON.stringify(config));
  // Reset singleton instances so they reload with new credentials
  firebaseAppInstance = null;
  firebaseAuthInstance = null;
  firestoreInstance = null;
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_CONFIG);
  firebaseAppInstance = null;
  firebaseAuthInstance = null;
  firestoreInstance = null;
}

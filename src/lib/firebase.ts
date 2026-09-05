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
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { ExpenseRecord, FirebaseConfigOptions, UserProfile, MessLedger, DailyExpenseItem } from '../types';
import defaultRawConfig from '../../firebase-config.js';

const STORAGE_KEY_CUSTOM_CONFIG = 'messmate_custom_firebase_config';
const STORAGE_KEY_LOCAL_USER = 'messmate_local_user';
const STORAGE_KEY_LOCAL_DATA = 'messmate_local_expenses';
const STORAGE_KEY_LOCAL_MESSES = 'messmate_local_messes';
const STORAGE_KEY_DAILY_EXPENSES = 'messmate_local_daily_expenses';

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
  let userDocUnsub: Unsubscribe = () => {};

  // 2. If Firebase is active, listen to remote changes
  if (isConfigured && db) {
    try {
      // Primary: Listen to users/{userId} doc for instant cloud sync
      userDocUnsub = onSnapshot(
        doc(db, 'users', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data?.messes) && data.messes.length > 0) {
              const local = getLocalMesses(userId);
              const list: MessLedger[] = [...data.messes];
              local.forEach((m) => {
                if (!list.some((item) => item.id === m.id)) {
                  list.push(m);
                }
              });
              list.sort((a, b) => {
                if (a.isDefault) return -1;
                if (b.isDefault) return 1;
                return a.name.localeCompare(b.name);
              });
              saveLocalMesses(userId, list);
              onData(list);
            }
          }
        },
        () => {}
      );

      const q = collection(db, 'users', userId, 'messes');
      firestoreUnsub = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            const defaultMess: MessLedger = {
              id: 'default',
              name: 'Main Mess',
              description: 'Primary hostel mess ledger',
              icon: '🍲',
              color: 'amber',
              isDefault: true,
              createdAt: new Date().toISOString(),
            };
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

          const local = getLocalMesses(userId);
          local.forEach((localMess) => {
            if (!list.some((m) => m.id === localMess.id)) {
              list.push(localMess);
            }
          });

          list.sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return a.name.localeCompare(b.name);
          });

          saveLocalMesses(userId, list);
          onData(list);
        },
        () => {
          emitLocalMesses();
        }
      );
    } catch (err) {
      console.warn('Failed to listen to messes in Firestore:', err);
    }
  }

  return () => {
    firestoreUnsub();
    userDocUnsub();
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

  // 2. Sync to Firestore (both in user document and messes collection)
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      // Save directly to user document
      setDoc(doc(db, 'users', userId), {
        messes: current,
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch(() => {});

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

      setDoc(doc(db, 'users', userId, 'messes', messId), docData).catch(() => {});
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
      setDoc(doc(db, 'users', userId), {
        messes: current,
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      deleteDoc(doc(db, 'users', userId, 'messes', messId)).catch(() => {});
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

  // 1. Save locally FIRST immediately for instant UI feedback and guaranteed data persistence
  const records = getLocalMessExpenses(userId, messId);
  const savedRecord: ExpenseRecord = {
    ...record,
    createdAt: records[date]?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  records[date] = savedRecord;
  saveLocalMessExpenses(userId, messId, records);

  // Dispatch custom storage event for instant UI updates across components
  window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId, record: savedRecord } }));

  // 2. Sync to Firestore in the background (directly to users/{userId}/expenses/{date} for guaranteed cloud sync)
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      // Primary allowed path: users/{userId}/expenses/{date}
      const directRef = doc(db, 'users', userId, 'expenses', date);
      const writePromise = setDoc(directRef, savedRecord, { merge: true });

      // If custom mess ledger, also attempt subcollection write in background
      if (messId !== 'default') {
        const messRef = doc(db, 'users', userId, 'messes', messId, 'expenses', date);
        setDoc(messRef, savedRecord, { merge: true }).catch(() => {});
      }

      // Allow up to 3.5 seconds for network sync, but do not hang indefinitely
      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore sync timeout')), 3500))
      ]);
    } catch (err) {
      console.warn('Firestore sync notice (record safely saved locally):', err);
    }
  }

  return savedRecord;
}

export async function deleteMealExpense(
  userId: string,
  date: string,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Promise<void> {
  // 1. Delete locally FIRST
  const records = getLocalMessExpenses(userId, messId);
  if (records[date]) {
    delete records[date];
    saveLocalMessExpenses(userId, messId, records);
    window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));
  }

  // 2. Sync deletion to Firestore
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'expenses', date));
      if (messId !== 'default') {
        deleteDoc(doc(db, 'users', userId, 'messes', messId, 'expenses', date)).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore delete notice (record safely removed locally):', err);
    }
  }
}

export async function clearAllExpenses(
  userId: string,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Promise<void> {
  // 1. Clear local state immediately
  saveLocalMessExpenses(userId, messId, {});
  window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId, messId } }));

  // 2. Sync to Firestore
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      const q = collection(db, 'users', userId, 'expenses');
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(batchPromises);

      if (messId !== 'default') {
        const messQ = collection(db, 'users', userId, 'messes', messId, 'expenses');
        const messSnap = await getDocs(messQ);
        await Promise.all(messSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch (err) {
      console.warn('Firestore clear notice (cleared locally):', err);
    }
  }
}

export function subscribeUserExpenses(
  userId: string,
  onData: (records: ExpenseRecord[]) => void,
  currentUser: UserProfile | null,
  messId: string = 'default'
): Unsubscribe {
  // Helper to emit current local expenses
  const emitLocalData = () => {
    const local = getLocalMessExpenses(userId, messId);
    const list = Object.values(local).sort((a, b) => b.date.localeCompare(a.date));
    onData(list);
  };

  // 1. Always emit cached local data immediately on subscription
  emitLocalData();

  // 2. Listen to custom internal and storage events for instant offline updates
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.userId === userId && (!custom.detail?.messId || custom.detail?.messId === messId)) {
      emitLocalData();
    }
  };

  window.addEventListener('messmate_expenses_updated', handleUpdate);
  window.addEventListener('storage', emitLocalData);

  // 3. Connect Firestore real-time listener directly to users/{userId}/expenses
  const { isConfigured, db } = getFirebaseServices();
  let firestoreUnsubscribe: Unsubscribe = () => {};

  if (isConfigured && db) {
    try {
      const q = collection(db, 'users', userId, 'expenses');
      firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ExpenseRecord[] = [];
            const localMap = getLocalMessExpenses(userId, messId);
            snapshot.forEach((d) => {
              const data = d.data() as ExpenseRecord;
              const item: ExpenseRecord = {
                date: data.date || d.id,
                breakfast: Number(data.breakfast) || 0,
                lunch: Number(data.lunch) || 0,
                dinner: Number(data.dinner) || 0,
                dailyTotal: Number(data.dailyTotal) || (Number(data.breakfast) || 0) + (Number(data.lunch) || 0) + (Number(data.dinner) || 0),
                messId: data.messId || 'default',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              };
              if (!messId || messId === 'default' || item.messId === messId) {
                list.push(item);
                localMap[item.date] = item;
              }
            });
            saveLocalMessExpenses(userId, messId, localMap);
            list.sort((a, b) => b.date.localeCompare(a.date));
            onData(list);
          } else {
            emitLocalData();
          }
        },
        (error) => {
          console.warn('Firestore meal expenses live listener notice:', error);
          emitLocalData();
        }
      );
    } catch (err) {
      console.warn('Failed to start Firestore meal expenses listener:', err);
    }
  }

  return () => {
    window.removeEventListener('messmate_expenses_updated', handleUpdate);
    window.removeEventListener('storage', emitLocalData);
    if (typeof firestoreUnsubscribe === 'function') {
      firestoreUnsubscribe();
    }
  };
}

// -------------------------------------------------------------
// Daily Personal Expenses (Groceries, Travel, Academics, etc.)
// -------------------------------------------------------------

export function getLocalDailyExpenses(userId: string): Record<string, DailyExpenseItem> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DAILY_EXPENSES}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to parse local daily expenses:', err);
    return {};
  }
}

export function saveLocalDailyExpenses(userId: string, expenses: Record<string, DailyExpenseItem>) {
  try {
    localStorage.setItem(`${STORAGE_KEY_DAILY_EXPENSES}_${userId}`, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save local daily expenses:', err);
  }
}

export async function saveDailyExpense(
  userId: string,
  expense: Omit<DailyExpenseItem, 'id'> & { id?: string },
  currentUser: UserProfile | null
): Promise<DailyExpenseItem> {
  const nowIso = new Date().toISOString();
  // Ensure valid non-empty string ID
  const id = (expense.id && expense.id.trim().length > 0)
    ? expense.id.trim()
    : 'exp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

  const localExpenses = getLocalDailyExpenses(userId);
  const existing = localExpenses[id];

  // Clean data: Ensure NO undefined properties exist
  const recordToSave: DailyExpenseItem = {
    id,
    title: expense.title && expense.title.trim().length > 0 ? expense.title.trim() : 'Daily Expense',
    amount: Math.max(0, Number(expense.amount) || 0),
    category: expense.category || 'other',
    date: expense.date && expense.date.trim().length > 0 ? expense.date.trim() : new Date().toISOString().slice(0, 10),
    paymentMethod: expense.paymentMethod || 'Cash',
    notes: expense.notes ? expense.notes.trim() : '',
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // 1. Save locally first for instant UI response and offline support
  localExpenses[id] = recordToSave;
  saveLocalDailyExpenses(userId, localExpenses);

  // Dispatch custom storage event for instant UI update
  window.dispatchEvent(
    new CustomEvent('messmate_daily_expenses_updated', {
      detail: { userId, item: recordToSave }
    })
  );

  // 2. Background Firestore sync (stored directly on user doc for guaranteed cross-device sync)
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      // Primary: Save in users/{userId} doc under dailyExpensesMap
      const userRef = doc(db, 'users', userId);
      const writePromise = setDoc(userRef, {
        dailyExpensesMap: {
          ...localExpenses,
          [id]: recordToSave
        },
        lastUpdated: nowIso
      }, { merge: true });

      // Subcollection backup in background
      const docRef = doc(db, 'users', userId, 'daily_expenses', id);
      setDoc(docRef, recordToSave, { merge: true }).catch(() => {});

      await Promise.race([
        writePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore sync timeout')), 3500))
      ]);
    } catch (err) {
      console.warn('Firestore daily expense sync notice (saved locally):', err);
    }
  }

  return recordToSave;
}

export async function deleteDailyExpense(
  userId: string,
  expenseId: string,
  currentUser: UserProfile | null
): Promise<void> {
  // 1. Delete locally first
  const localExpenses = getLocalDailyExpenses(userId);
  if (localExpenses[expenseId]) {
    delete localExpenses[expenseId];
    saveLocalDailyExpenses(userId, localExpenses);
    window.dispatchEvent(
      new CustomEvent('messmate_daily_expenses_updated', {
        detail: { userId, deletedId: expenseId }
      })
    );
  }

  // 2. Sync deletion to Firestore
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      const userRef = doc(db, 'users', userId);
      setDoc(userRef, {
        dailyExpensesMap: localExpenses,
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      deleteDoc(doc(db, 'users', userId, 'daily_expenses', expenseId)).catch(() => {});
    } catch (err) {
      console.warn('Firestore daily expense delete notice (removed locally):', err);
    }
  }
}

export async function clearAllDailyExpenses(
  userId: string,
  currentUser: UserProfile | null
): Promise<void> {
  // 1. Clear locally
  saveLocalDailyExpenses(userId, {});
  window.dispatchEvent(
    new CustomEvent('messmate_daily_expenses_updated', {
      detail: { userId, cleared: true }
    })
  );

  // 2. Clear Firestore
  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        dailyExpensesMap: {},
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      const q = collection(db, 'users', userId, 'daily_expenses');
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.warn('Firestore clear daily expenses notice:', err);
    }
  }
}

export function subscribeDailyExpenses(
  userId: string,
  onData: (items: DailyExpenseItem[]) => void,
  currentUser: UserProfile | null
): Unsubscribe {
  // Helper to emit current local expenses sorted by date descending
  const emitLocalData = () => {
    const local = getLocalDailyExpenses(userId);
    const list = Object.values(local).sort((a, b) => b.date.localeCompare(a.date));
    onData(list);
  };

  // 1. Emit local immediately
  emitLocalData();

  // 2. Listen to custom internal events
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.userId === userId) {
      emitLocalData();
    }
  };

  window.addEventListener('messmate_daily_expenses_updated', handleUpdate);
  window.addEventListener('storage', emitLocalData);

  // 3. Connect Firestore listener directly to user doc
  const { isConfigured, db } = getFirebaseServices();
  let userDocUnsubscribe: Unsubscribe = () => {};
  let subcolUnsubscribe: Unsubscribe = () => {};

  if (isConfigured && db) {
    try {
      // Primary: Listen to users/{userId} doc for instant cloud sync
      userDocUnsubscribe = onSnapshot(
        doc(db, 'users', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.dailyExpensesMap && typeof data.dailyExpensesMap === 'object') {
              const localMap = getLocalDailyExpenses(userId);
              const cloudMap = data.dailyExpensesMap as Record<string, DailyExpenseItem>;
              Object.entries(cloudMap).forEach(([key, val]) => {
                if (val && typeof val === 'object') {
                  localMap[key] = {
                    id: val.id || key,
                    date: val.date || '',
                    title: val.title || 'Daily Expense',
                    amount: Number(val.amount) || 0,
                    category: val.category || 'other',
                    paymentMethod: val.paymentMethod || 'Cash',
                    notes: val.notes || '',
                    createdAt: val.createdAt || new Date().toISOString(),
                    updatedAt: val.updatedAt || new Date().toISOString(),
                  };
                }
              });
              saveLocalDailyExpenses(userId, localMap);
              const list = Object.values(localMap).sort((a, b) => b.date.localeCompare(a.date));
              onData(list);
              return;
            }
          }
          emitLocalData();
        },
        () => {
          emitLocalData();
        }
      );

      // Backup: listen to daily_expenses subcollection
      const q = collection(db, 'users', userId, 'daily_expenses');
      subcolUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const localMap = getLocalDailyExpenses(userId);
            snapshot.forEach((d) => {
              const data = d.data() as DailyExpenseItem;
              localMap[d.id] = {
                id: d.id,
                date: data.date || '',
                title: data.title || '',
                amount: Number(data.amount) || 0,
                category: data.category || 'other',
                paymentMethod: data.paymentMethod || 'Cash',
                notes: data.notes || '',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              };
            });
            saveLocalDailyExpenses(userId, localMap);
            const list = Object.values(localMap).sort((a, b) => b.date.localeCompare(a.date));
            onData(list);
          }
        },
        () => {}
      );
    } catch (err) {
      console.warn('Failed to start Firestore daily expenses listener:', err);
    }
  }

  return () => {
    window.removeEventListener('messmate_daily_expenses_updated', handleUpdate);
    window.removeEventListener('storage', emitLocalData);
    userDocUnsubscribe();
    subcolUnsubscribe();
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

// ==================== MONTHLY POCKET MONEY PERSISTENCE ====================
export const STORAGE_KEY_POCKET_MONEY_PREFIX = 'pocket_money_tracker_pocket_';

export function getLocalPocketMoney(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_POCKET_MONEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse local pocket money:', err);
  }
  return {};
}

export function saveLocalPocketMoney(userId: string, data: Record<string, number>) {
  try {
    localStorage.setItem(`${STORAGE_KEY_POCKET_MONEY_PREFIX}${userId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save local pocket money:', err);
  }
}

export async function saveMonthlyPocketMoney(
  userId: string,
  yearMonth: string,
  amount: number
): Promise<void> {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const localMap = getLocalPocketMoney(userId);
  localMap[yearMonth] = safeAmount;
  saveLocalPocketMoney(userId, localMap);

  window.dispatchEvent(
    new CustomEvent('expense_tracker_pocket_money_updated', {
      detail: { userId, yearMonth, amount: safeAmount }
    })
  );

  const { isConfigured, db } = getFirebaseServices();
  if (isConfigured && db) {
    try {
      // Primary: Save to users/{userId} doc under pocketMoneyMap for reliable sync
      const userRef = doc(db, 'users', userId);
      setDoc(userRef, {
        pocketMoneyMap: {
          ...localMap,
          [yearMonth]: safeAmount
        },
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      // Subcollection backup
      const docRef = doc(db, 'users', userId, 'pocket_money', yearMonth);
      setDoc(docRef, {
        monthKey: yearMonth,
        amount: safeAmount,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Could not sync pocket money to Firestore (using local storage):', err);
    }
  }
}

export function loadMonthlyPocketMoney(
  userId: string,
  onData: (data: Record<string, number>) => void
): () => void {
  const emitLocal = () => {
    onData(getLocalPocketMoney(userId));
  };

  emitLocal();

  const handleUpdate = () => emitLocal();
  window.addEventListener('expense_tracker_pocket_money_updated', handleUpdate);
  window.addEventListener('storage', emitLocal);

  let unsubscribeUserDoc: (() => void) | null = null;
  let unsubscribeCol: (() => void) | null = null;
  const { isConfigured, db } = getFirebaseServices();

  if (isConfigured && db) {
    try {
      // Primary: Listen to users/{userId} doc
      unsubscribeUserDoc = onSnapshot(doc(db, 'users', userId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.pocketMoneyMap && typeof data.pocketMoneyMap === 'object') {
            const localMap = getLocalPocketMoney(userId);
            Object.entries(data.pocketMoneyMap as Record<string, number>).forEach(([k, v]) => {
              if (typeof v === 'number') {
                localMap[k] = v;
              }
            });
            saveLocalPocketMoney(userId, localMap);
            onData(localMap);
            return;
          }
        }
        emitLocal();
      }, () => {
        emitLocal();
      });

      // Backup: Listen to pocket_money subcollection
      const colRef = collection(db, 'users', userId, 'pocket_money');
      unsubscribeCol = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const map = getLocalPocketMoney(userId);
          snapshot.forEach((d) => {
            const data = d.data();
            if (data && typeof data.amount === 'number') {
              map[d.id] = data.amount;
            }
          });
          saveLocalPocketMoney(userId, map);
          onData(map);
        }
      }, () => {});
    } catch (err) {
      console.warn('Failed to start Firestore pocket money listener:', err);
    }
  }

  return () => {
    window.removeEventListener('expense_tracker_pocket_money_updated', handleUpdate);
    window.removeEventListener('storage', emitLocal);
    if (unsubscribeUserDoc) unsubscribeUserDoc();
    if (unsubscribeCol) unsubscribeCol();
  };
}

// ==================== FULL TWO-WAY CLOUD DATA SYNC ====================

export interface CloudSyncResult {
  success: boolean;
  mealCount: number;
  dailyCount: number;
  pocketCount: number;
  message: string;
}

/**
 * Manually or automatically synchronizes all local browser data on this device
 * (PC or mobile) with the Firestore cloud database, and pulls any existing cloud records.
 */
export async function syncLocalDataToCloud(userId: string): Promise<CloudSyncResult> {
  const { isConfigured, db } = getFirebaseServices();
  if (!isConfigured || !db) {
    return {
      success: false,
      mealCount: 0,
      dailyCount: 0,
      pocketCount: 0,
      message: 'Cloud service is not configured or unavailable'
    };
  }

  try {
    // 1. Gather all local meal records from all ledgers
    const localMesses = getLocalMesses(userId);
    let totalMealsUploaded = 0;

    for (const mess of localMesses) {
      const records = getLocalMessExpenses(userId, mess.id);
      for (const record of Object.values(records)) {
        if (record && record.date) {
          // Upload directly to users/{userId}/expenses/{date}
          const directRef = doc(db, 'users', userId, 'expenses', record.date);
          await setDoc(directRef, record, { merge: true });
          totalMealsUploaded++;
        }
      }
    }

    // 2. Gather local daily expenses, pocket money, and messes
    const localDaily = getLocalDailyExpenses(userId);
    const localPocket = getLocalPocketMoney(userId);

    // Save consolidated state in users/{userId}
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      dailyExpensesMap: localDaily,
      pocketMoneyMap: localPocket,
      messes: localMesses,
      lastSyncTime: new Date().toISOString()
    }, { merge: true });

    // 3. Pull down any remote meal expenses from cloud to ensure local cache is fully updated
    const mealsCol = collection(db, 'users', userId, 'expenses');
    const mealsSnap = await getDocs(mealsCol);
    if (!mealsSnap.empty) {
      const defaultRecords = getLocalMessExpenses(userId, 'default');
      mealsSnap.forEach((d) => {
        const data = d.data() as ExpenseRecord;
        if (data && data.date) {
          defaultRecords[data.date] = {
            date: data.date,
            breakfast: Number(data.breakfast) || 0,
            lunch: Number(data.lunch) || 0,
            dinner: Number(data.dinner) || 0,
            dailyTotal: Number(data.dailyTotal) || 0,
            messId: data.messId || 'default',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        }
      });
      saveLocalMessExpenses(userId, 'default', defaultRecords);
      window.dispatchEvent(new CustomEvent('messmate_expenses_updated', { detail: { userId } }));
    }

    // 4. Pull down remote user document
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      if (uData?.dailyExpensesMap && typeof uData.dailyExpensesMap === 'object') {
        const mergedDaily = { ...localDaily, ...uData.dailyExpensesMap };
        saveLocalDailyExpenses(userId, mergedDaily);
        window.dispatchEvent(new CustomEvent('messmate_daily_expenses_updated', { detail: { userId } }));
      }
      if (uData?.pocketMoneyMap && typeof uData.pocketMoneyMap === 'object') {
        const mergedPocket = { ...localPocket, ...uData.pocketMoneyMap };
        saveLocalPocketMoney(userId, mergedPocket);
        window.dispatchEvent(new CustomEvent('expense_tracker_pocket_money_updated', { detail: { userId } }));
      }
      if (Array.isArray(uData?.messes) && uData.messes.length > 0) {
        saveLocalMesses(userId, uData.messes);
        window.dispatchEvent(new CustomEvent('messmate_messes_updated', { detail: { userId } }));
      }
    }

    return {
      success: true,
      mealCount: totalMealsUploaded,
      dailyCount: Object.keys(localDaily).length,
      pocketCount: Object.keys(localPocket).length,
      message: 'All expenses successfully synchronized with the cloud!'
    };
  } catch (err) {
    console.error('syncLocalDataToCloud error:', err);
    return {
      success: false,
      mealCount: 0,
      dailyCount: 0,
      pocketCount: 0,
      message: err instanceof Error ? err.message : 'Sync failed'
    };
  }
}

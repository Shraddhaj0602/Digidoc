import { initializeApp } from 'firebase/app';
import {
    getFirestore, collection, addDoc,
    getDocs, doc, updateDoc,
    deleteDoc, query, orderBy,
    getDoc, onSnapshot
} from 'firebase/firestore';

const firebaseConfig = {

    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── SAVE a new record ──
export const saveRecord = async (recordData) => {
    const docRef = await addDoc(collection(db, 'records'), {
        ...recordData,
        createdAt: new Date().toISOString(),
        status: recordData.status || 'completed'
    });
    return docRef.id;
};

// ── GET all records ──
export const getAllRecords = async () => {
    const q = query(collection(db, 'records'),
        orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// ── UPDATE a record ──
export const updateRecord = async (id, data) => {
    const ref = doc(db, 'records', id);
    await updateDoc(ref, data);
};

// ── DELETE a record ──
export const deleteRecord = async (id) => {
    await deleteDoc(doc(db, 'records', id));
};

// ── GET a single record by ID ──
export const getRecordById = async (id) => {
    const ref = doc(db, 'records', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
    }
    return null;
};

// ── SUBSCRIBE to all records (realtime) ──
export const subscribeToRecords = (callback) => {
    const q = query(collection(db, 'records'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(data);
    });
};
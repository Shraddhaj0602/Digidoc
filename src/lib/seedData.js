import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const demoRecords = [
    {
        plant: "Alpha Manufacturing Pvt. Ltd.",
        department: "Machining",
        shift: "A",
        date: "21/05/2024",
        status: "completed",
        totalProduction: 981,
        remarks: "Tool wear observed on MC-101",
        machines: [
            {
                machineId: "MC-101", productCode: "P-2001",
                plan: 500, actual: 482, rejects: 18, operator: "Ravi"
            },
            {
                machineId: "MC-102", productCode: "P-2001",
                plan: 500, actual: 499, rejects: 1, operator: "Suresh"
            },
        ]
    }

];

export const seedIfEmpty = async () => {
    const snapshot = await getDocs(collection(db, 'records'));
    
    // If database contains excess records from the old seed list, clear them out
    if (snapshot.size > 1) {
        console.log('Clearing multiple older records to maintain exactly one demo record...');
        const { deleteDoc, doc } = await import('firebase/firestore');
        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, 'records', docSnapshot.id));
        }
        
        // Seed exactly the single demo record
        console.log('Seeding one clean demo record...');
        for (const record of demoRecords) {
            await addDoc(collection(db, 'records'), {
                ...record,
                createdAt: new Date().toISOString()
            });
        }
        console.log('Seeded exactly one demo record!');
    } else if (snapshot.empty) {
        console.log('Seeding demo data...');
        for (const record of demoRecords) {
            await addDoc(collection(db, 'records'), {
                ...record,
                createdAt: new Date().toISOString()
            });
        }
        console.log('Demo data seeded!');
    }
};
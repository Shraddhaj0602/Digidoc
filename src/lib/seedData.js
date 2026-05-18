import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const mockSvgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%"><rect width="800" height="1000" fill="%230b0f19" rx="16" /><rect x="20" y="20" width="760" height="960" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" rx="12" /><text x="50" y="80" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">MACHINE SHOP OPERATIONAL LOG</text><line x1="50" y1="110" x2="750" y2="110" stroke="rgba(255,255,255,0.1)" stroke-width="2" /><text x="50" y="150" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Plant Name:</text><text x="50" y="180" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="18" font-weight="600">Alpha Manufacturing Pvt. Ltd.</text><text x="400" y="150" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Department:</text><text x="400" y="180" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="18" font-weight="600">Machining</text><text x="50" y="230" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Date:</text><text x="50" y="260" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="16">21/05/2024</text><text x="400" y="230" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Shift:</text><text x="400" y="260" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="16">A (Morning)</text><rect x="50" y="320" width="700" height="40" fill="rgba(255,255,255,0.03)" rx="6" /><text x="70" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Machine ID</text><text x="200" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Prod Code</text><text x="320" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Plan</text><text x="420" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Actual</text><text x="520" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Rejects</text><text x="620" y="345" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Operator</text><text x="70" y="400" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="14">MC-101</text><text x="200" y="400" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">P-2001</text><text x="320" y="400" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">500</text><text x="420" y="400" fill="%2334d399" font-family="system-ui, sans-serif" font-size="14" font-weight="600">482</text><text x="520" y="400" fill="%23f87171" font-family="system-ui, sans-serif" font-size="14">18</text><text x="620" y="400" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">Ravi (4.5 hrs)</text><line x1="50" y1="420" x2="750" y2="420" stroke="rgba(255,255,255,0.05)" stroke-width="1" /><text x="70" y="460" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="14">MC-102</text><text x="200" y="460" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">P-2001</text><text x="320" y="460" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">500</text><text x="420" y="460" fill="%2334d399" font-family="system-ui, sans-serif" font-size="14" font-weight="600">499</text><text x="520" y="460" fill="%23f87171" font-family="system-ui, sans-serif" font-size="14">1</text><text x="620" y="460" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">Suresh (3.5 hrs)</text><line x1="50" y1="480" x2="750" y2="480" stroke="rgba(255,255,255,0.05)" stroke-width="1" /><rect x="50" y="520" width="700" height="120" fill="rgba(255,255,255,0.01)" rx="8" stroke="rgba(255,255,255,0.03)" stroke-width="1" /><text x="70" y="555" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Total Production:</text><text x="200" y="555" fill="%2334d399" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">981 units</text><text x="70" y="605" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14">Remarks:</text><text x="200" y="605" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="14">Tool wear observed on MC-101. Replaced inserts.</text><circle cx="680" cy="580" r="40" fill="none" stroke="rgba(56,189,248,0.2)" stroke-width="3" stroke-dasharray="6 3" /><text x="650" y="585" fill="rgba(56,189,248,0.3)" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">DIGITIZED</text></svg>`;

const demoRecords = [
    {
        plant: "Alpha Manufacturing Pvt. Ltd.",
        department: "Machining",
        shift: "A",
        date: "21/05/2024",
        status: "completed",
        totalProduction: 981,
        remarks: "Tool wear observed on MC-101",
        fileName: "Alpha_Machining_Log.png",
        fileType: "image/png",
        fileUrl: mockSvgUrl,
        machines: [
            {
                machineId: "MC-101", productCode: "P-2001",
                plan: 500, actual: 482, rejects: 18, operator: "Ravi", timeTaken: "4.5"
            },
            {
                machineId: "MC-102", productCode: "P-2001",
                plan: 500, actual: 499, rejects: 1, operator: "Suresh", timeTaken: "3.5"
            },
        ]
    }
];

export const seedIfEmpty = async () => {
    const snapshot = await getDocs(collection(db, 'records'));
    
    // Check if the single seeded record is the old one (missing fileUrl)
    let isOldSeed = false;
    if (snapshot.size === 1) {
        const docData = snapshot.docs[0].data();
        if (!docData.fileUrl) {
            isOldSeed = true;
        }
    }

    // If database contains excess records or an old seed, clear them out
    if (snapshot.size > 1 || isOldSeed) {
        console.log('Clearing older/incomplete records to seed fresh demo data...');
        const { deleteDoc, doc } = await import('firebase/firestore');
        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, 'records', docSnapshot.id));
        }
        
        // Seed exactly the single demo record
        console.log('Seeding clean demo record...');
        for (const record of demoRecords) {
            await addDoc(collection(db, 'records'), {
                ...record,
                createdAt: new Date().toISOString()
            });
        }
        console.log('Seeded clean demo record successfully!');
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
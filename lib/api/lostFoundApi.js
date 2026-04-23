import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Auth xavfsizligi
const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const lostFoundApi = {
    
    // 1. Barcha e'lonlarni olish
    async getItems() {
        try {
            const q = query(
                collection(db, 'lostFoundItems'),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Sana formatini chiroyli o'zgartirish
                    formattedDate: data.createdAt?.toDate().toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    }) || "Noma'lum"
                };
            });
        } catch (error) {
            console.error("Buyumlarni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Yangi e'lon qo'shish
    async createItem(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            const docRef = await addDoc(collection(db, 'lostFoundItems'), {
                ...data,
                reporterId: user.uid,
                reporterName: user.displayName || user.email?.split('@')[0] || "Anonim",
                createdAt: serverTimestamp()
            });

            return {
                id: docRef.id,
                ...data,
                formattedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            };
        } catch (error) {
            console.error("E'lon qo'shishda xato:", error);
            throw error;
        }
    }
};
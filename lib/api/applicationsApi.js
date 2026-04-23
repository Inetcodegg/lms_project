import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

export const applicationsApi = {
    
    // 1. Arizalar ro'yxatini olish
    async getApplications() {
        try {
            const user = await requireAuth();
            if (!user) return [];

            const q = query(
                collection(db, 'applications'),
                where('userId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            // Olingan ma'lumotlarni vaqt bo'yicha saralash (Eng yangisi birinchi)
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Vaqtni o'qiladigan formatga o'tkazish
                formattedDate: doc.data().createdAt?.toDate().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                }) || "Noma'lum sana"
            }));

            return apps.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        } catch (error) {
            console.error("Arizalarni olishda xato:", error);
            return [];
        }
    },

    // 2. Yangi ariza yuborish (Create)
    async createApplication(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            // Firebase'ga yangi hujjat qo'shish
            const docRef = await addDoc(collection(db, 'applications'), {
                ...data,
                userId: user.uid,
                status: 'Pending', // Yangi ariza doim kutilmoqda bo'ladi
                createdAt: serverTimestamp() // Server vaqti
            });

            return { 
                id: docRef.id, 
                ...data, 
                status: 'Pending', 
                formattedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
        } catch (error) {
            console.error("Ariza yaratishda xato:", error);
            throw error;
        }
    }
};
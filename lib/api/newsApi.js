import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const newsApi = {
    // 1. Barcha yangiliklarni olish (Eng yangilari birinchi)
    async getNews() {
        try {
            const q = query(
                collection(db, 'news'),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Sanani chiroyli formatlash
                    formattedDate: data.createdAt?.toDate().toLocaleDateString('uz-UZ', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    }) || "Yaqinda"
                };
            });
        } catch (error) {
            console.error("Yangiliklarni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Yangi xabar (News) qo'shish
    async createNews(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            const newsData = {
                ...data,
                authorId: user.uid,
                authorName: user.displayName || user.email?.split('@')[0] || "Admin",
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'news'), newsData);

            return {
                id: docRef.id,
                ...newsData,
                formattedDate: new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
            };
        } catch (error) {
            console.error("Yangilik yaratishda xato:", error);
            throw error;
        }
    }
};
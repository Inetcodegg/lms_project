import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const rankingsApi = {
    // 1. Barcha talabalar reytingini olish (Ball bo'yicha kamayish tartibida)
    async getRankings() {
        try {
            await requireAuth(); // Faqat tizimga kirganlar ko'ra oladi
            
            // studentRankings kolleksiyasidan ball (score) bo'yicha saralab olamiz
            const q = query(
                collection(db, 'studentRankings'),
                orderBy('score', 'desc')
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            // Avtomatik reyting raqamini (rank) berib chiqish
            return snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1, // 1-o'rin, 2-o'rin...
                ...doc.data()
            }));
        } catch (error) {
            console.error("Reytingni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Foydalanuvchining shaxsiy yutuqlari va o'sishini olish
    async getUserStats() {
        try {
            const user = await requireAuth();
            if (!user) return null;

            const docRef = doc(db, 'userStats', user.uid);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                return snapshot.data();
            }
            return { growth: 0, percentile: "N/A" };
        } catch (error) {
            return { growth: 0, percentile: "N/A" };
        }
    }
};
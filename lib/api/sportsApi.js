import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const sportsApi = {
    // 1. Sport TURLARINI (Kategoriyalarni) bazadan olish
    async getSportsCategories() {
        try {
            const snapshot = await getDocs(collection(db, 'sportsCategories'));
            if (snapshot.empty) return [];
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Sport turlarini yuklashda xato:", error);
            return [];
        }
    },

    // 2. ADMIN uchun yangi sport turini qo'shish
    async createSportsCategory(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");
            
            // Xavfsizlik: Buni faqat admin qila olishi kerak (UI da tekshirilgan, rules da ham qo'yish kerak)
            const docRef = await addDoc(collection(db, 'sportsCategories'), {
                ...data,
                createdBy: user.uid,
                createdAt: serverTimestamp()
            });

            return { id: docRef.id, ...data };
        } catch (error) {
            console.error("Sport turi qo'shishda xato:", error);
            throw error;
        }
    },

    // 3. Sport o'yinlarini (Matches) olish
    async getMatches() {
        try {
            const q = query(collection(db, 'sportsMatches'), orderBy('matchDate', 'asc'));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            return [];
        }
    },

    // 4. Chipta band qilish
    async bookTicket(matchId, matchTitle) {
        try {
            const user = await requireAuth();
            await addDoc(collection(db, 'sportsTickets'), {
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0],
                matchId: matchId,
                matchTitle: matchTitle,
                status: 'Booked',
                createdAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            throw error;
        }
    },

    // 5. Foydalanuvchi sport statistikasi
    async getUserSportsStats() {
        try {
            const user = await requireAuth();
            if (!user) return null;

            const docRef = doc(db, 'sportsStats', user.uid);
            const snapshot = await getDoc(docRef);
            return snapshot.exists() ? snapshot.data() : { kcalBurnt: 0, growth: "+0%", trainings: 0, target: 30 };
        } catch (error) {
            return { kcalBurnt: 0, growth: "+0%", trainings: 0, target: 30 };
        }
    },

    // 6. Sport Reytingini olish (Leaderboard)
    async getSportsLeaderboard() {
        try {
            const q = query(collection(db, 'sportsStats'), orderBy('score', 'desc'), limit(5));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data()
            }));
        } catch (error) {
            return [];
        }
    }
};
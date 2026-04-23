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

export const helpApi = {
    
    // 1. FAQ (Savol-javoblar) ni foydalanuvchi roliga qarab olish
    async getFAQs(role = 'student') {
        try {
            // 'all' hamma uchun, yoki aynan user rolini qidiradi
            const q = query(
                collection(db, 'faqs'),
                where('targetRoles', 'array-contains-any', ['all', role])
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("FAQ yuklashda xato:", error);
            return []; // Xato bo'lsa dastur qulamaydi
        }
    },

    // 2. Yordam So'rovini yuborish (Submit Support Ticket)
    async submitTicket(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            // So'rovni Firebase bazasiga yozish
            const docRef = await addDoc(collection(db, 'supportTickets'), {
                ...data,
                userId: user.uid,
                userEmail: user.email,
                status: 'Open', // Yangi so'rovlar ochiq holatda bo'ladi
                createdAt: serverTimestamp()
            });

            return docRef.id;
        } catch (error) {
            console.error("Ticket yuborishda xato:", error);
            throw error;
        }
    }
};
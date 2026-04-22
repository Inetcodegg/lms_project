import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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

export const eventsApi = {
    
    /**
     * Tadbirlarni foydalanuvchi roliga qarab olish.
     * @param {string} userRole - foydalanuvchi roli ('student', 'teacher', 'chef', 'admin')
     */
    async getEvents(userRole = 'student') {
        try {
            const user = await requireAuth();
            if (!user) return [];

            // Barcha rollar uchun umumiy ('all') yoki aynan shu ro'lga tegishli tadbirlarni olamiz
            const q = query(
                collection(db, 'events'),
                where('targetRoles', 'array-contains-any', ['all', userRole])
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            const events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Vaqt bo'yicha saralash (eng yaqini birinchi)
            // Agar date maydoni Timestamp bo'lsa
            return events.sort((a, b) => {
                const dateA = a.dateTimestamp?.seconds || 0;
                const dateB = b.dateTimestamp?.seconds || 0;
                return dateA - dateB; 
            });

        } catch (error) {
            console.error("Tadbirlarni yuklashda xato:", error);
            return [];
        }
    }
};
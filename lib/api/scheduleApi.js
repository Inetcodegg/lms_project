import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const scheduleApi = {
    // Foydalanuvchi roliga mos dars jadvalini olish
    async getSchedule(role = 'student') {
        try {
            const user = await requireAuth();
            if (!user) return [];

            const scheduleRef = collection(db, 'schedules');
            let q;

            // Rolga qarab Firebase Query ni o'zgartiramiz
            if (role === 'teacher') {
                // Agar o'qituvchi bo'lsa, faqat o'zi dars o'tadigan jadvallarni oladi
                q = query(scheduleRef, where('teacherId', '==', user.uid));
            } else if (role === 'student') {
                // Agar talaba bo'lsa, ro'yxatida o'zi bor darslarni oladi
                q = query(scheduleRef, where('studentsList', 'array-contains', user.uid));
            } else {
                // Adminlar barcha darslarni ko'rishi mumkin
                q = query(scheduleRef); 
            }

            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            // Olingan darslarni vaqtiga (para raqamiga) qarab tartiblash
            const schedules = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return schedules.sort((a, b) => (a.para || 0) - (b.para || 0));
        } catch (error) {
            console.error("Jadvalni yuklashda xato:", error);
            return [];
        }
    }
};
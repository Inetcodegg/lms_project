import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const teachersApi = {
    
    // 1. O'qituvchilarni ro'lga va guruhga moslab olish
    async getTeachers(userRole, userGroupId) {
        try {
            await requireAuth();
            const teachersRef = collection(db, 'teachers');
            let q;

            if (userRole === 'admin') {
                // Admin barcha o'qituvchilarni ko'radi
                q = query(teachersRef);
            } else {
                // Talaba faqat o'z guruhiga ('Guruh-101') yoki hammaga ('all') dars beradiganlarni ko'radi
                q = query(
                    teachersRef, 
                    where('assignedGroups', 'array-contains-any', ['all', userGroupId || 'general'])
                );
            }

            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("O'qituvchilarni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Yangi o'qituvchi qo'shish (Faqat ADMIN uchun)
    async addTeacher(teacherData) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            const docRef = await addDoc(collection(db, 'teachers'), {
                ...teacherData,
                createdAt: serverTimestamp(),
                createdBy: user.uid
            });

            return { id: docRef.id, ...teacherData };
        } catch (error) {
            console.error("O'qituvchi qo'shishda xato:", error);
            throw error;
        }
    },

    // 3. O'qituvchi qabuliga yozilish (Uchrashuv bron qilish)
    async bookAppointment(teacherId, teacherName, date, time, reason) {
        try {
            const user = await requireAuth();
            
            await addDoc(collection(db, 'appointments'), {
                studentId: user.uid,
                studentName: user.displayName || user.email?.split('@')[0],
                teacherId,
                teacherName,
                date,
                time,
                reason,
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error("Qabulga yozilishda xato:", error);
            throw error;
        }
    },

    // 4. Statistika (Footer uchun)
    async getFacultyStats() {
        // Haqiqiy loyihada bularni bazadan count qilib olish mumkin. 
        // Tezlik uchun hozircha mock emas, statik obyekt, keyin update qilasiz.
        return {
            activeProfessors: 142,
            phdCandidates: 56,
            departments: 12
        };
    }
};
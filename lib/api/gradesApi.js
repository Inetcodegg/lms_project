import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Auth xavfsizligi
const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user); // Foydalanuvchi yo'q bo'lsa qulamaydi, null qaytaradi
        });
    });
};

// Bo'sh (Empty) holat uchun xavfsiz ma'lumotlar
const DEFAULT_PROFILE = {
    gpa: "0.0",
    rank: "N/A",
    trends: [
        { label: "O'zlashtirish darajasi", val: 0, color: 'bg-indigo-500' },
        { label: "Loyiha natijalari", val: 0, color: 'bg-emerald-500' },
        { label: "Davomat", val: 0, color: 'bg-amber-500' },
        { label: "Qo'shimcha faollik", val: 0, color: 'bg-rose-500' },
    ]
};

export const gradesApi = {
    
    // 1. Akademik profilni olish (GPA, Rank, Trends)
    async getAcademicProfile() {
        try {
            const user = await requireAuth();
            if (!user) return DEFAULT_PROFILE;

            const profileRef = doc(db, 'academicProfiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                return { ...DEFAULT_PROFILE, ...profileSnap.data() };
            }
            return DEFAULT_PROFILE;
        } catch (error) {
            console.error("Profile xatosi:", error);
            return DEFAULT_PROFILE;
        }
    },

    // 2. Baholar va Trankript ro'yxatini olish
    async getGrades() {
        try {
            const user = await requireAuth();
            if (!user) return [];

            const q = query(
                collection(db, 'grades'),
                where('studentId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            // default ranglar massivi (agar bazada rang kiritilmagan bo'lsa)
            const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];

            return snapshot.docs.map((doc, index) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    color: colors[index % colors.length], // Avtomatik rang
                    ...data
                };
            });
        } catch (error) {
            console.error("Grades xatosi:", error);
            return [];
        }
    }
};
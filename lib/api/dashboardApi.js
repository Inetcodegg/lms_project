import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// 1. YANGLANGAN: Error o'rniga jimgina null qaytaramiz
const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user); // Foydalanuvchi yo'q bo'lsa null qaytadi, dastur qulamaydi
        });
    });
};

// 2. Default stat
const DEFAULT_STATS = {
    enrolledCourses: 0,
    totalAssignments: 0,
    completedCourses: 0,
    upcomingQuizzes: 0,
    overallProgress: 0,
    assignmentBreakdown: { submitted: 0, inReview: 0, remaining: 0 },
    analytics: [
        { label: 'Dush', hours: 0, isPeak: false },
        { label: 'Sesh', hours: 0, isPeak: false },
        { label: 'Chor', hours: 0, isPeak: false },
        { label: 'Pay', hours: 0, isPeak: false },
        { label: 'Jum', hours: 0, isPeak: false },
        { label: 'Shan', hours: 0, isPeak: false },
        { label: 'Yak', hours: 0, isPeak: false }
    ]
};

export const dashboardApi = {
    
    // --- 1. DASHBOARD STATISTIKASI ---
    async getDashboardStats(period = 'weekly') {
        try {
            const user = await requireAuth();
            if (!user) return DEFAULT_STATS; // YANGLANGAN: Login qilinmagan bo'lsa xatosiz 0 qaytadi

            const statsRef = doc(db, 'userStats', user.uid);
            const statsSnap = await getDoc(statsRef);

            if (statsSnap.exists()) {
                const data = statsSnap.data();
                return data[period] || data; 
            }
            return DEFAULT_STATS;
        } catch (error) {
            return DEFAULT_STATS;
        }
    },

    // --- 2. DAVOM ETAYOTGAN KURSLAR ---
    async getOngoingCourses() {
        try {
            const user = await requireAuth();
            if (!user) return []; // YANGLANGAN: User yo'q bo'lsa bo'sh massiv qaytadi

            const q = query(
                collection(db, 'courses'),
                where('studentsList', 'array-contains', user.uid),
                where('status', '==', 'ongoing')
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            return [];
        }
    },

    // --- 3. KELGUSI DARSLAR ---
    async getUpcomingClasses() {
        try {
            const user = await requireAuth();
            if (!user) return []; // YANGLANGAN

            const q = query(
                collection(db, 'courses'),
                where('studentsList', 'array-contains', user.uid),
                where('status', '==', 'upcoming')
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            return [];
        }
    },

    // --- 4. VAZIFALAR (ASSIGNMENTS) ---
    async getAssignments() {
        try {
            const user = await requireAuth();
            if (!user) return []; // YANGLANGAN

            const q = query(
                collection(db, 'assignments'),
                where('studentId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            return [];
        }
    }
};
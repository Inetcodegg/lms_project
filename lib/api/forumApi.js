import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

export const forumApi = {
    
    // 1. Forum xabarlarini olish (Eng yangilari birinchi)
    async getPosts() {
        try {
            const q = query(
                collection(db, 'forumPosts'),
                orderBy('createdAt', 'desc') // Yangilari birinchi
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Vaqt formatini chiroyli qilish (M: "2h", "1d" kabi)
                let timeAgo = "Hozir";
                if (data.createdAt) {
                    const diffMs = Date.now() - data.createdAt.toMillis();
                    const diffMins = Math.round(diffMs / 60000);
                    const diffHours = Math.round(diffMins / 60);
                    const diffDays = Math.round(diffHours / 24);
                    
                    if (diffDays > 0) timeAgo = `${diffDays}k`;
                    else if (diffHours > 0) timeAgo = `${diffHours}s`;
                    else if (diffMins > 0) timeAgo = `${diffMins}d`;
                }

                return {
                    id: doc.id,
                    ...data,
                    time: timeAgo
                };
            });
        } catch (error) {
            console.error("Forum yuklash xatosi:", error);
            return [];
        }
    },

    // 2. Yangi mavzu qo'shish
    async createPost(data) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            const postData = {
                ...data,
                authorId: user.uid,
                author: user.displayName || user.email?.split('@')[0] || "Anonim",
                upvotes: 0,
                comments: 0,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'forumPosts'), postData);

            return {
                id: docRef.id,
                ...postData,
                time: "Hozir"
            };
        } catch (error) {
            console.error("Post yaratishda xato:", error);
            throw error;
        }
    }
};
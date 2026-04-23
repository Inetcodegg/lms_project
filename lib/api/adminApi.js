import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where, setDoc, serverTimestamp  } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../firebase';

const requireAdmin = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            // Haqiqiy loyihada bu yerda user.role === 'admin' ekanligini Firestore'dan tekshirish kerak
            if (user) resolve(user);
            else reject(new Error("Admin huquqi yo'q"));
        });
    });
};

export const adminApi = {
    // 1. Tizim statistikasini olish
    async getSystemStats() {
        try {
            await requireAdmin();
            // Aslida bu Firestore'dagi 'users', 'teachers' kabi kolleksiyalarning length'i bo'ladi.
            // Hozirgi holatda barcha kolleksiyalarni o'qib count qilamiz
            const usersSnap = await getDocs(collection(db, 'users'));
            const ticketsSnap = await getDocs(query(collection(db, 'supportTickets'), where('status', '==', 'Open')));
            
            return {
                totalUsers: usersSnap.empty ? 0 : usersSnap.size,
                activeTickets: ticketsSnap.empty ? 0 : ticketsSnap.size,
                serverStatus: "99.9%",
                storageUsed: "45%"
            };
        } catch (error) {
            console.error("Statistika xatosi:", error);
            return { totalUsers: 0, activeTickets: 0, serverStatus: "100%", storageUsed: "0%" };
        }
    },

    // 2. Foydalanuvchilarni olish
    async getUsers() {
        try {
            await requireAdmin();
            const snapshot = await getDocs(collection(db, 'users'));
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Userlarni yuklashda xato:", error);
            return [];
        }
    },

    // 3. Yordam so'rovlarini (Tickets) olish
    async getTickets() {
        try {
            await requireAdmin();
            const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.createdAt?.toDate().toLocaleDateString('uz-UZ') || "Hozir"
                };
            });
        } catch (error) {
            console.error("Tickets xatosi:", error);
            return [];
        }
    },

    // 4. Ticket statusini yangilash (Masalan: Yopilgan deb belgilash)
    async updateTicketStatus(ticketId, newStatus) {
        try {
            await requireAdmin();
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, { status: newStatus });
            return true;
        } catch (error) {
            console.error("Ticket yangilash xatosi:", error);
            throw error;
        }
    },

    // 5. Foydalanuvchini tizimdan o'chirish
    async deleteUserDoc(userId) {
        try {
            await requireAdmin();
            await deleteDoc(doc(db, 'users', userId));
            return true;
        } catch (error) {
            console.error("O'chirishda xato:", error);
            throw error;
        }
    },

    async createNewUser(userData) {
            try {
                // 1. Firebase Identity Toolkit API orqali orqa fonda yaratamiz 
                // Bu usul Admin akkauntiga mutlaqo tegmaydi!
                const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userData.email,
                        password: userData.password,
                        returnSecureToken: true
                    })
                });

                const data = await response.json();

                // Xatoliklarni chiroyli qaytarish
                if (!response.ok) {
                    if (data.error.message === 'EMAIL_EXISTS') throw new Error("Bu email allaqachon band!");
                    if (data.error.message === 'WEAK_PASSWORD') throw new Error("Parol kamida 6 ta belgi bo'lishi kerak!");
                    if (data.error.message === 'INVALID_EMAIL') throw new Error("Email noto'g'ri kiritildi!");
                    throw new Error("Xatolik yuz berdi: " + data.error.message);
                }

                const newUid = data.localId; // Yaratilgan yangi odamning ID si

                // 2. Olingan ID orqali Firestore bazasiga ma'lumotlarni yozib qo'yish
                await setDoc(doc(db, "users", newUid), {
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
                    createdAt: serverTimestamp()
                });

                return { id: newUid, ...userData, dateAdded: "Hozir" };

            } catch (error) {
                console.error("Qo'shishda xatolik:", error);
                throw error; // UI dagi Toast uchun xatoni yuqoriga uzatamiz
            }
        }
};


import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

export const cafeteriaApi = {
    
    // 1. Menyuni bazadan olish
    async getMenu() {
        try {
            // Menyu hamma uchun ochiq, shuning uchun auth shart emas, lekin ulanishni tekshiramiz
            const snapshot = await getDocs(collection(db, 'cafeteriaMenu'));
            
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Menyuni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Buyurtma berish (Create Order)
    async placeOrder(item) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            // Buyurtmani 'cafeteriaOrders' kolleksiyasiga saqlash
            await addDoc(collection(db, 'cafeteriaOrders'), {
                userId: user.uid,
                menuItemId: item.id,
                itemName: item.name,
                price: item.price,
                status: 'Pending', // Kutilmoqda
                createdAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error("Buyurtma berishda xato:", error);
            throw error;
        }
    }
};
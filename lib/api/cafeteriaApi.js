import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
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
            const snapshot = await getDocs(query(collection(db, 'cafeteriaMenu'), orderBy('createdAt', 'desc')));

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


            await addDoc(collection(db, 'cafeteriaOrders'), {
                userId: user.uid,
                menuItemId: item.id,
                itemName: item.name,
                price: item.price,
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error("Buyurtma berishda xato:", error);
            throw error;
        }
    },

    // 3. Yangi taom qo'shish (Chef Terminal uchun)
    async addDish(dish) {
        try {
            await addDoc(collection(db, 'cafeteriaMenu'), {
                ...dish,
                price: Number(dish.price),
                createdAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Taom qo'shishda xato:", error);
            throw error;
        }
    },

    // 4. Taomni o'chirish
    async deleteDish(id) {
        try {
            await deleteDoc(doc(db, 'cafeteriaMenu', id));
            return true;
        } catch (error) {
            console.error("Taomni o'chirishda xato:", error);
            throw error;
        }
    },

    // 5. Taomni yangilash
    async updateDish(id, updates) {
        try {
            const dishRef = doc(db, "cafeteriaMenu", id);
            await updateDoc(dishRef, updates);
            return true;
        } catch (error) {
            console.error("Taomni yangilashda xato:", error);
            throw error;
        }
    }
};

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, deleteUser, updateProfile as updateAuthProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) resolve(user);
            else reject(new Error("Tizimga kirmagansiz"));
        });
    });
};

export const profileApi = {
    // 1. Profil ma'lumotlarini olish
    async getProfile() {
        try {
            const user = await requireAuth();
            const docRef = doc(db, 'users', user.uid);
            const snapshot = await getDoc(docRef);
            
            // Default sozlamalar
            const defaultSettings = {
                major: "",
                year: "",
                notifications: { emailAlerts: true, pushNotifs: true, updates: false }
            };

            const firestoreData = snapshot.exists() ? snapshot.data() : defaultSettings;

            return {
                id: user.uid,
                email: user.email,
                name: user.displayName || firestoreData.name || "Foydalanuvchi",
                avatar: user.photoURL || firestoreData.avatar || null,
                role: firestoreData.role || "student",
                ...firestoreData
            };
        } catch (error) {
            console.error("Profil yuklashda xato:", error);
            return null;
        }
    },

    // 2. Profil ma'lumotlarini yangilash (Ism, Mutaxassislik, Sozlamalar)
    async updateProfileData(data) {
        try {
            const user = await requireAuth();
            const docRef = doc(db, 'users', user.uid);
            
            // Auth profilini yangilash (Ism o'zgarsa)
            if (data.name) {
                await updateAuthProfile(user, { displayName: data.name });
            }

            await updateDoc(docRef, data);
            return true;
        } catch (error) {
            console.error("Profil yangilashda xato:", error);
            throw error;
        }
    },

    // 3. Rasm (Avatar) yuklash
    async uploadAvatar(file) {
        try {
            const user = await requireAuth();
            const storage = getStorage();
            // Rasmni Firebase Storage'ga joylash
            const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            
            // URL ni olish
            const downloadURL = await getDownloadURL(storageRef);
            
            // Auth va Firestore ni yangilash
            await updateAuthProfile(user, { photoURL: downloadURL });
            await updateDoc(doc(db, 'users', user.uid), { avatar: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error("Rasm yuklashda xato:", error);
            throw error;
        }
    },

    // 4. Parolni yangilash
    async updateSecurePassword(newPassword) {
        try {
            const user = await requireAuth();
            await updatePassword(user, newPassword);
            return true;
        } catch (error) {
            console.error("Parol yangilashda xato:", error);
            throw error;
        }
    },

    // 5. Akkauntni o'chirish
    async deleteAccount() {
        try {
            const user = await requireAuth();
            // Eslatma: Haqiqiy loyihada oldin Firestore'dagi ma'lumotlarni tozalash kerak
            await deleteUser(user);
            return true;
        } catch (error) {
            console.error("Akkaunt o'chirishda xato:", error);
            throw error;
        }
    }
};
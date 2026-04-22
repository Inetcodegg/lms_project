import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';

export const notificationsApi = {
    
    // 1. Xabarlarni jonli tarzda (Real-time) eshitib turish
    // Callback funksiya orqali yangilangan ma'lumotni komponentga yetkazadi
    listenToNotifications(userRole, userId, callback) {
        if (!userRole || !userId) return () => {};

        // 'notifications' kolleksiyasidan yo hammaga tegishli ('all'), 
        // yo shu ro'lga tegishli ('student'), yoki aynan shu foydalanuvchiga tegishli xabarlarni olamiz
        const q = query(
            collection(db, 'notifications'),
            where('targetRoles', 'array-contains-any', ['all', userRole, userId]),
            orderBy('createdAt', 'desc')
        );

        // onSnapshot - ma'lumot bazada o'zgarishi bilan srazu ishga tushadi
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Vaqtni hisoblash
                let timeAgo = "Hozir";
                if (data.createdAt) {
                    const diffMs = Date.now() - data.createdAt.toMillis();
                    const diffMins = Math.round(diffMs / 60000);
                    const diffHours = Math.round(diffMins / 60);
                    const diffDays = Math.round(diffHours / 24);
                    
                    if (diffDays > 0) timeAgo = `${diffDays}k oldin`;
                    else if (diffHours > 0) timeAgo = `${diffHours}s oldin`;
                    else if (diffMins > 0) timeAgo = `${diffMins}d oldin`;
                }

                return {
                    id: doc.id,
                    ...data,
                    time: timeAgo,
                    // Agar o'qilganlar ro'yxatida mening ID'im bo'lsa, read = true bo'ladi
                    read: data.readBy ? data.readBy.includes(userId) : false
                };
            });
            
            callback(notifications); // Natijani sahifaga beramiz
        }, (error) => {
            console.error("Xabarnomalarni tinglashda xato:", error);
            callback([]);
        });

        return unsubscribe; // Komponent yopilganda uzib qo'yish uchun
    },

    // 2. Bitta xabarni o'qilgan deb belgilash
    async markAsRead(notificationId, userId, currentReadBy = []) {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            // Array ichida dublikat bo'lmasligini tekshiramiz
            if (!currentReadBy.includes(userId)) {
                await updateDoc(notifRef, {
                    readBy: [...currentReadBy, userId]
                });
            }
        } catch (error) {
            console.error("O'qilgan deb belgilashda xato:", error);
        }
    },

    // 3. Barcha xabarlarni o'qilgan deb belgilash (Batch update)
    async markAllAsRead(notifications, userId) {
        try {
            const batch = writeBatch(db);
            let updatedCount = 0;

            notifications.forEach(notif => {
                if (!notif.read) {
                    const notifRef = doc(db, 'notifications', notif.id);
                    const newReadBy = notif.readBy ? [...notif.readBy, userId] : [userId];
                    batch.update(notifRef, { readBy: newReadBy });
                    updatedCount++;
                }
            });

            if (updatedCount > 0) {
                await batch.commit(); // Barchasini birdaniga Firebase'ga yozadi
            }
        } catch (error) {
            console.error("Barchasini o'qishda xato:", error);
        }
    }
};
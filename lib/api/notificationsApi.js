import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

// Brauzer spami bo'lmasligi uchun allaqachon ko'rsatilgan xabarlarni xotirada saqlab turamiz
const notifiedMessageIds = new Set();

export const notificationsApi = {
    
    // 1. Yangi xabar yuborish
    async sendNotification({ title, message, targetRoles = ['all'], type = 'info', link = '' }) {
        try {
            await addDoc(collection(db, 'notifications'), {
                title,
                message,
                targetRoles, // Bunga ['all', 'student', 'teacher', userId, groupId] tushishi mumkin
                type,
                link,
                createdAt: serverTimestamp(),
                readBy: []
            });
            return true;
        } catch (error) {
            console.error("Xabarnoma yuborishda xato:", error);
            return false;
        }
    },

    // 2. Jonli eshitib turish
    listenToNotifications(user, callback) {
        if (!user || !user.uid) return () => {};

        // Qaysi rollarga tegishli xabarlarni izlash kerak?
        const searchRoles = ['all', user.role, user.uid];
        if (user.groupId) searchRoles.push(user.groupId);

        const q = query(
            collection(db, 'notifications'),
            where('targetRoles', 'array-contains-any', searchRoles),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                
                let timeAgo = "Hozir";
                let diffMins = 0;

                // XATONI TUZATISH: Firebase yozishni tugatmagan bo'lsa (pending) createdAt null bo'lishi mumkin.
                const createdAtMs = data.createdAt ? data.createdAt.toMillis() : Date.now();
                
                const diffMs = Date.now() - createdAtMs;
                diffMins = Math.max(0, Math.round(diffMs / 60000)); // Manfiy son chiqmasligi uchun
                
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                
                if (diffDays > 0) timeAgo = `${diffDays}k oldin`;
                else if (diffHours > 0) timeAgo = `${diffHours}s oldin`;
                else if (diffMins > 0) timeAgo = `${diffMins}d oldin`;

                const isRead = data.readBy ? data.readBy.includes(user.uid) : false;

                // XATONI TUZATISH: Brauzer Notification spami bo'lmasligi uchun Set() ga tekshiramiz
                // Snapshot serverdan kelgandagina (hasPendingWrites === false) notification ko'rsatamiz
                if (!isRead && diffMins < 2 && !notifiedMessageIds.has(docSnap.id) && !snapshot.metadata.hasPendingWrites) { 
                    showBrowserNotification(data.title, data.message);
                    notifiedMessageIds.add(docSnap.id); // Ro'yxatga qo'shamiz (qayta chiqmaydi)
                }

                return {
                    id: docSnap.id,
                    ...data,
                    time: timeAgo,
                    read: isRead,
                    readBy: data.readBy || []
                };
            });
            
            callback(notifications);
        }, (error) => {
            console.error("Xabarnomalarni tinglashda xato:", error);
            callback([]);
        });

        return unsubscribe; 
    },

    // 3. Xabarni o'qilgan deb belgilash
    async markAsRead(notificationId, userId, currentReadBy = []) {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            if (!currentReadBy.includes(userId)) {
                // XATONI TUZATISH: xavfsiz arrayUnion ishlatiladi
                await updateDoc(notifRef, {
                    readBy: arrayUnion(userId)
                });
            }
        } catch (error) {
            console.error("O'qilgan deb belgilashda xato:", error);
        }
    },

    // 4. Barcha xabarlarni o'qilgan deb belgilash
    async markAllAsRead(notifications, userId) {
        try {
            const batch = writeBatch(db);
            let updatedCount = 0;

            notifications.forEach(notif => {
                if (!notif.read) {
                    const notifRef = doc(db, 'notifications', notif.id);
                    // XATONI TUZATISH: xavfsiz arrayUnion ishlatiladi
                    batch.update(notifRef, { readBy: arrayUnion(userId) });
                    updatedCount++;
                }
            });

            if (updatedCount > 0) {
                await batch.commit(); 
            }
        } catch (error) {
            console.error("Barchasini o'qishda xato:", error);
        }
    }
};

// 🌟 BRAUZER NOTIFICATION UCHUN YORDAMCHI FUNKSIYA
function showBrowserNotification(title, body) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' }); 
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body, icon: '/favicon.ico' });
            }
        });
    }
}
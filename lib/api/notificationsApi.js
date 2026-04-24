import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const notificationsApi = {
    
    // Yangi xabar yuborish
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

    // Jonli eshitib turish (Group ID ham qo'shildi)
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
            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                
                let timeAgo = "Hozir";
                let diffMins = 0; // XATONI TUZATDIK: Uni shu yerda e'lon qilamiz

                if (data.createdAt) {
                    const diffMs = Date.now() - data.createdAt.toMillis();
                    diffMins = Math.round(diffMs / 60000); // Qiymatni yangilaymiz
                    const diffHours = Math.round(diffMins / 60);
                    const diffDays = Math.round(diffHours / 24);
                    
                    if (diffDays > 0) timeAgo = `${diffDays}k oldin`;
                    else if (diffHours > 0) timeAgo = `${diffHours}s oldin`;
                    else if (diffMins > 0) timeAgo = `${diffMins}d oldin`;
                }

                const isRead = data.readBy ? data.readBy.includes(user.uid) : false;

                // BRAUZER NOTIFICATION LOGIKASI (Endi diffMins hamma joyga ko'rinadi)
                if (!isRead && diffMins < 1) { 
                    showBrowserNotification(data.title, data.message);
                }

                return {
                    id: doc.id,
                    ...data,
                    time: timeAgo,
                    read: isRead
                };
            });
            
            callback(notifications);
        }, (error) => {
            console.error("Xabarnomalarni tinglashda xato:", error);
            callback([]);
        });

        return unsubscribe; 
    },

    // Xabarni o'qilgan deb belgilash
    async markAsRead(notificationId, userId, currentReadBy = []) {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            if (!currentReadBy.includes(userId)) {
                await updateDoc(notifRef, {
                    readBy: [...currentReadBy, userId]
                });
            }
        } catch (error) {
            console.error("O'qilgan deb belgilashda xato:", error);
        }
    },

    // Barcha xabarlarni o'qilgan deb belgilash
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
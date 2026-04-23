import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const managementApi = {
    // 1. Barcha ma'lumotlarni bir vaqtda tortib olish
    async fetchAllData() {
        const [structSnap, groupSnap, userSnap, roomSnap] = await Promise.all([
            getDocs(collection(db, "academic_structure")),
            getDocs(collection(db, "groups")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "rooms")) // Xonalarni ham tortamiz
        ]);

        const users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return {
            structure: structSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            groups: groupSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            rooms: roomSnap.docs.map(d => ({ id: d.id, ...d.data() })), // Xonalar qo'shildi
            teachers: users.filter(u => u.role === 'teacher'),
            students: users.filter(u => u.role === 'student')
        };
    },

    // 2. Struktura tugunini saqlash
    async saveStructureNode(id, data) {
        if (id) {
            await updateDoc(doc(db, "academic_structure", id), { ...data, updatedAt: serverTimestamp() });
            return { id, ...data };
        } else {
            const payload = { ...data, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "academic_structure"), payload);
            return { id: docRef.id, ...payload };
        }
    },

    async deleteStructureNode(id) {
        await deleteDoc(doc(db, "academic_structure", id));
        return true;
    },

    // 3. Guruh qo'shish va o'chirish
    async createGroup(data) {
        const payload = { ...data, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, "groups"), payload);
        return { id: docRef.id, ...payload };
    },

    async deleteGroup(id) {
        await deleteDoc(doc(db, "groups", id));
        return true;
    },

    // 4. XONALAR UCHUN (Yangi qo'shildi)
    async saveRoom(id, data) {
        if (id) {
            await updateDoc(doc(db, "rooms", id), { ...data, updatedAt: serverTimestamp() });
            return { id, ...data };
        } else {
            const payload = { ...data, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "rooms"), payload);
            return { id: docRef.id, ...payload };
        }
    },

    async deleteRoom(id) {
        await deleteDoc(doc(db, "rooms", id));
        return true;
    },

    // 5. Biriktirish logikalari
    async assignStudentToGroup(studentId, groupData) {
        await updateDoc(doc(db, "users", studentId), groupData);
        return true;
    },

    async assignTeacherToSubject(teacherId, subjectData) {
        await updateDoc(doc(db, "users", teacherId), subjectData);
        return true;
    }
};
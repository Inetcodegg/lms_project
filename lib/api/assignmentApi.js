import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const assignmentApi = {
    // 1. Topshiriqlarni olish
    async getAllAssignments() {
        const q = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // 2. Guruhlarni olish va ulardan Bosqichlarni (O'quv yillarini) ajratib olish
    async getGroupsData() {
        const snap = await getDocs(collection(db, "groups"));
        const groups = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Guruhlar ichidan faqat noyob (takrorlanmas) o'quv yillari yoki bosqichlarni ajratib olamiz
        const uniqueGrades = [...new Set(groups.map(g => g.year).filter(Boolean))].sort();
        
        return { groups, uniqueGrades };
    },

    // 3. Akademik Shajarani (Tree) olish (Yo'nalishlar va Fanlar uchun)
    async getAcademicStructure() {
        const snap = await getDocs(collection(db, "academic_structure"));
        const structure = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return {
            specialties: structure.filter(item => item.type === 'major'),
            subjects: structure.filter(item => item.type === 'subject')
        };
    },

    // 4. Saqlash
    async createAssignment(data) {
        const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, "assignments"), payload);
        return { id: docRef.id, ...payload };
    },

    // 5. Yangilash
    async updateAssignment(id, data) {
        const payload = { ...data, updatedAt: serverTimestamp() };
        await updateDoc(doc(db, "assignments", id), payload);
        return { id, ...payload };
    },

    // 6. O'chirish
    async deleteAssignment(id) {
        await deleteDoc(doc(db, "assignments", id));
        return true;
    }
};
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const requireAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const teachersApi = {

    // 1. O'qituvchilarni ro'lga va guruhga moslab olish
    async getTeachers(userRole, userGroupId) {
        try {
            await requireAuth();
            const teachersRef = collection(db, 'teachers');
            let q;

            if (userRole === 'admin') {
                // Admin barcha o'qituvchilarni ko'radi
                q = query(teachersRef);
            } else {
                // Talaba faqat o'z guruhiga ('Guruh-101') yoki hammaga ('all') dars beradiganlarni ko'radi
                q = query(
                    teachersRef,
                    where('assignedGroups', 'array-contains-any', ['all', userGroupId || 'general'])
                );
            }

            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("O'qituvchilarni yuklashda xato:", error);
            return [];
        }
    },

    // 2. Yangi o'qituvchi qo'shish (Faqat ADMIN uchun)
    async addTeacher(teacherData) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            const docRef = await addDoc(collection(db, 'teachers'), {
                ...teacherData,
                createdAt: serverTimestamp(),
                createdBy: user.uid
            });

            return { id: docRef.id, ...teacherData };
        } catch (error) {
            console.error("O'qituvchi qo'shishda xato:", error);
            throw error;
        }
    },

    // 3. O'qituvchi qabuliga yozilish (Uchrashuv bron qilish)
    async bookAppointment(teacherId, teacherName, date, time, reason) {
        try {
            const user = await requireAuth();

            await addDoc(collection(db, 'appointments'), {
                studentId: user.uid,
                studentName: user.displayName || user.email?.split('@')[0],
                teacherId,
                teacherName,
                date,
                time,
                reason,
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error("Qabulga yozilishda xato:", error);
            throw error;
        }
    },

    // 4. Statistika (Footer uchun)
    async getFacultyStats() {
        try {
            const snapshot = await getDocs(collection(db, 'teachers'));
            return {
                activeProfessors: snapshot.size,
                phdCandidates: 56, // Mock, bo'lsa DBdan olinadi
                departments: 12 // Mock
            };
        } catch (error) {
            console.error("Statsni yuklashda xato:", error);
            return {
                activeProfessors: 142,
                phdCandidates: 56,
                departments: 12
            };
        }
    },

    // 5. Davomatni saqlash (Mark Attendance)
    async markAttendance(classId, lessonDate, studentsList) {
        try {
            const user = await requireAuth();
            if (!user) throw new Error("Tizimga kirmagansiz");

            // studentsList: [{ studentId: '123', name: 'Ali', status: 'present' }, ...]
            const attendanceRef = await addDoc(collection(db, 'attendance'), {
                teacherId: user.uid,
                classId,
                date: lessonDate, // Masalan: "2024-05-20"
                students: studentsList,
                recordedAt: serverTimestamp(),
                lastUpdatedBy: user.uid
            });

            return { id: attendanceRef.id, status: 'success' };
        } catch (error) {
            console.error("Davomatni saqlashda xato:", error);
            throw error;
        }
    },

    // 6. Ma'lum bir guruh va sana uchun davomatni olish
    async getAttendanceByDate(classId, date) {
        try {
            await requireAuth();
            const attendanceRef = collection(db, 'attendance');
            const q = query(
                attendanceRef,
                where('classId', '==', classId),
                where('date', '==', date)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
        } catch (error) {
            console.error("Davomatni yuklashda xato:", error);
            return null;
        }
    },

    // 7. O'qituvchining davomatlar tarixi (Barcha qilgan davomatlari)
    async getTeacherAttendanceHistory(limitCount = 20) {
        try {
            const user = await requireAuth();
            const attendanceRef = collection(db, 'attendance');
            const q = query(
                attendanceRef,
                where('teacherId', '==', user.uid)
                // orderBy qo'shish uchun Firestore'da index yaratish kerak bo'ladi
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Tarixni yuklashda xato:", error);
            return [];
        }
    },

    // 8. Davomatni tahrirlash (Update Attendance)
    async updateAttendance(docId, updatedStudents) {
        try {
            const user = await requireAuth();
            const docRef = doc(db, 'attendance', docId);

            await updateDoc(docRef, {
                students: updatedStudents,
                updatedAt: serverTimestamp(),
                lastUpdatedBy: user.uid
            });

            return true;
        } catch (error) {
            console.error("Davomatni yangilashda xato:", error);
            throw error;
        }
    },
    // 9. O'qituvchiga tegishli barcha topshiriqlarni olish (Admin yaratgan)
    async getAssignedTasks(teacherId, type = 'assignment') {
        // type: 'assignment', 'exam', yoki 'oral_exam'
        const q = query(
            collection(db, 'tasks'),
            where('teacherId', '==', teacherId),
            where('type', '==', type)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // 10. Muayyan topshiriq bo'yicha talabalar yuborgan javoblarni olish
    async getSubmissions(taskId) {
        const q = query(collection(db, 'submissions'), where('taskId', '==', taskId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // 11. Baholash funksiyasi
    async submitGrade(submissionId, grade, feedback) {
        const docRef = doc(db, 'submissions', submissionId);
        return await updateDoc(docRef, {
            grade: Number(grade),
            feedback: feedback,
            status: 'graded',
            gradedAt: serverTimestamp()
        });
    }
};
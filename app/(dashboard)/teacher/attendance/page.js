"use client";
import React, { useState, useEffect } from "react";
import {
    ClipboardCheck, Users, Calendar as CalendarIcon,
    CheckCircle2, XCircle, Clock, Save,
    ChevronLeft, Search, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Card from "../../../../components/Card";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { teachersApi } from "../../../../lib/api/teachersApi"; // API manzilingiz

export default function AttendancePage() {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceList, setAttendanceList] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // 1. O'qituvchiga biriktirilgan guruhlarni yuklash
    useEffect(() => {
        // auth.currentUser bazen null keladi — onAuthStateChanged bilan kuting
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const q = query(collection(db, "classes"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                const classesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setClasses(classesData);
            } catch (err) {
                console.error("Guruhlarni yuklashda xato:", err);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe(); // Cleanup
    }, []);

    // 2. Guruh tanlanganda o'quvchilarni yuklash
    const handleClassSelect = async (classItem) => {
        setSelectedClass(classItem);
        try {
            setLoading(true);
            // Faraz qilaylik, 'users' collectionda o'quvchilar 'classId' orqali bog'langan
            const q = query(collection(db, "users"), where("classId", "==", classItem.id), where("role", "==", "student"));
            const snap = await getDocs(q);
            const studentsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            setStudents(studentsData);

            // Default holat: hamma kelgan ('present')
            const initialAttendance = {};
            studentsData.forEach(s => initialAttendance[s.id] = 'present');
            setAttendanceList(initialAttendance);

        } catch (err) {
            console.error("O'quvchilarni yuklashda xato:", err);
        } finally {
            setLoading(false);
        }
    };

    // 3. Davomatni saqlash
    const saveAttendance = async () => {
        if (!selectedClass) return;
        setSaving(true);
        try {
            const formattedList = students.map(s => ({
                studentId: s.id,
                name: s.fullName,
                status: attendanceList[s.id]
            }));

            await teachersApi.markAttendance(selectedClass.id, date, formattedList);
            alert("Davomat muvaffaqiyatli saqlandi!");
            setSelectedClass(null); // Jarayon tugagach orqaga qaytish (ixtiyoriy)
        } catch (err) {
            alert("Xatolik yuz berdi: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = (studentId, status) => {
        setAttendanceList(prev => ({ ...prev, [studentId]: status }));
    };

    if (loading && !selectedClass) {
        return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
    }

    return (
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    {selectedClass && (
                        <button onClick={() => setSelectedClass(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:scale-105 transition-transform">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Davomat jurnali</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {selectedClass ? `${selectedClass.name} guruhi uchun` : "Guruhni tanlang"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>

            {!selectedClass ? (
                /* Guruhlarni tanlash gridi */
                classes.length === 0 ? (
                    <div className="py-20 text-center bg-white/40 dark:bg-slate-900/20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5">
                        <Users className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Sizga biriktirilgan guruhlar topilmadi</p>
                        <p className="text-[10px] font-bold text-slate-300 mt-2">Firebase'da "classes" collectionda teacherId ni tekshiring</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                onClick={() => handleClassSelect(cls)}
                                className="group cursor-pointer p-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[24px] hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                            >
                                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wide">{cls.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase">{cls.subject || "Fan nomi"}</p>
                                <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                                    Kirish <ChevronLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* O'quvchilar ro'yxati */
                <div className="space-y-4">
                    <Card className="overflow-hidden border-none bg-white/40 dark:bg-slate-900/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">F.I.SH</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-500">
                                                        {student.fullName?.[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <StatusBtn
                                                        active={attendanceList[student.id] === 'present'}
                                                        onClick={() => toggleStatus(student.id, 'present')}
                                                        icon={CheckCircle2} color="emerald" label="Keldi"
                                                    />
                                                    <StatusBtn
                                                        active={attendanceList[student.id] === 'absent'}
                                                        onClick={() => toggleStatus(student.id, 'absent')}
                                                        icon={XCircle} color="rose" label="Yo'q"
                                                    />
                                                    <StatusBtn
                                                        active={attendanceList[student.id] === 'late'}
                                                        onClick={() => toggleStatus(student.id, 'late')}
                                                        icon={Clock} color="amber" label="Kechikdi"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Submit Bar */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg">
                        <button
                            onClick={saveAttendance}
                            disabled={saving}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Davomatni saqlash
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Holat tugmachasi uchun kichik komponent
function StatusBtn({ active, onClick, icon: Icon, color, label }) {
    const colors = {
        emerald: active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
        rose: active ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20',
        amber: active ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${colors[color]}`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
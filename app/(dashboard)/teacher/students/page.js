"use client";
import React, { useState, useEffect } from "react";
import {
    Users, Search, Mail, Phone,
    Loader2, GraduationCap
} from "lucide-react";
// Card importini loyiha tuzilmangizga qarab tekshiring
import Card from "../../../../components/Card";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("all");

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;

                // Foydalanuvchi tizimga kirganini tekshirish
                if (!user) {
                    console.log("Foydalanuvchi topilmadi");
                    setLoading(false);
                    return;
                }

                // 1. O'qituvchiga tegishli barcha guruhlarni (classes) olish
                const classesQ = query(
                    collection(db, "classes"),
                    where("teacherId", "==", user.uid)
                );
                const classesSnap = await getDocs(classesQ);
                const classesData = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setClasses(classesData);

                // Guruh ID-larini massivga yig'ish
                const classIds = classesData.map(c => c.id);

                if (classIds.length > 0) {
                    // 2. Faqat shu guruhlarga tegishli talabalarni olish
                    // 'in' operatori classId o'qituvchining guruhlari ichida bo'lganlarni filtrlaydi
                    const studentsQ = query(
                        collection(db, "users"),
                        where("role", "==", "student"),
                        where("classId", "in", classIds)
                    );

                    const studentsSnap = await getDocs(studentsQ);
                    const studentsData = studentsSnap.docs.map(d => ({
                        id: d.id,
                        ...d.data()
                    }));
                    setStudents(studentsData);
                } else {
                    setStudents([]);
                }

            } catch (err) {
                console.error("Ma'lumot yuklashda xatolik:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, []);

    // Qidiruv va Filtrlash mantiqi
    const filteredStudents = students.filter(s => {
        const fullName = s.fullName?.toLowerCase() || "";
        const email = s.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();

        const matchesSearch = fullName.includes(search) || email.includes(search);
        const matchesClass = selectedClassId === "all" || s.classId === selectedClassId;

        return matchesSearch && matchesClass;
    });

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        Talabalar ro'yxati
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                        Mening darslarimdagi barcha o'quvchilar
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ism yoki email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold outline-none"
                    >
                        <option value="all">Barcha guruhlar</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <Users className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                        Talabalar topilmadi
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student) => {
                        const studentClass = classes.find(c => c.id === student.classId);
                        return (
                            <Card key={student.id} className="p-6 border-slate-100 dark:border-white/5 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xl">
                                        {student.fullName?.[0] || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">
                                            {student.fullName}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {studentClass?.name || "Noma'lum guruh"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                        <Mail size={14} className="text-indigo-500" />
                                        <span className="truncate">{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                        <Phone size={14} className="text-emerald-500" />
                                        <span>{student.phone || "Kiritilmagan"}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-white/5 flex gap-2">
                                    <button className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase rounded-lg hover:bg-slate-100 transition-colors">
                                        Profil
                                    </button>
                                    <button className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors">
                                        Xabar
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
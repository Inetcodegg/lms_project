"use client";
import React, { useState, useEffect } from "react";
import {
    Users, Calendar as CalendarIcon, CheckCircle2, XCircle, 
    Clock, Save, ChevronLeft, Loader2, AlertCircle
} from "lucide-react";
import Card from "../../../../components/Card";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";
import { notificationsApi } from "../../../../lib/api/notificationsApi"; 

const getCurrentPair = () => {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const currentTime = hours * 60 + mins;

    if (currentTime >= 9*60 && currentTime <= 10*60+20) return 1;
    if (currentTime >= 10*60+30 && currentTime <= 11*60+50) return 2;
    if (currentTime >= 12*60 && currentTime <= 13*60+20) return 3;
    if (currentTime >= 13*60+30 && currentTime <= 14*60+50) return 4;
    if (currentTime >= 15*60 && currentTime <= 16*60+20) return 5;
    if (currentTime >= 16*60+30 && currentTime <= 17*60+50) return 6;
    
    return null; 
};

export default function TeacherAttendancePage() {
    const { user } = useUser();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceList, setAttendanceList] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    
    const [currentDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPair, setCurrentPair] = useState(getCurrentPair());

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchTeacherGroups = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);
                const q = query(collection(db, "schedules"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                
                const uniqueGroups = [];
                const groupIds = new Set();
                
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.groupId && !groupIds.has(data.groupId)) {
                        groupIds.add(data.groupId);
                        uniqueGroups.push({ id: data.groupId, name: data.groupName, subject: data.subject });
                    }
                });
                
                setClasses(uniqueGroups);
            } catch (err) {
                showToast("Guruhlarni yuklashda xatolik", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherGroups();
    }, [user]);

    const handleClassSelect = async (classItem) => {
        setSelectedClass(classItem);
        setCurrentPair(getCurrentPair()); 
        
        try {
            setLoading(true);
            const q = query(
                collection(db, "users"), 
                where("role", "==", "student"),
                where("groupId", "==", classItem.id)
            );
            const snap = await getDocs(q);
            const studentsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            studentsData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setStudents(studentsData);
            setAttendanceList({}); 
        } catch (err) {
            showToast("Talabalarni yuklashda xatolik", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId, status) => {
        setAttendanceList(prev => ({ ...prev, [studentId]: status }));
    };

    const isAllMarked = students.length > 0 && Object.keys(attendanceList).length === students.length;

    const saveAttendance = async () => {
        if (!selectedClass || students.length === 0) return;
        
        const isConfirmed = window.confirm(`Diqqat! Siz ${currentDate} sanasi, ${currentPair ? currentPair + "-para" : "darsdan tashqari vaqt"} uchun davomat qilyapsiz. Saqlaysizmi?`);
        if (!isConfirmed) return;

        setSaving(true);
        try {
            const formattedList = students.map(s => ({
                studentId: s.id,
                name: s.name || s.fullName || "Noma'lum",
                status: attendanceList[s.id]
            }));

            await addDoc(collection(db, "attendance"), {
                groupId: selectedClass.id,
                groupName: selectedClass.name,
                subject: selectedClass.subject,
                teacherId: user.uid,
                date: currentDate,
                pair: currentPair || "Noma'lum", 
                records: formattedList,
                createdAt: serverTimestamp()
            });

            const absentStudents = formattedList.filter(s => s.status === 'absent').map(s => s.studentId);
            const lateStudents = formattedList.filter(s => s.status === 'late').map(s => s.studentId);

            if (absentStudents.length > 0) {
                await notificationsApi.sendNotification({
                    title: "Davomat: Darsda Yo'qsiz",
                    message: `Siz bugun (${currentDate}), ${selectedClass.subject} fanidan ${currentPair ? currentPair + "-para" : "dars"}ga qatnashmadingiz ("NB" qo'yildi).`,
                    targetRoles: absentStudents,
                    type: 'warning'
                });
            }

            if (lateStudents.length > 0) {
                await notificationsApi.sendNotification({
                    title: "Davomat: Kechikish",
                    message: `Siz bugun (${currentDate}), ${selectedClass.subject} faniga kechikib keldingiz. Iltimos keyingi darslarga vaqtida qatnashing.`,
                    targetRoles: lateStudents,
                    type: 'info'
                });
            }

            showToast("Davomat saqlandi va xabarnomalar yuborildi!");
            setSelectedClass(null); 
            setAttendanceList({});
        } catch (err) {
            console.error(err);
            showToast("Xatolik yuz berdi", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !selectedClass) {
        return <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
    }

    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            
            {toast && (
                <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[600] px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    {selectedClass && (
                        <button onClick={() => setSelectedClass(null)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:scale-105 transition-transform border border-slate-100 dark:border-slate-700">
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Davomat jurnali</h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                            {selectedClass ? `${selectedClass.name} guruhi uchun` : "O'zingizga biriktirilgan guruhni tanlang"}
                        </p>
                    </div>
                </div>

                {/* 🌟 YANGILANISH: Kalendar va Saqlash tugmasi bir qatorda */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    
                    {/* Avtomatik Sana va Para */}
                    <div className="w-full sm:w-auto flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">{currentDate}</span>
                            <span className="text-[9px] font-bold text-indigo-500/70 uppercase tracking-widest mt-0.5 leading-none">
                                {currentPair ? `${currentPair}-para darsi` : "Dars vaqti emas"}
                            </span>
                        </div>
                    </div>

                    {/* Saqlash tugmasi (Faqat barcha talabalar belgilangan bo'lsa va dars vaqti bo'lsa) */}
                    {selectedClass && (
                        <button
                            onClick={saveAttendance}
                            disabled={saving || !currentPair || !isAllMarked} 
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] shadow-md transition-all
                            ${(currentPair && isAllMarked) ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                        >
                            {saving ? <Spinner className="w-4 h-4 text-inherit" /> : <Save className="w-4 h-4 shrink-0" />}
                            {saving ? "Saqlanmoqda..." : !isAllMarked ? "Barchani belgilang" : !currentPair ? "Vaqti emas" : "Saqlash"}
                        </button>
                    )}
                </div>
            </div>

            {!selectedClass ? (
                classes.length === 0 ? (
                    <div className="py-20 text-center bg-white/60 dark:bg-slate-900/40 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5 shadow-sm">
                        <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Sizga biriktirilgan guruhlar topilmadi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {classes.map((cls) => (
                            <div key={cls.id} onClick={() => handleClassSelect(cls)} className="group cursor-pointer p-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[24px] hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col h-full">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{cls.name}</h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest line-clamp-1">{cls.subject}</p>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    <Card className="overflow-hidden border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-0 rounded-[24px] shadow-sm">
                        {loading ? (
                            <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-indigo-500 animate-spin" /></div>
                        ) : students.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bu guruhda talabalar mavjud emas</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-16 text-center">#</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Talaba F.I.SH</th>
                                            <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Davomat Holati</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {students.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 md:px-8 py-4 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <img src={student.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80"} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm" alt="avatar" />
                                                        <div>
                                                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{student.name || student.fullName || "Noma'lum"}</span>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{student.id.substring(0,6)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 md:px-8 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <StatusBtn active={attendanceList[student.id] === 'present'} onClick={() => toggleStatus(student.id, 'present')} icon={CheckCircle2} color="emerald" label="Keldi" />
                                                        <StatusBtn active={attendanceList[student.id] === 'absent'} onClick={() => toggleStatus(student.id, 'absent')} icon={XCircle} color="rose" label="Yo'q" />
                                                        <StatusBtn active={attendanceList[student.id] === 'late'} onClick={() => toggleStatus(student.id, 'late')} icon={Clock} color="amber" label="Kechikdi" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatusBtn({ active, onClick, icon: Icon, color, label }) {
    const colors = {
        emerald: active ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-md' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
        rose: active ? 'bg-rose-500 text-white ring-2 ring-rose-500/30 shadow-md' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20',
        amber: active ? 'bg-amber-500 text-white ring-2 ring-amber-500/30 shadow-md' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    };

    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${colors[color]}`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
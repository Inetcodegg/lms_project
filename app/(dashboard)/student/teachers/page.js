"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Search, Filter, Mail, Calendar, BookOpen,
    Star, GraduationCap, X, Loader2, Award, ExternalLink, User
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop";

export default function TeachersPage() {
    const { user } = useUser();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                setLoading(true);
                const q = query(collection(db, "users"), where("role", "==", "teacher"));
                const snap = await getDocs(q);
                setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    const filteredTeachers = useMemo(() => {
        if (!searchQuery) return teachers;
        const q = searchQuery.toLowerCase();
        return teachers.filter(t => 
            t.name?.toLowerCase().includes(q) || 
            t.department?.toLowerCase().includes(q) ||
            t.degree?.toLowerCase().includes(q) ||
            (t.subjects && t.subjects.some(s => s.toLowerCase().includes(q)))
        );
    }, [teachers, searchQuery]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-12">
                <div className="w-full xl:w-auto">
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">Universitet Professorlari</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        Barcha o'qituvchilarning ilmiy salohiyati va qabul jadvallari
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 w-full sm:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text" placeholder="Ism, fan yoki kafedra..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[32px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)
                ) : filteredTeachers.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px]">
                        <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Ma'lumot topilmadi</p>
                    </div>
                ) : (
                    filteredTeachers.map(teacher => (
                        <Card key={teacher.id} className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-[400px] group">
                            
                            <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-slate-800 shrink-0">
                                <img src={teacher.avatar || FALLBACK_AVATAR} onError={(e) => {e.target.onerror=null; e.target.src=FALLBACK_AVATAR}} alt={teacher.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                                <div className="absolute bottom-3 left-4">
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg flex items-center space-x-1.5 text-white border border-white/20 shadow-sm">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{teacher.degree || "O'qituvchi"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col min-h-0">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1 truncate">{teacher.name}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 truncate">{teacher.department || "Kafedra belgilanmagan"}</p>

                                <div className="flex flex-col gap-2 min-h-0 flex-1">
                                    <div className="flex gap-2 items-start">
                                        <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div className="flex flex-wrap gap-1 overflow-hidden">
                                            {teacher.subjects && teacher.subjects.length > 0 ? (
                                                teacher.subjects.slice(0,2).map((sub, i) => (
                                                    <span key={i} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-100 dark:border-transparent truncate max-w-full">{sub}</span>
                                                ))
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Fan kiritilmagan</span>
                                            )}
                                            {teacher.subjects?.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{teacher.subjects.length - 2}</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Line-clamp qilingan Bio qismi (Kartani katta qilib yubormaydi) */}
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-1">
                                        {teacher.bio || "O'qituvchi haqida qo'shimcha ma'lumot yo'q."}
                                    </p>
                                </div>

                                <button onClick={() => setSelectedTeacher(teacher)} className="w-full mt-3 py-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/10 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Batafsil Profil
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* 🌟 MUKAMMALLASHTIRILGAN BATAFSIL PROFIL MODALI */}
            {selectedTeacher && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setSelectedTeacher(null)}></div>
                    
                    <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden border border-white/10 animate-in zoom-in-95">
                        
                        {/* Chap tomon: Rasm va Asosiy info */}
                        <div className="w-full md:w-[35%] shrink-0 bg-slate-50 dark:bg-slate-800/50 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 relative">
                            <button onClick={() => setSelectedTeacher(null)} className="md:hidden absolute top-4 right-4 z-10 p-2 bg-black/20 text-white rounded-full backdrop-blur-sm"><X className="w-4 h-4" /></button>
                            
                            <div className="h-48 md:h-64 relative shrink-0">
                                <img src={selectedTeacher.avatar || FALLBACK_AVATAR} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                                <div className="absolute bottom-4 left-5 right-5">
                                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md inline-block mb-2">
                                        {selectedTeacher.degree || "O'qituvchi"}
                                    </span>
                                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{selectedTeacher.name}</h2>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-1"/> Kafedra / Fakultet</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedTeacher.department || "Kiritilmagan"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Mail className="w-3 h-3 mr-1"/> Email</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedTeacher.email || "Kiritilmagan"}</p>
                                </div>
                            </div>
                        </div>

                        {/* O'ng tomon: Bio, Fanlar va Sertifikatlar (Scrollable) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col gap-8 relative">
                            <button onClick={() => setSelectedTeacher(null)} className="hidden md:block absolute top-6 right-6 p-2 bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center"><User className="w-4 h-4 mr-2 text-indigo-500"/> O'qituvchi haqida</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {selectedTeacher.bio || "O'qituvchi haqida ma'lumot kiritilmagan."}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center"><BookOpen className="w-4 h-4 mr-2 text-emerald-500"/> Dars beradigan fanlari</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? (
                                        selectedTeacher.subjects.map((sub, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 text-[11px] font-black rounded-lg border border-indigo-100 dark:border-indigo-500/20">{sub}</span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold italic">Kiritilmagan</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center"><Award className="w-4 h-4 mr-2 text-amber-500"/> Sertifikat va Yutuqlar</h4>
                                {selectedTeacher.certificates && selectedTeacher.certificates.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedTeacher.certificates.map((cert, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/20 hover:border-amber-300 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Award className="w-4 h-4"/></div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate pr-2">{cert.title}</p>
                                                </div>
                                                {cert.url && (
                                                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sertifikatlar yuklanmagan</p>
                                    </div>
                                )}
                            </div>

                            {/* Qabulga Yozilish Tugmasi */}
                            {user?.role === 'student' && (
                                <div className="mt-auto pt-6">
                                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <Calendar className="w-4 h-4" /> Qabulga Yozilish (Tez Kunda)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
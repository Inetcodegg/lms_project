"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Trophy, Award, TrendingUp, Search, BookOpen,
    Filter, Star, Zap, Target, Book, LayoutGrid,
    ChevronUp, ChevronDown, Medal, Users, X, Loader2
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

// --- REYTING QATORI ---
const RankRow = ({ rank, student, isUser, onViewProfile }) => {
    const [imgSrc, setImgSrc] = useState(student.avatar || FALLBACK_AVATAR);

    return (
        <tr className={`group transition-all duration-300 ${isUser ? 'bg-indigo-50/80 dark:bg-indigo-500/10 shadow-sm relative z-10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
            <td className="py-4 md:py-6 pl-4 md:pl-8">
                <div className="flex items-center space-x-2 md:space-x-4">
                    <span className={`text-xs md:text-sm font-black ${rank <= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                        {rank.toString().padStart(2, '0')}
                    </span>
                    {rank === 1 && <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />}
                    {rank === 2 && <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />}
                    {rank === 3 && <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400" />}
                </div>
            </td>
            <td className="py-4 md:py-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="relative shrink-0">
                        <img 
                            src={imgSrc} 
                            onError={() => setImgSrc(FALLBACK_AVATAR)}
                            alt={student.name} 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm bg-slate-100" 
                        />
                        {isUser && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full"></div>}
                    </div>
                    <div>
                        <h4 className={`text-xs md:text-sm font-black tracking-tight line-clamp-1 ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{student.name} {isUser && "(Siz)"}</h4>
                        <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">ID: {student.id.substring(0,6)}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 md:py-6">
                <div className="flex items-center space-x-1.5 md:space-x-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500" />
                    <span>{student.totalScore} Ball</span>
                </div>
            </td>
            <td className="py-4 md:py-6 pr-4 md:pr-8 text-right">
                <button onClick={() => onViewProfile(student)} className="px-4 md:px-5 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 transition-all shadow-sm active:scale-95">
                    Profilni Ko'rish
                </button>
            </td>
        </tr>
    );
};

// --- ASOSIY SAHIFA ---
export default function StudentRankingsPage() {
    const { user } = useUser();
    
    // UI States
    const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'grades'
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [groupmates, setGroupmates] = useState([]);
    const [myGrades, setMyGrades] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('Barchasi');

    // Profile Modal
    const [selectedProfile, setSelectedProfile] = useState(null);

    useEffect(() => {
        const fetchGroupAndGrades = async () => {
            if (!user?.groupId) return;
            try {
                setLoading(true);

                // 1. Guruhdoshlarni tortish
                const usersQ = query(collection(db, "users"), where("groupId", "==", user.groupId));
                const usersSnap = await getDocs(usersQ);
                let studentsData = usersSnap.docs.map(d => ({ id: d.id, ...d.data(), totalScore: 0 }));

                // 2. Shu guruhdagi hamma baholarni tortish
                const gradesQ = query(collection(db, "grades"), where("groupId", "==", user.groupId));
                const gradesSnap = await getDocs(gradesQ);
                const allGrades = gradesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 3. Talabalarni baholari bo'yicha hisoblash
                studentsData = studentsData.map(student => {
                    const studentGrades = allGrades.filter(g => g.studentId === student.id);
                    const totalScore = studentGrades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
                    return { ...student, totalScore };
                });

                // Reyting bo'yicha sortlash (Kattadan kichikga)
                studentsData.sort((a, b) => b.totalScore - a.totalScore);
                
                // O'rinlarni (Rank) belgilash
                studentsData = studentsData.map((s, index) => ({ ...s, rank: index + 1 }));

                setGroupmates(studentsData);

                // 4. Mening baholarimni ajratib olish
                const mine = allGrades.filter(g => g.studentId === user.uid);
                mine.sort((a,b) => new Date(b.date) - new Date(a.date)); // Yangilari tepada
                setMyGrades(mine);

            } catch (error) {
                console.error("Xato:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupAndGrades();
    }, [user]);

    // Reyting qidiruv filtri
    const filteredRanking = useMemo(() => {
        return groupmates.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [groupmates, searchQuery]);

    // Baholar filtri (Fan bo'yicha)
    const uniqueSubjects = useMemo(() => {
        const subs = new Set(myGrades.map(g => g.subject));
        return ['Barchasi', ...Array.from(subs)];
    }, [myGrades]);

    const filteredGrades = useMemo(() => {
        if (selectedSubject === 'Barchasi') return myGrades;
        return myGrades.filter(g => g.subject === selectedSubject);
    }, [myGrades, selectedSubject]);

    // Joriy talabaning reytingdagi joyi
    const myStats = groupmates.find(s => s.id === user?.uid) || { rank: "-", totalScore: 0 };
    const topThree = filteredRanking.slice(0, 3);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32">

            {/* --- HEADER --- */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">Reyting va Baholar</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-4">
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Guruh: <span className="text-indigo-500 font-black">{user?.groupName || "Guruhingiz"}</span></span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Medal className="w-3.5 h-3.5 text-amber-500" />
                            <span>Guruhdagi o'rningiz: <span className="text-amber-500 font-black">#{myStats.rank}</span></span>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center w-full md:w-auto bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-[20px] p-1.5 shadow-sm">
                    <button onClick={() => setActiveTab('ranking')} className={`flex-1 md:flex-none px-6 py-3 rounded-[14px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ranking' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <Trophy className="w-4 h-4"/> Guruh Reytingi
                    </button>
                    <button onClick={() => setActiveTab('grades')} className={`flex-1 md:flex-none px-6 py-3 rounded-[14px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'grades' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <BookOpen className="w-4 h-4"/> Mening Baholarim
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="space-y-8 animate-in fade-in">
                    
                    {/* ================= TAB 1: GURUH REYTINGI ================= */}
                    {activeTab === 'ranking' && (
                        <>
                            {groupmates.length === 0 ? (
                                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest">Guruhingizda talabalar mavjud emas</p>
                                </div>
                            ) : (
                                <>
                                    {/* Top 3 Spotlight */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8 mb-8 md:mb-12">
                                        {topThree.map((student) => (
                                            <Card key={student.id} className={`p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 border border-white dark:border-white/5 rounded-3xl md:rounded-[40px] shadow-sm relative overflow-hidden flex flex-col items-center text-center transition-all ${student.rank === 1 ? 'sm:scale-105 border-t-4 border-t-amber-400 z-10 shadow-xl' : 'hover:-translate-y-2'}`}>
                                                <div className="relative mb-5 mt-2">
                                                    <img 
                                                        src={student.avatar || FALLBACK_AVATAR} 
                                                        onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                                        alt={student.name} 
                                                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-xl bg-slate-100" 
                                                    />
                                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 ${student.rank === 1 ? 'bg-amber-500' : 'bg-slate-900 dark:bg-indigo-600'} text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap`}>
                                                        # {student.rank}-o'rin
                                                    </div>
                                                </div>
                                                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight line-clamp-1 w-full">{student.name}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">ID: {student.id.substring(0,6)}</p>

                                                <div className="w-full pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-center">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jami Ball</p>
                                                        <p className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">{student.totalScore}</p>
                                                    </div>
                                                </div>
                                                {student.rank === 1 && <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-400/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>}
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Guruh Ro'yxati */}
                                    <Card className="p-0 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-3xl md:rounded-[40px] shadow-sm overflow-hidden">
                                        <div className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Guruh Reytingi</h2>
                                            <div className="relative group w-full md:w-80">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text" placeholder="Kursdoshni qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
                                            <table className="w-full text-left min-w-[600px]">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                                        <th className="py-5 pl-4 md:pl-8">O'rni</th>
                                                        <th className="py-5">Talaba</th>
                                                        <th className="py-5">Jami Ball</th>
                                                        <th className="py-5 pr-4 md:pr-8 text-right">Profil</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                    {filteredRanking.map((row) => (
                                                        <RankRow 
                                                            key={row.id} 
                                                            rank={row.rank} student={row} 
                                                            isUser={user?.uid === row.id} 
                                                            onViewProfile={setSelectedProfile} 
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </>
                            )}
                        </>
                    )}

                    {/* ================= TAB 2: MENING BAHOLARIM ================= */}
                    {activeTab === 'grades' && (
                        <div className="space-y-6">
                            
                            {/* Fanlar Filtri */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {uniqueSubjects.map(subject => (
                                    <button
                                        key={subject} onClick={() => setSelectedSubject(subject)}
                                        className={`px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedSubject === subject ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50'}`}
                                    >
                                        {subject === 'Barchasi' ? <LayoutGrid className="w-4 h-4 inline mr-2 -mt-0.5"/> : <Book className="w-4 h-4 inline mr-2 -mt-0.5"/>}
                                        {subject}
                                    </button>
                                ))}
                            </div>

                            {/* Baholar Ro'yxati */}
                            {filteredGrades.length === 0 ? (
                                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                                    <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Hozircha baholar yo'q</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredGrades.map(grade => (
                                        <Card key={grade.id} className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-3xl hover:shadow-lg transition-all flex flex-col group">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    {grade.subject}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">{grade.date || "Yaqinda"}</span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">{grade.taskTitle || "Vazifa/Imtihon"}</h3>
                                            
                                            <div className="mt-auto pt-6 flex items-end justify-between border-t border-slate-50 dark:border-white/5">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Olingan Ball</p>
                                                    <div className="flex items-end gap-1 text-emerald-500">
                                                        <span className="text-3xl font-black leading-none">{grade.score}</span>
                                                        <span className="text-xs font-bold mb-1">/{grade.maxScore || 100}</span>
                                                    </div>
                                                </div>
                                                {grade.teacherName && (
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">O'qituvchi</p>
                                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{grade.teacherName}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ================= BOSHQA TALABA PROFILI MODALI ================= */}
            {selectedProfile && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedProfile(null)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 flex flex-col items-center text-center">
                        <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        
                        <div className="relative mb-6 mt-4">
                            <img 
                                src={selectedProfile.avatar || FALLBACK_AVATAR} 
                                onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                alt={selectedProfile.name} 
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-lg" 
                            />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                                #{selectedProfile.rank}
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{selectedProfile.name}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedProfile.id.substring(0,8)}</p>

                        <div className="w-full mt-8 p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">To'plagan Balli</p>
                            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
                                <Zap className="w-6 h-6"/> {selectedProfile.totalScore}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
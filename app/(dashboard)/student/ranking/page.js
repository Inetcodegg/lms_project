"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Trophy, Award, Search, BookOpen, Star, Zap, 
    ChevronRight, Medal, Users, X, Loader2, Target, TrendingUp, TrendingDown, Info, CheckCircle2, XCircle, MessageSquare
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

// --- 🌟 MATRIX GRADING BALLARINI HISOBLASH MANTIG'I ---
const getGradeInfo = (scoreCode) => {
    if (!scoreCode) return { label: 'KUTILMOQDA', pts: 0, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', icon: Star };
    
    const code = String(scoreCode).toLowerCase();
    if (code.includes('distinction') || code === '5') return { label: 'DISTINCTION', pts: 150, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icon: Award };
    if (code.includes('merit') || code === '4') return { label: 'MERIT', pts: 100, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: Zap };
    if (code.includes('pass') || code === '3') return { label: 'PASS', pts: 50, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: CheckCircle2 };
    if (code.includes('fail') || code === '2' || code === '1') return { label: 'FAIL', pts: -5, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icon: XCircle };
    
    return { label: 'KUTILMOQDA', pts: 0, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', icon: Star };
};

// --- IXCHAM REYTING QATORI ---
const RankRow = ({ rank, student, isUser, onViewProfile }) => {
    const [imgSrc, setImgSrc] = useState(student.avatar || FALLBACK_AVATAR);

    return (
        <div className={`relative overflow-hidden flex items-center justify-between p-3 md:p-3.5 rounded-2xl md:rounded-[20px] border transition-all duration-300 group
            ${isUser 
                ? 'bg-indigo-50/90 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-500/10 z-10' 
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/20'
            }`}
        >
            {isUser && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-[20px]"></div>}

            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 pl-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-[10px] md:text-sm
                    ${rank === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 shadow-inner' : 
                      rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 
                      rank === 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20' : 
                      'bg-slate-50 text-slate-400 dark:bg-slate-800/80'}`}
                >
                    {rank === 1 ? <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4" /> : 
                     rank === 2 ? <Award className="w-3.5 h-3.5 md:w-4 md:h-4" /> : 
                     rank === 3 ? <Award className="w-3.5 h-3.5 md:w-4 md:h-4" /> : 
                     `#${rank}`}
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <img 
                            src={imgSrc} onError={() => setImgSrc(FALLBACK_AVATAR)} alt={student.name} 
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full md:rounded-[14px] object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm" 
                        />
                        {isUser && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>}
                    </div>
                    <div className="min-w-0">
                        <h4 className={`text-xs md:text-sm font-black tracking-tight truncate ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                            {student.name} {isUser && <span className="text-[9px] font-bold opacity-70 ml-1">(Siz)</span>}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">ID: {student.id.substring(0,8)}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5 shrink-0 pr-1">
                <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border ${student.growth >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>
                    {student.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-[10px] font-black">{student.growth > 0 ? '+' : ''}{student.growth}%</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="hidden sm:block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jami PTS</span>
                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className={`text-sm md:text-base font-black leading-none ${student.totalScore < 0 ? 'text-rose-500' : ''}`}>{student.totalScore}</span>
                    </div>
                    <span className={`sm:hidden text-[9px] font-black mt-1 ${student.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {student.growth > 0 ? '+' : ''}{student.growth}%
                    </span>
                </div>

                <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 hidden sm:block mx-1"></div>

                <button onClick={() => onViewProfile(student)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors shadow-sm group-hover:scale-105 active:scale-95">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default function StudentRankingsPage() {
    const { user } = useUser();
    
    const [activeTab, setActiveTab] = useState('ranking'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [groupmates, setGroupmates] = useState([]);
    const [myGrades, setMyGrades] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('Barchasi');

    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const fetchDataSafely = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);

                let studentsData = [];
                let allGrades = [];
                let allAssignments = [];

                // 1. Tizimdagi Assignmentlarni tortish
                const assignQueries = [];
                if (user.groupId) assignQueries.push(getDocs(query(collection(db, "assignments"), where("targetId", "==", user.groupId))));
                assignQueries.push(getDocs(query(collection(db, "assignments"), where("targetId", "==", user.uid))));

                const assignSnaps = await Promise.all(assignQueries);
                assignSnaps.forEach(snap => {
                    snap.docs.forEach(d => allAssignments.push({ id: d.id, ...d.data() }));
                });
                allAssignments = Array.from(new Set(allAssignments.map(a => a.id))).map(id => allAssignments.find(a => a.id === id));

                // 2. Talabalar va Baholarni o'qish
                if (user.groupId) {
                    const usersSnap = await getDocs(query(collection(db, "users"), where("groupId", "==", user.groupId), where("role", "==", "student")));
                    studentsData = usersSnap.docs.map(d => ({ id: d.id, ...d.data(), totalScore: 0, growth: 0 }));

                    const studentIds = studentsData.map(s => s.id);
                    if (studentIds.length > 0) {
                        const chunks = [];
                        for (let i = 0; i < studentIds.length; i += 10) { chunks.push(studentIds.slice(i, i + 10)); }
                        for (const chunk of chunks) {
                            const gSnap = await getDocs(query(collection(db, "grades"), where("studentId", "in", chunk)));
                            gSnap.docs.forEach(d => allGrades.push({ id: d.id, ...d.data() }));
                        }
                    }
                } else {
                    studentsData = [{ id: user.uid, name: user.name, avatar: user.avatar, totalScore: 0, growth: 0 }];
                    const myGradesSnap = await getDocs(query(collection(db, "grades"), where("studentId", "==", user.uid)));
                    allGrades = myGradesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                }

                // 3. O'QITUVCHILAR BAZASI
                const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
                const allTeachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 4. Baholarni PTS larga o'tkazish
                studentsData = studentsData.map(student => {
                    const studentGrades = allGrades.filter(g => g.studentId === student.id);
                    const totalScore = studentGrades.reduce((sum, g) => sum + getGradeInfo(g.score).pts, 0);
                    
                    let simulatedGrowth = 0;
                    if (totalScore > 0) simulatedGrowth = Math.round((totalScore % 15) + 2);
                    else if (totalScore < 0) simulatedGrowth = -Math.round(Math.abs(totalScore % 5) + 1);

                    return { ...student, totalScore, growth: simulatedGrowth };
                });

                studentsData.sort((a, b) => b.totalScore - a.totalScore);
                studentsData = studentsData.map((s, index) => ({ ...s, rank: index + 1 }));
                setGroupmates(studentsData);

                // 5. 🌟 MENING BAHOLARIM JADVALINI TO'LIQ BIRIKTIRISH
                const mine = allGrades.filter(g => g.studentId === user.uid);
                
                const enrichedGrades = mine.map(g => {
                    const assign = allAssignments.find(a => a.id === g.assignmentId) || {};
                    const teacher = allTeachers.find(t => t.id === g.teacherId) || {};
                    
                    let teacherSubject = "Baholangan Topshiriq";
                    if (teacher.subject && Array.isArray(teacher.subject) && teacher.subject.length > 0) teacherSubject = teacher.subject[0];
                    else if (typeof teacher.subject === 'string') teacherSubject = teacher.subject;
                    else if (teacher.department) teacherSubject = teacher.department;

                    return {
                        ...g,
                        subject: assign.subject || g.subject || teacherSubject,
                        teacherName: assign.name || teacher.name || "Noma'lum Ustoz",
                        taskTitle: assign.title || g.taskTitle || "Mustaqil Ish",
                        date: g.updatedAt?.toDate ? g.updatedAt.toDate() : new Date(g.updatedAt || g.date || Date.now())
                    };
                });
                
                enrichedGrades.sort((a,b) => b.date - a.date); 
                setMyGrades(enrichedGrades);

            } catch (error) {
                console.error("Xato yuz berdi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDataSafely();
    }, [user]);

    const filteredRanking = useMemo(() => {
        return groupmates.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [groupmates, searchQuery]);

    const uniqueSubjects = useMemo(() => {
        const subs = new Set(myGrades.map(g => g.subject || "Fan"));
        return ['Barchasi', ...Array.from(subs)];
    }, [myGrades]);

    const filteredGrades = useMemo(() => {
        if (selectedSubject === 'Barchasi') return myGrades;
        return myGrades.filter(g => (g.subject || "Fan") === selectedSubject);
    }, [myGrades, selectedSubject]);

    const myStats = groupmates.find(s => s.id === user?.uid) || { rank: "-", totalScore: 0 };

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-32">

            {/* --- HEADER --- */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Reyting va Baholar</h1>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-md flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            <Users className="w-3 h-3" />
                            <span>{user?.groupName || "Guruh"}</span>
                        </div>
                        <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-md flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                            <Medal className="w-3 h-3" />
                            <span>Guruhda: #{myStats.rank}</span>
                        </div>
                    </div>
                </div>

                <div className="flex p-1 w-full md:w-auto bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl shadow-inner">
                    <button onClick={() => setActiveTab('ranking')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ranking' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Trophy className="w-3.5 h-3.5"/> Reyting
                    </button>
                    <button onClick={() => setActiveTab('grades')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'grades' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <BookOpen className="w-3.5 h-3.5"/> Baholarim
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
                    
                    {/* ================= TAB 1: GURUH REYTINGI ================= */}
                    {activeTab === 'ranking' && (
                        <Card className="p-4 md:p-5 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-[24px] md:rounded-[32px] shadow-sm">
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white px-2">Umumiy Ro'yxat</h2>
                                    
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowGuide(!showGuide)}
                                            className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm ring-2 ring-indigo-500/20"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>
                                        
                                        {showGuide && (
                                            <div className="absolute top-10 left-0 md:left-auto md:right-0 w-56 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Trophy className="w-3 h-3"/> Matrix Grading</h4>
                                                    <button onClick={() => setShowGuide(false)} className="p-1 text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5"/></button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-1.5 rounded">Distinction</span> <span>+150 PTS</span></div>
                                                    <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 rounded">Merit</span> <span>+100 PTS</span></div>
                                                    <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 rounded">Pass</span> <span>+50 PTS</span></div>
                                                    <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 rounded">Fail</span> <span className="text-rose-500">-5 PTS</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text" placeholder="Ism bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                {filteredRanking.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[20px]">
                                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Talabalar topilmadi</p>
                                    </div>
                                ) : (
                                    filteredRanking.map((row) => (
                                        <RankRow 
                                            key={row.id} rank={row.rank} student={row} 
                                            isUser={user?.uid === row.id} 
                                            onViewProfile={setSelectedProfile} 
                                        />
                                    ))
                                )}
                            </div>
                        </Card>
                    )}

                    {/* ================= TAB 2: MENING BAHOLARIM (IXCHAM JADVAL / TABLE VIEW) ================= */}
                    {activeTab === 'grades' && (
                        <div className="space-y-4 animate-in slide-in-from-right-6 duration-500">
                            
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 custom-scrollbar">
                                {uniqueSubjects.map(subject => (
                                    <button
                                        key={subject} onClick={() => setSelectedSubject(subject)}
                                        className={`px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm
                                        ${selectedSubject === subject 
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20' 
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
                                    >
                                        {subject === 'Barchasi' ? <Target className="w-3.5 h-3.5"/> : <BookOpen className="w-3.5 h-3.5"/>}
                                        {subject}
                                    </button>
                                ))}
                            </div>

                            {filteredGrades.length === 0 ? (
                                <div className="py-16 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px]">
                                    <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Hozircha baholar yo'q</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fan va O'qituvchi</th>
                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Topshiriq va Sana</th>
                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Natija (Matrix)</th>
                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">O'qituvchi Izohi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {filteredGrades.map(grade => {
                                                    const gradeDetails = getGradeInfo(grade.score);
                                                    const GradeIcon = gradeDetails.icon;
                                                    const dateStr = grade.date.toLocaleDateString();

                                                    return (
                                                        <tr key={grade.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${gradeDetails.bg} ${gradeDetails.border} ${gradeDetails.color}`}>
                                                                        <BookOpen className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0 max-w-[220px]">
                                                                        <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                                                            {grade.subject}
                                                                        </h4>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                                                            Ustoz: {grade.teacherName}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="min-w-0 max-w-[200px]">
                                                                    <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight truncate mb-1">
                                                                        {grade.taskTitle}
                                                                    </h4>
                                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded whitespace-nowrap">
                                                                        {dateStr}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-center">
                                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${gradeDetails.bg} ${gradeDetails.color} ${gradeDetails.border}`}>
                                                                        <GradeIcon className="w-3.5 h-3.5" />
                                                                        {gradeDetails.label}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 min-w-[200px]">
                                                                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                    <MessageSquare className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                                                                    <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                                                                        {grade.comment ? `"${grade.comment}"` : "Izoh qoldirilmagan."}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ================= BOSHQA TALABA PROFILI MODALI ================= */}
            {selectedProfile && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedProfile(null)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 animate-in zoom-in-95 flex flex-col items-center text-center border border-white/10">
                        <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-4 h-4"/></button>
                        
                        <div className="relative mb-5 mt-2">
                            <img 
                                src={selectedProfile.avatar || FALLBACK_AVATAR} onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}} alt={selectedProfile.name} 
                                className="w-20 h-20 rounded-[20px] object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-xl" 
                            />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-md border-2 border-white dark:border-slate-900">
                                #{selectedProfile.rank}
                            </div>
                        </div>

                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">{selectedProfile.name}</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Talaba ID: {selectedProfile.id.substring(0,8)}</p>

                        <div className="w-full mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jami PTS</span>
                                <span className={`text-lg font-black flex items-center gap-1 ${selectedProfile.totalScore < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    <Zap className="w-4 h-4"/> {selectedProfile.totalScore}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">O'sish</span>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black ${selectedProfile.growth >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                    {selectedProfile.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {selectedProfile.growth > 0 ? '+' : ''}{selectedProfile.growth}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
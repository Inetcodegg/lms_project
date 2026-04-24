"use client";
import React, { useState, useEffect } from "react";
import { 
    CalendarDays, CheckCircle2, XCircle, Clock, 
    AlertCircle, Activity, BookOpen, ShieldAlert, Loader2,
    ChevronLeft, ChevronRight, TrendingUp
} from "lucide-react";
import Card from "../../../../components/Card";
import { db } from "../../../../lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

const DAYS_SHORT = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

export default function StudentAttendancePage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    
    // Ma'lumotlar
    const [attendanceData, setAttendanceData] = useState([]);
    const [subjectStats, setSubjectStats] = useState({}); 
    const [overallStats, setOverallStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

    // Kalendar uchun
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);
                const q = query(collection(db, "attendance"));
                const snap = await getDocs(q);
                
                const allRecords = [];
                const statsBySubject = {};
                const overall = { present: 0, absent: 0, late: 0, total: 0 };

                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const myRecord = data.records?.find(r => r.studentId === user.uid);
                    
                    if (myRecord) {
                        const recordInfo = {
                            id: doc.id,
                            date: data.date,
                            subject: data.subject || "Umumiy",
                            status: myRecord.status,
                            pair: data.pair || "1"
                        };
                        allRecords.push(recordInfo);

                        overall.total++;
                        overall[myRecord.status]++;

                        if (!statsBySubject[recordInfo.subject]) {
                            statsBySubject[recordInfo.subject] = { present: 0, absent: 0, late: 0, total: 0 };
                        }
                        statsBySubject[recordInfo.subject].total++;
                        statsBySubject[recordInfo.subject][myRecord.status]++;
                    }
                });

                allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                setAttendanceData(allRecords);
                setSubjectStats(statsBySubject);
                setOverallStats(overall);

            } catch (err) {
                console.error("Xato:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user]);

    // Ranglar logikasi (75% limit)
    const getPercentageColor = (percentage) => {
        if (percentage >= 85) return 'text-emerald-500';
        if (percentage >= 75) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getBgColor = (percentage) => {
        if (percentage >= 85) return 'bg-emerald-500';
        if (percentage >= 75) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getStatusColor = (status) => {
        if (status === 'present') return 'bg-emerald-500';
        if (status === 'late') return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getStatusText = (status) => {
        if (status === 'present') return 'Keldi';
        if (status === 'late') return 'Kechikdi';
        return "Yo'q";
    };

    const overallPercentage = overallStats.total > 0 
        ? Math.round((overallStats.present + (overallStats.late * 0.5)) / overallStats.total * 100) 
        : 100;

    // Kalendar hisob kitoblari
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Dushanbadan boshlash

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    if (loading) {
        return <div className="min-h-screen flex justify-center pt-32"><Spinner className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
    }

    // Statistika Arrayi (Ticker uchun)
    const statsArray = Object.entries(subjectStats).map(([subj, stats]) => ({
        subject: subj,
        percent: Math.round((stats.present + (stats.late * 0.5)) / stats.total * 100)
    }));

    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 overflow-hidden">
            
            {/* 🌟 ANIMATSION TICKER (News style) */}
            {statsArray.length > 0 && (
                <div className="w-full bg-slate-900 text-white py-2.5 px-4 rounded-2xl mb-8 flex items-center shadow-lg relative overflow-hidden">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/20 z-10 bg-slate-900 shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Jonli Statistika:</span>
                    </div>
                    
                    {/* Ticker Container */}
                    <div className="flex-1 overflow-hidden whitespace-nowrap relative ml-4">
                        <div className="inline-block animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
                            {/* Original */}
                            {statsArray.map((stat, i) => (
                                <span key={`a-${i}`} className="inline-flex items-center mx-6">
                                    <span className="text-xs font-bold text-slate-300 mr-2">{stat.subject}:</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getPercentageColor(stat.percent)} bg-white/10`}>{stat.percent}%</span>
                                </span>
                            ))}
                            {/* Duplicate (Uzluksiz aylanishi uchun) */}
                            {statsArray.map((stat, i) => (
                                <span key={`b-${i}`} className="inline-flex items-center mx-6">
                                    <span className="text-xs font-bold text-slate-300 mr-2">{stat.subject}:</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getPercentageColor(stat.percent)} bg-white/10`}>{stat.percent}%</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-8">
                <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Mening Davomatim</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Analitik va statistik kuzatuv panelingiz
                </p>
            </header>

            {/* UMUMIY STATISTIKA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className={`p-6 flex flex-col justify-center items-center border-b-4 bg-white/60 dark:bg-slate-900/60 shadow-sm ${overallPercentage >= 75 ? 'border-b-emerald-500' : 'border-b-rose-500'}`}>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Umumiy Ko'rsatkich</h3>
                    <div className={`text-4xl md:text-5xl font-black ${getPercentageColor(overallPercentage)}`}>{overallPercentage}%</div>
                    {overallPercentage < 75 && (
                        <span className="text-[9px] font-bold text-rose-500 flex items-center mt-3 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded">
                            <ShieldAlert className="w-3 h-3 mr-1"/> Xavf chegarasi
                        </span>
                    )}
                </Card>

                <Card className="p-6 flex flex-col justify-between bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4"/> Qatnashdi (Present)
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-4">{overallStats.present} <span className="text-sm text-slate-400">marta</span></div>
                </Card>

                <Card className="p-6 flex flex-col justify-between bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        <Clock className="w-4 h-4"/> Kechikdi (Late)
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-4">{overallStats.late} <span className="text-sm text-slate-400">marta</span></div>
                </Card>

                <Card className="p-6 flex flex-col justify-between bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                        <XCircle className="w-4 h-4"/> Qoldirdi (Absent)
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-4">{overallStats.absent} <span className="text-sm text-slate-400">marta</span></div>
                </Card>
            </div>

            {/* DAVOMAT MATRITSASI (Kichik Kalendar) */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-indigo-500"/> Davomat Matritsasi</h2>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-100 dark:border-white/5 shadow-sm">
                        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2">{new Intl.DateTimeFormat('uz-UZ', { month: 'long', year: 'numeric' }).format(currentMonth)}</span>
                        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                </div>

                <Card className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="grid grid-cols-7 gap-2 md:gap-4 text-center mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {DAYS_SHORT.map(d => <div key={d} className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2 md:gap-4 pt-2">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2"></div>)}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const dayRecords = attendanceData.filter(r => r.date === dateStr);
                            const isToday = dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <div key={day} className="relative group">
                                    <div className={`flex flex-col items-center justify-start p-2 min-h-[60px] md:min-h-[80px] rounded-xl md:rounded-2xl transition-all border shadow-sm ${isToday ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30' : 'bg-slate-50 border-slate-100 dark:border-slate-800 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 z-10'} cursor-pointer`}>
                                        <span className={`text-xs md:text-sm font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                                        
                                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                                            {dayRecords.map((r, idx) => (
                                                <span key={idx} className={`w-2 h-2 rounded-full ${getStatusColor(r.status)} shadow-sm`}></span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tooltip Hover */}
                                    {dayRecords.length > 0 && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-56 md:w-64 bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 pointer-events-none border border-white/10">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                                                <span>{dateStr}</span>
                                                <span className="text-indigo-400">{dayRecords.length} ta dars</span>
                                            </div>
                                            <div className="space-y-3">
                                                {dayRecords.map((r, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-start text-xs">
                                                            <span className="font-bold pr-2 flex-1 leading-tight line-clamp-2">{r.subject}</span>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm shrink-0 ${r.status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : r.status === 'late' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                                {getStatusText(r.status)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{r.pair}-para darsi</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 dark:bg-slate-800 border-b border-r border-white/10 rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* FANLAR KESIMIDA STATISTIKA */}
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-500"/> Fanlar bo'yicha tahlil</h2>
                    
                    {Object.keys(subjectStats).length === 0 ? (
                        <div className="p-10 text-center bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 text-slate-400 font-bold text-xs shadow-sm">Sizda hali davomat yozuvlari shakllanmagan.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(subjectStats).map(([subject, stats]) => {
                                const percentage = Math.round((stats.present + (stats.late * 0.5)) / stats.total * 100);
                                return (
                                    <Card key={subject} className="p-5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-white/5 hover:shadow-lg transition-all shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase leading-tight line-clamp-1 pr-4">{subject}</h3>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${getPercentageColor(percentage)} bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                        
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden flex shadow-inner">
                                            <div className={`${getBgColor(percentage)} h-full rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                                            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500"/> {stats.present}</span>
                                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500"/> {stats.late}</span>
                                            <span className="flex items-center"><XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500"/> {stats.absent}</span>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* TARIX (Ro'yxat ko'rinishida) */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-indigo-500"/> So'nggi Harakatlar</h2>
                    
                    <Card className="p-0 overflow-hidden border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm h-[400px] flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            {attendanceData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">Tarix bo'sh</div>
                            ) : (
                                <div className="space-y-2">
                                    {attendanceData.map((record, index) => (
                                        <div key={index} className="p-4 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-between hover:shadow-md transition-all border border-slate-100 dark:border-slate-700">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase line-clamp-1">{record.subject}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 tracking-widest">{record.date}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-[9px] font-bold text-indigo-400 tracking-widest">{record.pair}-para</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                                    record.status === 'present' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                                                    record.status === 'absent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' :
                                                    'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                                }`}>
                                                    {getStatusText(record.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
"use client";
import React, { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import { 
    CalendarDays, Loader2, Clock, MapPin, Users, BookOpen, LayoutGrid, List
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const PAIRS = [
    { id: 1, time: "09:00 - 10:20" }, { id: 2, time: "10:30 - 11:50" },
    { id: 3, time: "12:00 - 13:20" }, { id: 4, time: "13:30 - 14:50" },
    { id: 5, time: "15:00 - 16:20" }, { id: 6, time: "16:30 - 17:50" },
];

export default function TeacherSchedulePage() {
    const { user } = useUser();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' yoki 'list'

    useEffect(() => {
        const fetchMySchedule = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);
                // MUHIM: Faqat shu o'qituvchiga tegishli darslarni tortamiz!
                const q = query(collection(db, "schedules"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setSchedules(data);
            } catch (error) {
                console.error("Jadvalni yuklashda xato:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMySchedule();
    }, [user]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-[36px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Mening Jadvalim</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <BookOpen className="w-3.5 h-3.5 mr-1 text-emerald-500" /> 
                        {user?.subject || "Faningiz"} bo'yicha darslar
                    </p>
                </div>

                <div className="flex items-center bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-1 w-full sm:w-auto shadow-sm">
                    <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none p-2.5 px-6 rounded-xl transition-all flex items-center justify-center text-xs font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                        <LayoutGrid className="w-4 h-4 mr-2" /> Matritsa
                    </button>
                    <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none p-2.5 px-6 rounded-xl transition-all flex items-center justify-center text-xs font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                        <List className="w-4 h-4 mr-2" /> Ro'yxat
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-emerald-500 animate-spin" /></div>
            ) : schedules.length === 0 ? (
                <div className="py-20 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sizda hozircha dars yo'q</p>
                </div>
            ) : (
                <>
                    {/* MATRITSA (GRID) */}
                    {viewMode === 'grid' && (
                        <div className="overflow-x-auto pb-4">
                            <div className="min-w-[900px] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/40">
                                <div className="grid grid-cols-7 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/5">
                                    <div className="p-4 text-center border-r border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock className="w-4 h-4 mx-auto mb-1"/> Vaqt</div>
                                    {DAYS.map(day => <div key={day} className="p-4 text-center border-r border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{day}</div>)}
                                </div>
                                
                                {PAIRS.map(pair => (
                                    <div key={pair.id} className="grid grid-cols-7 border-b border-slate-200/50 dark:border-white/5 last:border-0">
                                        <div className="p-4 flex flex-col justify-center items-center border-r border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/10">
                                            <span className="text-[10px] font-black text-emerald-500">{pair.id}-para</span>
                                            <span className="text-[9px] font-bold text-slate-400">{pair.time}</span>
                                        </div>
                                        
                                        {DAYS.map(day => {
                                            const cell = schedules.find(s => s.day === day && Number(s.pair) === pair.id);
                                            return (
                                                <div key={`${day}-${pair.id}`} className={`p-2 min-h-[90px] border-r border-slate-200/50 dark:border-white/5 last:border-0 ${cell ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''}`}>
                                                    {cell && (
                                                        <div className="h-full bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 shadow-sm relative">
                                                            <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-[9px] font-black rounded text-slate-500">{cell.room}</span>
                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight mb-2 pr-6">{cell.subject}</p>
                                                            <p className="text-[9px] font-bold text-slate-500 flex items-center mt-auto">
                                                                <Users className="w-3 h-3 mr-1 text-indigo-500"/> {cell.group}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RO'YXAT (LIST) */}
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schedules.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)).map(s => {
                                const pairInfo = PAIRS.find(p => p.id === Number(s.pair));
                                return (
                                    <Card key={s.id} className="p-5 border-l-4 border-l-emerald-500">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                                <Users className="w-3 h-3 mr-1" /> {s.group}
                                            </div>
                                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" /> {s.room}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 line-clamp-1">{s.subject}</h3>
                                        <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                                            <Clock className="w-4 h-4 mr-2 text-emerald-500" />
                                            {s.day}, {s.pair}-para ({pairInfo?.time})
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
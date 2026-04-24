"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../../../../lib/UserContext";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { 
    ChevronLeft, ChevronRight, Clock, MapPin, User, Users,
    CheckCircle2, Plus, Loader2, X, Trash2,
    Book, Dumbbell, Coffee, Music, Monitor, Code, Moon, ShoppingCart, 
    Phone, Video, Heart, Activity, Briefcase, Camera, Mic, Map, Plane, 
    Tv, Gamepad2, Utensils, Zap, BookOpen, Laptop, GraduationCap
} from "lucide-react";

// --- 20+ MAXSUS IKONKALAR ---
const ICONS_MAP = {
    Book, Dumbbell, Coffee, Music, Monitor, Code, Moon, ShoppingCart, 
    Phone, Video, Heart, Activity, Briefcase, Camera, Mic, Map, Plane, 
    Tv, Gamepad2, Utensils, Zap, BookOpen, Laptop, GraduationCap
};

// --- CHIROYLI RANGLAR PALITRASI ---
const COLOR_PALETTE = [
    "bg-indigo-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", 
    "bg-rose-500", "bg-pink-500", "bg-purple-500", "bg-cyan-500", "bg-teal-500", "bg-orange-500"
];

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

const PAIRS_MAPPING = {
    1: { startH: 9, startM: 0, endH: 10, endM: 20 },
    2: { startH: 10, startM: 30, endH: 11, endM: 50 },
    3: { startH: 12, startM: 0, endH: 13, endM: 20 },
    4: { startH: 13, startM: 30, endH: 14, endM: 50 },
    5: { startH: 15, startM: 0, endH: 16, endM: 20 },
    6: { startH: 16, startM: 30, endH: 17, endM: 50 },
};

const getColors = (idString) => {
    const colors = [
        "bg-[#C4B5FD] text-[#312E81] border-[#A78BFA]", 
        "bg-[#D9F99D] text-[#3F6212] border-[#BEF264]", 
        "bg-[#93C5FD] text-[#1E3A8A] border-[#60A5FA]", 
        "bg-[#FCD34D] text-[#78350F] border-[#FBBF24]", 
        "bg-[#F9A8D4] text-[#831843] border-[#F472B6]"
    ];
    let sum = 0;
    if (idString) {
        for (let i = 0; i < idString.length; i++) sum += idString.charCodeAt(i);
    }
    return colors[sum % colors.length];
};

export default function SchedulePage() {
    const { user } = useUser();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleType, setScheduleType] = useState('academic'); 
    
    const [academicData, setAcademicData] = useState([]);
    const [personalData, setPersonalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [now, setNow] = useState(new Date());

    const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
    const [personalForm, setPersonalForm] = useState({
        title: "", day: "Dushanba", start: "09:00", end: "10:00", icon: "Activity", color: "bg-indigo-500"
    });

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            let academicQuery;
            if (user.role === 'student' && user.groupId) {
                academicQuery = query(collection(db, "schedules"), where("groupId", "==", user.groupId));
            } else if (user.role === 'teacher') {
                academicQuery = query(collection(db, "schedules"), where("teacherId", "==", user.id || user.uid));
            }
            if (academicQuery) {
                const snap = await getDocs(academicQuery);
                setAcademicData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            const personalQuery = query(collection(db, "personal_schedules"), where("userId", "==", user.uid));
            const pSnap = await getDocs(personalQuery);
            setPersonalData(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let firstDay = new Date(currentYear, currentMonth, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    
    const isTodayCal = (day) => {
        const today = new Date();
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const getWeekDays = (date) => {
        const current = new Date(date);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(current.setDate(diff));
        
        const week = [];
        for (let i = 0; i < 7; i++) { 
            const weekDay = new Date(monday);
            weekDay.setDate(monday.getDate() + i);
            week.push({
                date: weekDay,
                name: DAYS[i].substring(0, 3),
                number: String(weekDay.getDate()).padStart(2, '0'),
                fullDayName: DAYS[i],
                key: weekDay.getTime()
            });
        }
        return week;
    };

    const activeWeek = getWeekDays(currentDate);
    const prevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    const nextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    const goToToday = () => setCurrentDate(new Date());

    // --- SOATLAR VA MATRITSA HISOBI ---
    const ROW_HEIGHT = 60; 
    
    // Akademik (8:00 dan 18:00 gacha), Personal (0:00 dan 23:00 gacha)
    const ACADEMIC_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); 
    const PERSONAL_HOURS = Array.from({ length: 24 }, (_, i) => i);
    const HOURS = scheduleType === 'academic' ? ACADEMIC_HOURS : PERSONAL_HOURS;
    const START_HOUR = HOURS[0];
    
    // Gridning aniq balandligini hisoblash (ortiqcha joyni kesish uchun)
    // Nechta soat bo'lsa shuncha * ROW_HEIGHT. Unga Header balandligi (taxminan 60px) ham qo'shiladi.
    const TOTAL_GRID_HEIGHT = (HOURS.length * ROW_HEIGHT) + 60; 

    const getPositionAcademic = (pairId) => {
        const time = PAIRS_MAPPING[pairId];
        if (!time) return { top: 0, height: 0 };
        const startDiffMins = (time.startH - START_HOUR) * 60 + time.startM;
        const durationMins = (time.endH * 60 + time.endM) - (time.startH * 60 + time.startM);
        return { top: (startDiffMins / 60) * ROW_HEIGHT, height: (durationMins / 60) * ROW_HEIGHT };
    };

    const getPositionPersonal = (start, end) => {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startDiffMins = (startH - START_HOUR) * 60 + startM;
        const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
        return { top: (startDiffMins / 60) * ROW_HEIGHT, height: (durationMins / 60) * ROW_HEIGHT };
    };

    const currentTimeTop = ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) / 60 * ROW_HEIGHT;
    const isCurrentTimeVisible = now.getHours() >= START_HOUR && now.getHours() <= HOURS[HOURS.length - 1];

    const handleGridClick = (dayObj, hour) => {
        if (scheduleType === 'academic') return; 
        
        setPersonalForm({
            ...personalForm,
            day: dayObj.fullDayName,
            start: `${String(hour).padStart(2, '0')}:00`,
            end: `${String((hour + 1) % 24).padStart(2, '0')}:00`
        });
        setIsPersonalModalOpen(true);
    };

    const savePersonalTask = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSave = { ...personalForm, userId: user.uid };
            const docRef = await addDoc(collection(db, "personal_schedules"), dataToSave);
            setPersonalData([...personalData, { ...dataToSave, id: docRef.id }]);
            setIsPersonalModalOpen(false);
            setPersonalForm({ title: "", day: "Dushanba", start: "09:00", end: "10:00", icon: "Activity", color: "bg-indigo-500" });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const deletePersonalTask = async (id, e) => {
        e.stopPropagation();
        if(!window.confirm("Buni o'chirasizmi?")) return;
        await deleteDoc(doc(db, "personal_schedules", id));
        setPersonalData(personalData.filter(d => d.id !== id));
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 p-4 md:p-6 font-sans pb-32">
            <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6">
                
                {/* --- CHAP SIDEBAR --- */}
                <div className="w-full xl:w-72 shrink-0 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-2 shadow-sm border border-slate-200 dark:border-white/5 flex gap-1">
                        <button 
                            onClick={() => setScheduleType('academic')} 
                            className={`flex-1 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${scheduleType === 'academic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Akademik
                        </button>
                        <button 
                            onClick={() => setScheduleType('personal')} 
                            className={`flex-1 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${scheduleType === 'personal' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Shaxsiy Reja
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-slate-900 dark:text-white font-black text-lg">
                                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"><ChevronLeft className="w-4 h-4"/></button>
                                <button onClick={nextMonth} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} className="text-[10px] font-black text-slate-400">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isToday = isTodayCal(day);
                                return (
                                    <div key={day} className="py-1">
                                        <button className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                                            isToday 
                                            ? 'bg-indigo-600 text-white shadow-md scale-110' 
                                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}>
                                            {day}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {scheduleType === 'personal' && (
                        <button onClick={() => setIsPersonalModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> Vazifa Qo'shish
                        </button>
                    )}
                </div>

                {/* --- O'NG QISM: ASOSIY MATRITSA --- */}
                {/* 🌟 DIQQAT: Xatoni to'g'irladik - Endi Matritsaning balandligi faqatgina darslarga qarab cho'ziladi va uning atrofida scroll chiqmaydi */}
                <div 
                    className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden max-h-[85vh] 2xl:max-h-[90vh]"
                >
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-20 shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(activeWeek[0].date)} - {new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(activeWeek[6].date)}
                            </h2>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button onClick={goToToday} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">Bugun</button>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                                <button onClick={prevWeek} className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                                <button onClick={nextWeek} className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar flex relative">
                        
                        {/* Soatlar (Chap ustun) - Faqat TOTAL_GRID_HEIGHT bo'yicha chiziladi */}
                        <div className="w-14 md:w-16 shrink-0 border-r border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 z-10 pt-[60px]" style={{ height: `${TOTAL_GRID_HEIGHT}px` }}>
                            {HOURS.map((hour, index) => (
                                <div key={hour} className="relative pr-2 text-right text-[9px] md:text-[10px] font-bold text-slate-400 -translate-y-1/2" style={{ height: `${ROW_HEIGHT}px` }}>
                                    {/* Oxirgi soatga qo'shimcha yozuv yozmaymiz, ortiqcha joy olmasligi uchun */}
                                    {index < HOURS.length ? `${String(hour).padStart(2, '0')}:00` : ''}
                                </div>
                            ))}
                        </div>

                        {/* Asosiy Grid */}
                        <div className="flex-1 min-w-[700px] relative" style={{ height: `${TOTAL_GRID_HEIGHT}px` }}>
                            
                            {/* Kunlar Headeri */}
                            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800/50 sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                                {activeWeek.map(day => {
                                    const isToday = isTodayCal(day.date.getDate());
                                    return (
                                        <div key={day.key} className="py-3 flex flex-col items-center justify-center border-r border-slate-50 dark:border-slate-800/30 last:border-0 relative">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{day.name}</span>
                                            <span className={`text-base font-black w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-800 dark:text-white'}`}>
                                                {day.number}
                                            </span>
                                            {/* XATONI TUZATISH: 2000px o'rniga faqat to'rning aniq balandligini yozamiz */}
                                            {isToday && <div className="absolute top-full w-full bg-indigo-50/20 dark:bg-indigo-500/5 -z-10 pointer-events-none" style={{ height: `${TOTAL_GRID_HEIGHT}px` }}></div>}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="absolute inset-0 pt-[60px] pointer-events-none z-0">
                                {HOURS.map(hour => (
                                    <div key={hour} className="w-full border-t border-slate-200/40 dark:border-white/5 border-dashed" style={{ height: `${ROW_HEIGHT}px` }}></div>
                                ))}
                            </div>

                            <div className="absolute inset-0 pt-[60px] grid grid-cols-7 pointer-events-none z-0">
                                {activeWeek.map(day => <div key={`v-${day.key}`} className="h-full border-r border-slate-200/30 dark:border-white/5 last:border-none"></div>)}
                            </div>

                            {/* Click to Add */}
                            <div className="absolute inset-0 pt-[60px] grid grid-cols-7 z-10">
                                {activeWeek.map((dayObj) => (
                                    <div key={`click-${dayObj.key}`} className="relative w-full h-full">
                                        {scheduleType === 'personal' && HOURS.map((hour, i) => (
                                            <div 
                                                key={`slot-${hour}`}
                                                onClick={() => handleGridClick(dayObj, hour)}
                                                className={`w-full flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 cursor-pointer transition-all border-b border-transparent ${i === HOURS.length - 1 ? 'hidden' : ''}`}
                                                style={{ height: `${ROW_HEIGHT}px` }}
                                            >
                                                <span className="text-[10px] font-black text-emerald-500 flex items-center">
                                                    <Plus className="w-3 h-3 mr-1"/> Qo'shish
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Qizil Vaqt Chizig'i */}
                            {isCurrentTimeVisible && (
                                <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ top: `${60 + currentTimeTop}px` }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] -ml-1.5 animate-pulse"></div>
                                    <div className="flex-1 border-t-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                </div>
                            )}

                            {/* DARSLAR VA REJALAR */}
                            <div className="absolute inset-0 pt-[60px] grid grid-cols-7 pointer-events-none z-20">
                                {loading ? (
                                    <div className="col-span-full flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/></div>
                                ) : (
                                    activeWeek.map((dayObj, colIndex) => {
                                        if (scheduleType === 'academic') {
                                            const daySchedules = academicData.filter(s => s.day === dayObj.fullDayName);
                                            return (
                                                <div key={colIndex} className="relative w-full h-full">
                                                    {daySchedules.map(schedule => {
                                                        const pos = getPositionAcademic(schedule.pair);
                                                        if (pos.height === 0) return null;
                                                        const colors = getColors(schedule.id);
                                                        
                                                        return (
                                                            <div 
                                                                key={schedule.id}
                                                                className={`absolute left-0.5 right-0.5 rounded-[12px] p-2.5 border overflow-hidden shadow-sm pointer-events-auto cursor-default hover:scale-[1.02] hover:z-40 transition-all group ${colors}`}
                                                                style={{ top: `${pos.top + 1}px`, height: `${pos.height - 2}px` }}
                                                            >
                                                                <h4 className="text-[10px] md:text-[11px] font-black leading-tight line-clamp-2">{schedule.subject}</h4>
                                                                <p className="text-[9px] mt-1 font-bold opacity-80 flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 shrink-0"/> {schedule.roomName}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        } 
                                        else {
                                            const daySchedules = personalData.filter(s => s.day === dayObj.fullDayName);
                                            return (
                                                <div key={colIndex} className="relative w-full h-full">
                                                    {daySchedules.map(schedule => {
                                                        const pos = getPositionPersonal(schedule.start, schedule.end);
                                                        if (pos.height === 0) return null;
                                                        const SelectedIcon = ICONS_MAP[schedule.icon] || Activity;
                                                        
                                                        return (
                                                            <div 
                                                                key={schedule.id}
                                                                className={`absolute left-0.5 right-0.5 rounded-[12px] p-2.5 text-white shadow-sm overflow-hidden pointer-events-auto cursor-pointer hover:scale-[1.02] hover:z-40 transition-all group ${schedule.color}`}
                                                                style={{ top: `${pos.top + 1}px`, height: `${pos.height - 2}px` }}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <SelectedIcon className="w-3.5 h-3.5 opacity-90 mb-1 shrink-0" />
                                                                    <button onClick={(e) => deletePersonalTask(schedule.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-rose-200 transition-opacity shrink-0 bg-black/10 p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>
                                                                </div>
                                                                <h4 className="text-[10px] md:text-[11px] font-black leading-tight line-clamp-2 mt-1">{schedule.title}</h4>
                                                                <p className="text-[9px] font-bold opacity-90 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5"/> {schedule.start} - {schedule.end}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        }
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SHAXSIY DARS QO'SHISH MODALI */}
            {isPersonalModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsPersonalModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Shaxsiy Reja</h3>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">O'zingiz uchun jadval</p>
                            </div>
                            <button onClick={() => setIsPersonalModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        </div>

                        <form onSubmit={savePersonalTask} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nima ish qilasiz?</label>
                                <input required type="text" value={personalForm.title} onChange={e => setPersonalForm({...personalForm, title: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" placeholder="Kutubxona, Mashg'ulot..." />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kuni</label>
                                <select value={personalForm.day} onChange={e => setPersonalForm({...personalForm, day: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer">
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Boshlanishi</label>
                                    <input required type="time" value={personalForm.start} onChange={e => setPersonalForm({...personalForm, start: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tugashi</label>
                                    <input required type="time" value={personalForm.end} onChange={e => setPersonalForm({...personalForm, end: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Belgi (Icon)</label>
                                <div className="grid grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl max-h-32 overflow-y-auto custom-scrollbar">
                                    {Object.entries(ICONS_MAP).map(([name, IconComponent]) => (
                                        <button 
                                            key={name} type="button" onClick={() => setPersonalForm({...personalForm, icon: name})}
                                            className={`p-2 rounded-xl flex justify-center items-center transition-all ${personalForm.icon === name ? 'bg-emerald-500 text-white shadow-md scale-110' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rang</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    {COLOR_PALETTE.map(color => (
                                        <button 
                                            key={color} type="button" onClick={() => setPersonalForm({...personalForm, color})}
                                            className={`w-7 h-7 rounded-full ${color} ${personalForm.color === color ? 'ring-4 ring-emerald-500/30 scale-110' : 'hover:scale-105'} transition-all shadow-sm`}
                                        ></button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full py-4 mt-2 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex items-center justify-center">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Jadvalga Qo'shish"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
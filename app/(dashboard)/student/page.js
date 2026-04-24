"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../components/Card";
import { useUser } from "../../../lib/UserContext";
import Spinner from "../../../components/Spinner";
import { useLanguage } from "../../../lib/LanguageContext";
import {
    Clock, CheckCircle2, AlertCircle, 
    BookOpen, Bell, ArrowRight, TrendingUp, MapPin, 
    Loader2, Megaphone, CheckSquare, User, FileText, Calendar
} from "lucide-react";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// --- KICHIK STATISTIKA KARTACHASI ---
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <Card className="p-5 flex items-center gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[24px] hover:shadow-lg transition-shadow">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</h3>
                {subtitle && <span className="text-[10px] font-bold text-slate-500">{subtitle}</span>}
            </div>
        </div>
    </Card>
);

export default function StudentDashboard() {
    const { user } = useUser();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);

    // Haqiqiy ma'lumotlar (Firebase dan keladi)
    const [todayClasses, setTodayClasses] = useState([]);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({ attendance: 0, gpa: 0 });

    const todayDate = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    useEffect(() => {
        const fetchRealDashboardData = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);
                
                // 1. E'LONLAR (News kolleksiyasidan)
                const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(5));
                const snapNews = await getDocs(qNews);
                
                // Faqat talabaga tegishli yoki hammaga ('all') yuborilgan e'lonlarni ajratamiz
                const activeNews = snapNews.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => {
                    const targets = n.audienceType;
                    const val = n.targetValue;
                    if (targets === 'all') return true;
                    if (targets === 'role' && val === 'student') return true;
                    if (targets === 'group' && val === user.groupId) return true;
                    if (targets === 'faculty' && val === user.deptId) return true;
                    return false;
                });
                setAnnouncements(activeNews);

                // 2. VAZIFALAR (Documents/Assignments kolleksiyasidan)
                // "request" yoki "financial" tipidagi va hali javob berilmagan hujjatlarni qidiramiz
                const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
                const snapDocs = await getDocs(qDocs);
                
                const activeTasks = snapDocs.docs.map(d => ({ id: d.id, ...d.data() })).filter(doc => {
                    // Hujjat menga tegishlimi?
                    const targets = doc.audienceType;
                    const val = doc.targetValue;
                    let isForMe = false;

                    if (targets === 'all') isForMe = true;
                    else if (targets === 'role' && val === 'student') isForMe = true;
                    else if (targets === 'group' && val === user.groupId) isForMe = true;
                    else if (targets === 'faculty' && val === user.deptId) isForMe = true;
                    else if (targets === 'individual' && val === user.uid) isForMe = true;

                    if (!isForMe) return false;

                    // Menga tegishli bo'lsa, men javob berganmanmi?
                    const myResponse = (doc.responses || []).find(r => r.userId === user.uid);
                    
                    // Agar faqat o'qish uchun bo'lmasa (info emas) va men javob bermagan bo'lsam = Pending Task
                    return doc.type !== 'info' && !myResponse;
                });
                setPendingTasks(activeTasks);

                // 3. DARS JADVALI VA STATISTIKA
                // Dars jadvalini 'schedule' yoki 'classes' kolleksiyasidan olish logikasi (Sizning strukturangizga qarab)
                // Hozircha bo'sh massiv qo'yamiz, chunki sizning schedule kolleksiyangiz qanday nomlanganligini bilmayman.
                // Agar sizda maxsus API bo'lsa (masalan dashboardApi.getTodayClasses()), o'shani ishlating:
                // const classesData = await dashboardApi.getTodayClasses(user.groupId);
                // setTodayClasses(classesData);
                
                // GPA va Davomat (Users kolleksiyasidan yoki alohida grades kolleksiyasidan)
                setStats({ 
                    attendance: user.attendance || 0, 
                    gpa: user.gpa || 0 
                });

            } catch (error) {
                console.error("Dashboard yuklashda xatolik:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRealDashboardData();
    }, [user]);


    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Spinner className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {/* SALOMLASHISH VA SANA */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                        Xush kelibsiz, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0] || "Talaba"}</span> 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        {todayDate} • Muvaffaqiyatli kun tilaymiz!
                    </p>
                </div>
                <div className="px-5 py-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GPA Ko'rsatkichi</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{stats.gpa} <span className="text-[10px] text-slate-400">/ 5.0</span></p>
                    </div>
                </div>
            </header>

            {/* TEZKAR STATISTIKA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Bugungi Darslar" value={todayClasses.length} subtitle="ta dars" icon={BookOpen} colorClass="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" />
                <StatCard title="Faol Vazifalar" value={pendingTasks.length} subtitle="topshirilmagan" icon={CheckSquare} colorClass="bg-rose-50 dark:bg-rose-500/10 text-rose-600" />
                <StatCard title="Muhim E'lonlar" value={announcements.length} subtitle="yangi" icon={Bell} colorClass="bg-amber-50 dark:bg-amber-500/10 text-amber-600" />
                <StatCard title="Davomat" value={`${stats.attendance}%`} subtitle="joriy semestr" icon={User} colorClass="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" />
            </div>

            {/* ASOSIY KONTENT: 2 Ustunli */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                
                {/* CHAP USTUN (Kengroq): Dars Jadvali va Vazifalar */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8">
                    
                    {/* 1. BUGUNGI DARS JADVALI (Timeline UI) */}
                    <Card className="p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" /> Bugungi Darslar
                            </h2>
                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1">
                               <a href="student/schedule">To'liq jadval</a>  <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[27px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                            {todayClasses.length === 0 ? (
                                <p className="text-center text-sm font-bold text-slate-400 py-10 z-10 relative">Bugun darslar yo'q yoki jadval kiritilmagan.</p>
                            ) : (
                                todayClasses.map((cls, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110">
                                            {cls.isDone ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : cls.current ? <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping"></div> : <Clock className="w-6 h-6 opacity-50" />}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 bg-white dark:bg-slate-800/80 group-hover:-translate-y-1 z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${cls.current ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                    {cls.time}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">{cls.type}</span>
                                            </div>
                                            <h3 className={`text-base font-black leading-tight mb-1 ${cls.current ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{cls.subject}</h3>
                                            <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><User className="w-3 h-3"/> {cls.professorName || "O'qituvchi"}</span>
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {cls.room || "Xona"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* 2. DOLZARB VAZIFALAR (Hujjatlar / To'lovlar) */}
                    <Card className="p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-rose-500" /> Bajarilishi kerak bo'lgan vazifalar
                            </h2>
                            <span className="px-3 py-1 bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                                {pendingTasks.length} ta
                            </span>
                        </div>

                        <div className="space-y-4">
                            {pendingTasks.length === 0 ? (
                                <p className="text-center text-sm font-bold text-slate-400 py-6">Barcha vazifalar bajarilgan. Yaxshi!</p>
                            ) : (
                                pendingTasks.map(task => (
                                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-colors gap-4 group">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${task.type === 'financial' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-amber-400'}`}></div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{task.title}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.type === 'financial' ? "To'lov so'rovi" : "Hujjat yuklash"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${task.type === 'financial' ? 'text-rose-500' : 'text-slate-500'}`}>
                                                <Calendar className="w-3.5 h-3.5" /> {task.deadline || "Muddatsiz"}
                                            </span>
                                            <a href="student/docs" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-700 dark:text-slate-300 rounded-lg uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                Boshlash
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                </div>

                {/* O'NG USTUN (Torroq): E'lonlar va Tizim xabarlari */}
                <div className="space-y-6 md:space-y-8">
                    
                    <Card className="p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[32px] shadow-xl shadow-indigo-500/20 border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mt-10 -mr-10"></div>
                        <h2 className="text-lg font-black flex items-center gap-2 mb-2 relative z-10"><Megaphone className="w-5 h-5"/> Tizim E'lonlari</h2>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-6 relative z-10">Universitet yangiliklari</p>
                        
                        <div className="space-y-4 relative z-10">
                            {announcements.length === 0 ? (
                                <p className="text-xs font-bold text-indigo-200 text-center py-4">Yangi e'lonlar yo'q</p>
                            ) : (
                                announcements.map(ann => (
                                    <div key={ann.id} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-2">
                                            {ann.requiresRegistration ? <AlertCircle className="w-3.5 h-3.5 text-rose-300"/> : <Bell className="w-3.5 h-3.5 text-amber-300"/>}
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">{ann.createdAt?.toDate().toLocaleDateString() || "Yaqinda"}</span>
                                        </div>
                                        <h4 className="text-sm font-bold leading-snug line-clamp-2">{ann.title}</h4>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <a href="student/news" className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 relative z-10">
                            Barchasini ko'rish <ArrowRight className="w-3 h-3" />
                        </a>
                    </Card>

                    {/* Qo'shimcha Foydali Havolalar */}
                    <Card className="p-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Tezkor Havolalar</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="student/docs" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 transition-colors text-slate-600 dark:text-slate-300">
                                <FileText className="w-5 h-5"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Hujjatlar</span>
                            </a>
                            <a href="student/schedule" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 transition-colors text-slate-600 dark:text-slate-300">
                                <BookOpen className="w-5 h-5"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Dars Jadvali</span>
                            </a>
                        </div>
                    </Card>

                </div>

            </div>
        </div>
    );
}
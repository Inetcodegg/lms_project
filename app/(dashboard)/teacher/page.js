"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Card from "../../../components/Card"; // Pathni tekshiring
import {
    Users, BookOpen, Calendar,
    ChevronRight, LayoutDashboard,
    Newspaper, ClipboardCheck, FileText
} from "lucide-react";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import Spinner from "../../../components/Spinner";

export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeGroups: 0,
        pendingTasks: 0
    });
    const [recentNews, setRecentNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;

                if (!user) {
                    setLoading(false);
                    return;
                }

                // 1. Faol guruhlarni sanash (Barcha guruhlarni olamiz)
                const groupsSnap = await getDocs(collection(db, "groups"));
                const activeGroupsCount = groupsSnap.size;

                // 2. Jami talabalarni sanash (Faqat role == student bo'lganlar)
                const studentsQ = query(collection(db, "users"), where("role", "==", "student"));
                const studentsSnap = await getDocs(studentsQ);
                const totalStudentsCount = studentsSnap.size;

                // 3. Tekshirilmagan ishlar (Submissions - pending)
                // O'qituvchiga kelgan barcha tekshirilmagan ishlar
                const subsQ = query(
                    collection(db, "submissions"),
                    where("teacherId", "==", user.uid),
                    where("status", "==", "pending") 
                );
                let pendingTasksCount = 0;
                try {
                    const subsSnap = await getDocs(subsQ);
                    pendingTasksCount = subsSnap.size;
                } catch (e) {
                    console.log("Submissions o'qishda xato (index yo'q bo'lishi mumkin):", e);
                }

                // 4. So'nggi yangiliklarni yuklash
                const newsQ = query(
                    collection(db, "news"), 
                    orderBy("createdAt", "desc"), 
                    limit(3)
                );
                let newsData = [];
                try {
                    const newsSnap = await getDocs(newsQ);
                    newsData = newsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                } catch (e) {
                    console.log("Yangiliklarni o'qishda xato:", e);
                }

                // State ni yangilash
                setStats({
                    totalStudents: totalStudentsCount,
                    activeGroups: activeGroupsCount,
                    pendingTasks: pendingTasksCount
                });
                setRecentNews(newsData);

            } catch (err) {
                console.error("Dashboard yuklashda xato:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const menuItems = [
        { title: "Davomat", icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/teacher/attendance" },
        { title: "Yangiliklar", icon: Newspaper, color: "text-blue-500", bg: "bg-blue-500/10", href: "/teacher/news" },
        { title: "Dars Jadvali", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/teacher/schedule" },
        { title: "Talabalar", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", href: "/teacher/students" },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Spinner className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">

            {/* Welcome Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Xush kelibsiz! 👋
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Bugungi ish rejangiz va statistikalaringiz
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-[14px] bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                        {auth.currentUser?.displayName?.[0] || "U"}
                    </div>
                    <div className="pr-4">
                        <p className="text-xs font-black dark:text-white">{auth.currentUser?.displayName || "O'qituvchi"}</p>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Fakultet a'zosi</p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <StatCard 
                    label="Jami Talabalar" 
                    value={stats.totalStudents} 
                    icon={Users} 
                    trend="Tizimdagi jami" 
                    color="text-blue-500" 
                    bg="bg-blue-500/10" 
                />
                <StatCard 
                    label="Faol Guruhlar" 
                    value={stats.activeGroups} 
                    icon={BookOpen} 
                    trend="Tizimdagi jami" 
                    color="text-indigo-500" 
                    bg="bg-indigo-500/10" 
                />
                <StatCard 
                    label="Tekshirilmagan Ishlar" 
                    value={stats.pendingTasks} 
                    icon={FileText} 
                    trend={stats.pendingTasks > 0 ? "Kutmoqda" : "Barchasi toza"} 
                    color={stats.pendingTasks > 0 ? "text-rose-500" : "text-emerald-500"} 
                    bg={stats.pendingTasks > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Navigation Menu */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                        Boshqaruv Paneli
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                        {menuItems.map((item, idx) => (
                            <Link href={item.href} key={idx}>
                                <Card className="p-5 md:p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer border-slate-100 dark:border-white/5 group relative overflow-hidden bg-white/80 dark:bg-slate-900/80">
                                    <div className={`${item.bg} ${item.color} w-12 h-12 rounded-[16px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[10px] md:text-xs">
                                        {item.title}
                                    </h3>
                                    <ChevronRight className="absolute right-5 bottom-5 w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Side Section: Recent News Summary */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">So'nggi yangiliklar</h2>
                        <Link href="/teacher/news" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Hammasi</Link>
                    </div>

                    <div className="space-y-4">
                        {recentNews.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hozircha yangiliklar yo'q</p>
                            </div>
                        ) : (
                            recentNews.map((n) => (
                                <div key={n.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4 items-center hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 rounded-[14px] overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                                        {n.image ? (
                                            <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Newspaper className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white truncate uppercase">{n.title}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{n.category || "Umumiy"}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Yordamchi Stat Card komponenti
function StatCard({ label, value, icon: Icon, trend, color, bg }) {
    return (
        <Card className="p-6 border-slate-100 dark:border-white/5 flex items-center gap-5 relative overflow-hidden group bg-white/80 dark:bg-slate-900/80">
            <div className={`p-4 rounded-[20px] ${bg} ${color} group-hover:scale-110 transition-transform shrink-0`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">{value}</h3>
                <span className={`text-[8px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 inline-block truncate max-w-full`}>
                    {trend}
                </span>
            </div>
        </Card>
    );
}
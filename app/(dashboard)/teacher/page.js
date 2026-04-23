"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Card from "../../../components/Card"; // Pathni loyihangizga qarab tekshiring
import {
    Users, BookOpen, Calendar,
    Bell, ChevronRight, LayoutDashboard,
    Clock, CheckCircle2, TrendingUp,
    Newspaper, ClipboardCheck
} from "lucide-react";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeClasses: 0,
        pendingAppointments: 0
    });
    const [recentNews, setRecentNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;

                // 1. Statistikalar (Misol tariqasida)
                // Haqiqiy loyihada bularni o'qituvchi ID'si bo'yicha filtrlang
                const classesSnap = await getDocs(collection(db, "classes"));
                const newsSnap = await getDocs(
                    query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3))
                );

                setStats({
                    totalStudents: 124, // Buni dinamik hisoblash mumkin
                    activeClasses: classesSnap.size,
                    pendingAppointments: 5
                });

                setRecentNews(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (err) {
                console.error("Dashboard yuklashda xato:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const menuItems = [
        { title: "Davomat", icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/dashboard/teacher/attendance" },
        { title: "Yangiliklar", icon: Newspaper, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/teacher/news" },
        { title: "Dars Jadvali", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/dashboard/teacher/schedule" },
        { title: "Talabalar", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/teacher/students" },
    ];

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Welcome Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Xush kelibsiz! 👋
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Bugungi ish rejangiz va statistikalaringiz
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {auth.currentUser?.displayName?.[0] || "T"}
                    </div>
                    <div className="pr-4">
                        <p className="text-xs font-black dark:text-white">{auth.currentUser?.displayName || "O'qituvchi"}</p>
                        <p className="text-[10px] font-bold text-slate-400">FAKULTET AZOSI</p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <StatCard label="Jami Talabalar" value={stats.totalStudents} icon={Users} trend="+12%" color="text-blue-500" />
                <StatCard label="Faol Guruhlar" value={stats.activeClasses} icon={BookOpen} trend="Barqaror" color="text-indigo-500" />
                <StatCard label="Kutilayotgan Uchrashuvlar" value={stats.pendingAppointments} icon={Clock} trend="Bugun" color="text-rose-500" />
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
                                <Card className="p-6 hover:scale-[1.02] transition-all cursor-pointer border-slate-100 dark:border-white/5 group relative overflow-hidden">
                                    <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">
                                        {item.title}
                                    </h3>
                                    <ChevronRight className="absolute right-6 bottom-6 w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Side Section: Recent News Summary */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">So'nggi yangiliklar</h2>
                        <Link href="/dashboard/teacher/news" className="text-[10px] font-black text-indigo-500 uppercase hover:underline">Hammasi</Link>
                    </div>

                    <div className="space-y-4">
                        {recentNews.map((n) => (
                            <div key={n.id} className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={n.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white truncate uppercase">{n.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">{n.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Yordamchi Stat Card komponenti
function StatCard({ label, value, icon: Icon, trend, color }) {
    return (
        <Card className="p-6 border-slate-100 dark:border-white/5 flex items-center gap-5 relative overflow-hidden group">
            <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full mt-2 inline-block">
                    {trend}
                </span>
            </div>
        </Card>
    );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { dashboardApi } from "../../../lib/api/dashboardApi"; // Yangi ajratilgan API
import {
    Search, Calendar, ChevronDown, Sun, HelpCircle, 
    FileText, CheckCircle2, Layout, Flame, ArrowRight, 
    Bell, Filter, AlertCircle, X
} from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, status, progress, icon: Icon, onClick, t }) => (
    <div
        onClick={onClick}
        className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[32px] p-5 md:p-6 shadow-sm flex flex-col justify-between h-[140px] md:h-[160px] group hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all duration-300 cursor-pointer w-full"
    >
        <div className="flex justify-between items-start">
            <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-slate-700 dark:text-slate-300" />
            </div>
            {status && (
                <div className="flex items-center space-x-1 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-500/20">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] md:text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">{t('active') || 'Faol'}</span>
                </div>
            )}
        </div>
        <div>
            <p className="text-xs md:text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1 truncate">{title}</p>
            <div className="flex items-baseline space-x-3">
                <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{value}</span>
                {progress !== undefined && (
                    <div className="flex-1 max-w-[80px] md:max-w-[120px] hidden sm:block">
                        <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-400 mb-1">
                            <span>{t('progress') || 'Jarayon'}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// --- MAIN DASHBOARD ---
export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [upcoming, setUpcoming] = useState([]);
    const [ongoingCourses, setOngoingCourses] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [chartPeriod, setChartPeriod] = useState('weekly');
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedModal, setSelectedModal] = useState(null);

    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch Firebase logic from the separated API file
                const [s, u, oc] = await Promise.all([
                    dashboardApi.getDashboardStats(chartPeriod),
                    dashboardApi.getUpcomingClasses(),
                    dashboardApi.getOngoingCourses()
                ]);
                
                setStats(s);
                setUpcoming(u || []);
                setOngoingCourses(oc || []);
            } catch (err) {
                console.error("Dashboard xatosi:", err);
                setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chartPeriod]);

    // Qidiruv filtri
    const filteredOngoingCourses = useMemo(() => {
        if (!searchQuery) return ongoingCourses;
        return ongoingCourses.filter(course => 
            course.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [ongoingCourses, searchQuery]);

    // Chart hisoblashlari (0 bo'lsa ham qulamaydi)
    const maxStudyHours = useMemo(() => {
        if (!stats?.analytics || stats.analytics.length === 0) return 8;
        const max = Math.max(...stats.analytics.map(a => a.hours));
        return max > 0 ? max : 8; // Agar hamma soat 0 bo'lsa, max 8 qoladi
    }, [stats?.analytics]);

    const breakdownTotals = useMemo(() => {
        if (!stats?.assignmentBreakdown) return { submitted: 0, inReview: 0, remaining: 0, total: 1 };
        const { submitted, inReview, remaining } = stats.assignmentBreakdown;
        const total = submitted + inReview + remaining;
        return { submitted, inReview, remaining, total: total > 0 ? total : 1 };
    }, [stats?.assignmentBreakdown]);

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ulanishda xatolik</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-md">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Qayta urinish
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Toolbar - Mobile First Flex-col */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder') || "Kurs yoki ID bo'yicha qidirish..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl md:rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex bg-white/60 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 rounded-xl md:rounded-2xl p-1 shadow-sm w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-lg md:rounded-xl shadow-sm text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                            <Calendar className="w-4 h-4" />
                            <span>{selectedYear}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* KPI Cards Row - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
                <StatCard
                    title={t('enrolledCourses') || "Faol kurslar"}
                    value={stats?.enrolledCourses || 0}
                    status={stats?.enrolledCourses > 0 ? "Active" : null}
                    progress={stats?.overallProgress || 0}
                    icon={Layout}
                    onClick={() => { setSelectedModal('courses'); setShowModal(true); }}
                    t={t}
                />
                <StatCard
                    title={t('totalAssignments') || "Vazifalar"}
                    value={stats?.totalAssignments || 0}
                    icon={FileText}
                    onClick={() => { setSelectedModal('assignments'); setShowModal(true); }}
                    t={t}
                />
                <StatCard
                    title={t('completedCourses') || "Tugatilgan"}
                    value={stats?.completedCourses || 0}
                    icon={CheckCircle2}
                    onClick={() => { setSelectedModal('completed'); setShowModal(true); }}
                    t={t}
                />
                <StatCard
                    title={t('upcomingQuiz') || "Keyingi imtihon"}
                    value={`${stats?.upcomingQuizzes || 0} kun`}
                    icon={Bell}
                    onClick={() => { setSelectedModal('quiz'); setShowModal(true); }}
                    t={t}
                />
            </div>

            {/* Main Content Grids */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                
                {/* Left Column: Analytics & Classes */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8">
                    
                    {/* Analytics Chart */}
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('reportAnalytics') || "Tahliliy hisobot"}</h2>
                            <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl w-full sm:w-auto">
                                {['daily', 'weekly', 'monthly'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setChartPeriod(period)}
                                        className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${chartPeriod === period ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                    >
                                        {period === 'daily' ? 'Kun' : period === 'weekly' ? 'Hafta' : 'Oy'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-48 md:h-64 relative mt-4">
                            <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                                {[maxStudyHours, maxStudyHours * 0.75, maxStudyHours * 0.5, maxStudyHours * 0.25, 0].map(h => (
                                    <div key={h} className="flex items-center space-x-2 md:space-x-4 opacity-50 md:opacity-100">
                                        <span className="w-6 md:w-8 text-[9px] md:text-[11px] font-bold text-slate-400 text-right">{Math.round(h)}h</span>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50"></div>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute inset-0 pl-10 md:pl-12 flex justify-around items-end">
                                {stats?.analytics?.map((item, idx) => {
                                    const heightPercentage = Math.min((item.hours / maxStudyHours) * 100, 100);
                                    return (
                                        <div key={idx} className="flex flex-col items-center group w-full max-w-[20px] md:max-w-[40px]">
                                            <div
                                                className={`w-full md:w-12 rounded-t-md md:rounded-xl transition-all duration-700 ease-out relative ${item.isPeak ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                style={{ height: `${heightPercentage}%` }}
                                            >
                                                {/* Tooltip */}
                                                <div className={`hidden md:block absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl z-20 transition-opacity duration-200 ${item.isPeak ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <div className="flex items-center space-x-1.5">
                                                        {item.isPeak && <Flame className="w-3 h-3 text-orange-400" />}
                                                        <span>{item.hours} soat</span>
                                                    </div>
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                                </div>
                                            </div>
                                            <span className={`mt-2 md:mt-4 text-[8px] md:text-[11px] font-bold uppercase tracking-wider ${item.isPeak ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{item.label.substring(0,3)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Ongoing Courses Table */}
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-8 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('ongoingCourses') || "Davom etayotgan kurslar"}</h2>
                            <button className="p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                <Filter className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Mobile Scrollable wrapper */}
                        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 custom-scrollbar">
                            <table className="w-full text-left font-sans min-w-[500px]">
                                <thead>
                                    <tr className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                        <th className="pb-3 md:pb-4 pl-2">ID</th>
                                        <th className="pb-3 md:pb-4">Kurs nomi</th>
                                        <th className="pb-3 md:pb-4">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredOngoingCourses.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-slate-500 text-xs md:text-sm font-medium">
                                                Hozircha ma'lumot yo'q. (Bo'sh)
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOngoingCourses.map((course, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 md:py-4 pl-2">
                                                    <span className="text-xs md:text-[13px] font-bold text-slate-500">{course.id}</span>
                                                </td>
                                                <td className="py-3 md:py-4">
                                                    <span className="text-sm md:text-[14px] font-bold text-slate-800 dark:text-white">{course.subject}</span>
                                                </td>
                                                <td className="py-3 md:py-4 w-32 md:w-40">
                                                    <div className="flex items-center space-x-2 md:space-x-3">
                                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.progress || 0}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-600 dark:text-slate-300">{course.progress || 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Upcoming & Breakdown */}
                <div className="space-y-6 md:space-y-8">

                    {/* Upcoming Classes */}
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('upcomingClasses') || "Kelgusi darslar"}</h2>
                            <div className="flex items-center space-x-1.5 md:space-x-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${upcoming.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{upcoming.length} rejalashtirilgan</span>
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            {upcoming.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-xs md:text-sm font-medium border border-dashed border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl">
                                    Rejalashtirilgan darslar yo'q
                                </div>
                            ) : (
                                upcoming.map((cls, idx) => (
                                    <div key={idx} className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center space-x-3 mb-3 md:mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                                                {cls.subject?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm md:text-[14px] font-bold text-slate-900 dark:text-white line-clamp-1">{cls.subject}</p>
                                                <p className="text-xs md:text-[12px] font-semibold text-slate-500">{cls.professorName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-3">
                                            <div className="flex items-center space-x-1.5 text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{cls.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Assignment Breakdown */}
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('assignmentBreakdown') || "Vazifalar holati"}</h2>
                            <HelpCircle className="w-4 h-4 md:w-4.5 md:h-4.5 text-slate-300" />
                        </div>

                        <div className="space-y-6 md:space-y-8">
                            <div className="h-4 md:h-6 w-full flex rounded-lg md:rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-700">
                                <div className="h-full bg-emerald-400 border-r border-white/20 transition-all duration-1000" style={{ width: `${(breakdownTotals.submitted / breakdownTotals.total) * 100}%` }}></div>
                                <div className="h-full bg-indigo-400 border-r border-white/20 transition-all duration-1000" style={{ width: `${(breakdownTotals.inReview / breakdownTotals.total) * 100}%` }}></div>
                                <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${(breakdownTotals.remaining / breakdownTotals.total) * 100}%` }}></div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                                {[
                                    { label: 'Topshirilgan', value: breakdownTotals.submitted, color: 'bg-emerald-400' },
                                    { label: 'Tekshirilmoqda', value: breakdownTotals.inReview, color: 'bg-indigo-400' },
                                    { label: 'Qolgan', value: breakdownTotals.remaining, color: 'bg-amber-400' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 md:space-x-3 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${item.color}`}></div>
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL (Pop-up) - Mobile Responsive */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-white dark:border-white/10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Batafsil ma'lumot
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto">
                            <div className="text-center py-10 text-slate-500 text-sm font-medium">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                Hozircha batafsil oyna uchun API ma'lumotlari kiritilmagan.<br/>(Yoki Firebase ro'yxati bo'sh)
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
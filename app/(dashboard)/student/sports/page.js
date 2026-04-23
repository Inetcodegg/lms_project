"use client";
import React, { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import {
    Dumbbell, Calendar, Users, Trophy, CheckCircle2,
    MapPin, Clock, ArrowRight, Activity, Zap, Medal, 
    Loader2, Plus, Target, Star, X
} from "lucide-react";
import { sportsApi } from "../../../../lib/api/sportsApi";
import { useUser } from "../../../../lib/UserContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546519638-68e1004ddda8?w=800&q=80&auto=format&fit=crop";

// Firebase'dan keladigan string nomini haqiqiy Ikonkaga o'giruvchi Map
const iconMap = {
    Trophy: Trophy,
    Activity: Activity,
    Zap: Zap,
    Dumbbell: Dumbbell,
    Medal: Medal,
    Target: Target,
    Star: Star
};

// --- SPORT O'YINI KARTASI ---
const SportCard = ({ id, title, date, time, location, color, image, scoreTeam1, scoreTeam2, isLive = false, onBook }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
    const [isBooking, setIsBooking] = useState(false);

    const handleBooking = async () => {
        setIsBooking(true);
        await onBook(id, title);
        setIsBooking(false);
    };

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col h-full">
            <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                    src={imgSrc} 
                    onError={() => setImgSrc(FALLBACK_IMAGE)}
                    alt={title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className={`absolute inset-0 opacity-80 mix-blend-multiply ${
                    color === 'orange' ? 'bg-orange-900' : 
                    color === 'emerald' ? 'bg-emerald-900' : 
                    color === 'rose' ? 'bg-rose-900' : 'bg-indigo-900'
                }`}></div>
                
                <div className="absolute top-3 left-3 md:top-4 md:left-4">
                    {isLive ? (
                        <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-rose-500/90 backdrop-blur-md rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-rose-400 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            <span>Live Score</span>
                        </span>
                    ) : (
                        <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm border border-white dark:border-white/10">
                            Kelgusi O'yin
                        </span>
                    )}
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex items-center justify-between text-white">
                    <div className="flex -space-x-2 md:-space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-900 shadow-md">UNI</div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] md:text-[10px] font-black text-white shadow-md z-10">STA</div>
                    </div>
                    {isLive && (
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/80 leading-none mb-1">Hisob</p>
                            <p className="text-xl md:text-2xl font-black drop-shadow-md">{scoreTeam1 || 0} - {scoreTeam2 || 0}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 md:p-8 flex-1 flex flex-col">
                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase leading-tight line-clamp-2">{title}</h3>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
                    <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{location}</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                    <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500" />
                        <span>{date} • {time}</span>
                    </div>
                </div>

                <button 
                    onClick={handleBooking}
                    disabled={isBooking}
                    className="mt-auto w-full py-3.5 md:py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg active:scale-95 transform flex items-center justify-center disabled:opacity-70"
                >
                    {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chipta Band Qilish"}
                </button>
            </div>
        </Card>
    );
};


// --- ASOSIY SAHIFA ---
export default function SportsPage() {
    const { user } = useUser(); // User rolini tekshiramiz
    
    const [categories, setCategories] = useState([]);
    const [matches, setMatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState("");

    // Admin Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", members: "", iconName: "Trophy" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Barcha ma'lumotlarni to'g'ridan-to'g'ri bazadan tortish
                const [catData, matchesData, statsData, leaderboardData] = await Promise.all([
                    sportsApi.getSportsCategories(),
                    sportsApi.getMatches(),
                    sportsApi.getUserSportsStats(),
                    sportsApi.getSportsLeaderboard()
                ]);
                
                setCategories(catData || []);
                setMatches(matchesData || []);
                setStats(statsData);
                setLeaderboard(leaderboardData || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Chipta bron qilish handler
    const handleBookTicket = async (id, title) => {
        try {
            await sportsApi.bookTicket(id, title);
            setToastMsg(`✓ "${title}" uchun chipta band qilindi!`);
            setTimeout(() => setToastMsg(""), 3500);
        } catch (error) {
            setToastMsg("❌ Xatolik! Tizimga kiring.");
            setTimeout(() => setToastMsg(""), 3500);
        }
    };

    // Admin: Sport Turini qo'shish
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.members) return;

        try {
            setIsSubmitting(true);
            const newCat = await sportsApi.createSportsCategory({
                title: formData.title,
                members: formData.members,
                icon: formData.iconName
            });
            setCategories([newCat, ...categories]);
            setShowAddModal(false);
            setFormData({ title: "", members: "", iconName: "Trophy" });
            setToastMsg("✓ Sport turi muvaffaqiyatli qo'shildi!");
            setTimeout(() => setToastMsg(""), 3500);
        } catch (error) {
            setToastMsg("❌ Xatolik yuz berdi. Faqat admin ruxsatiga ega.");
            setTimeout(() => setToastMsg(""), 3500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Toast Notification */}
            {toastMsg && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-xl font-bold text-xs animate-in slide-in-from-top-4 duration-300 ${toastMsg.includes('❌') ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toastMsg}
                </div>
            )}

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Kampus Sporti</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-4">
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Medal className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                            <span>{categories.length} Faol Turlar</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                            <span>Barcha Talabalar Uchun Ochiq</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    {/* Faqat Admin Sport turlarini qo'sha oladi */}
                    {user?.role === 'admin' && (
                        <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center space-x-2 p-3.5 md:p-4 bg-emerald-500 text-white rounded-xl md:rounded-[24px] hover:bg-emerald-600 transition-all shadow-md active:scale-95 transform shrink-0">
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    )}
                    <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 md:space-x-3 px-6 md:px-8 py-3 md:py-3.5 bg-[#1e293b] dark:bg-indigo-600 text-white rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl active:scale-95 transform">
                        <Calendar className="w-4 h-4 md:w-4 md:h-4" />
                        <span>Maydonni Band Qilish</span>
                    </button>
                </div>
            </header>

            {/* Sport Turlari (Categories) Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                {loading ? (
                    [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)
                ) : categories.length === 0 ? (
                    <div className="col-span-full py-10 text-center bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hozircha sport turlari yo'q</p>
                    </div>
                ) : (
                    categories.map((section) => {
                        const Icon = iconMap[section.icon] || Trophy; // Dinamik ikonkani chaqirish
                        return (
                            <Card key={section.id} className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center sm:block space-x-4 sm:space-x-0">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5 md:mb-1 leading-tight line-clamp-1">{section.title}</h3>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{section.members}</p>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">

                {/* Chap qism: O'yinlar (Matches) */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8 order-2 xl:order-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Asosiy O'yinlar</h2>
                        <button className="flex items-center text-indigo-600 dark:text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:translate-x-1 transition-transform">
                            <span>Barcha O'yinlar</span>
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1.5 md:ml-2" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                            {[1, 2].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[40px] animate-pulse"></div>)}
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] md:rounded-[40px]">
                            <Trophy className="w-10 h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Hozircha o'yinlar yo'q</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                            {matches.map(match => (
                                <SportCard key={match.id} {...match} onBook={handleBookTicket} />
                            ))}
                        </div>
                    )}
                </div>

                {/* O'ng qism: Shaxsiy Statistika & Reyting */}
                <div className="space-y-6 md:space-y-8 order-1 xl:order-2">
                    <Card className="p-6 md:p-8 bg-indigo-600 text-white rounded-2xl md:rounded-[40px] shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg md:text-xl font-black tracking-tight mb-6 md:mb-8 uppercase">Shaxsiy Statistika</h3>
                            
                            <div className="space-y-6 md:space-y-8">
                                <div className="flex items-center justify-between bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center space-x-3 md:space-x-4">
                                        <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl shrink-0">
                                            <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-0.5 md:mb-1">Yoqilgan Kkal</p>
                                            <h4 className="text-lg md:text-xl font-black">{stats?.kcalBurnt || 0}</h4>
                                        </div>
                                    </div>
                                    <div className="text-[9px] md:text-[11px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-emerald-400/20">
                                        {stats?.growth || '+0%'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center space-x-3 md:space-x-4">
                                        <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl shrink-0">
                                            <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-0.5 md:mb-1">Mashg'ulotlar</p>
                                            <h4 className="text-lg md:text-xl font-black">{stats?.trainings || 0}</h4>
                                        </div>
                                    </div>
                                    <div className="text-[9px] md:text-[11px] font-black text-indigo-200">
                                        Maqsad {stats?.target || 30}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 md:-mr-24 md:-mt-24"></div>
                    </Card>

                    {/* Dinamik Leaderboard (Bazada bor eng zo'rlar) */}
                    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
                        <div className="flex justify-between items-center mb-5 md:mb-6">
                            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Top Atlets</h3>
                            <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-500" />
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            {loading ? (
                                [1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)
                            ) : leaderboard.length === 0 ? (
                                <p className="text-center text-xs font-bold text-slate-400 py-4">Reyting shakllanmoqda</p>
                            ) : (
                                leaderboard.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center space-x-2 md:space-x-3">
                                            <span className="text-[9px] md:text-[11px] font-black text-slate-400">0{student.rank}</span>
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                                                <Trophy className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" />
                                            </div>
                                            <p className="text-[10px] md:text-[12px] font-black text-slate-800 dark:text-white line-clamp-1">{student.name || "Talaba"}</p>
                                        </div>
                                        <span className="text-[9px] md:text-[11px] font-black text-indigo-600 dark:text-indigo-400">{student.score || 0} pts</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ADMIN MODAL: Yangi Sport Turini Qo'shish */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Sport qo'shish</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Yangi kategoriya (Faqat Admin)</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowAddModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCategory} className="space-y-5">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Kategoriya Nomi</label>
                                <input
                                    type="text" required placeholder="Masalan: Voleybol Ligasi"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Tavsif / A'zolar</label>
                                <input
                                    type="text" required placeholder="Masalan: 12 Jamoa, Ochiq 08:00"
                                    value={formData.members} onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Ikonka tanlang</label>
                                <select
                                    value={formData.iconName} onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                >
                                    <option value="Trophy">Kubok (Trophy)</option>
                                    <option value="Activity">Puls (Activity)</option>
                                    <option value="Zap">Chaqmoq (Zap)</option>
                                    <option value="Dumbbell">Tosh (Dumbbell)</option>
                                    <option value="Medal">Medal (Medal)</option>
                                    <option value="Target">Nishon (Target)</option>
                                    <option value="Star">Yulduz (Star)</option>
                                </select>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3">
                                <button type="button" disabled={isSubmitting} onClick={() => setShowAddModal(false)} className="px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[120px]">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'shish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Trophy, Award, TrendingUp, Search,
    Filter, Star, Zap, Target,
    ChevronUp, ChevronDown, Medal, Users
} from "lucide-react";
import { rankingsApi } from "../../../../lib/api/rankingsApi";
import { useUser } from "../../../../lib/UserContext";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

// --- JADVAL QATORI (Row) ---
const RankRow = ({ rank, name, major, score, trend, avatar, isUser = false }) => {
    const [imgSrc, setImgSrc] = useState(avatar || FALLBACK_AVATAR);

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
                            alt={name} 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm bg-slate-100" 
                        />
                        {isUser && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full"></div>}
                    </div>
                    <div>
                        <h4 className={`text-xs md:text-sm font-black tracking-tight line-clamp-1 ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{name} {isUser && "(Siz)"}</h4>
                        <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{major}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 md:py-6">
                <div className="flex items-center space-x-1.5 md:space-x-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500" />
                    <span>{score} Ball</span>
                </div>
            </td>
            <td className="py-4 md:py-6">
                <div className={`flex items-center space-x-1 md:space-x-1.5 text-[9px] md:text-[11px] font-black uppercase tracking-widest ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend > 0 ? <ChevronUp className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                    <span>{Math.abs(trend || 0)}%</span>
                </div>
            </td>
            <td className="py-4 md:py-6 pr-4 md:pr-8 text-right">
                <button className="px-3 md:px-5 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 transition-all shadow-sm">
                    Profil
                </button>
            </td>
        </tr>
    );
};

// --- ASOSIY SAHIFA ---
export default function RankingsPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('Umumiy');
    const [searchQuery, setSearchQuery] = useState('');

    const [list, setList] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const categories = ['Umumiy', 'Fakultet', 'Ilmiy Izlanish', 'Sport'];

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                setLoading(true);
                const [rankData, statsData] = await Promise.all([
                    rankingsApi.getRankings(),
                    rankingsApi.getUserStats()
                ]);
                setList(rankData || []);
                setUserStats(statsData || { growth: "+0", percentile: "N/A" });
            } catch (error) {
                console.error("Fetch xatosi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRankings();
    }, []);

    // Filter va Qidiruv (useMemo orqali optimallashtirilgan)
    const filteredList = useMemo(() => {
        return list.filter(student => {
            const matchesTab = activeTab === 'Umumiy' || student.category === activeTab || student.department === activeTab;
            const matchesSearch = 
                student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.major?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [list, activeTab, searchQuery]);

    const topThree = filteredList.slice(0, 3); // Eng zo'r 3 ta

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Header Section */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Akademik Reyting</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-4">
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                            <span>Sizning O'sishingiz: <span className="text-emerald-500 font-black">{userStats?.growth}%</span> Oyiga</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Medal className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                            <span>Top {userStats?.percentile} O'quvchilar safida</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center w-full md:w-auto overflow-x-auto no-scrollbar bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-xl md:rounded-[24px] p-1.5 md:p-2 shadow-sm">
                    {categories.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-[18px] text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${tab === activeTab ? 'bg-[#1e293b] dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : filteredList.length === 0 ? (
                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] md:rounded-[40px]">
                    <Users className="w-10 h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest">Bu toifada reyting mavjud emas</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Spotlight - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
                        {topThree.map((student, idx) => (
                            <Card key={idx} className={`p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm relative overflow-hidden flex flex-col items-center text-center transition-transform ${student.rank === 1 ? 'sm:scale-105 border-t-4 border-t-amber-400 z-10 shadow-xl' : 'hover:-translate-y-2'}`}>
                                <div className="relative mb-4 md:mb-6 mt-2">
                                    <img 
                                        src={student.avatar || FALLBACK_AVATAR} 
                                        onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                        alt={student.name} 
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-xl bg-slate-100" 
                                    />
                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 md:px-4 py-1 md:py-1.5 ${student.rank === 1 ? 'bg-amber-500' : 'bg-slate-900 dark:bg-indigo-600'} text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap`}>
                                        # {student.rank}-o'rin
                                    </div>
                                </div>
                                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight line-clamp-1 w-full px-2">{student.name}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 line-clamp-1 px-2">{student.major}</p>

                                <div className="w-full pt-4 md:pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-around">
                                    <div className="space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Ball</p>
                                        <p className="text-base md:text-lg font-black text-slate-900 dark:text-white">{student.score}</p>
                                    </div>
                                    <div className="w-px h-6 md:h-8 bg-slate-100 dark:bg-white/10"></div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">O'sish</p>
                                        <p className="text-base md:text-lg font-black text-emerald-500">+{student.trend}%</p>
                                    </div>
                                </div>
                                {student.rank === 1 && <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-400/10 rounded-full blur-3xl -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>}
                            </Card>
                        ))}
                    </div>

                    {/* Rankings Table */}
                    <Card className="p-0 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm overflow-hidden">
                        <div className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">To'liq Reyting Jadvali</h2>
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Talabani qidirish..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl py-3 md:py-3.5 pl-11 pr-4 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
                            <table className="w-full text-left min-w-[600px] md:min-w-[800px]">
                                <thead>
                                    <tr className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                                        <th className="pb-4 md:pb-6 pl-4 md:pl-8">O'rni</th>
                                        <th className="pb-4 md:pb-6">Talaba Ma'lumoti</th>
                                        <th className="pb-4 md:pb-6">Akademik Ball</th>
                                        <th className="pb-4 md:pb-6">Oylik O'sish</th>
                                        <th className="pb-4 md:pb-6 pr-4 md:pr-8 text-right">Amal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {filteredList.map((row) => (
                                        <RankRow 
                                            key={row.id} 
                                            {...row} 
                                            isUser={user?.uid === row.userId} // Agar jadvoldagi user men bo'lsam ajralib turadi
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-5 md:p-8 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
                                {activeTab} toifasida jami {filteredList.length} talaba ko'rsatilmoqda
                            </p>
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed">Oldingi</button>
                                <button className="px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all shadow-sm">Keyingi</button>
                            </div>
                        </div>
                    </Card>

                    {/* Achievements Section */}
                    <div className="mt-10 md:mt-12">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6 md:mb-8">Nishonlar va Faxriylar Zali</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                            {[
                                { label: 'Dekan Ro\'yxati', icon: Medal, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                                { label: 'Ilmiy Izlanuvchi', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                                { label: 'Jamoa Qahramoni', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                { label: 'Faol Fuqaro', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                                { label: 'Tezkor O\'quvchi', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                                { label: 'Top Hissa Qo\'shuvchi', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                            ].map((badge, idx) => (
                                <Card key={idx} className="p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[32px] shadow-sm flex flex-col items-center text-center group hover:-translate-y-2 transition-all cursor-pointer">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 ${badge.bg} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                                        <badge.icon className={`w-5 h-5 md:w-7 md:h-7 ${badge.color}`} />
                                    </div>
                                    <h4 className="text-[9px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">{badge.label}</h4>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
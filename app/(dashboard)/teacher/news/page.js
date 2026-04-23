"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Newspaper, Search, Calendar, Eye,
    Bookmark, Bell, Filter, Loader2,
    ArrowRight, Globe, GraduationCap
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

const CATEGORIES = ["Hamma", "E'lon", "Tadbir", "Imtihon", "Muhim"];

export default function TeacherNewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Hamma");

    // 1. Yangiliklarni o'qituvchi filtri bilan yuklash
    useEffect(() => {
        const fetchTeacherNews = async () => {
            try {
                setLoading(true);
                // Faqat 'all' va 'teachers' ga tegishli yangiliklarni olamiz
                const q = query(
                    collection(db, "news"),
                    where("targetAudience", "in", ["all", "teachers"]),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Yangiliklar yuklanmadi:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherNews();
    }, []);

    // 2. Qidiruv va Kategoriya bo'yicha filter
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === "Hamma" || item.category === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [news, searchQuery, activeTab]);

    return (
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Section */}
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">E'lonlar paneli</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Siz uchun muhim xabarlar</p>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Yangiliklarni qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        />
                    </div>

                    {/* Horizontal Scroll Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* News Grid */}
            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : filteredNews.length === 0 ? (
                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/20 rounded-[32px] border border-dashed border-slate-200 dark:border-white/10">
                    <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hozircha yangiliklar yo'q</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNews.map((item) => (
                        <Card key={item.id} className="p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-white/5 flex flex-col h-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                            {/* Kichikroq Rasm */}
                            <div className="relative h-40 overflow-hidden">
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute top-3 left-3">
                                    <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-[9px] font-black uppercase text-indigo-600 shadow-sm border border-white/20">
                                        {item.category}
                                    </span>
                                </div>
                                {item.targetAudience === 'teachers' && (
                                    <div className="absolute top-3 right-3 p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg">
                                        <GraduationCap className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Calendar className="w-3 h-3" />
                                    {item.createdAt?.toDate().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{item.authorName || "Ma'muriyat"}</span>
                                </div>

                                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {item.title}
                                </h3>

                                <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium leading-relaxed">
                                    {item.content}
                                </p>

                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center group/btn">
                                        Batafsil <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                            <Bookmark className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
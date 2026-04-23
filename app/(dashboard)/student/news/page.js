"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Calendar, Clock, Bookmark, ArrowRight,
    TrendingUp, Newspaper, Bell, MapPin, Plus, X, Image as ImageIcon, Loader2
} from "lucide-react";
import { useLanguage } from "../../../../lib/LanguageContext";
import { useUser } from "../../../../lib/UserContext"; // User rolini tekshirish uchun
import { newsApi } from "../../../../lib/api/newsApi";
import { eventsApi } from "../../../../lib/api/eventsApi"; // Oldingi qadamda yaratilgan API

// Zaxira rasm (Supabase/Firebase rasm o'qiy olmasa shu chiqadi)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=800&q=80&auto=format&fit=crop";

// --- YANGILIK KARTASI ---
const NewsCard = ({ category, title, content, formattedDate, image, featured = false }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group h-full flex flex-col">
            <div className="relative h-48 md:h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={imgSrc}
                    onError={() => setImgSrc(FALLBACK_IMAGE)}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent"></div>
                <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-2">
                    <span className="px-3 md:px-4 py-1.5 md:py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm border border-white dark:border-white/10">
                        {category}
                    </span>
                    {featured && (
                        <span className="px-3 md:px-4 py-1.5 md:py-2 bg-indigo-600 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-lg">Asosiy</span>
                    )}
                </div>
                <button className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/20 backdrop-blur-md text-white rounded-xl md:rounded-2xl hover:bg-black/40 transition-all">
                    <Bookmark className="w-4 h-4" />
                </button>
            </div>
            <div className="p-5 md:p-8 flex-1 flex flex-col">
                <div className="flex items-center space-x-3 mb-3 md:mb-4 text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center space-x-1.5 text-indigo-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                    </div>
                </div>
                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{title}</h3>
                <p className="text-[12px] md:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-6 line-clamp-3">{content}</p>
                <div className="mt-auto pt-4 md:pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">Batafsil</span>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10">
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function NewsPage() {
    const { t } = useLanguage();
    const { user } = useUser(); // User rolini tekshirish uchun
    
    const [activeTab, setActiveTab] = useState('Barchasi');
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal Statelari
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", category: "Kampus", content: "", image: "", featured: false });

    const categories = ['Barchasi', 'Akademik', 'Kampus', 'Sport', 'Hayot'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [newsData, eventsData] = await Promise.all([
                    newsApi.getNews(),
                    eventsApi.getEvents(user?.role || 'student')
                ]);
                setNews(newsData || []);
                setEvents(eventsData || []);
            } catch (error) {
                console.error("Xato:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role]);

    // Yangilik Qo'shish
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return;

        try {
            setIsSubmitting(true);
            const newNews = await newsApi.createNews({
                title: formData.title,
                category: formData.category,
                content: formData.content,
                image: formData.image || FALLBACK_IMAGE,
                featured: formData.featured
            });
            
            setNews([newNews, ...news]); // UI da darhol ko'rsatish
            setShowModal(false);
            setFormData({ title: "", category: "Kampus", content: "", image: "", featured: false });
        } catch (error) {
            alert("Xatolik yuz berdi. Tizimga kiring.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtrlangan yangiliklar
    const filteredNews = useMemo(() => {
        if (activeTab === 'Barchasi') return news;
        return news.filter(item => item.category === activeTab);
    }, [news, activeTab]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Section */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-12">
                <div className="w-full xl:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3 md:mb-4">{t('newsTitle') || "Yangiliklar"}</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-4">
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                            <span>{t('trendingNow') || "Trendda"}: Bitiruv 2026</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Newspaper className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                            <span>{news.length} {t('newStories') || "ta maqola"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    {/* Faqat Admin yoki O'qituvchi bo'lsagina Yangilik qo'shish ko'rinadi */}
                    {['admin', 'teacher'].includes(user?.role) && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl md:rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Yangilik qo'shish</span>
                        </button>
                    )}
                    
                    {/* Kategoriyalar */}
                    <div className="flex items-center w-full overflow-x-auto no-scrollbar bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[24px] p-1.5 shadow-sm">
                        {categories.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-[18px] text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${tab === activeTab ? 'bg-[#1e293b] dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-10">
                {/* Asosiy Yangiliklar (Chap qism) */}
                <div className="xl:col-span-3">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-72 md:h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[40px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredNews.length === 0 ? (
                        <div className="py-16 md:py-24 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] md:rounded-[40px]">
                            <Newspaper className="w-10 h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 md:mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-sm">Bu ruknda yangilik yo'q</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            {filteredNews.map(item => (
                                <NewsCard key={item.id} {...item} />
                            ))}
                        </div>
                    )}
                </div>

                {/* O'ng qism: Kelgusi Tadbirlar va Obuna */}
                <div className="space-y-6 md:space-y-8">
                    {/* Tadbirlar */}
                    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('upcomingEvents') || "Yaqin Tadbirlar"}</h2>
                            <button className="p-2 md:p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                                <Calendar className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-5 md:space-y-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}
                                </div>
                            ) : events.length === 0 ? (
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Tadbirlar mavjud emas</p>
                            ) : (
                                events.slice(0, 5).map((event, idx) => (
                                    <div key={idx} className="group cursor-pointer">
                                        <h4 className="text-[13px] md:text-[14px] font-black text-slate-800 dark:text-white mb-1 md:mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{event.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                <span>{event.date || "Tez kunda"}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                <span className="truncate max-w-[100px]">{event.location || "Kampus"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="w-full mt-8 md:mt-10 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-white transition-all">
                            {t('viewCalendar') || "Kalendarni ko'rish"}
                        </button>
                    </Card>

                    {/* Obuna */}
                    <Card className="p-6 md:p-8 bg-indigo-600 text-white rounded-2xl md:rounded-[40px] shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <Bell className="w-6 h-6 md:w-8 md:h-8 text-indigo-300 mb-3 md:mb-4" />
                            <h3 className="text-base md:text-lg font-black tracking-tight mb-2 leading-none">{t('stayInLoop') || "Xabardor bo'ling"}</h3>
                            <p className="text-[11px] md:text-xs font-bold text-indigo-100 mb-5 md:mb-6 leading-relaxed">{t('newsLetterDesc') || "Muhim yangiliklarni email orqali qabul qiling"}</p>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder={t('emailPlaceholder') || "Email kiriting..."}
                                    className="w-full px-4 md:px-5 py-3 md:py-3.5 bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-xs font-bold outline-none focus:bg-white/20 transition-all placeholder:text-indigo-200"
                                />
                                <button className="w-full py-3 md:py-3.5 bg-white text-indigo-600 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                                    {t('subscribeNow') || "Obuna bo'lish"}
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-2xl md:blur-3xl -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>
                    </Card>
                </div>
            </div>

            {/* YANGI YANGILIK QO'SHISH MODALI */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Yangilik qo'shish</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Admin / O'qituvchilar uchun</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Sarlavha</label>
                                <input
                                    type="text" required placeholder="Yangilik sarlavhasi"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Kategoriya</label>
                                    <select
                                        value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                    >
                                        <option>Akademik</option>
                                        <option>Kampus</option>
                                        <option>Sport</option>
                                        <option>Hayot</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center space-x-2 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl w-full">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="rounded text-indigo-600 w-4 h-4"
                                        />
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Asosiy (Featured)</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Rasm URL (Supabase/Firebase)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url" placeholder="https://..."
                                        value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1.5 ml-1 font-medium">Agar bo'sh qoldirsangiz standart rasm qo'yiladi</p>
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Matn</label>
                                <textarea
                                    required rows="4" placeholder="Yangilik matni..."
                                    value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3 md:space-x-4">
                                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[100px]">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Nashr qilish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
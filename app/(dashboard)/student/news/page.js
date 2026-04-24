"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Calendar, ArrowRight, TrendingUp, Newspaper, 
    Plus, X, Image as ImageIcon, Loader2, Sparkles
} from "lucide-react";
import { useLanguage } from "../../../../lib/LanguageContext";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner"; 
import { newsApi } from "../../../../lib/api/newsApi";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=800&q=80&auto=format&fit=crop";

// --- IXCHAM VA PREMIUM YANGILIK KARTASI ---
const NewsCard = ({ category, title, content, formattedDate, image, featured = false }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col relative">
            
            {/* Rasm qismi (Ixcham h-40) */}
            <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                <img
                    src={imgSrc}
                    onError={() => setImgSrc(FALLBACK_IMAGE)}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Kategoriyalar va Nshonlar */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    {featured && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Asosiy
                        </span>
                    )}
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                        {category}
                    </span>
                </div>
            </div>

            {/* Matn qismi */}
            <div className="p-5 md:p-6 flex-1 flex flex-col bg-white dark:bg-slate-900 relative z-10 -mt-2 rounded-t-[20px]">
                <div className="flex items-center space-x-1.5 mb-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate || "Yaqinda"}</span>
                </div>
                
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {title}
                </h3>
                
                <p className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {content}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Batafsil o'qish</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Card>
    );
};


export default function NewsPage() {
    const { t } = useLanguage();
    const { user } = useUser(); 
    
    const [activeTab, setActiveTab] = useState('Barchasi');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", category: "Kampus", content: "", image: "", featured: false });

    const categories = ['Barchasi', 'Akademik', 'Kampus', 'Sport', 'Hayot'];

    useEffect(() => {
        const fetchNewsData = async () => {
            try {
                setLoading(true);
                const newsData = await newsApi.getNews();
                setNews(newsData || []);
            } catch (error) {
                console.error("Xato:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNewsData();
    }, []);

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
            
            setNews([newNews, ...news]); 
            setShowModal(false);
            setFormData({ title: "", category: "Kampus", content: "", image: "", featured: false });
        } catch (error) {
            alert("Xatolik yuz berdi. Tizimga kiring.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredNews = useMemo(() => {
        if (activeTab === 'Barchasi') return news;
        return news.filter(item => item.category === activeTab);
    }, [news, activeTab]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {/* --- HEADER --- */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 md:mb-10">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Universitet Hayoti</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[9px] md:text-[10px] border border-emerald-100 dark:border-emerald-500/20">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>So'nggi Yangiliklar</span>
                        </div>
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 font-black uppercase tracking-widest text-[9px] md:text-[10px] border border-slate-100 dark:border-slate-700">
                            <Newspaper className="w-3.5 h-3.5" />
                            <span>Jami {news.length} ta maqola</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Admin / O'qituvchi uchun qo'shish tugmasi */}
                    {['admin', 'teacher'].includes(user?.role) && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center space-x-2 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Maqola Qo'shish</span>
                        </button>
                    )}
                    
                    {/* KATEGORIYALAR (Silliq va zamonaviy UI) */}
                    <div className="flex items-center w-full overflow-x-auto custom-scrollbar bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-inner">
                        {categories.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all 
                                ${tab === activeTab ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* --- MAQOLALAR RO'YXATI (ANIMATSIYA BILAN) --- */}
            <div className="w-full relative min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-[24px] animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center py-20 bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                        <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Ushbu ruknda yangilik topilmadi</p>
                    </div>
                ) : (
                    /* 🌟 ANIMATSIYA SIRRI: key atributi o'zgarganda Tailwind animate-in boshidan ishlaydi! */
                    <div key={activeTab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
                        {filteredNews.map(item => (
                            <NewsCard key={item.id} {...item} />
                        ))}
                    </div>
                )}
            </div>

            {/* --- YANGI MAQOLA QO'SHISH MODALI --- */}
            {showModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-8 border border-white dark:border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                        
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Maqola Nashr Qilish</h3>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Sarlavha</label>
                                <input
                                    type="text" required placeholder="Qisqa va aniq sarlavha..."
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Rukn</label>
                                    <select
                                        value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    >
                                        <option>Akademik</option>
                                        <option>Kampus</option>
                                        <option>Sport</option>
                                        <option>Hayot</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-1.5">
                                    <label className="flex items-center space-x-2 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl w-full bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="rounded text-indigo-600 w-4 h-4"
                                        />
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Asosiy Qilish</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Rasm Havolasi (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url" placeholder="https://..."
                                        value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">To'liq Matn</label>
                                <textarea
                                    required rows="5" placeholder="Maqola matnini kiriting..."
                                    value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium outline-none focus:border-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Spinner className="w-4 h-4 text-inherit" /> : "Nashr qilish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
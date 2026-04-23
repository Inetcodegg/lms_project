"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    MessageSquare, Search, Filter, Plus,
    ArrowUpCircle, ArrowDownCircle, Clock,
    User, Tag, Share2, MoreHorizontal,
    TrendingUp, Award, MessageCircle, X
} from "lucide-react";
import { forumApi } from "../../../../lib/api/forumApi";

// --- FORUM POST KOMPONENTI ---
const ForumPost = ({ author, time, title, category, content, tags, upvotes, comments }) => (
    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-500/10 transition-all duration-500 group flex gap-4 md:gap-8">
        {/* Chap tomondagi Upvote qismi (Faqat PC da) */}
        <div className="hidden sm:flex flex-col items-center space-y-2 pt-1 shrink-0">
            <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{upvotes || 0}</span>
            <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8" />
            </button>
        </div>

        {/* Asosiy Content qismi */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase shrink-0">
                        {(author || "A")[0]}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 md:space-x-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-slate-900 dark:text-white font-extrabold truncate max-w-[100px] md:max-w-none">{author || "Anonim"}</span>
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                        <Clock className="w-3 h-3 hidden sm:block" />
                        <span>{time} oldin</span>
                        <div className="hidden sm:block w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                        <span className="text-indigo-500">{category}</span>
                    </div>
                </div>
                <button className="p-1.5 md:p-2 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>

            <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase line-clamp-2">
                {title}
            </h3>

            <p className="text-[12px] md:text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-6 line-clamp-3">
                {content}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {(tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="px-3 md:px-4 py-1 md:py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer">
                            # {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center space-x-4 md:space-x-6 text-[10px] md:text-[11px] font-black text-slate-400 tracking-widest uppercase">
                    {/* Telefon ekranlari uchun Upvote (Chunki chap qism yashirilgan) */}
                    <div className="flex sm:hidden items-center space-x-1.5 text-indigo-500">
                        <ArrowUpCircle className="w-4 h-4" />
                        <span>{upvotes || 0}</span>
                    </div>

                    <button className="flex items-center space-x-1.5 md:space-x-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{comments || 0} Fikr</span>
                    </button>
                    <button className="hidden sm:flex items-center space-x-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Ulashish</span>
                    </button>
                </div>
            </div>
        </div>
    </Card>
);

// --- ASOSIY SAHIFA ---
export default function ForumPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Barchasi");

    // Yangi Post Modal Statelari
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", category: "Academics", content: "", tags: "" });

    const categories = ['Barchasi', 'Academics', 'Campus Life', 'Announcements', 'Lost & Found'];

    // Postlarni tortish
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const data = await forumApi.getPosts();
                setPosts(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // Yangi Post Yuborish
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return;

        try {
            setIsSubmitting(true);
            const tagArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            
            const newPost = await forumApi.createPost({
                title: formData.title,
                category: formData.category,
                content: formData.content,
                tags: tagArray
            });
            
            setPosts([newPost, ...posts]); // UI ga darhol qo'shamiz
            setShowModal(false);
            setFormData({ title: "", category: "Academics", content: "", tags: "" });
        } catch (error) {
            alert("Xatolik yuz berdi, tizimga kirganingizni tekshiring.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filterlash (Qidiruv va Kategoriya bo'yicha)
    const filteredPosts = useMemo(() => {
        let result = posts;
        
        // Tab bo'yicha filter
        if (activeTab !== 'Barchasi') {
            result = result.filter(p => p.category === activeTab);
        }
        
        // Qidiruv bo'yicha filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title?.toLowerCase().includes(q) || 
                p.content?.toLowerCase().includes(q) ||
                p.author?.toLowerCase().includes(q)
            );
        }
        
        return result;
    }, [posts, activeTab, searchQuery]);


    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Hamjamiyat Forumi</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-3">
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Trendda: Kuzgi Karyera</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 md:space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                            <span>124 Faol Muhokama</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center w-full md:w-auto">
                    <button 
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-3.5 bg-[#1e293b] text-white rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transform"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Mavzu qo'shish</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 md:gap-10">

                {/* Posts Feed (Chap qism) */}
                <div className="xl:col-span-3 space-y-6 md:space-y-8 order-2 xl:order-1">
                    
                    {/* Category Filter (Mobile Scrollable) */}
                    <div className="flex items-center bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[24px] p-1.5 md:p-2 shadow-sm overflow-x-auto no-scrollbar custom-scrollbar">
                        {categories.map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-[18px] text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        {loading ? (
                             <div className="py-12 flex justify-center">
                                 <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                             </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="py-16 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hozircha xabarlar yo'q</p>
                            </div>
                        ) : (
                            filteredPosts.map(post => (
                                <ForumPost key={post.id} {...post} />
                            ))
                        )}

                        {/* Featured Topic Card */}
                        <Card className="p-0 overflow-hidden bg-indigo-600 border-none rounded-2xl md:rounded-[40px] shadow-xl relative h-48 md:h-64 group cursor-pointer mt-8 md:mt-12">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-transparent"></div>
                            <div className="relative h-full flex flex-col justify-center p-6 md:p-10 max-w-xl">
                                <h2 className="text-xl md:text-3xl font-black text-white mb-2 md:mb-4 tracking-tight leading-tight uppercase line-clamp-2">Rektor bilan Ochiq Muloqot</h2>
                                <p className="text-[10px] md:text-sm font-bold text-indigo-100 mb-4 md:mb-8 uppercase tracking-widest">Shu payshanba soat 15:00 da Asosiy Zal</p>
                                <div className="flex items-center space-x-2 md:space-x-3 text-white font-black uppercase tracking-widest text-[9px] md:text-[11px]">
                                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span>248 Eslatma o'rnatildi</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 md:-mr-32 md:-mt-32"></div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar: Stats & Members (O'ng qism) */}
                <div className="space-y-6 md:space-y-8 order-1 xl:order-2">
                    
                    {/* Search Card */}
                    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4 md:mb-6">Qidiruv</h3>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Kalit so'zlar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl py-3 pl-10 md:pl-12 pr-4 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm"
                            />
                        </div>
                    </Card>

                    {/* Community Stats */}
                    <Card className="p-6 md:p-8 bg-slate-900 text-white rounded-2xl md:rounded-[40px] shadow-xl overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-base md:text-lg font-black tracking-tight mb-6 md:mb-8 uppercase">Statistika</h3>
                            <div className="grid grid-cols-2 gap-4 md:gap-8">
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">A'zolar</p>
                                    <h4 className="text-xl md:text-2xl font-black">24,102</h4>
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Xabarlar</p>
                                    <h4 className="text-xl md:text-2xl font-black">102K+</h4>
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onlayn</p>
                                    <h4 className="text-xl md:text-2xl font-black text-emerald-400">1,240</h4>
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">O'rin</p>
                                    <h4 className="text-xl md:text-2xl font-black text-amber-400">#12</h4>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>
                    </Card>
                </div>
            </div>

            {/* YANGI POST YARATISH MODALI */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Yangi Mavzu</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Muhokama boshlash</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Sarlavha</label>
                                <input
                                    type="text" required placeholder="Nima haqida gaplashamiz?"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Toifa</label>
                                <select
                                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                >
                                    <option value="Academics">Academics (O'qish)</option>
                                    <option value="Campus Life">Campus Life (Hayot)</option>
                                    <option value="Announcements">Announcements (E'lon)</option>
                                    <option value="Lost & Found">Lost & Found (Topilmalar)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Batafsil matn</label>
                                <textarea
                                    required rows="4" placeholder="Fikringizni batafsil yozing..."
                                    value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Teglar (Vergul bilan ajrating)</label>
                                <input
                                    type="text" placeholder="Masalan: kutubxona, yordam, dars"
                                    value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3">
                                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[100px]">
                                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Yuborish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
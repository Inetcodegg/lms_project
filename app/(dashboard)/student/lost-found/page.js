"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Search, Plus, Camera, MapPin, Clock, 
    ShieldCheck, Info, Package, AlertTriangle, 
    CheckCircle2, X, Loader2
} from "lucide-react";
import { lostFoundApi } from "../../../../lib/api/lostFoundApi";

// Zaxira rasm (Supabase yozilgunicha yoki rasm xato yuklansa chiqadi)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?w=800&q=80&auto=format&fit=crop";

// --- ITEM KARTASI ---
const ItemCard = ({ title, formattedDate, location, category, status, image }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col h-full">
            <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                    src={imgSrc} 
                    onError={() => setImgSrc(FALLBACK_IMAGE)}
                    alt={title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                
                <div className="absolute top-3 left-3 md:top-4 md:left-4">
                    <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm border border-white dark:border-white/10">
                        {category}
                    </span>
                </div>
                
                <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
                    <div className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-lg ${status === 'Found' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {status === 'Found' ? 'Topilgan' : 'Yo\'qolgan'}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
                <h3 className="text-sm md:text-[17px] font-black text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tighter uppercase leading-tight line-clamp-2">{title}</h3>
                
                <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                    <div className="flex items-start space-x-2 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500 shrink-0" />
                        <span className="line-clamp-2 leading-relaxed">{location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500 shrink-0" />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <button className="mt-auto w-full py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 transition-all active:scale-95 transform shadow-sm">
                    Batafsil ko'rish
                </button>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function LostFoundPage() {
    const [itemList, setItemList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Barchasi");

    // Modal Statelari
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", location: "", category: "Electronics", status: "Found", description: "", image: "" });

    const categories = ['Barchasi', 'Electronics', 'Academic', 'Accessories', 'Personal'];

    // 1. Ma'lumotlarni tortish
    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const data = await lostFoundApi.getItems();
                setItemList(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // 2. Yangi e'lon berish
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.location) return;

        try {
            setIsSubmitting(true);
            const newItem = await lostFoundApi.createItem({
                ...formData,
                // Agar bo'sh qoldirilsa avtomat fallback tushadi
                image: formData.image || FALLBACK_IMAGE 
            });
            
            setItemList([newItem, ...itemList]);
            setShowModal(false);
            setFormData({ title: "", location: "", category: "Electronics", status: "Found", description: "", image: "" });
        } catch (error) {
            alert("Xato yuz berdi. Tizimga kiring.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Qidiruv va Kategoriya Filtri
    const filteredItems = useMemo(() => {
        let result = itemList;
        
        if (activeCategory !== 'Barchasi') {
            result = result.filter(i => i.category === activeCategory);
        }
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i => 
                i.title?.toLowerCase().includes(q) || 
                i.location?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [itemList, activeCategory, searchQuery]);

    // UI da chiqadigan statistikalar uchun hisob:
    const activeSearchCount = itemList.filter(i => i.status === 'Lost').length;
    const foundCount = itemList.filter(i => i.status === 'Found').length;

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">Yo'qotilgan va Topilgan</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Talabalarga o'z buyumlarini topishda yordam beramiz</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 md:space-x-3 px-6 md:px-8 py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transform"
                >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>E'lon berish</span>
                </button>
            </header>

            {/* Quick Stats - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
                {[
                    { title: activeSearchCount, label: 'Faol qidiruvlar', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { title: foundCount, label: 'Topilgan buyumlar', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { title: 'Markaziy', label: 'A-bino ofis', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' }
                ].map((stat, i) => (
                    <Card key={i} className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm flex items-center space-x-4 md:space-x-6">
                        <div className={`p-4 md:p-5 ${stat.bg} rounded-xl md:rounded-[24px] shrink-0`}>
                            <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                        </div>
                        <div>
                            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{stat.title}</h4>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="relative w-full md:w-auto md:flex-1 group">
                    <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buyumni qidiring..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[32px] py-3.5 md:py-5 pl-12 md:pl-16 pr-6 md:pr-8 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center w-full md:w-auto bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[32px] p-1.5 md:p-2 shadow-sm overflow-x-auto no-scrollbar custom-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 md:px-6 py-2.5 md:py-3.5 rounded-lg md:rounded-[24px] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {cat === 'Barchasi' ? 'Barchasi' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[40px] animate-pulse"></div>)
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full py-16 md:py-24 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl md:rounded-[40px]">
                        <Package className="w-10 h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 md:mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Bu toifada buyumlar topilmadi</p>
                    </div>
                ) : (
                    <>
                        {filteredItems.map(item => (
                            <ItemCard key={item.id} {...item} />
                        ))}
                        
                        {/* E'lon berish datchigi kartasi */}
                        <button onClick={() => setShowModal(true)} className="group border-2 md:border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[40px] p-8 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all min-h-[300px] md:min-h-[400px]">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all text-slate-400">
                                <Camera className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                            <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1 md:mb-2">Buyum rasm'ini kiritish</h3>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tezkor ro'yxatdan o'tkazish</p>
                        </button>
                    </>
                )}
            </div>

            {/* Quyidagi Qoidalar Banneri */}
            <Card className="mt-12 md:mt-16 p-6 md:p-10 bg-[#1e293b] text-white rounded-2xl md:rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-10">
                    <div className="w-full lg:max-w-xl text-center lg:text-left">
                        <h2 className="text-xl md:text-3xl font-black mb-3 md:mb-4 tracking-tighter uppercase">Qaytarish Qoidalari</h2>
                        <p className="text-indigo-100/80 font-bold text-xs md:text-sm leading-relaxed mb-6 md:mb-8 uppercase tracking-wide">Buyumni qaytarib olish uchun siz uni batafsil tavsiflab berishingiz va rasmiy Talaba ID kartangizni taqdim etishingiz kerak.</p>
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start">
                            <div className="flex items-center space-x-2 md:space-x-3 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-indigo-300">
                                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                                <span>ID karta talab etiladi</span>
                            </div>
                            <div className="flex items-center space-x-2 md:space-x-3 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-indigo-300">
                                <Info className="w-4 h-4 md:w-5 md:h-5" />
                                <span>30 kun saqlanadi</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-full lg:w-auto px-6 md:px-10 py-4 md:py-5 bg-white text-slate-900 rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-xl shrink-0">
                        Ish vaqtini ko'rish
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-24 -mt-24 md:-mr-32 md:-mt-32"></div>
            </Card>

            {/* Yaratish Modali (Form) */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6 md:mb-10">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Yangi e'lon</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Buyumlar tizimi</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Buyum nomi</label>
                                <input
                                    type="text" required placeholder="Masalan: Qora hamyon"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 px-5 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Holati</label>
                                    <select
                                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                    >
                                        <option value="Found">Topilgan</option>
                                        <option value="Lost">Yo'qolgan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Kategoriya</label>
                                    <select
                                        value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                    >
                                        <option>Electronics</option>
                                        <option>Academic</option>
                                        <option>Accessories</option>
                                        <option>Personal</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Joylashuv (Location)</label>
                                <input
                                    type="text" required placeholder="Masalan: Kutubxona 2-qavat"
                                    value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 px-5 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Tavsif (Description)</label>
                                <textarea
                                    required rows="3" placeholder="Rangi, shakli va hokazo..."
                                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 px-5 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3 md:space-x-4">
                                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="px-6 md:px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 md:px-10 py-3.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[120px]">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "E'lonni joylash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
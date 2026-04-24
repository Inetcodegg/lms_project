"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Utensils, Coffee, Star, Heart, Info, Clock,
    Leaf, Flame, ShoppingCart, Loader2
} from "lucide-react";
import { cafeteriaApi } from "../../../../lib/api/cafeteriaApi"; // Yangi Firebase API

// --- IXCHAM (COMPACT) MENU KARTASI ---
const MenuItem = ({ item, onOrder }) => {
    const [isOrdering, setIsOrdering] = useState(false);

    const handleOrderClick = async () => {
        setIsOrdering(true);
        await onOrder(item);
        setIsOrdering(false);
    };

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col">
            <div className="relative h-36 sm:h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {(item.tags || []).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
                <button className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all">
                    <Heart className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase line-clamp-2">{item.name}</h3>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 shrink-0">${parseFloat(item.price || 0).toFixed(2)}</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">{item.description || "Yangi va mazali tayyorlangan"}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>{item.calories || 0} kcal</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>{item.rating || "5.0"}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleOrderClick} 
                        disabled={isOrdering}
                        className="p-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-md active:scale-90 transform disabled:opacity-50"
                    >
                        {isOrdering ? <Spinner className="w-4 h-4 text-inherit" /> : <ShoppingCart className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function CafeteriaPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderMsg, setOrderMsg] = useState('');
    
    // Kategoriyalarni bazadagi ma'lumotlarga qarab dinamik yaratsa ham bo'ladi, hozircha static:
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setLoading(true);
                const data = await cafeteriaApi.getMenu();
                setMenu(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const handleOrder = async (item) => {
        try {
            await cafeteriaApi.placeOrder(item);
            setOrderMsg(`✓ "${item.name}" buyurtma qilindi!`);
            setTimeout(() => setOrderMsg(''), 3000);
        } catch (error) {
            setOrderMsg(`❌ Xatolik yuz berdi. Tizimga kiring.`);
            setTimeout(() => setOrderMsg(''), 3000);
        }
    };

    const filteredMenu = useMemo(() => {
        if (activeCategory === 'All') return menu;
        return menu.filter(m => m.category === activeCategory);
    }, [menu, activeCategory]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Buyurtma tasdiqlandi (Toast) */}
            {orderMsg && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-3 ${orderMsg.includes('❌') ? 'bg-red-600' : 'bg-emerald-600'} text-white rounded-xl shadow-xl font-bold text-xs animate-in slide-in-from-top-4 duration-300`}>
                    {orderMsg}
                </div>
            )}

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Campus Kafeteriya</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-3">
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ochiq • 21:00 da yopiladi</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                            <Utensils className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{menu.length} xil taom</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Category Filter (Mobile Scrollable) */}
            <div className="flex items-center bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[20px] p-1.5 shadow-sm mb-8 overflow-x-auto custom-scrollbar no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeCategory === cat ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'}`}
                    >
                        {cat === 'All' ? 'Barchasi' : cat}
                    </button>
                ))}
            </div>

            {/* Menu Grid - Ixcham (5 ustungacha) */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[24px] animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    
                    {/* Promo Card (Faqat 1-qatorda) */}
                    {activeCategory === 'All' && (
                        <Card className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 p-6 bg-indigo-600 text-white rounded-[24px] shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[220px]">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <Utensils className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black mb-1 tracking-tight">Tushlik Aksiya</h3>
                                <p className="text-xs font-medium text-indigo-100 mb-6 max-w-[200px]">Istalgan taom xaridi uchun bepul sharbat!</p>
                                <button className="w-max px-6 py-2.5 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                                    Chegirmani olish
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        </Card>
                    )}

                    {/* Menu Items */}
                    {filteredMenu.map(item => (
                        <MenuItem key={item.id} item={item} onOrder={handleOrder} />
                    ))}

                    {/* Bo'sh holat */}
                    {filteredMenu.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                            <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ushbu bo'limda hozircha taom yo'q</p>
                        </div>
                    )}
                </div>
            )}

            {/* Informatsion Kichik Kartalar (Footer qismi) */}
            <div className="mt-10 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="p-5 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-[24px] shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl shrink-0">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">100% Tabiiy</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Mahalliy fermalardan</p>
                    </div>
                </Card>
                <Card className="p-5 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-[24px] shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl shrink-0">
                        <Info className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Allergiya Info</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Taomlar tarkibi belgilangan</p>
                    </div>
                </Card>
                <Card className="p-5 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-[24px] shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl shrink-0">
                        <Coffee className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Qahvaxona</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Dars tayyorlash uchun 24/7</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
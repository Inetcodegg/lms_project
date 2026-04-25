// components/KitchenMenu.js
"use client";
import { useState, useEffect } from "react";
import { cafeteriaApi } from "../../../../lib/api/cafeteriaApi";
import { Utensils, Clock, ChevronRight, Star, Loader2, Soup, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../../../../components/Card";

export default function KitchenMenu() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = await cafeteriaApi.getMenu();
                setItems(data);
            } catch (error) {
                console.error("Menyuni yuklashda xato:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const availableItems = items.filter(item => item.isAvailable !== false);
    const filteredItems = selectedCategory === "All"
        ? availableItems
        : availableItems.filter(item => item.category === selectedCategory);

    const categories = ["All", ...new Set(availableItems.map(item => item.category))].filter(Boolean);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemAnim = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Menyu yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32 space-y-8">
            {/* Header section inspired by the provided snippet */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 italic uppercase">
                        <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                        Oshxona Menyusi
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Bugungi mazali taomlar va desertlar ro'yxati
                    </p>
                </div>

                {/* Categories Filter */}
                <div className="flex gap-3 overflow-x-auto pb-8 pt-4 px-4 -mx-4 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap border ${selectedCategory === cat
                                ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/30 scale-[1.05]"
                                : "bg-white/70 dark:bg-slate-900/40 text-slate-400 border-slate-100 dark:border-white/5 hover:border-orange-500/30 hover:text-slate-600 dark:hover:text-slate-200"
                                }`}
                        >
                            {cat === "All" ? "Barchasi" : cat}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredItems.map(item => (
                        <motion.div key={item.id} variants={itemAnim} layout>
                            <Card className="group relative p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[32px] hover:scale-[1.02] transition-all duration-300 cursor-default overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />

                                <div className="flex flex-col h-full space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                                            <Soup className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-full tracking-wider">
                                                {item.category || "General"}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black uppercase italic tracking-tight text-slate-800 dark:text-white">
                                            {item.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-2 leading-relaxed">
                                            {item.desc || "Ajoyib ta'm va yuqori sifatli ingredientlar bilan tayyorlangan."}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-slate-50 dark:border-white/5 mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Narxi</span>
                                            <span className="text-lg font-black text-orange-500 tracking-tighter">
                                                {item.price?.toLocaleString()} <span className="text-xs">UZS</span>
                                            </span>
                                        </div>
                                        {item.isSpecial && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-xl text-[9px] font-black uppercase border border-orange-500/20 animate-pulse">
                                                <Star className="w-3 h-3 fill-current" />
                                                Bugungi Maxsus
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredItems.length === 0 && (
                <div className="py-20 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hozircha menyuda hech narsa yo'q</p>
                </div>
            )}
        </div>
    );
}
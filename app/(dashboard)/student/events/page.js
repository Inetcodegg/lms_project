"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Calendar as CalendarIcon, Plus, MapPin, Clock, Users, Star,
    ArrowRight, ChevronLeft, ChevronRight, Compass, Bell, Bookmark
} from "lucide-react";
import { eventsApi } from "../../../../lib/api/eventsApi";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner"; // User rolini olish uchun

// Zaxira rasm (Supabase rasm o'qiy olmasa shu chiqadi)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800&q=80&auto=format&fit=crop";

// --- IXCHAM EVENT KARTASI ---
const EventCard = ({ title, type, date, location, status, image }) => {
    // Supabase rasm xatoligini ushlash uchun state
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col">
            <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                    src={imgSrc} 
                    onError={() => setImgSrc(FALLBACK_IMAGE)} // Rasm topilmasa zaxira rasmga o'tadi
                    alt={title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm">
                        {type || 'General'}
                    </span>
                </div>
                <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all">
                    <Bookmark className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex items-center space-x-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-90">
                        <Clock className="w-3 h-3" />
                        <span>{date || "Tez kunda"}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 md:p-5 flex flex-col flex-1">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase leading-tight line-clamp-2">{title}</h3>
                <div className="flex items-center space-x-1.5 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{location || "Kampus"}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${status === 'Upcoming' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                        {status === 'Upcoming' ? 'Kutilmoqda' : status === 'Ongoing' ? 'Davom etmoqda' : status}
                    </span>
                    <button className="p-2 md:p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all group-hover:scale-105 transform">
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function EventsPage() {
    const { user } = useUser(); // Hozirgi foydalanuvchi roli (student, teacher...)
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Barchasi');

    const categories = ['Barchasi', 'Workshops', 'Social', 'Music', 'Sports', 'Academic'];

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                // API ga foydalanuvchi rolini jo'natamiz, shunga mos tadbirlar keladi
                const data = await eventsApi.getEvents(user?.role || 'student');
                setEvents(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user?.role]);

    // Kategoriya bo'yicha filterlash
    const filteredEvents = useMemo(() => {
        if (activeCategory === 'Barchasi') return events;
        return events.filter(e => e.type === activeCategory);
    }, [events, activeCategory]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Section - Mobile First */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Kampus Tadbirlari</h1>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-3">
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span>{events.length} ta Tadbir</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Ro'yxatdan o'tish ochiq</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto">
                    {/* Faqat Admin yoki Teacher tadbir qo'sha olsa shu logic ishlaydi: */}
                    {['admin', 'teacher'].includes(user?.role) && (
                        <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-3.5 bg-[#1e293b] text-white rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 transform">
                            <Plus className="w-4 h-4" />
                            <span>Tadbir qo'shish</span>
                        </button>
                    )}
                    <button className="p-3 md:p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[24px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                        <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-10">
                
                {/* Chap Kolonka: Kalendar va Kategoriyalar */}
                <div className="space-y-6 md:space-y-8 order-2 xl:order-1">
                    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[32px] shadow-sm">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">May 2026</h3>
                            <div className="flex space-x-1.5">
                                <button className="p-1.5 md:p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                                <button className="p-1.5 md:p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2 md:mb-4">
                            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d, i) => (
                                <span key={i} className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 31 }).map((_, i) => (
                                <div key={i} className={`aspect-square flex items-center justify-center text-[10px] md:text-[11px] font-black rounded-lg md:rounded-xl cursor-pointer transition-all ${i === 14 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Kategoriyalar */}
                    <div className="p-2 space-y-3">
                        <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 md:ml-4">Kategoriyalar</h4>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 md:px-4 py-2 md:py-2.5 border rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${activeCategory === cat ? 'bg-slate-900 dark:bg-indigo-600 text-white border-transparent' : 'bg-white/40 dark:bg-slate-800/40 border-white dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* O'ng Kolonka: Events Grid */}
                <div className="xl:col-span-3 order-1 xl:order-2">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                            {[1, 2, 3].map(i => <div key={i} className="h-60 md:h-72 bg-slate-100 dark:bg-slate-800 rounded-[24px] animate-pulse"></div>)}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="py-16 md:py-24 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] md:rounded-[40px]">
                            <Compass className="w-10 h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 md:mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">Bu kategoriyada tadbir yo'q</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} {...event} />
                            ))}
                            
                            {/* "Ko'proq kashf etish" dummy kartasi */}
                            <div className="p-6 md:p-10 border-2 md:border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center text-center group bg-slate-50/20 dark:bg-slate-900/20 cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800 transition-all min-h-[200px]">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <Compass className="w-6 h-6 md:w-8 md:h-8 text-slate-300 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                </div>
                                <h4 className="text-xs md:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2">Boshqa klublar</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Yashirin tadbirlarni topish</p>
                            </div>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}
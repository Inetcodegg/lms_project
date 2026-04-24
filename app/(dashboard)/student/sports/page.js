"use client";
import React, { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import {
    Dumbbell, Calendar, Users, Trophy, CheckCircle2,
    MapPin, Clock, ArrowRight, Activity, Zap, Medal, 
    Loader2, Plus, Target, Star, X, AlertCircle
} from "lucide-react";
import { sportsApi } from "../../../../lib/api/sportsApi"; // Yuqoridagi Firebase API
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546519638-68e1004ddda8?w=800&q=80&auto=format&fit=crop";

const iconMap = { Trophy, Activity, Zap, Dumbbell, Medal, Target, Star };

// --- SPORT O'YINI KARTASI ---
const SportCard = ({ id, title, date, time, location, color, image, scoreTeam1, scoreTeam2, isLive = false, participants = [], onBook, user }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
    const [isBooking, setIsBooking] = useState(false);
    
    // Foydalanuvchi allaqachon band qilganmi?
    const isBooked = participants.some(p => p.userId === user?.uid);

    const handleBooking = async () => {
        setIsBooking(true);
        await onBook(id, title);
        setIsBooking(false);
    };

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col h-full">
            <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
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
                
                <div className="absolute top-3 left-3 md:top-4 md:left-4 flex gap-2">
                    {isLive ? (
                        <span className="px-2.5 py-1 bg-rose-500/90 backdrop-blur-md rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-rose-400 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            <span>Live</span>
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm border border-white dark:border-white/10">
                            Kelgusi O'yin
                        </span>
                    )}
                    {isBooked && (
                        <span className="px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3"/> Band qilingan
                        </span>
                    )}
                </div>
                
                {isLive && (
                    <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex justify-end text-white">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/80 leading-none mb-1">Hisob</p>
                            <p className="text-xl md:text-2xl font-black drop-shadow-md">{scoreTeam1 || 0} - {scoreTeam2 || 0}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 md:p-8 flex-1 flex flex-col">
                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight uppercase leading-tight line-clamp-2">{title}</h3>
                
                <div className="flex flex-col gap-2 text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{date} • {time}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-400 uppercase">
                        <Users className="w-3 h-3" /> <span>{participants.length} ishtirokchi</span>
                    </div>

                    {user?.role === 'student' && !isBooked && (
                        <button 
                            onClick={handleBooking} disabled={isBooking}
                            className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70"
                        >
                            {isBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Qatnashish"}
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
};


// --- ASOSIY SAHIFA ---
export default function SportsPage() {
    const { user } = useUser();
    
    const [categories, setCategories] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Admin Modals
    const [showAddCatModal, setShowAddCatModal] = useState(false);
    const [showAddMatchModal, setShowAddMatchModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [catForm, setCatForm] = useState({ title: "", members: "", iconName: "Trophy" });
    const [matchForm, setMatchForm] = useState({ title: "", date: "", time: "", location: "", color: "indigo" });

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 3500); };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [catData, matchesData] = await Promise.all([
                    sportsApi.getSportsCategories(),
                    sportsApi.getMatches()
                ]);
                setCategories(catData || []);
                setMatches(matchesData || []);
            } catch (error) {
                showToast("Ma'lumotlarni yuklashda xato", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // 🌟 Talaba O'yinga Qatnashishi (Ticket Booking)
    const handleBookTicket = async (matchId, matchTitle) => {
        if (!user) return showToast("Iltimos, tizimga kiring!", "error");
        
        try {
            await sportsApi.bookTicket(matchId, user.uid, user.name);
            
            // Ekranni tezkor yangilash
            setMatches(matches.map(m => m.id === matchId ? { ...m, participants: [...(m.participants || []), { userId: user.uid }] } : m));
            showToast("✓ Muvaffaqiyatli band qilindi!");

            // Notification yuborish
            await notificationsApi.sendNotification({
                title: "Sport: O'yin Band Qilindi",
                message: `Siz ${matchTitle} o'yinida qatnashish uchun ro'yxatdan o'tdingiz. Vaqtida kelishni unutmang!`,
                targetRoles: [user.uid],
                type: 'info',
                link: '/sports'
            });

        } catch (error) {
            showToast("Xatolik yuz berdi. Qayta urinib ko'ring.", "error");
        }
    };

    // 🌟 Admin: Kategoriya Qo'shish
    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const newCat = await sportsApi.createSportsCategory({
                title: catForm.title, members: catForm.members, icon: catForm.iconName
            });
            setCategories([newCat, ...categories]);
            setShowAddCatModal(false);
            setCatForm({ title: "", members: "", iconName: "Trophy" });
            showToast("Sport turi qo'shildi!");
        } catch (error) {
            showToast("Xatolik yuz berdi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🌟 Admin: Yangi O'yin Qo'shish
    const handleAddMatch = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const newMatch = await sportsApi.createMatch(matchForm);
            setMatches([newMatch, ...matches]);
            setShowAddMatchModal(false);
            setMatchForm({ title: "", date: "", time: "", location: "", color: "indigo" });
            showToast("Yangi o'yin e'lon qilindi!");

            // Barchaga yuborish
            await notificationsApi.sendNotification({
                title: "Yangi Sport Tadbiri",
                message: `${matchForm.title} uchun e'lon berildi. Qatnashish uchun ro'yxatdan o'ting!`,
                targetRoles: ['student'],
                type: 'info',
                link: '/sports'
            });

        } catch (error) {
            showToast("Xatolik yuz berdi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">

            {toast && (
                <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[600] px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Kampus Sporti</h1>
                    <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        <Medal className="w-3.5 h-3.5 text-amber-500" />
                        <span>Barcha talabalar uchun musobaqalar va to'garaklar</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {user?.role === 'admin' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setShowAddCatModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Kategoriya
                            </button>
                            <button onClick={() => setShowAddMatchModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> O'yin
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Sport Turlari (Categories) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-12">
                {loading ? (
                    [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse"></div>)
                ) : categories.length === 0 ? (
                    <div className="col-span-full py-10 text-center bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sport turlari mavjud emas</p>
                    </div>
                ) : (
                    categories.map((section) => {
                        const Icon = iconMap[section.icon] || Trophy; 
                        return (
                            <Card key={section.id} className="p-5 md:p-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-all group flex items-center space-x-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 line-clamp-1">{section.title}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{section.members}</p>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* O'yinlar (Matches) */}
            <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-rose-500"/> Bo'lajak Musobaqalar
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)}
                    </div>
                ) : matches.length === 0 ? (
                    <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px]">
                        <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Hozircha o'yinlar belgilanmagan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {matches.map(match => (
                            <SportCard key={match.id} {...match} user={user} onBook={handleBookTicket} />
                        ))}
                    </div>
                )}
            </div>

            {/* --- ADMIN MODALS --- */}
            {showAddCatModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddCatModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div><h3 className="text-xl font-black">Sport qo'shish</h3></div>
                            <button onClick={() => setShowAddCatModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <input required type="text" placeholder="Nomi" value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input required type="text" placeholder="Tavsifi (masalan: 12 kishi)" value={catForm.members} onChange={(e) => setCatForm({ ...catForm, members: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                            <select value={catForm.iconName} onChange={(e) => setCatForm({ ...catForm, iconName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none">
                                {Object.keys(iconMap).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest">{isSubmitting ? "Kuting..." : "Saqlash"}</button>
                        </form>
                    </div>
                </div>
            )}

            {showAddMatchModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddMatchModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div><h3 className="text-xl font-black">Yangi O'yin</h3></div>
                            <button onClick={() => setShowAddMatchModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddMatch} className="space-y-4">
                            <input required type="text" placeholder="O'yin nomi (Universitet vs ...)" value={matchForm.title} onChange={(e) => setMatchForm({ ...matchForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="date" value={matchForm.date} onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none" />
                                <input required type="time" value={matchForm.time} onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none" />
                            </div>
                            <input required type="text" placeholder="Joylashuv (Masalan: Sport zal 2)" value={matchForm.location} onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none" />
                            <select value={matchForm.color} onChange={(e) => setMatchForm({ ...matchForm, color: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none">
                                <option value="indigo">Binafsha</option><option value="emerald">Yashil</option><option value="orange">Apelsin</option><option value="rose">Qizil</option>
                            </select>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest">{isSubmitting ? "Kuting..." : "E'lon Qilish"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
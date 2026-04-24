"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../../components/Card";
import {
    Dumbbell, Calendar, Users, Trophy, CheckCircle2,
    MapPin, Clock, ArrowRight, Activity, Zap, Medal, 
    Loader2, Plus, Target, Star, X, AlertCircle, Newspaper, Ticket, Trash2, ShieldAlert
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, query, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { sportsApi } from "../../../../lib/api/sportsApi"; 
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546519638-68e1004ddda8?w=800&q=80&auto=format&fit=crop";
const iconMap = { Trophy, Activity, Zap, Dumbbell, Medal, Target, Star };

// --- SPORT O'YINI KARTASI (Matches) ---
const SportCard = ({ id, title, date, time, location, color, image, scoreTeam1, scoreTeam2, isLive = false, participants = [], onBook, onDelete, user }) => {
    const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
    const [isBooking, setIsBooking] = useState(false);
    
    const isBooked = participants.some(p => p.userId === user?.uid);

    const handleBooking = async () => {
        setIsBooking(true);
        await onBook(id, title);
        setIsBooking(false);
    };

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col h-full">
            <div className="relative h-36 md:h-40 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                <img src={imgSrc} onError={() => setImgSrc(FALLBACK_IMAGE)} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute inset-0 opacity-80 mix-blend-multiply ${color === 'orange' ? 'bg-orange-900' : color === 'emerald' ? 'bg-emerald-900' : color === 'rose' ? 'bg-rose-900' : 'bg-indigo-900'}`}></div>
                
                <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
                    {isLive ? (
                        <span className="px-2.5 py-1 bg-rose-500/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-rose-400 flex items-center space-x-1.5 w-max">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span><span>Live Score</span>
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm w-max">
                            Kelgusi O'yin
                        </span>
                    )}
                    {isBooked && (
                        <span className="px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3"/> Band qilingan
                        </span>
                    )}
                </div>
                
                {user?.role === 'admin' && (
                    <button onClick={() => onDelete(id)} className="absolute top-3 right-3 p-2 bg-rose-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}

                {isLive && (
                    <div className="absolute bottom-4 right-4 flex flex-col items-end text-white">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/80 leading-none mb-1">Hisob</p>
                        <p className="text-2xl font-black drop-shadow-md">{scoreTeam1 || 0} - {scoreTeam2 || 0}</p>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tight uppercase leading-tight line-clamp-2">{title}</h3>
                
                <div className="flex flex-col gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> <span className="truncate">{location}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> <span>{date} • {time}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[10px] font-black text-slate-400 uppercase">
                        <Users className="w-3.5 h-3.5" /> <span>{participants.length} qatnashchi</span>
                    </div>

                    {user?.role === 'student' && !isBooked && (
                        <button onClick={handleBooking} disabled={isBooking} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70">
                            {isBooking ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : "Qatnashish"}
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
    
    const [activeTab, setActiveTab] = useState("matches"); // 'matches' | 'news'
    const [categories, setCategories] = useState([]);
    const [matches, setMatches] = useState([]);
    const [sportsNews, setSportsNews] = useState([]); // Admin yuborgan Sport E'lonlari
    
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
                
                // 1. Kategoriyalar va O'yinlar (Sports API)
                const catData = await sportsApi.getSportsCategories();
                const matchesData = await sportsApi.getMatches();
                
                // 2. Sport E'lonlari va So'rovnomalari (News API dan filtrlab olamiz)
                const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
                const snapNews = await getDocs(qNews);
                const allNews = snapNews.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Faqat "Sport" kategoriyasidagilar yoki matnida sport bo'lgan e'lonlar
                const sNews = allNews.filter(n => n.category === "Sport" || n.title?.toLowerCase().includes("sport") || n.title?.toLowerCase().includes("turnir"));

                setCategories(catData || []);
                setMatches(matchesData || []);
                setSportsNews(sNews);
            } catch (error) {
                showToast("Ma'lumotlarni yuklashda xato", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleBookTicket = async (matchId, matchTitle) => {
        if (!user) return showToast("Iltimos, tizimga kiring!", "error");
        try {
            await sportsApi.bookTicket(matchId, user.uid, user.name);
            setMatches(matches.map(m => m.id === matchId ? { ...m, participants: [...(m.participants || []), { userId: user.uid }] } : m));
            showToast("✓ Muvaffaqiyatli band qilindi!");
            await notificationsApi.sendNotification({
                title: "Sport: O'yin Band Qilindi",
                message: `Siz ${matchTitle} o'yinida qatnashish uchun ro'yxatdan o'tdingiz.`,
                targetRoles: [user.uid], type: 'info', link: '/sports'
            });
        } catch (error) { showToast("Xatolik yuz berdi.", "error"); }
    };

    const handleDeleteMatch = async (matchId) => {
        if (!window.confirm("O'yinni o'chirasizmi?")) return;
        try {
            await sportsApi.deleteMatch(matchId); // API da deleteMatch bor deb hisoblaymiz
            setMatches(matches.filter(m => m.id !== matchId));
            showToast("O'yin o'chirildi");
        } catch (err) { showToast("Xatolik", "error"); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const newCat = await sportsApi.createSportsCategory({ title: catForm.title, members: catForm.members, icon: catForm.iconName });
            setCategories([newCat, ...categories]);
            setShowAddCatModal(false);
            setCatForm({ title: "", members: "", iconName: "Trophy" });
            showToast("Sport turi qo'shildi!");
        } catch (error) { showToast("Xatolik yuz berdi", "error"); } finally { setIsSubmitting(false); }
    };

    const handleAddMatch = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const newMatch = await sportsApi.createMatch(matchForm);
            setMatches([newMatch, ...matches]);
            setShowAddMatchModal(false);
            setMatchForm({ title: "", date: "", time: "", location: "", color: "indigo" });
            showToast("Yangi o'yin e'lon qilindi!");
            await notificationsApi.sendNotification({
                title: "Yangi Sport Tadbiri", message: `${matchForm.title} bo'lib o'tadi. Qatnashish uchun ro'yxatdan o'ting!`,
                targetRoles: ['student'], type: 'sports', link: '/sports'
            });
        } catch (error) { showToast("Xatolik yuz berdi", "error"); } finally { setIsSubmitting(false); }
    };

    // Sport Yangiligini (E'lonni) O'chirish
    const handleDeleteNews = async (id) => {
        if (!window.confirm("E'lonni o'chirasizmi?")) return;
        try {
            await deleteDoc(doc(db, "news", id));
            setSportsNews(sportsNews.filter(n => n.id !== id));
            showToast("E'lon o'chirildi");
        } catch (err) { showToast("Xatolik", "error"); }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">

            {toast && (
                <div className={`fixed top-6 right-6 z-[900] px-6 py-4 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Kampus Sporti</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <Medal className="w-4 h-4 mr-2 text-amber-500" /> Barcha musobaqalar, to'garaklar va sport e'lonlari
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Tab Navigation */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-auto shadow-sm border border-slate-200 dark:border-white/5">
                        <button onClick={() => setActiveTab('matches')} className={`flex-1 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                            <Trophy className="w-4 h-4" /> O'yinlar
                        </button>
                        <button onClick={() => setActiveTab('news')} className={`flex-1 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'news' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                            <Newspaper className="w-4 h-4" /> E'lonlar
                        </button>
                    </div>

                    {user?.role === 'admin' && activeTab === 'matches' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setShowAddCatModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Kategoriya
                            </button>
                            <button onClick={() => setShowAddMatchModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                                <Plus className="w-3.5 h-3.5 mr-1" /> O'yin
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Sport Turlari (Categories) - Har doim tepada turadi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-10">
                {loading ? (
                    [1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)
                ) : categories.length === 0 ? (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sport turlari mavjud emas</p>
                    </div>
                ) : (
                    categories.map((section) => {
                        const Icon = iconMap[section.icon] || Trophy; 
                        return (
                            <Card key={section.id} className="p-4 md:p-5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex items-center space-x-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
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

            {/* --- TAB CONTENT --- */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner className="w-10 h-10 text-indigo-500 animate-spin"/></div>
            ) : activeTab === 'matches' ? (
                
                /* ================= MUSOBAQALAR (MATCHES) ================= */
                <div className="animate-in fade-in">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-rose-500"/> O'yinlar Jadvali
                    </h2>
                    {matches.length === 0 ? (
                        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                            <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Hozircha o'yinlar belgilanmagan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {matches.map(match => (
                                <SportCard key={match.id} {...match} user={user} onBook={handleBookTicket} onDelete={handleDeleteMatch} />
                            ))}
                        </div>
                    )}
                </div>

            ) : (

                /* ================= SPORT E'LONLARI VA SO'ROVNOMALAR ================= */
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6 flex items-center">
                        <Newspaper className="w-5 h-5 mr-2 text-emerald-500"/> Sport E'lonlari va So'rovnomalar
                    </h2>
                    {sportsNews.length === 0 ? (
                        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                            <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Hozircha sport e'lonlari yo'q</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {sportsNews.map((item) => {
                                // Qatnashish statistikasi
                                const approvedCount = item.requests?.filter(r => r.status === 'approved').length || 0;
                                const totalReqs = item.requests?.length || 0;

                                return (
                                    <Card key={item.id} className="p-0 overflow-hidden group border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full">
                                        <div className="p-5 border-b border-slate-50 dark:border-white/5 flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                                <Dumbbell className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded text-[8px] font-black uppercase tracking-widest">Sport E'loni</span>
                                                    {item.requiresRegistration && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Ticket className="w-3 h-3"/> Arizali</span>}
                                                </div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight line-clamp-2">{item.title}</h3>
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 flex-1 flex flex-col gap-3">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{item.content || item.description}</p>
                                            
                                            {item.requiresRegistration && (
                                                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                                        <span>Arizalar Holati</span>
                                                        <span className="text-emerald-500">{approvedCount} / {item.maxParticipants} tasdiqlandi</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (approvedCount / item.maxParticipants) * 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-2 text-right">Jami: {totalReqs} ta ariza</p>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {item.createdAt?.toDate().toLocaleDateString()}</span>
                                                {user?.role === 'admin' && (
                                                    <button onClick={() => handleDeleteNews(item.id)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}


            {/* --- ADMIN MODALS (Category & Match) --- */}
            {/* Modal kodlari avvalgisidek ixcham va chiroyli (uzunlikni tejash uchun kodni xuddi tepadagidek qoldiramiz) */}
            {showAddCatModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddCatModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">Sport qo'shish</h3>
                            <button onClick={() => setShowAddCatModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <input required type="text" placeholder="Nomi" value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input required type="text" placeholder="Tavsifi (masalan: 12 kishi)" value={catForm.members} onChange={(e) => setCatForm({ ...catForm, members: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                            <select value={catForm.iconName} onChange={(e) => setCatForm({ ...catForm, iconName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none">
                                {Object.keys(iconMap).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700">{isSubmitting ? "Kuting..." : "Saqlash"}</button>
                        </form>
                    </div>
                </div>
            )}

            {showAddMatchModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddMatchModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">Yangi O'yin</h3>
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
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600">{isSubmitting ? "Kuting..." : "E'lon Qilish"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bell, Search, LogOut, User,
    Moon, Sun, ChevronDown, Menu,
    CheckCircle2, Info, CalendarClock, AlertTriangle,
    Monitor, Palette, LayoutDashboard, Trophy,
    GraduationCap, Medal, Newspaper, FileText, Settings, PackageSearch, Loader2
} from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { auth, db } from '../lib/firebase';
import { notificationsApi } from '../lib/api/notificationsApi';
import { useTheme } from 'next-themes';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

const getStaticModules = (role) => [
    { id: 'm1', title: "Bosh sahifa", subtitle: "Asosiy oyna", path: `/${role}/dashboard`, icon: LayoutDashboard, type: 'module' },
    { id: 'm2', title: "Dars jadvali", subtitle: "Haftalik darslar", path: `/${role}/schedule`, icon: CalendarClock, type: 'module' },
    { id: 'm3', title: "Akademik Reyting", subtitle: "O'zlashtirish", path: `/${role}/ranking`, icon: Trophy, type: 'module' },
    { id: 'm4', title: "O'qituvchilar", subtitle: "Professorlar bazasi", path: `/${role}/teachers`, icon: GraduationCap, type: 'module' },
    { id: 'm5', title: "Kampus Sporti", subtitle: "Sport va to'garaklar", path: `/${role}/sports`, icon: Medal, type: 'module' },
    { id: 'm6', title: "Yangiliklar", subtitle: "Universitet hayoti", path: `/${role}/news`, icon: Newspaper, type: 'module' },
    { id: 'm7', title: "Hujjatlar", subtitle: "So'rovlar va arizalar", path: `/${role}/docs`, icon: FileText, type: 'module' },
    { id: 'm8', title: "Yo'qotilgan va Topilgan", subtitle: "Buyumlar tizimi", path: `/${role}/lost-found`, icon: PackageSearch, type: 'module' },
    ...(role === 'admin' ? [{ id: 'm9', title: "Tizim Boshqaruvi", subtitle: "Admin panel", path: `/admin/management`, icon: Settings, type: 'module' }] : [])
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useUser();

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // --- Dropdown States ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);

    // --- GLOBAL QIDIRUV (SMART SEARCH) STATES ---
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const themeRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) mainContainer.style.paddingTop = '80px';
    }, []);

    // Scroll Animation
    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (!scrollContainer) return;

        const handleScroll = () => {
            const currentScrollY = scrollContainer.scrollTop;
            if (currentScrollY < 50) setIsVisible(true);
            else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) setIsVisible(false);
            else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 5) setIsVisible(true);

            setLastScrollY(currentScrollY);
            setIsProfileOpen(false);
            setIsNotifOpen(false);
            setIsThemeOpen(false);
            setIsSearchOpen(false);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Xabarlar
    useEffect(() => {
        if (!user || !user.uid) return;
        const unsubscribe = notificationsApi.listenToNotifications(user, (data) => {
            // Mantiq: Bazadan kelgan xatolar (hammaga kelgan xabarlar) filtri (Backenddagi xatoni yopish)
            const safeData = data.filter(n =>
                n.targetRoles?.includes(user.uid) ||
                n.targetRoles?.includes(user.role) ||
                n.targetRoles?.includes(user.groupId) ||
                n.targetRoles?.includes('all')
            );
            setNotifications(safeData);
            setUnreadCount(safeData.filter(n => !n.read).length);
        });
        return () => unsubscribe();
    }, [user]);

    // Tashqariga bosganda yopish
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
            if (themeRef.current && !themeRef.current.contains(event.target)) setIsThemeOpen(false);
            if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // --- 🌟 HAQIQIY GLOBAL QIDIRUV LOGIKASI ---
    useEffect(() => {
        const fetchGlobalData = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const qText = searchQuery.toLowerCase();
                const results = [];
                const role = user?.role || 'student';

                const staticMods = getStaticModules(role);
                const matchedMods = staticMods.filter(m => m.title.toLowerCase().includes(qText) || m.subtitle.toLowerCase().includes(qText));
                results.push(...matchedMods);

                const [newsSnap, usersSnap, itemsSnap] = await Promise.all([
                    getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(50))),
                    getDocs(query(collection(db, "users"), limit(50))),
                    getDocs(query(collection(db, "lost_found"), orderBy("createdAt", "desc"), limit(50)))
                ]);

                newsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.title?.toLowerCase().includes(qText) || data.content?.toLowerCase().includes(qText)) {
                        results.push({
                            id: doc.id, title: data.title, subtitle: data.category,
                            path: `/${role}/news`, icon: Newspaper, type: 'news'
                        });
                    }
                });

                usersSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.name?.toLowerCase().includes(qText) || data.department?.toLowerCase().includes(qText) || data.subjects?.some(s => s.toLowerCase().includes(qText))) {
                        results.push({
                            id: doc.id, title: data.name, subtitle: data.role === 'teacher' ? data.department || "O'qituvchi" : "Talaba",
                            path: data.role === 'teacher' ? `/${role}/teachers` : `/${role}/ranking`, icon: data.role === 'teacher' ? GraduationCap : User, type: 'person'
                        });
                    }
                });

                itemsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.title?.toLowerCase().includes(qText) || data.location?.toLowerCase().includes(qText)) {
                        results.push({
                            id: doc.id, title: data.title, subtitle: data.status === 'Found' ? "Topilgan" : "Yo'qolgan",
                            path: `/${role}/lost-found`, icon: PackageSearch, type: 'item'
                        });
                    }
                });

                const uniqueResults = Array.from(new Set(results.map(a => a.id))).map(id => results.find(a => a.id === id)).slice(0, 8);
                setSearchResults(uniqueResults);
            } catch (error) {
                console.error("Qidiruvda xatolik:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchGlobalData(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, user?.role]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.trim().length > 0) setIsSearchOpen(true);
        else setIsSearchOpen(false);
    };

    const handleSearchSelect = (path) => {
        router.push(path);
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            if (logout) logout();
            router.replace('/login');
        } catch (error) { console.error("Chiqishda xato:", error); }
    };

    // 🌟 AQLLI LINK TIZIMI
    const getSmartLink = (rawLink) => {
        if (!rawLink || !user?.role) return '/';
        // Oldingi qotib qolgan (xato) linklarni ushbu foydalanuvchining joriy roliga moslaymiz.
        // Masalan: Link "/student/assignments" bo'lsa-yu, foydalanuvchi "teacher" bo'lsa -> "/teacher/assignments" ga aylantiriladi.
        const pathParts = rawLink.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
            const section = pathParts[1];
            return `/${user.role}/${section}`;
        }
        return `/${user.role}/dashboard`;
    };

    const handleReadNotif = async (notif) => {
        if (!notif.read) {
            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
            await notificationsApi.markAsRead(notif.id, user.uid, notif.readBy);
        }
        if (notif.link) {
            const safeLink = getSmartLink(notif.link);
            router.push(safeLink);
            setIsNotifOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        await notificationsApi.markAllAsRead(notifications, user.uid);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'schedule': return <CalendarClock className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    const getPageTitle = () => {
        const path = pathname.split('/').pop();
        if (!path || path === user?.role) return "Bosh Sahifa";
        const titles = {
            'schedule': "Dars Jadvali",
            'ranking': "Akademik Reyting",
            'teachers': "Ustozlar",
            'sports': "Kampus Sporti",
            'news': "Yangiliklar",
            'profile': "Profil",
            'notifications': "Xabarnomalar",
            'management': "Boshqaruv",
            'docs': "Hujjatlar",
            'lost-found': "Yo'qolgan Buyumlar",
            'assignments': "Vazifalar",
            'grading': "Baholash"
        };
        return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <header
            className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="flex items-center justify-between px-4 md:px-6 lg:px-10 h-16 md:h-20 max-w-[1920px] mx-auto gap-4">

                    {/* Chap qism */}
                    <div className="flex items-center space-x-3 shrink-0">
                        <button
                            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none drop-shadow-sm">
                                {getPageTitle()}
                            </h2>
                        </div>
                    </div>

                    {/* O'rta qism: QIDIRUV */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-auto relative z-[600]" ref={searchRef}>
                        <div className="relative w-full group">
                            {isSearching ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin z-10" />
                            ) : (
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                            )}

                            <input
                                type="text"
                                placeholder="Ism, maqola, dars yoki buyum izlash..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => searchQuery.trim().length > 0 && setIsSearchOpen(true)}
                                className={`w-full bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/10 py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-md ${isSearchOpen ? 'rounded-t-2xl rounded-b-none border-b-transparent' : 'rounded-2xl'}`}
                            />

                            {isSearchOpen && (
                                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-t-0 border-slate-200/50 dark:border-white/10 rounded-b-2xl shadow-2xl overflow-hidden pt-1">
                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">

                                        {isSearching && searchResults.length === 0 ? (
                                            <div className="py-8 text-center text-slate-400 flex flex-col items-center animate-in fade-in duration-300">
                                                <Loader2 className="w-6 h-6 mb-2 text-indigo-400 animate-spin" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Ma'lumotlar bazasi qidirilmoqda...</span>
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="py-8 text-center text-slate-400 flex flex-col items-center animate-in fade-in duration-300">
                                                <Search className="w-6 h-6 mb-2 opacity-20" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Hech narsa topilmadi</span>
                                            </div>
                                        ) : (
                                            searchResults.map((result, index) => {
                                                const Icon = result.icon;
                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => handleSearchSelect(result.path)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-left transition-colors group animate-in slide-in-from-bottom-2 fade-in fill-mode-both"
                                                        style={{ animationDelay: `${index * 30}ms` }}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors
                                                            ${result.type === 'person' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                                                                result.type === 'news' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                                                                    result.type === 'item' ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' :
                                                                        'bg-slate-100 text-slate-500 dark:bg-slate-700/50 group-hover:bg-white dark:group-hover:bg-slate-700'}
                                                        `}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{result.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{result.subtitle}</span>
                                                                {result.type !== 'module' && <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full shrink-0"></span>}
                                                                {result.type !== 'module' && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{result.type}</span>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* O'ng qism */}
                    <div className="flex items-center space-x-2 md:space-x-4 shrink-0">

                        {/* THEME TOGGLE */}
                        {mounted && (
                            <div className="relative hidden sm:block" ref={themeRef}>
                                <button
                                    onClick={() => { setIsThemeOpen(!isThemeOpen); setIsNotifOpen(false); setIsProfileOpen(false); setIsSearchOpen(false); }}
                                    className={`p-2 md:p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl transition-all shadow-sm ${isThemeOpen ? 'ring-2 ring-indigo-500/20' : ''}`}
                                >
                                    <Palette className="w-4 h-4 md:w-5 md:h-5" />
                                </button>

                                {isThemeOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50 p-2">
                                        <div className="px-3 py-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tashqi ko'rinish</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => setTheme('light')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border ${theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                    <Sun className="w-4 h-4" /> <span className="text-[9px] font-bold">Yorug'</span>
                                                </button>
                                                <button onClick={() => setTheme('dark')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border ${theme === 'dark' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                    <Moon className="w-4 h-4" /> <span className="text-[9px] font-bold">Qorong'i</span>
                                                </button>
                                                <button onClick={() => setTheme('system')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border ${theme === 'system' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                    <Monitor className="w-4 h-4" /> <span className="text-[9px] font-bold">Tizim</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 🌟 XABARNOMALAR */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); setIsThemeOpen(false); setIsSearchOpen(false); }}
                                className="relative p-2 md:p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl transition-all group shadow-sm"
                            >
                                <Bell className="w-4 h-4 md:w-5 md:h-5 group-hover:animate-swing" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 md:h-5 md:w-5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative flex items-center justify-center rounded-full h-4 w-4 md:h-5 md:w-5 bg-rose-500 border-2 border-white dark:border-slate-900 text-[9px] md:text-[10px] text-white font-black shadow-md">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-[300px] sm:w-80 md:w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
                                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Xabarnomalar</h3>
                                        {unreadCount > 0 ? (
                                            <button onClick={handleMarkAllRead} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 transition-colors">Barchasini O'qish</button>
                                        ) : (
                                            <Link href={`/${user?.role || 'student'}/notifications`} onClick={() => setIsNotifOpen(false)} className="text-[9px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">To'liq Ko'rish</Link>
                                        )}
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400">
                                                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Hozircha xabarlar yo'q</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50 dark:divide-white/5">
                                                {notifications.slice(0, 5).map((notif) => (
                                                    <div key={notif.id} onClick={() => handleReadNotif(notif)} className={`p-4 cursor-pointer transition-colors flex items-start gap-3 relative group ${notif.read ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/30 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20'}`}>
                                                        {!notif.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>}
                                                        <div className={`p-2 rounded-xl shrink-0 ${notif.read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5'}`}>
                                                            {getIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-1 pr-2">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className={`text-xs line-clamp-1 ${notif.read ? 'font-bold text-slate-600 dark:text-slate-300' : 'font-black text-slate-900 dark:text-white'}`}>{notif.title}</h4>
                                                                {notif.read && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                            </div>
                                                            <p className={`text-[11px] leading-snug line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>{notif.message}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{notif.time}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50">
                                        <Link href={`/${user?.role || 'student'}/notifications`} onClick={() => setIsNotifOpen(false)}>
                                            <button className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
                                                Barcha xabarlarga o'tish
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PROFIL MENU */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); setIsThemeOpen(false); setIsSearchOpen(false); }}
                                className="flex items-center space-x-2 md:space-x-3 p-1 pr-2 md:pr-3 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-full md:rounded-[24px] transition-all shadow-sm"
                            >
                                <img
                                    src={user?.avatar || FALLBACK_AVATAR}
                                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR }}
                                    alt="Profile"
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 ring-2 ring-white/50 dark:ring-slate-700/50"
                                />
                                <div className="hidden sm:flex flex-col items-start text-left">
                                    <span className="text-[11px] md:text-[13px] font-black text-slate-800 dark:text-white leading-none mb-1 line-clamp-1 max-w-[100px] drop-shadow-sm">{user?.name || "Foydalanuvchi"}</span>
                                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">{user?.role || "Student"}</span>
                                </div>
                                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-500 ml-1 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
                                    <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{user?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1">{user?.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <Link href={`/${user?.role || 'student'}/profile`} onClick={() => setIsProfileOpen(false)}>
                                            <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                                <User className="w-4 h-4" />
                                                <span>Shaxsiy Profil</span>
                                            </div>
                                        </Link>

                                        <div className="sm:hidden border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-4 py-3 flex justify-between items-center">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Mavzu:</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Sun className="w-4 h-4" /></button>
                                                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}><Moon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Chiqish</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </header>
    );
}
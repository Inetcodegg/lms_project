"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Bell, Search, LogOut, User, 
    Settings, Moon, Sun, ChevronDown, Menu,
    CheckCircle2, Info, CalendarClock, AlertTriangle
} from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { useLanguage } from '../lib/LanguageContext';
import { auth } from '../lib/firebase';
import { notificationsApi } from '../lib/api/notificationsApi';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useUser();
    const { language, changeLanguage, t } = useLanguage();
    
    // --- Holatlar (States) ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false); // Xabarlar dropdowni
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isVisible, setIsVisible] = useState(true); 
    const [lastScrollY, setLastScrollY] = useState(0);
    
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // 1. Glassmorphism Padding
    useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) mainContainer.style.paddingTop = '80px';
    }, []);

    // 2. Scroll Animation
    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (!scrollContainer) return;

        const handleScroll = () => {
            const currentScrollY = scrollContainer.scrollTop;
            if (currentScrollY < 50) setIsVisible(true);
            else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) setIsVisible(false);
            else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 5) setIsVisible(true);
            
            setLastScrollY(currentScrollY);
            // Scroll qilinganda ochiq dropdownlarni yopish
            setIsProfileOpen(false);
            setIsNotifOpen(false);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // 3. JONLI XABARLARNI ESHITISH VA QIZIL RAQAM
    useEffect(() => {
        if (!user || !user.uid) return;
        
        // 💡 Diqqat: Yangilangan API da endi butun `user` obyekti berilyapti
        const unsubscribe = notificationsApi.listenToNotifications(user, (data) => {
            setNotifications(data);
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);
        });

        // Brauzer xabarnomasiga ruxsat so'rash
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        return () => unsubscribe();
    }, [user]);

    // 4. Tashqariga bosganda menyularni yopish
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- ACTIONS ---
    const handleSignOut = async () => {
        try {
            await auth.signOut();
            if (logout) logout();
            router.replace('/login');
        } catch (error) { console.error("Chiqishda xato:", error); }
    };

    const handleReadNotif = async (notif) => {
        if (!notif.read) {
            // Ekranda darhol o'chadi
            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
            await notificationsApi.markAsRead(notif.id, user.uid, notif.readBy);
        }
        if (notif.link) {
            router.push(notif.link);
            setIsNotifOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        await notificationsApi.markAllAsRead(notifications, user.uid);
    };

    // UI Yordamchilar
    const getIcon = (type) => {
        switch (type) {
            case 'schedule': return <CalendarClock className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    const getPageTitle = () => {
        const path = pathname.split('/').pop();
        if (!path || path === user?.role) return t('dashboard') || "Bosh Sahifa";
        const titles = {
            'schedule': t('schedule') || "Dars Jadvali",
            'rankings': t('rankings', "Akademik Reyting"),
            'teachers': t('teachers') || "Ustozlar",
            'sports': t('sports', "Kampus Sporti"),
            'news': t('news') || "Yangiliklar",
            'profile': t('profile') || "Profil",
            'notifications': t('notifications', "Xabarnomalar"),
            'management': "Boshqaruv"
        };
        return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <header 
            className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
            <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="flex items-center justify-between px-4 md:px-6 lg:px-10 h-16 md:h-20 max-w-[1920px] mx-auto">
                    
                    {/* Chap qism */}
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                            className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none drop-shadow-sm">
                                {getPageTitle()}
                            </h2>
                            <p className="text-[9px] md:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1 hidden sm:block">
                                Aetheria Portal
                            </p>
                        </div>
                    </div>

                    {/* O'rta qism: Qidiruv */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder') || "Qidiruv..."}
                                className="w-full bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-md"
                            />
                        </div>
                    </div>

                    {/* O'ng qism */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        
                        <div className="relative hidden sm:flex items-center">
                            <select 
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="appearance-none bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 rounded-xl py-2 pl-3 pr-8 text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all uppercase tracking-widest cursor-pointer shadow-sm backdrop-blur-md"
                            >
                                <option value="uz" className="text-slate-900 bg-white font-bold">UZ</option>
                                <option value="ru" className="text-slate-900 bg-white font-bold">RU</option>
                                <option value="en" className="text-slate-900 bg-white font-bold">EN</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="hidden sm:flex p-2 md:p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/10 shadow-sm"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>

                        {/* XABARNOMALAR (QO'NG'IROQCHA DROPDOWN) */}
                        <div className="relative" ref={notifRef}>
                            <button 
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                                className="relative p-2 md:p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl transition-all group shadow-sm"
                            >
                                <Bell className="w-4 h-4 md:w-5 md:h-5 group-hover:animate-swing" />
                                
                                {/* QIZIL RAQAMCHA */}
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 md:h-5 md:w-5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative flex items-center justify-center rounded-full h-4 w-4 md:h-5 md:w-5 bg-rose-500 border-2 border-white dark:border-slate-900 text-[9px] md:text-[10px] text-white font-black shadow-md">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* DROPDOWN OYNASI */}
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
                                                    <div 
                                                        key={notif.id} 
                                                        onClick={() => handleReadNotif(notif)}
                                                        className={`p-4 cursor-pointer transition-colors flex items-start gap-3 relative group ${notif.read ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/30 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20'}`}
                                                    >
                                                        {/* O'qilmagan chiziqcha */}
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
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                                className="flex items-center space-x-2 md:space-x-3 p-1 pr-2 md:pr-3 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-full md:rounded-[24px] transition-all shadow-sm"
                            >
                                <img 
                                    src={user?.avatar || FALLBACK_AVATAR} 
                                    onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                    alt="Profile" 
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 ring-2 ring-white/50 dark:ring-slate-700/50"
                                />
                                <div className="hidden sm:flex flex-col items-start text-left">
                                    <span className="text-[11px] md:text-[13px] font-black text-slate-800 dark:text-white leading-none mb-1 line-clamp-1 max-w-[100px] drop-shadow-sm">{user?.name || t('guestUser')}</span>
                                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">{user?.role || "Student"}</span>
                                </div>
                                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-500 ml-1 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
                                    <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{user?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1">{user?.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <Link href={`/${user?.role || 'student'}/profile`} onClick={() => setIsProfileOpen(false)}>
                                            <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                                <User className="w-4 h-4" />
                                                <span>{t('myProfile') || "Profil"}</span>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="p-2 border-t border-slate-100 dark:border-white/5">
                                        <button 
                                            onClick={handleSignOut}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>{t('signOut') || "Chiqish"}</span>
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
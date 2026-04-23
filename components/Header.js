"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Bell, Search, LogOut, User, 
    Settings, Moon, Sun, ChevronDown, Menu 
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
    
    // Holatlar (States)
    const [unreadCount, setUnreadCount] = useState(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isVisible, setIsVisible] = useState(true); // Header ko'rinish holati
    const [lastScrollY, setLastScrollY] = useState(0); // Scroll pozitsiyasi
    
    const dropdownRef = useRef(null);

    // 1. Shisha effekti (Glassmorphism) uchun kontentni Header tagidan o'tkazish
    useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            // Header'ning balandligicha (80px) joy ochib beramiz
            mainContainer.style.paddingTop = '80px';
        }
    }, []);

    // 2. Scroll animatsiyasini eshitish (Tepaga chiqsa yashirish, pastga tushsa ko'rsatish)
    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (!scrollContainer) return;

        const handleScroll = () => {
            const currentScrollY = scrollContainer.scrollTop;
            
            if (currentScrollY < 50) {
                setIsVisible(true); // Eng tepada doim ko'rinadi
            } else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) {
                setIsVisible(false); // Pastga scroll qilganda yashirinadi
            } else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 5) {
                setIsVisible(true); // Tepaga scroll qilganda qayta chiqadi
            }
            
            setLastScrollY(currentScrollY);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // 3. Jonli Xabarnomalarni (Real-time) eshitish
    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = notificationsApi.listenToNotifications(user.role, user.uid, (data) => {
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);
        });
        return () => unsubscribe();
    }, [user?.uid, user?.role]);

    // 4. Dropdown menyuni tashqarisiga bosganda yopish
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

        const handleSignOut = async () => {
                try {
                    await auth.signOut(); // Firebase'dan uzadi
                    if (logout) logout(); // UserContext ni tozalaydi
                    router.replace('/login'); // Srazu Login sahifasiga otadi va tarixni tozalaydi
                } catch (error) {
                    console.error("Chiqishda xato:", error);
                }
            };

    const getPageTitle = () => {
        const path = pathname.split('/').pop();
        if (!path || path === user?.role) return t('dashboard');
        
        const titles = {
            'schedule': t('schedule'),
            'rankings': t('rankings', "Akademik Reyting"), // fallback to string if not in translation
            'teachers': t('teachers'),
            'sports': t('sports', "Kampus Sporti"),
            'news': t('news'),
            'forum': t('forum'),
            'lost-found': t('lostFound'),
            'cafeteria': t('cafeteria'),
            'applications': t('documents'),
            'profile': t('profile'),
            'help': t('support'),
            'notifications': t('notifications', "Xabarnomalar")
        };
        return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <header 
            className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
            {/* Asosiy Glassmorphism qatlami */}
            <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="flex items-center justify-between px-4 md:px-6 lg:px-10 h-16 md:h-20 max-w-[1920px] mx-auto">
                    
                    {/* Chap qism: Sahifa Nomi */}
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

                    {/* O'rta qism: Qidiruv (Faqat katta ekranlarda ko'rinadi) */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="w-full bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-md"
                            />
                        </div>
                    </div>

                    {/* O'ng qism: Xabarnomalar va Profil */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        
                        {/* Til tanlash (Language Selector) */}
                        <div className="relative flex items-center">
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

                        <Link href={`/${user?.role || 'student'}/notifications`}>
                            <button className="relative p-2 md:p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl transition-all group shadow-sm">
                                <Bell className="w-4 h-4 md:w-5 md:h-5 group-hover:animate-swing" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-3.5 md:w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 md:h-3.5 md:w-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 text-[8px] items-center justify-center text-white font-black"></span>
                                    </span>
                                )}
                            </button>
                        </Link>

                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
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

                            {/* Profil Dropdown oynasi (Smooth Fade-in) */}
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
                                                <span>{t('myProfile')}</span>
                                            </div>
                                        </Link>
                                        <Link href={`/${user?.role || 'student'}/help`} onClick={() => setIsProfileOpen(false)}>
                                            <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                                <Settings className="w-4 h-4" />
                                                <span>{t('settings')}</span>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="p-2 border-t border-slate-100 dark:border-white/5">
                                        <button 
                                            onClick={handleSignOut}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>{t('signOut')}</span>
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
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Info, CalendarClock, AlertTriangle } from "lucide-react";
import { notificationsApi } from "../lib/api/notificationsApi";
// useUser yoki useAuth - sizning loyihangizdagi User context
import { useUser } from "../lib/UserContext"; 

export default function NotificationBell() {
    const { user } = useUser(); // user.id va user.role kerak
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Real-time tinglash
    useEffect(() => {
        if (!user) return;
        
        // onSnapshot orqali ma'lumot kelsa setNotifications'ga o'rnatamiz
        const unsubscribe = notificationsApi.listenToNotifications(user.role, user.id, (data) => {
            setNotifications(data);
        });

        return () => unsubscribe(); // Komponent yopilganda to'xtatish
    }, [user]);

    // Tashqariga bossa Dropdown yopilishi uchun
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // O'qilmagan xabarlar soni
    const unreadCount = notifications.filter(n => !n.read).length;

    // Bitta xabarni o'qish
    const handleRead = (notif) => {
        if (!notif.read) {
            notificationsApi.markAsRead(notif.id, user.id, notif.readBy);
        }
        // Agar linki bo'lsa o'sha sahifaga o'tkazib yuborish mumkin
        if (notif.link) {
            window.location.href = notif.link;
            setIsOpen(false);
        }
    };

    // Barchasini o'qish
    const handleMarkAllRead = () => {
        notificationsApi.markAllAsRead(notifications, user.id);
    };

    // Ikonkalarni turi bo'yicha tanlash
    const getIcon = (type) => {
        switch (type) {
            case 'schedule': return <CalendarClock className="w-5 h-5 text-indigo-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-emerald-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* QO'NG'IROQCHA TUGMASI */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                
                {/* Qizil Badge (O'qilmagan xabarlar bo'lsa chiqadi) */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-500 text-white text-[10px] font-black border-2 border-white dark:border-slate-900">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* OCHILADIGAN OYNA (DROPDOWN) */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-[24px] z-[100] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950">
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white">Bildirishnomalar</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">So'nggi xabarlar</p>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead} 
                                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                                Barchasini o'qish
                            </button>
                        )}
                    </div>

                    {/* Xabarlar Ro'yxati */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Hozircha xabarlar yo'q</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => handleRead(notif)}
                                        className={`p-4 cursor-pointer transition-colors flex items-start gap-4 relative group ${notif.read ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10'}`}
                                    >
                                        {/* O'qilmagan bo'lsa ko'k chiziqcha */}
                                        {!notif.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>}
                                        
                                        {/* Ikonka */}
                                        <div className={`p-2.5 rounded-2xl shrink-0 ${notif.read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5'}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        
                                        {/* Matn */}
                                        <div className="flex-1 pr-2">
                                            <h4 className={`text-sm mb-1 line-clamp-1 ${notif.read ? 'font-bold text-slate-600 dark:text-slate-300' : 'font-black text-slate-900 dark:text-white'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className={`text-xs leading-relaxed line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{notif.time}</p>
                                        </div>

                                        {/* Checked belgisi (faqat o'qilganlarda hover qilsa ko'rinadi yoki o'zi turadi) */}
                                        {notif.read && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
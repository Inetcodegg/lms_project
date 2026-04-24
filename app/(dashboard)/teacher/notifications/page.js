"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, BookOpen, AlertCircle, CheckCircle2, Inbox, ClipboardCheck, Dumbbell, X } from 'lucide-react';
import Card from '../../../../components/Card';
import { notificationsApi } from '../../../../lib/api/notificationsApi';
import { useUser } from '../../../../lib/UserContext';

export default function TeacherNotificationsPage() {
    const { user } = useUser();
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [previewNotif, setPreviewNotif] = useState(null);

    // 1. Firebase bilan Real-Time aloqani o'rnatish
    useEffect(() => {
        if (!user || !user.uid) return;

        setLoading(true);
        // O'qituvchiga tegishli barcha xabarlarni tortib olish
        const unsubscribe = notificationsApi.listenToNotifications(user, (data) => {
            // Agar data undefined bo'lsa bo'sh massiv qaytaramiz
            setNotifications(data || []);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // 2. Xabarlarni o'qish logikasi
    const handleMarkAsRead = async (id, readByArray, e) => {
        if (e) e.stopPropagation(); 
        if (!user?.uid) return;
        await notificationsApi.markAsRead(id, user.uid, readByArray);
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.uid) return;
        await notificationsApi.markAllAsRead(notifications, user.uid);
    };

    const openPreview = async (notif) => {
        setPreviewNotif(notif);
        if (!notif.read) {
            await handleMarkAsRead(notif.id, notif.readBy);
        }
    };

    // 3. 🌟 XATONI TUZATISH: Toifalar (Kategoriyalar) bo'yicha filterlash
    const filteredNotifications = useMemo(() => {
        if (!notifications || !Array.isArray(notifications)) return [];
        if (filter === 'all') return notifications;
        
        // Bu yerda xabarning 'type' maydoni filterning ID siga mos kelishi tekshiriladi.
        // Agar DB da 'academic' deb saqlangan bo'lsa, 'O'quv Jarayoni' tabida ko'rinadi.
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    const getIcon = (type) => {
        switch (type) {
            case 'academic': return <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />;
            case 'submissions': return <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />;
            case 'events': return <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />;
            case 'sports': return <Dumbbell className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />;
            case 'system': return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />;
            default: return <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'academic': return 'bg-indigo-50 dark:bg-indigo-500/10';
            case 'submissions': return 'bg-amber-50 dark:bg-amber-500/10';
            case 'events': return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'sports': return 'bg-orange-50 dark:bg-orange-500/10';
            case 'system': return 'bg-rose-50 dark:bg-rose-500/10';
            default: return 'bg-slate-50 dark:bg-slate-800';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
                <div>
                    <div className="flex items-center space-x-3 mb-1.5 md:mb-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Xabarnomalar</h1>
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] md:text-xs font-black shadow-sm animate-pulse">{unreadCount} ta yangi</span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[11px]">O'qituvchilar uchun dars jadvallari, vazifalar va muhim xabarlar</p>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Barchasini o'qish</span>
                    </button>
                )}
            </header>

            {/* Filter Tabs */}
            <div className="flex flex-nowrap items-center gap-2 mb-6 md:mb-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 w-full overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'all', label: 'Barchasi', icon: Bell },
                    { id: 'submissions', label: 'Vazifalar', icon: Inbox },
                    { id: 'academic', label: 'O\'quv Jarayoni', icon: BookOpen }, // 'academic' type bo'lishi kerak DB da
                    { id: 'sports', label: 'Sport & E\'lon', icon: Dumbbell },
                    { id: 'events', label: 'Majlislar', icon: Calendar },
                    { id: 'system', label: 'Tizim', icon: AlertCircle }
                ].map((tab) => {
                    const active = filter === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex items-center space-x-2 px-4 md:px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${active
                                    ? 'bg-slate-900 dark:bg-indigo-600 shadow-md text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            <TabIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${active ? 'opacity-100' : 'opacity-60'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Notifications Feed */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
                {loading ? (
                    [1,2,3,4].map(i => <div key={i} className="h-28 bg-white/40 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[32px] animate-pulse"></div>)
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            onDoubleClick={() => openPreview(notification)}
                            className={`p-4 md:p-6 transition-all duration-300 border rounded-2xl md:rounded-[32px] cursor-pointer group select-none
                            ${!notification.read ? 'bg-white dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-500/30 shadow-md ring-2 ring-indigo-500/10' : 'bg-white/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-white/5 shadow-sm opacity-80'} hover:opacity-100 hover:shadow-lg`}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6">
                                
                                <div className="flex items-center space-x-3 sm:space-x-0 w-full sm:w-auto">
                                    <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center ${getBgColor(notification.type)}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="sm:hidden flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{notification.time}</span>
                                            {!notification.read && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-w-0 pr-4">
                                    {/* Agar xabar o'qituvchiga tegishli ekani ko'rsatilgan bo'lsa (Masalan: title da ko'rinib qolsa) */}
                                    <h3 className={`text-sm md:text-base lg:text-lg font-black tracking-tight mb-1 truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed md:max-w-3xl line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-[9px] font-bold text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">Batafsil o'qish uchun 2 marta bosing</p>
                                </div>

                                <div className="hidden sm:flex flex-col items-end justify-between h-full gap-3 shrink-0 border-l border-slate-100 dark:border-white/5 pl-6 ml-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                        {notification.time}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openPreview(notification); }}
                                            className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            O'qish
                                        </button>
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notification.id, notification.readBy, e)}
                                                className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                            >
                                                O'qildi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Mobil uchun O'qildi tugmalari */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 sm:hidden flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); openPreview(notification); }} className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 py-3 rounded-xl transition-all shadow-sm active:scale-95">
                                    Batafsil
                                </button>
                                {!notification.read && (
                                    <button onClick={(e) => handleMarkAsRead(notification.id, notification.readBy, e)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 py-3 rounded-xl transition-all shadow-sm active:scale-95">
                                        O'qildi
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="py-16 md:py-24 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest">Bu bo'limda xabarlar yo'q</p>
                    </div>
                )}
            </div>

            {/* BATAZSIL O'QISH MODALI */}
            {previewNotif && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPreviewNotif(null)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-3">
                                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${getBgColor(previewNotif.type)}`}>
                                    {getIcon(previewNotif.type)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{previewNotif.time}</p>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Tizim xabarnomasi</span>
                                </div>
                            </div>
                            <button onClick={() => setPreviewNotif(null)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{previewNotif.title}</h2>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                {previewNotif.message}
                            </p>
                        </div>

                        <button onClick={() => setPreviewNotif(null)} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl active:scale-95">
                            Yopish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
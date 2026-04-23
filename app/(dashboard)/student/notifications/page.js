"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, Dumbbell, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../../../components/Card';
import { notificationsApi } from '../../../../lib/api/notificationsApi';
import { useUser } from '../../../../lib/UserContext'; // Rol va UID ni olish uchun

export default function NotificationsPage() {
    const { user } = useUser();
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Firebase bilan Real-Time aloqani o'rnatish
    useEffect(() => {
        if (!user?.uid) return;

        setLoading(true);
        // unsubscribe - bu aloqani uzish funksiyasi (component unmount bo'lganda ishlaydi)
        const unsubscribe = notificationsApi.listenToNotifications(user.role, user.uid, (data) => {
            setNotifications(data);
            setLoading(false);
        });

        // Sahifadan chiqib ketganda Firebase listenerni o'chiramiz (xotirani tejash uchun)
        return () => unsubscribe();
    }, [user?.uid, user?.role]);

    // 2. Xabarlarni o'qish logikasi
    const handleMarkAsRead = async (id, readByArray) => {
        if (!user?.uid) return;
        await notificationsApi.markAsRead(id, user.uid, readByArray);
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.uid) return;
        await notificationsApi.markAllAsRead(notifications, user.uid);
    };

    // 3. Toifalar bo'yicha filterlash
    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    // 4. Kichik yordamchi UI funksiyalar
    const getIcon = (type) => {
        switch (type) {
            case 'academic': return <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />;
            case 'events': return <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />;
            case 'sports': return <Dumbbell className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />;
            case 'system': return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />;
            default: return <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'academic': return 'bg-indigo-50 dark:bg-indigo-500/10';
            case 'events': return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'sports': return 'bg-orange-50 dark:bg-orange-500/10';
            case 'system': return 'bg-rose-50 dark:bg-rose-500/10';
            default: return 'bg-slate-50 dark:bg-slate-800';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
                <div>
                    <div className="flex items-center space-x-3 mb-1.5 md:mb-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Xabarnomalar</h1>
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] md:text-xs font-black">{unreadCount} ta yangi</span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[11px]">Barcha muhim voqealar va yangiliklar</p>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Barchasini o'qish</span>
                    </button>
                )}
            </header>

            {/* Filter Tabs - Mobile Scrollable */}
            <div className="flex flex-nowrap items-center gap-2 mb-6 md:mb-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 w-full overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'all', label: 'Barchasi', icon: Bell },
                    { id: 'academic', label: 'Akademik', icon: BookOpen },
                    { id: 'events', label: 'Tadbirlar', icon: Calendar },
                    { id: 'sports', label: 'Sport', icon: Dumbbell },
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
                    [1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl md:rounded-[32px] animate-pulse"></div>)
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`p-4 md:p-6 transition-all duration-300 border rounded-2xl md:rounded-[32px] ${!notification.read ? 'bg-white dark:bg-slate-800/80 border-indigo-100 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-500/10' : 'bg-white/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-white/5 shadow-sm opacity-80 hover:opacity-100'} hover:shadow-lg`}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6">
                                <div className="flex items-center space-x-3 sm:space-x-0 w-full sm:w-auto">
                                    <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${getBgColor(notification.type)}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="sm:hidden flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{notification.time}</span>
                                            {!notification.read && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-w-0">
                                    <h3 className={`text-sm md:text-base lg:text-lg font-black tracking-tight mb-1 truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed md:max-w-2xl line-clamp-2 md:line-clamp-none">
                                        {notification.message}
                                    </p>
                                </div>

                                <div className="hidden sm:flex flex-col items-end justify-between h-full gap-2 shrink-0 border-l border-slate-100 dark:border-white/5 pl-6 ml-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                        {notification.time}
                                    </span>
                                    {!notification.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id, notification.readBy)}
                                            className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            O'qildi
                                        </button>
                                    )}
                                </div>
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
        </div>
    );
}
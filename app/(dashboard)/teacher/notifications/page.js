"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Bell, Calendar, BookOpen, AlertCircle, CheckCircle2, Inbox, 
    ClipboardCheck, Dumbbell, X, Ticket, ShieldAlert, Trash2, 
    CheckSquare, Square, Info, Loader2, UserCheck, UserX 
} from 'lucide-react';
import Card from '../../../../components/Card';
import { notificationsApi } from '../../../../lib/api/notificationsApi';
import { useUser } from '../../../../lib/UserContext';
import { db } from "../../../../lib/firebase";
import { doc, updateDoc, arrayUnion, query, collection, where, getDocs } from "firebase/firestore";

export default function NotificationsPage() {
    const { user } = useUser();
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [previewNotif, setPreviewNotif] = useState(null);

    // Tanlab o'chirish holatlari
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Maxsus Toast va Confirm Dialog
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Firebase bilan Real-Time aloqa
    useEffect(() => {
        if (!user || !user.uid) return;
        setLoading(true);

        const unsubscribe = notificationsApi.listenToNotifications(user, (data) => {
            // O'chirilgan xabarlarni filtrlaymiz
            const activeData = (data || []).filter(n => !(n.deletedBy || []).includes(user.uid));
            setNotifications(activeData);
            setLoading(false);
        });

        return () => { if (unsubscribe) unsubscribe(); };
    }, [user]);

    // 2. O'qish logikasi
    const handleMarkAsRead = async (id, readByArray, e) => {
        if (e) e.stopPropagation(); 
        if (!user?.uid) return;
        await notificationsApi.markAsRead(id, user.uid, readByArray);
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.uid) return;
        await notificationsApi.markAllAsRead(notifications, user.uid);
        showToast("Barcha xabarlar o'qildi!");
    };

    const openPreview = async (notif) => {
        if (isSelectMode) {
            toggleSelect(notif.id);
            return;
        }
        setPreviewNotif(notif);
        if (!notif.read) await handleMarkAsRead(notif.id, notif.readBy);
    };

    // 3. TANLAB O'CHIRISH LOGIKASI
    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        
        // Custom Confirm Dialog chaqirish
        setConfirmDialog({
            title: "Xabarlarni o'chirish",
            message: `Haqiqatan ham ${selectedIds.length} ta xabarni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`,
            onConfirm: async () => {
                try {
                    setConfirmDialog(null);
                    for (const id of selectedIds) {
                        const notifRef = doc(db, 'notifications', id);
                        await updateDoc(notifRef, { deletedBy: arrayUnion(user.uid) });
                    }
                    setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
                    setSelectedIds([]);
                    setIsSelectMode(false);
                    showToast("Xabarlar o'chirildi!");
                } catch (error) {
                    showToast("O'chirishda xatolik yuz berdi", "error");
                }
            }
        });
    };

    // 4. SO'ROVNOMA VA TADBIRLARGA QO'SHILISH LOGIKASI
    const handleJoinEvent = async (notif, action) => {
        try {
            // Adminning asl 'news' dokumentini sarlavha orqali qidiramiz
            const cleanTitle = notif.title.replace("Yangilik: ", "");
            const q = query(collection(db, "news"), where("title", "==", cleanTitle));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const newsDoc = snap.docs[0];
                const newsData = newsDoc.data();
                
                // Avval javob berganligini tekshirish
                if (newsData.requests?.some(r => r.userId === user.uid)) {
                    showToast("Siz allaqachon arizangizni yuborgansiz!", "error");
                    return;
                }

                // Arizani Firebasega yozish
                const newReq = {
                    userId: user.uid,
                    userName: user.name || "Foydalanuvchi",
                    date: new Date().toISOString(),
                    status: action === 'join' ? 'pending' : 'rejected'
                };

                await updateDoc(doc(db, "news", newsDoc.id), {
                    requests: arrayUnion(newReq)
                });
            }

            // Xabarning o'zida ham foydalanuvchi javob berganini belgilab qoyamiz (Tugmalar qayta chiqmasligi uchun)
            await updateDoc(doc(db, "notifications", notif.id), {
                [`responses.${user.uid}`]: action
            });

            showToast(action === 'join' ? "Arizangiz muvaffaqiyatli yuborildi!" : "Rad etildi", "success");
            setPreviewNotif(null);

        } catch (error) {
            console.error(error);
            showToast("Xatolik yuz berdi. Qayta urinib ko'ring", "error");
        }
    };

    // 5. AQLLI KATEGORIZATSIYA
    const processedNotifications = useMemo(() => {
        if (!notifications) return [];
        return notifications.map(n => {
            const titleLower = (n.title || '').toLowerCase();
            const msgLower = (n.message || '').toLowerCase();
            let smartType = n.type; 

            if (titleLower.includes('sport') || msgLower.includes('sport') || titleLower.includes('turnir')) smartType = 'sports';
            else if (titleLower.includes('vazifa') || titleLower.includes('javob') || msgLower.includes('vazifa')) smartType = 'submissions';
            else if (titleLower.includes('dars') || titleLower.includes('jadval') || msgLower.includes('xona')) smartType = 'academic';
            else if (titleLower.includes('majlis') || titleLower.includes('tadbir')) smartType = 'events';

            const isPersonal = n.targetRoles?.includes(user?.uid) && !n.targetRoles?.includes('all');
            const isSurvey = n.type === 'warning' || titleLower.includes('so\'rovnoma') || titleLower.includes('ariza');
            
            // Foydalanuvchi allaqachon javob berganmi?
            const userResponse = n.responses ? n.responses[user?.uid] : null;

            return { ...n, smartType, isPersonal, isSurvey, userResponse };
        });
    }, [notifications, user?.uid]);

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return processedNotifications;
        return processedNotifications.filter(n => n.smartType === filter);
    }, [processedNotifications, filter]);

    const getIcon = (smartType) => {
        switch (smartType) {
            case 'academic': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'submissions': return <ClipboardCheck className="w-5 h-5 text-amber-500" />;
            case 'events': return <Calendar className="w-5 h-5 text-emerald-500" />;
            case 'sports': return <Dumbbell className="w-5 h-5 text-orange-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    const getBgColor = (smartType) => {
        switch (smartType) {
            case 'academic': return 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20';
            case 'submissions': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
            case 'events': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
            case 'sports': return 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20';
            default: return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    const unreadCount = processedNotifications.filter(n => !n.read).length;

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-32 relative">
            
            {/* CUSTOM TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[900] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* CUSTOM CONFIRM DIALOG */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDialog(null)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 text-center border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Bekor qilish</button>
                            <button onClick={confirmDialog.onConfirm} className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md active:scale-95">Tasdiqlash</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
                <div>
                    <div className="flex items-center space-x-3 mb-1.5 md:mb-2">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Xabarnomalar</h1>
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] md:text-xs font-black shadow-sm animate-pulse">{unreadCount} ta yangi</span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[11px]">Sizga kelgan muhim xabarlar va so'rovnomalar</p>
                </div>
                
                {/* ACTION BUTTONS (Tanlash va O'chirish) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {isSelectMode ? (
                        <>
                            <button onClick={toggleSelectAll} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm active:scale-95">
                                {selectedIds.length > 0 && selectedIds.length === filteredNotifications.length ? <CheckSquare className="w-4 h-4 text-indigo-500"/> : <Square className="w-4 h-4"/>}
                                <span>Barchasi ({selectedIds.length})</span>
                            </button>
                            <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                                <Trash2 className="w-4 h-4" /> <span>O'chirish</span>
                            </button>
                            <button onClick={() => { setIsSelectMode(false); setSelectedIds([]); }} className="w-full sm:w-auto p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsSelectMode(true)} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                                <CheckSquare className="w-4 h-4" /> <span>Tanlash</span>
                            </button>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm active:scale-95">
                                    <CheckCircle2 className="w-4 h-4" /> <span>Barchasini o'qish</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex flex-nowrap items-center gap-2 mb-6 md:mb-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 w-full overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'all', label: 'Barchasi', icon: Bell },
                    { id: 'academic', label: 'O\'quv', icon: BookOpen }, 
                    { id: 'sports', label: 'Sport & So\'rov', icon: Dumbbell },
                    { id: 'submissions', label: 'Vazifa', icon: Inbox },
                    { id: 'events', label: 'Tadbir', icon: Calendar },
                    { id: 'system', label: 'Tizim', icon: AlertCircle }
                ].map((tab) => {
                    const active = filter === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id} onClick={() => setFilter(tab.id)}
                            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-slate-900 dark:bg-indigo-600 shadow-md text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
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
                    [1,2,3].map(i => <div key={i} className="h-28 bg-white/40 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[32px] animate-pulse"></div>)
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            onDoubleClick={() => openPreview(notification)}
                            onClick={() => { if(isSelectMode) toggleSelect(notification.id) }} 
                            className={`p-0 overflow-hidden transition-all duration-300 border rounded-2xl md:rounded-[32px] cursor-pointer group select-none hover:shadow-lg
                            ${selectedIds.includes(notification.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500/30' : 
                            !notification.read ? 'bg-white dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-500/30 shadow-md ring-2 ring-indigo-500/10' : 'bg-white/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-white/5 shadow-sm opacity-80 hover:opacity-100'}`}
                        >
                            <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6 relative">
                                
                                {/* Select Mode Checkbox */}
                                {isSelectMode && (
                                    <div className="absolute top-4 left-4 sm:static sm:top-auto sm:left-auto z-20">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(notification.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                            {selectedIds.includes(notification.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                )}

                                {notification.isPersonal && !isSelectMode && (
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-md z-10 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" /> Shaxsiy
                                    </div>
                                )}

                                <div className={`flex items-center space-x-3 sm:space-x-0 w-full sm:w-auto ${isSelectMode ? 'ml-8 sm:ml-0' : ''}`}>
                                    <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border shadow-sm ${getBgColor(notification.smartType)}`}>
                                        {getIcon(notification.smartType)}
                                    </div>
                                    <div className="sm:hidden flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{notification.time}</span>
                                            {!notification.read && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-w-0 pr-4 mt-2 sm:mt-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className={`text-sm md:text-base lg:text-lg font-black tracking-tight truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                                            {notification.title}
                                        </h3>
                                        {notification.isSurvey && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md shrink-0 flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/30">
                                                <Ticket className="w-3 h-3"/> So'rovnoma
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-[9px] font-bold text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                        {isSelectMode ? 'Tanlash uchun bosing' : 'To\'liq o\'qish uchun 2 marta bosing'}
                                    </p>
                                </div>

                                {!isSelectMode && (
                                    <div className="hidden sm:flex flex-col items-end justify-between h-full gap-3 shrink-0 border-l border-slate-100 dark:border-white/5 pl-6 ml-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{notification.time}</span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openPreview(notification); }} className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-all shadow-sm active:scale-95 px-3 py-2 rounded-xl">Batafsil</button>
                                            {!notification.read && (
                                                <button onClick={(e) => handleMarkAsRead(notification.id, notification.readBy, e)} className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-500/10 transition-all shadow-sm active:scale-95 px-3 py-2 rounded-xl">O'qildi</button>
                                            )}
                                        </div>
                                    </div>
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

            {/* BATAZSIL O'QISH VA ARIZA TOPHIRISH MODALI */}
            {previewNotif && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPreviewNotif(null)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 animate-in zoom-in-95 max-h-[85vh] flex flex-col border border-white/10">
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-3">
                                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${getBgColor(previewNotif.smartType)}`}>
                                    {getIcon(previewNotif.smartType)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{previewNotif.time}</p>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{previewNotif.isPersonal ? "Shaxsiy xabarnoma" : "Tizim xabarnomasi"}</span>
                                </div>
                            </div>
                            <button onClick={() => setPreviewNotif(null)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                {previewNotif.isSurvey && (
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/30">
                                        <Info className="w-3 h-3"/> Tasdiqlash talab etiladi
                                    </span>
                                )}
                            </div>

                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{previewNotif.title}</h2>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                {previewNotif.message}
                            </p>

                            {/* Agar avval javob bergan bo'lsa, qanday javob berganini ko'rsatish */}
                            {previewNotif.userResponse && (
                                <div className="mt-6 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sizning javobingiz:</span>
                                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${previewNotif.userResponse === 'join' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                        {previewNotif.userResponse === 'join' ? 'Qatnashaman' : 'Rad etilgan'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 🌟 ARIZALI/SO'ROVNOMA TUGMALARI (Faqat hali javob bermagan bo'lsa chiqadi) */}
                        {previewNotif.isSurvey && !previewNotif.userResponse ? (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => handleJoinEvent(previewNotif, 'join')} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                                    <UserCheck className="w-4 h-4"/> Qatnashaman
                                </button>
                                <button onClick={() => handleJoinEvent(previewNotif, 'reject')} className="w-full sm:w-auto px-8 py-4 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <UserX className="w-4 h-4"/> Rad etish
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setPreviewNotif(null)} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                                Yopish
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
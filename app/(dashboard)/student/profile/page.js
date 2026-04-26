"use client";
import { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import { profileApi } from "../../../../lib/api/profileApi";
import {
    User, Settings, Shield, Bell, LogOut,
    AlertCircle, Camera, Mail, GraduationCap,
    Calendar, Globe, Lock, Save, X, Loader2, CheckCircle2,
    Briefcase, ShieldCheck, KeyRound
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../../lib/LanguageContext";
import { auth } from "../../../../lib/firebase";
import Spinner from "../../../../components/Spinner";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop";

export default function ProfilePage() {
    const router = useRouter();
    const { t } = useLanguage();

    // UI Statelari
    const [activeTab, setActiveTab] = useState("profile");
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Data Statelari
    const [user, setUser] = useState(null);
    const [currentAvatar, setCurrentAvatar] = useState(FALLBACK_AVATAR);

    // Formalar
    const [formData, setFormData] = useState({ name: '', major: '', year: '' });
    const [notifSettings, setNotifSettings] = useState({ emailAlerts: true, pushNotifs: true, updates: false });
    const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' }); // Yangi: Parolni tasdiqlash qo'shildi

    const tabs = [
        { id: 'profile', label: t('profile') || "Shaxsiy Profil", icon: User },
        { id: 'notifications', label: t('notifications') || "Xabarnomalar", icon: Bell },
        { id: 'security', label: t('security') || "Xavfsizlik", icon: Shield },
    ];

    // 1. Profilni yuklash
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const u = await profileApi.getProfile();
                if (u) {
                    setUser(u);
                    setCurrentAvatar(u.avatar || FALLBACK_AVATAR);
                    setFormData({ name: u.name || '', major: u.major || '', year: u.year || '' });
                    if (u.notifications) setNotifSettings(u.notifications);
                }
            } catch (error) {
                console.error(error);
                showToast("Ma'lumotlarni yuklashda xatolik", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // 2. Profilni Saqlash
    const handleSaveProfile = async () => {
        if (!formData.name.trim()) return showToast("Ism bo'sh bo'lishi mumkin emas", "error");

        setIsSaving(true);
        try {
            await profileApi.updateProfileData({
                name: formData.name,
                major: formData.major,
                year: formData.year
            });
            setUser({ ...user, ...formData });
            showToast("Profil muvaffaqiyatli yangilandi!");
        } catch (error) {
            showToast("Saqlashda xatolik yuz berdi.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Rasm yuklash (Avatar)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview (Ekranda darhol ko'rinishi uchun)
        const reader = new FileReader();
        reader.onloadend = () => setCurrentAvatar(reader.result);
        reader.readAsDataURL(file);

        setShowImageModal(false);
        setIsSaving(true);

        try {
            const downloadUrl = await profileApi.uploadAvatar(file);
            setCurrentAvatar(downloadUrl);
            setUser({ ...user, avatar: downloadUrl });
            showToast("Profilingiz rasmi yangilandi!");
        } catch (error) {
            showToast("Rasm yuklashda xatolik.", 'error');
            setCurrentAvatar(user?.avatar || FALLBACK_AVATAR);
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Xabarnoma sozlamalarini saqlash
    const handleSaveNotifications = async () => {
        setIsSaving(true);
        try {
            await profileApi.updateProfileData({ notifications: notifSettings });
            showToast("Sozlamalar saqlandi!");
        } catch (error) {
            showToast("Saqlashda xatolik.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 5. Parolni o'zgartirish (Xavfsiz versiya)
    const handleUpdatePassword = async () => {
        if (passwords.newPass.length < 6) {
            return showToast("Parol kamida 6 ta belgi bo'lishi kerak", 'error');
        }
        if (passwords.newPass !== passwords.confirmPass) {
            return showToast("Parollar bir-biriga mos kelmadi!", 'error');
        }

        setIsSaving(true);
        try {
            await profileApi.updateSecurePassword(passwords.newPass);
            setPasswords({ newPass: '', confirmPass: '' });
            showToast("Akkaunt paroli muvaffaqiyatli yangilandi!");
        } catch (error) {
            showToast("Xato! Iltimos tizimga qaytadan kirib urinib ko'ring.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        if (window.confirm("Haqiqatan ham tizimdan chiqmoqchimisiz?")) {
            await auth.signOut();
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Spinner className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 relative">

            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-xl shadow-xl font-bold text-sm flex items-center space-x-2 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{t('settingsTitle') || "Sozlamalar"}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Shaxsiy profil va xavfsizlikni boshqarish</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* SIDEBAR NAVIGATION (Ixchamlashtirildi) */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-[20px] lg:bg-transparent lg:dark:bg-transparent lg:p-0 border border-slate-100 dark:border-white/5 lg:border-none">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 lg:w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${isActive
                                            ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 opacity-80" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="hidden lg:block pt-6 mt-6 border-t border-slate-200/50 dark:border-white/5">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{t('signOut') || "Tizimdan chiqish"}</span>
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 w-full min-w-0">

                    {/* TAB 1: SHAXSIY PROFIL */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in duration-300">
                            <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm">

                                {/* Header Info */}
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('publicProfile') || "Ommaviy Profil"}</h2>
                                    <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        <Globe className="w-3 h-3" />
                                        <span className="hidden sm:inline">Kampusda ko'rinadi</span>
                                    </div>
                                </div>

                                {/* Avatar & Role Info (Kichraytirildi) */}
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="relative group shrink-0">
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden bg-slate-100">
                                            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                                        </div>
                                        <button onClick={() => setShowImageModal(true)} className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 hover:scale-105 transition-all ring-2 ring-white dark:ring-slate-900">
                                            <Camera className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight line-clamp-1">{user?.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center">
                                            {user?.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1 text-rose-500" /> : <User className="w-3 h-3 mr-1 text-indigo-500" />}
                                            Rol: {user?.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Forms (2 ustunli Grid) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('fullName') || "To'liq ism"}</label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('emailAddress') || "Elektron pochta"}</label>
                                        <div className="relative opacity-70 cursor-not-allowed">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email" value={user?.email || ""} readOnly
                                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{user?.role === 'student' ? "Mutaxassislik" : "Kafedra / Yo'nalish"}</label>
                                        <div className="relative group">
                                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} placeholder={user?.role === 'student' ? "Software Engineering" : "IT Department"}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Studentlar uchun kurs, Teacherlar uchun tajriba/daraja */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{user?.role === 'student' ? "O'qish yili (Kursi)" : "Daraja / Unvoni"}</label>
                                        <div className="relative group">
                                            {user?.role === 'student' ? <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> : <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                                            <input
                                                type="text" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder={user?.role === 'student' ? "2-kurs" : "Professor"}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Saqlash Tugmasi */}
                                <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile} disabled={isSaving}
                                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[140px]"
                                    >
                                        {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : <><Save className="w-3.5 h-3.5 mr-2" /> Saqlash</>}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB 2: XABARNOMALAR */}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-300">
                            <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm">
                                <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Xabarnoma sozlamalari</h2>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Qaysi kanallar orqali xabar olasiz?</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {[
                                        { id: 'emailAlerts', title: "Email orqali (Asosiy)", desc: "Muhim yangiliklar va tizim o'zgarishlari" },
                                        { id: 'pushNotifs', title: "Ilova ichida (Push)", desc: "Dars jadvali va baholar o'zgarishi" },
                                        { id: 'updates', title: "Tizim va Platforma", desc: "Platforma yangilanishlari" }
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                            <div className="pr-4">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.title}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input type="checkbox" className="sr-only peer" checked={notifSettings[item.id]} onChange={(e) => setNotifSettings({ ...notifSettings, [item.id]: e.target.checked })} />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:border-white"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex justify-end">
                                    <button onClick={handleSaveNotifications} disabled={isSaving} className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[140px]">
                                        {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : "Sozlamalarni Saqlash"}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB 3: XAVFSIZLIK (Kengaytirilgan va Xavfsiz) */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in duration-300">
                            <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur border border-rose-100 dark:border-rose-500/10 rounded-3xl shadow-sm">
                                <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg"><KeyRound className="w-5 h-5 text-rose-500" /></div>
                                    <div>
                                        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Xavfsizlik va Kirish</h2>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Akkaunt parolini himoyalash</p>
                                    </div>
                                </div>

                                <div className="max-w-md space-y-4 mb-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yangi Parol</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="password" placeholder="Kamida 6 ta belgi" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parolni Tasdiqlang</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="password" placeholder="Parolni qayta kiriting" value={passwords.confirmPass} onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex justify-end">
                                    <button
                                        onClick={handleUpdatePassword} disabled={isSaving || !passwords.newPass || (passwords.newPass !== passwords.confirmPass)}
                                        className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                                    >
                                        {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : "Parolni Yangilash"}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sign Out Button */}
            <div className="lg:hidden mt-8">
                <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-colors">
                    <LogOut className="w-4 h-4" /> <span>Tizimdan chiqish</span>
                </button>
            </div>

            {/* RASM YUKLASH MODALI (Ixcham) */}
            {showImageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowImageModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Profil Rasmi</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Yangi avatar tanlang</p>
                            </div>
                            <button onClick={() => !isSaving && setShowImageModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 group hover:border-indigo-400 transition-all">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                                <Camera className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mb-6 uppercase tracking-widest">JPG, PNG (Max 2MB)</p>

                            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isSaving} />
                            <label htmlFor="avatar-upload" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-md active:scale-95 flex items-center">
                                {isSaving ? <Spinner className="w-4 h-4 animate-spin mr-2" /> : "Kompuyterdan tanlash"}
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
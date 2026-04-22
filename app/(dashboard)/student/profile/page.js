"use client";
import { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import { profileApi } from "../../../../lib/api/profileApi";
import {
    User, Settings, Shield, Bell, LogOut,
    AlertCircle, Camera, Mail, GraduationCap,
    Calendar, Globe, Lock, Save, Trash2, X, Loader2, CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../../lib/LanguageContext";
import { auth } from "../../../../lib/firebase";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop";

export default function Profile() {
    const router = useRouter();
    const { t } = useLanguage();
    
    // UI Statelari
    const [activeTab, setActiveTab] = useState("profile");
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg: '' }

    // Data Statelari
    const [user, setUser] = useState(null);
    const [currentAvatar, setCurrentAvatar] = useState(FALLBACK_AVATAR);
    const [formData, setFormData] = useState({ name: '', major: '', year: '' });
    const [notifSettings, setNotifSettings] = useState({ emailAlerts: true, pushNotifs: true, updates: false });
    const [passwords, setPasswords] = useState({ newPass: '' });
    const [selectedFile, setSelectedFile] = useState(null); // Avatar fayli

    const tabs = [
        { id: 'profile', label: t('profile') || "Profil", icon: User },
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
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 2. Profilni Saqlash
    const handleSaveProfile = async () => {
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
            showToast("Xatolik yuz berdi.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Rasm yuklash (Avatar)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview uchun
        const reader = new FileReader();
        reader.onloadend = () => setCurrentAvatar(reader.result);
        reader.readAsDataURL(file);
        
        setShowImageModal(false);
        setIsSaving(true);

        try {
            // Firebase Storage ga yuklash va URL olish
            const downloadUrl = await profileApi.uploadAvatar(file);
            setCurrentAvatar(downloadUrl);
            setUser({ ...user, avatar: downloadUrl });
            showToast("Rasm yangilandi!");
        } catch (error) {
            showToast("Rasm yuklashda xato.", 'error');
            setCurrentAvatar(user?.avatar || FALLBACK_AVATAR); // Xato bo'lsa orqaga qaytarish
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
            showToast("Xatolik yuz berdi.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 5. Parolni o'zgartirish
    const handleUpdatePassword = async () => {
        if (passwords.newPass.length < 6) {
            showToast("Parol kamida 6 ta belgi bo'lishi kerak", 'error');
            return;
        }
        setIsSaving(true);
        try {
            await profileApi.updateSecurePassword(passwords.newPass);
            setPasswords({ newPass: '' });
            showToast("Parol muvaffaqiyatli yangilandi!");
        } catch (error) {
            // Firebase xavfsizlik qoidasi: Agar user uzoq vaqt oldin kirgan bo'lsa re-auth so'raydi
            showToast("Xato! Iltimos tizimga qaytadan kirib urinib ko'ring.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 6. Tizimdan chiqish
    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-xl font-bold text-sm flex items-center space-x-2 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="mb-8 md:mb-12">
                <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">{t('settingsTitle') || "Sozlamalar"}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">{t('settingsSubtitle') || "Shaxsiy profil va xavfsizlikni boshqarish"}</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 md:gap-10">

                {/* Sidebar Navigation - Mobile scrollable */}
                <div className="w-full xl:w-72 shrink-0 flex xl:flex-col gap-2 overflow-x-auto xl:overflow-visible no-scrollbar pb-2 xl:pb-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 xl:w-full flex items-center space-x-3 md:space-x-4 px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-[24px] text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg xl:-translate-y-1'
                                    : 'bg-white/40 xl:bg-transparent border border-white/40 xl:border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <div className="hidden xl:block pt-6 mt-6 border-t border-slate-200/60 dark:border-white/5">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-4 px-6 py-4 rounded-[24px] text-sm font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{t('signOut') || "Tizimdan chiqish"}</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-4xl w-full">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <Card className="p-5 md:p-10 bg-white/60 dark:bg-slate-800/40 border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm">
                                <div className="flex justify-between items-center mb-8 md:mb-10">
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('publicProfile') || "Ommaviy Profil"}</h2>
                                    <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                        <Globe className="w-3 h-3" />
                                        <span className="hidden sm:inline">{t('visibleOnCampus') || "Kampusda ko'rinadi"}</span>
                                        <span className="sm:hidden">Ochiq</span>
                                    </div>
                                </div>

                                {/* Avatar qismi */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-10 border-b border-slate-100 dark:border-white/5 pb-8 md:pb-10 mb-8 md:mb-10">
                                    <div className="relative group shrink-0">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden relative bg-slate-100">
                                            <img 
                                                src={currentAvatar} 
                                                onError={() => setCurrentAvatar(FALLBACK_AVATAR)}
                                                alt="Avatar" 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowImageModal(true)}
                                            className="absolute bottom-0 right-0 p-2 md:p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-colors border-2 md:border-4 border-white dark:border-slate-800"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-4 md:space-y-6 w-full text-center sm:text-left pt-2">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-1 uppercase">{user?.name}</h3>
                                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">Rol: <span className="text-indigo-600 dark:text-indigo-400 uppercase">{user?.role}</span></p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 md:gap-3 justify-center sm:justify-start">
                                            <button
                                                onClick={() => setShowImageModal(true)}
                                                className="px-5 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                            >
                                                Rasm yuklash
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-2 md:space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('fullName') || "To'liq ism"}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg group-focus-within:bg-indigo-50 transition-colors">
                                                <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[20px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('emailAddress') || "Elektron pochta"}</label>
                                        <div className="relative group opacity-60 cursor-not-allowed">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={user?.email || ""}
                                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-[20px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 focus:outline-none pointer-events-none"
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('major') || "Mutaxassislik / Fakultet"}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.major}
                                                onChange={(e) => setFormData({...formData, major: e.target.value})}
                                                placeholder="Masalan: Software Engineering"
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[20px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('academicYear') || "O'qish yili / Kursi"}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.year}
                                                onChange={(e) => setFormData({...formData, year: e.target.value})}
                                                placeholder="Masalan: 2-kurs"
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[20px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 md:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 md:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl md:rounded-[32px] text-white">
                                    <div className="flex items-center space-x-3 md:space-x-4">
                                        <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl shrink-0">
                                            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm font-black tracking-tight leading-none mb-1">{t('officialData') || "Rasmiy ma'lumotlar"}</p>
                                            <p className="text-[9px] md:text-[11px] font-bold text-slate-400 line-clamp-1">Kiritilgan ma'lumotlar to'g'riligini tekshiring.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 active:scale-95 transform disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('save') || "Saqlash")}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <Card className="p-5 md:p-10 bg-white/60 dark:bg-slate-800/40 border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-3">{t('notificationSettings') || "Xabarnoma sozlamalari"}</h2>
                                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-100 dark:border-white/5">Qaysi turdagi xabarlarni qabul qilishni tanlang.</p>

                                <div className="space-y-6 md:space-y-10">
                                    {[
                                        { id: 'emailAlerts', title: "Email xabarnomalar", desc: "Muhim yangiliklarni pochtaga yuborish" },
                                        { id: 'pushNotifs', title: "Push xabarnomalar", desc: "Saytda qalqib chiquvchi xabarlar" },
                                        { id: 'updates', title: "Tizim yangilanishlari", desc: "Platforma o'zgarishlari haqida xabar" }
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between group gap-4">
                                            <div className="space-y-1">
                                                <h4 className="text-sm md:text-[15px] font-black text-slate-900 dark:text-white tracking-tight">{item.title}</h4>
                                                <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={notifSettings[item.id]}
                                                    onChange={(e) => setNotifSettings({...notifSettings, [item.id]: e.target.checked})}
                                                />
                                                <div className="w-12 h-7 md:w-14 md:h-8 bg-slate-200/60 dark:bg-slate-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] md:after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:border-white shadow-inner"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 md:mt-12 text-right">
                                    <button 
                                        onClick={handleSaveNotifications}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[120px] ml-auto"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sozlamalarni Saqlash"}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <Card className="p-5 md:p-10 bg-white/60 dark:bg-slate-800/40 border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-3">{t('securityKirish') || "Kirish xavfsizligi"}</h2>
                                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-100 dark:border-white/5">Akkaunt parolini yangilash.</p>

                                <div className="max-w-md space-y-6 md:space-y-8">
                                    <div className="space-y-2 md:space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{t('newPassword') || "Yangi parol"}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                                                <Lock className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="password"
                                                placeholder="Kamida 6 ta belgi"
                                                value={passwords.newPass}
                                                onChange={(e) => setPasswords({ newPass: e.target.value })}
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-[20px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <button 
                                            onClick={handleUpdatePassword}
                                            disabled={isSaving || !passwords.newPass}
                                            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-3.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 ml-auto"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    <span>{t('updatePassword') || "Parolni o'zgartirish"}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sign Out Button */}
            <div className="xl:hidden mt-10">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-sm font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>{t('signOut') || "Tizimdan chiqish"}</span>
                </button>
            </div>

            {/* Image Upload Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSaving && setShowImageModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-8 md:mb-10">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t('selectImage') || "Rasm yuklash"}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Yangi profil rasmini tanlang</p>
                            </div>
                            <button onClick={() => !isSaving && setShowImageModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl md:rounded-[40px] bg-slate-50/50 dark:bg-slate-800/20 group hover:border-indigo-400 transition-all duration-500">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <Camera className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                            </div>
                            <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Rasmni yuklash</h4>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-6 md:mb-8 uppercase tracking-widest">JPG, PNG, JPEG</p>

                            <input
                                type="file" id="avatar-upload" className="hidden" accept="image/*"
                                onChange={handleFileUpload} disabled={isSaving}
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="px-8 md:px-10 py-3.5 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Faylni tanlash
                            </label>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
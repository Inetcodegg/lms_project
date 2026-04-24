"use client";
import React, { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import { 
    User, Mail, Lock, ShieldCheck, CheckCircle2, 
    AlertCircle, Key, Eye, EyeOff, Loader2, Save, X 
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";
import { auth } from "../../../../lib/firebase";
import { 
    updateEmail, 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider 
} from "firebase/auth";

export default function AdminProfilePage() {
    const { user } = useUser();
    
    // Form States
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Re-authentication Modal States
    const [isReAuthOpen, setIsReAuthOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [pendingAction, setPendingAction] = useState(null); // 'email' yoki 'password'
    const [isReAuthLoading, setIsReAuthLoading] = useState(false);

    // User yuklanganda emailni state ga qo'yish
    useEffect(() => {
        if (user?.email) setEmail(user.email);
    }, [user]);

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Email o'zgartirish so'rovi
    const handleEmailSubmit = (e) => {
        e.preventDefault();
        if (email === user?.email) return showToast("Email o'zgartirilmadi", "error");
        if (!email.includes("@")) return showToast("To'g'ri email kiriting", "error");
        
        setPendingAction('email');
        setCurrentPassword("");
        setIsReAuthOpen(true);
    };

    // 2. Parol o'zgartirish so'rovi
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return showToast("Parol kamida 6 ta belgidan iborat bo'lishi kerak", "error");
        if (newPassword !== confirmPassword) return showToast("Parollar mos kelmadi!", "error");
        
        setPendingAction('password');
        setCurrentPassword("");
        setIsReAuthOpen(true);
    };

    // 3. Joriy parol bilan tasdiqlash va amaliyotni bajarish (Firebase Security Re-auth)
    const handleReAuthenticateAndExecute = async (e) => {
        e.preventDefault();
        if (!currentPassword) return showToast("Joriy parolni kiriting", "error");

        setIsReAuthLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Foydalanuvchi topilmadi");

            // Joriy parolni tasdiqlash uchun Credential yaratish
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            
            // 1. Re-authenticate
            await reauthenticateWithCredential(currentUser, credential);

            // 2. Kutib turgan amaliyotni (email yoki parol) bajarish
            if (pendingAction === 'email') {
                await updateEmail(currentUser, email);
                showToast("Email muvaffaqiyatli yangilandi!");
            } else if (pendingAction === 'password') {
                await updatePassword(currentUser, newPassword);
                showToast("Parol muvaffaqiyatli yangilandi!");
                setNewPassword("");
                setConfirmPassword("");
            }

            setIsReAuthOpen(false);
            setCurrentPassword("");
            setPendingAction(null);
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                showToast("Joriy parol noto'g'ri!", "error");
            } else if (error.code === 'auth/email-already-in-use') {
                showToast("Bu email allaqachon band", "error");
            } else {
                showToast("Xatolik yuz berdi. Qayta urinib ko'ring.", "error");
            }
        } finally {
            setIsReAuthLoading(false);
        }
    };

    return (
        <div className="p-4 lg:p-10 w-full max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {/* Custom Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[900] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Admin Profil</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" /> Shaxsiy ma'lumotlar va xavfsizlik sozlamalari
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. SHAXSIY MA'LUMOTLAR VA EMAIL */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center rounded-full mb-4 shadow-inner">
                            <User className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{user?.name || "Admin"}</h2>
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-transparent">
                            Tizim Administratori
                        </span>
                    </Card>

                    <Card className="p-6 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl"><Mail className="w-5 h-5"/></div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Elektron Pochta</h3>
                        </div>
                        <form onSubmit={handleEmailSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email manzili</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="email" required
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 transition-all" 
                                    />
                                </div>
                            </div>
                            <button disabled={email === user?.email} type="submit" className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> Emaildi Yangilash
                            </button>
                        </form>
                    </Card>
                </div>

                {/* 2. XAVFSIZLIK VA PAROL */}
                <div className="lg:col-span-7">
                    <Card className="p-6 md:p-10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl"><Key className="w-6 h-6"/></div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">Parolni O'zgartirish</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Kuchli parol tizim xavfsizligi garovidir</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Yangi Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"} required minLength="6"
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        className="w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 transition-all" 
                                        placeholder="Kamida 6 ta belgi"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Parolni Tasdiqlang</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} required minLength="6"
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        className={`w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none transition-all border 
                                            ${confirmPassword && newPassword !== confirmPassword ? 'border-rose-400 focus:ring-rose-500/20' : 'border-transparent focus:ring-indigo-500/20 focus:border-indigo-200'}`} 
                                        placeholder="Yangi parolni qayta kiriting"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-[10px] font-bold text-rose-500 pl-1">Parollar mos kelmayapti!</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={!newPassword || newPassword !== confirmPassword} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                                    <Key className="w-4 h-4" /> Parolni Yangilash
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>

            {/* --- RE-AUTHENTICATION MODAL --- */}
            {isReAuthOpen && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isReAuthLoading && setIsReAuthOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 flex flex-col animate-in zoom-in-95 border border-white/10">
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <button onClick={() => setIsReAuthOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Xavfsizlik Tekshiruvi</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            {pendingAction === 'email' ? "Emailni" : "Parolni"} o'zgartirish uchun avval joriy parolingizni tasdiqlashingiz kerak.
                        </p>

                        <form onSubmit={handleReAuthenticateAndExecute} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Joriy Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="password" required autoFocus
                                        value={currentPassword} 
                                        onChange={e => setCurrentPassword(e.target.value)} 
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 transition-all" 
                                        placeholder="Hozirgi parolingiz..."
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={isReAuthLoading || !currentPassword} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isReAuthLoading ? <Spinner className="w-4 h-4 text-inherit" /> : <><CheckCircle2 className="w-4 h-4"/> Tasdiqlash va Saqlash</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
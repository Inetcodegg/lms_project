"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useUser } from "../lib/UserContext";
import {
    Library, ShieldCheck, Mail, Lock,
    ArrowRight, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: contextLoading } = useUser();

    // Holatlar (States)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Agar tizimga allaqachon kirgan bo'lsa, o'zining paneliga haydaymiz
    useEffect(() => {
        if (!contextLoading && user) {
            router.replace(`/${user.role}`);
        }
    }, [user, contextLoading, router]);

    const showToast = (text, type = "error") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setToast(null);

        if (password.length < 6) {
            showToast("Parol kamida 6 ta belgi bo'lishi shart.", "error");
            return;
        }

        setLoading(true);

        try {
            let currentUser;

            try {
                // 1. Tizimga faqat mavjud login va parol bilan kirishga urinish
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                currentUser = userCredential.user;
            } catch (signInErr) {
                // XAVFSIZLIK: Firebase "Parol xato" bo'lsayam, "Email yo'q" bo'lsayam invalid-credential beradi
                if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password') {

                    // QUTQARUV QISMI: Faqatgina admin emaili kiritilgan bo'lsa, yangi yaratishga urinib ko'ramiz
                    if (email === 'inetcode@gmail.com') {
                        try {
                            const newUserCred = await createUserWithEmailAndPassword(auth, email, password);
                            currentUser = newUserCred.user;

                            // Adminni Firestore bazasiga yozamiz
                            await setDoc(doc(db, 'users', currentUser.uid), {
                                name: "Asosiy Administrator",
                                email: currentUser.email,
                                role: "admin",
                                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
                                createdAt: serverTimestamp()
                            });
                            showToast("Asosiy Admin akkaunti yaratildi!", "success");
                        } catch (regErr) {
                            // MUHIM QISM: Agar email allaqachon mavjud bo'lsa, demak PAROL XATO yozilgan!
                            if (regErr.code === 'auth/email-already-in-use') {
                                showToast("Email yoki parol noto'g'ri kiritildi.", "error");
                                setLoading(false);
                                return;
                            }
                            throw regErr;
                        }
                    } else {
                        // Begona odam bo'lsa darhol bloklaymiz va XATO beramiz
                        showToast("Email yoki parol noto'g'ri (yoki ruxsat yo'q).", "error");
                        setLoading(false);
                        return;
                    }
                } else {
                    // Boshqa har qanday xatolik (masalan internet uzilishi)
                    throw signInErr;
                }
            }

            // 3. Firestore bazasidan foydalanuvchi rolini tekshiramiz
            const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
            let targetRole = 'student';

            if (userDocSnap.exists()) {
                targetRole = userDocSnap.data().role || 'student';
            } else if (email !== 'inetcode@gmail.com') {
                showToast("Sizning ma'lumotlaringiz bazadan topilmadi. Ma'muriyatga murojaat qiling.", "error");
                setLoading(false);
                return;
            } else {
                targetRole = 'admin';
            }

            // 4. Olingan rolga qarab Dashboard'ga yo'naltirish
            showToast("Tizimga muvaffaqiyatli kirdingiz!", "success");
            router.replace(`/${targetRole}`);

        } catch (err) {
            console.error("Login xatosi:", err);
            if (err.code === 'auth/too-many-requests') {
                showToast("Ko'p urinishlar! Xavfsizlik yuzasidan birozdan so'ng qayta urinib ko'ring.", "error");
            } else {
                showToast("Tarmoq xatosi yoki ulanishda muammo yuz berdi.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Tizim holati tekshirila.yotganda ekranni oq ko'rsatib turish
    if (contextLoading) return null;

    return (
        <div className="flex h-[100dvh] w-full relative overflow-hidden font-sans bg-slate-900">

            {/* Tepadagi Global Alert (Toast) */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Orqa fon rasmi */}
            <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent mix-blend-multiply" />

            {/* Chap tomon: Brending */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 relative z-10 text-white">
                <div className="flex items-center space-x-3 text-2xl font-bold tracking-tight">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
                        <Library className="h-8 w-8 text-indigo-300" />
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                        Campus LMS
                    </span>
                </div>

                <div className="max-w-xl animate-in slide-in-from-left-8 duration-1000">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 px-4 py-1.5 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-widest mb-8 shadow-inner">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xavfsiz Yopiq Portal</span>
                    </div>
                    <h1 className="text-5xl xl:text-6xl font-extrabold mb-8 leading-[1.1] tracking-tight">
                        Tizimga kirish <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                            Boshqaruv markazi.
                        </span>
                    </h1>
                    <p className="text-lg xl:text-xl text-slate-300 leading-relaxed font-light max-w-md border-l-4 border-indigo-500/50 pl-6">
                        Ushbu tizimga faqatgina ma'muriyat tomonidan ruxsat berilgan talaba va o'qituvchilar kira oladi.
                    </p>
                </div>

                <div className="text-xs xl:text-sm font-medium text-slate-400 flex items-center space-x-8">
                    <span className="hover:text-white cursor-pointer transition-colors">© 2026 Aetheria</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Maxfiylik</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Yordam Markazi</span>
                </div>
            </div>

            {/* O'ng tomon: Login Formasi */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[440px] bg-white/10 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">

                    <div className="mb-10 text-center">
                        <div className="lg:hidden bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl inline-flex mb-6">
                            <Library className="h-8 w-8 text-indigo-300" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Tizimga kiring</h2>
                        <p className="text-slate-300 font-medium text-sm">Ma'muriyat bergan login va parolni kiriting</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Email manzil</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="id@campus.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-900/50 border border-white/10 focus:bg-slate-900/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder:text-slate-500 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Parol</label>
                                <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Parolni unutdingizmi?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-12 py-4 rounded-2xl bg-slate-900/50 border border-white/10 focus:bg-slate-900/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder:text-slate-500 shadow-inner"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_8px_20px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_25px_rgb(79,70,229,0.5)] transition-all duration-300 flex justify-center items-center group relative overflow-hidden mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span>Tizimga kirish</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
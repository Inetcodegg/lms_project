"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '../lib/UserContext'; 
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
    const { user, loading } = useUser();
    const router = useRouter();

    // Xavfsiz qaytish funksiyasi
    const handleSafeBack = () => {
        // Agar brauzer tarixida sahifalar bo'lsa va foydalanuvchi tizimda bo'lsa
        if (window.history.length > 1) {
            router.back();
        } else {
            // Agar tarix bo'sh bo'lsa, roliga qarab dashboardga yuboramiz
            router.push(user ? `/${user.role}` : '/login');
        }
    };

    const homePath = user ? `/${user.role}` : '/login';

    if (loading) return null; // Context yuklanishini kutamiz

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-900 text-white p-6 relative overflow-hidden">
            {/* Animatsiyali fon (Binafsha va Indigo nurlari) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 text-center max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="inline-flex p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl mb-6">
                        <AlertCircle className="w-16 h-16 text-indigo-400" />
                    </div>
                    <h1 className="text-8xl font-black tracking-tighter mb-2 opacity-20">404</h1>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Adashib qoldingizmi?</h2>
                    <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                        Siz qidirayotgan sahifa mavjud emas yoki kirish cheklangan. 
                        Xavotir olmang, quyidagi tugmalar yordamida xavfsiz joyga qaytishingiz mumkin.
                    </p>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* AQLLI ORQAGA QAYTISH TUGMASI */}
                    <button
                        onClick={handleSafeBack}
                        className="group w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Orqaga qaytish</span>
                    </button>

                    {/* TO'G'RIDAN-TO'G'RI DASHBOARDGA QAYTISH */}
                    <Link href={homePath} className="w-full sm:w-auto">
                        <button className="w-full flex items-center justify-center space-x-3 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                            <Home className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">
                                {user?.role === 'admin' ? "Admin Panel" : "Bosh sahifa"}
                            </span>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
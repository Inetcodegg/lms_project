"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/UserContext";
import { Loader2 } from "lucide-react";

import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }) {
    // 1. DIQQAT: useUser dan faqat 'user' emas, balki 'loading' ni ham olamiz!
    const { user, loading } = useUser(); 
    const router = useRouter();

    useEffect(() => {
        // 2. Kutish: Agar Firebase hali foydalanuvchini tekshirayotgan bo'lsa, hech narsa qilmang
        if (loading) return;

        // 3. Haydash: Faqatgina Firebase tekshirib bo'lgach va foydalanuvchi YO'Q bo'lsagina loginga otadi
        if (!user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // 4. Firebase tekshirayotgan 1-2 soniya ichida ekranda chiroyli Loader ko'rsatib turamiz
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] w-full text-indigo-600 bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Tizimga ulanmoqda...</p>
            </div>
        );
    }

    // Xavfsizlik: Tizimga kirmagan bo'lsa, pastdagi menyularni chizib o'tirmaydi
    if (!user) return null;

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden">
            <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative min-w-0 bg-transparent">
                
                <Header />
                
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth w-full relative pb-24 md:pb-32">
                    <div className="min-h-full flex flex-col">
                        {children}
                    </div>
                </main>
                
                <Sidebar /> 
            </div>
        </div>
    );
}
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/UserContext";
import { Loader2 } from "lucide-react";

import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }) {
    const { user, loading } = useUser(); 
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] w-full text-indigo-600 bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Tizimga ulanmoqda...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        /* ThemeProvider olib tashlandi, lekin transition klasslari qoldirildi */
        <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-500 ease-in-out">
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
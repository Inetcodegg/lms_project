"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../../../lib/UserContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname(); // Qaysi sahifada turganini bilish uchun
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Hali yuklanayotgan bo'lsa kutamiz
        if (loading) return; 
        
        if (!user) {
            // Tizimga kirmagan bo'lsa loginga otadi
            router.replace('/login');
        } else if (user.role !== 'admin') {
            // Admin bo'lmasa o'zining joyiga otadi
            router.replace(`/${user.role}`);
        } else {
            // Ruxsat beradi va HECK QAYERGA OTIB YUBORMAYDI!
            setIsAuthorized(true);
        }
    }, [user, loading, router, pathname]);

    if (loading || !isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] w-full">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
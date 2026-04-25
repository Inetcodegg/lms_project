"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    BookOpen, Calendar, CheckSquare, FileText,
    LayoutDashboard, LogOut, Users,
    Award, Clock, MessageSquare, GraduationCap, Trophy,
    Search, HelpCircle, ShieldCheck, CalendarRange, GitFork, Newspaper, Mic, Inbox, FolderOpen, AlignEndHorizontal, ClipboardCheck, FileMinusCorner, UtensilsCrossed
} from "lucide-react";
import { useUser } from "../lib/UserContext";
import { useLanguage } from "../lib/LanguageContext";
import { auth } from "../lib/firebase";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop";

// Rolga asoslangan menyular
const getMenuItems = (role, t) => {
    const basePath = `/${role}`;
    const menus = {
        student: [
            { name: t("dashboard", "Bosh panel"), icon: LayoutDashboard, path: `${basePath}` },
            { name: t("schedule", "Dars Jadvali"), icon: Calendar, path: `${basePath}/schedule` },
            { name: t("rankings"), icon: Award, path: `${basePath}/ranking` },
            { name: t("teachers"), icon: GraduationCap, path: `${basePath}/teachers` },
            { name: t("assignments"), icon: FileMinusCorner, path: `${basePath}/assignments` },
            { name: t("kitchen", "Oshxona"), icon: UtensilsCrossed, path: `${basePath}/kitchen` },
            { name: t("sports"), icon: Trophy, path: `${basePath}/sports` },
            { name: t("news"), icon: FileText, path: `${basePath}/news` },
            { name: t("documents"), icon: MessageSquare, path: `${basePath}/docs` },
            { name: t("lostFound"), icon: Search, path: `${basePath}/lost-found` },
            { name: t("attendance"), icon: AlignEndHorizontal, path: `${basePath}/attendance` },

        ],
        teacher: [
            { name: t("dashboard"), icon: LayoutDashboard, path: `${basePath}` },
            { name: t("news"), icon: Newspaper, path: `${basePath}/news` },
            { name: t("attendance"), icon: Users, path: `${basePath}/attendance` },
            { name: t("schedule"), icon: Calendar, path: `${basePath}/schedule` },
            { name: t("kitchen", "Oshxona"), icon: UtensilsCrossed, path: `${basePath}/kitchen` },
            { name: t("submissions"), icon: Inbox, path: `${basePath}/submissions` },
            { name: t("students"), icon: GraduationCap, path: `${basePath}/students` },
            { name: t("resources"), icon: FolderOpen, path: `${basePath}/resources` },
            { name: t("lostFound"), icon: Search, path: `${basePath}/lost-found` },
            { name: t("grade"), icon: ClipboardCheck, path: `${basePath}/grade` },


        ],
        chef: [
            { name: t("kitchen", "Oshxona"), icon: UtensilsCrossed, path: `${basePath}` },
        ],
        admin: [
            { name: t("dashboard"), icon: LayoutDashboard, path: `${basePath}` },
            { name: t("userManagement"), icon: Users, path: `${basePath}/users` },
            { name: t("teachers"), icon: GraduationCap, path: `${basePath}/teachers` },
            { name: t("schedule"), icon: CalendarRange, path: `${basePath}/schedule` },
            { name: t("news"), icon: FileText, path: `${basePath}/news` },
            { name: t("management"), icon: GitFork, path: `${basePath}/management` },
            { name: t("assignment"), icon: Newspaper, path: `${basePath}/assignment` },


            // { name: t("sports"), icon: Trophy, path: `${basePath}/sports` },
            { name: t("documents"), icon: ShieldCheck, path: `${basePath}/docs` },
        ]
    };
    return menus[role] || menus.student;
};

export default function DockNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useUser();
    const { t } = useLanguage();

    const currentRole = user?.role || "student";
    const links = getMenuItems(currentRole, t);

    const handleSignOut = async () => {
        try {
            await auth.signOut(); // Firebase'dan uzadi
            if (logout) logout(); // UserContext ni tozalaydi
            router.replace('/login'); // Srazu Login sahifasiga otadi va tarixni tozalaydi
        } catch (error) {
            console.error("Chiqishda xato:", error);
        }
    };

    return (
        <>
            {/* DESKTOP MAC-OS DOCK (Kompyuter va Planshetlar uchun)
            */}
            <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-end gap-2 px-4 py-3 bg-white/40 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">

                    {links.map((item) => {
                        const Icon = item.icon;
                        const isExact = pathname === item.path;
                        const isSub = item.path !== `/${currentRole}` && pathname.startsWith(item.path);
                        const isActive = isExact || isSub;

                        return (
                            <Link key={item.path} href={item.path} className="group relative flex flex-col items-center">
                                {/* Mac OS Tooltip */}
                                <div className="absolute -top-12 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-xl">
                                    {item.name}
                                    {/* Tooltip burchagi (Triangle) */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>

                                {/* Ikonka va Animatsiya */}
                                <div className={`relative p-3.5 rounded-2xl transition-all duration-300 ease-out origin-bottom hover:scale-[1.3] hover:-translate-y-2 hover:mx-2 cursor-pointer ${isActive
                                    ? "bg-indigo-600 shadow-lg shadow-indigo-500/40 text-white"
                                    : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                                    }`}>
                                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                {/* Mac OS faol nuqtasi (Dot) */}
                                {isActive && (
                                    <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-slate-800 dark:bg-white rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Ajratuvchi chiziq (Divider) */}
                    <div className="w-px h-10 bg-slate-300 dark:bg-white/10 mx-2 self-center"></div>

                    {/* Profil Sozlamalari */}
                    <Link href={`/${currentRole}/profile`} className="group relative flex flex-col items-center">
                        <div className="absolute -top-12 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none transition-all duration-300 shadow-xl">
                            {t("settings")}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                        </div>
                        <div className="relative p-1 rounded-2xl transition-all duration-300 ease-out origin-bottom hover:scale-[1.3] hover:-translate-y-2 hover:mx-2 cursor-pointer bg-white/50 dark:bg-slate-800/50">
                            <img
                                src={user?.avatar || FALLBACK_AVATAR}
                                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR }}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-white/50"
                                alt="Profil"
                            />
                        </div>
                        {pathname === `/${currentRole}/profile` && (
                            <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-slate-800 dark:bg-white rounded-full"></div>
                        )}
                    </Link>

                    {/* Chiqish (LogOut) */}
                    <button onClick={handleSignOut} className="group relative flex flex-col items-center">
                        <div className="absolute -top-12 px-3 py-1.5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-xl">
                            {t("signOut")}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-600 rotate-45"></div>
                        </div>
                        <div className="relative p-3.5 rounded-2xl transition-all duration-300 ease-out origin-bottom hover:scale-[1.3] hover:-translate-y-2 hover:mx-2 cursor-pointer text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20">
                            <LogOut className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                    </button>

                </div>
            </div>

            {/* MOBILE BOTTOM APP NAV (Telefonlar uchun scroll bo'ladigan menyu)
            */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/10 pb-safe">
                <div className="flex items-center overflow-x-auto no-scrollbar px-2 py-2 snap-x">
                    {links.map((item) => {
                        const Icon = item.icon;
                        const isExact = pathname === item.path;
                        const isSub = item.path !== `/${currentRole}` && pathname.startsWith(item.path);
                        const isActive = isExact || isSub;

                        return (
                            <Link key={item.path} href={item.path} className="snap-start shrink-0">
                                <div className="flex flex-col items-center justify-center w-16 h-14 relative transition-all duration-300">
                                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-indigo-600 shadow-md text-white -translate-y-1" : "text-slate-500 dark:text-slate-400"
                                        }`}>
                                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    {/* Agar yozuvni yashirib faqat icon qilmoqchi bo'lsangiz quyidagi qatorni yashiring */}
                                    <span className={`text-[8px] font-bold mt-1 max-w-[60px] truncate ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>
                                        {item.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    <div className="w-px h-8 bg-slate-300 dark:bg-white/10 mx-2 shrink-0"></div>

                    <button onClick={handleSignOut} className="snap-start shrink-0 flex flex-col items-center justify-center w-16 h-14 text-rose-500">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[8px] font-bold mt-1">{t('signOut')}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
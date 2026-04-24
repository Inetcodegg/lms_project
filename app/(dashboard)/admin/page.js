"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../components/Card";
import {
    Users, Server, HardDrive, LifeBuoy, Search, Filter, 
    MoreHorizontal, CheckCircle2, AlertCircle, Clock, Trash2, ShieldCheck, Mail
} from "lucide-react";
import { adminApi } from "../../../lib/api/adminApi";
import { useUser } from "../../../lib/UserContext";
import Spinner from "../../../components/Spinner";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop";

export default function AdminDashboard() {
    const { user } = useUser();
    
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtr va qidiruv
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);
                const [statsData, usersData, ticketsData] = await Promise.all([
                    adminApi.getSystemStats(),
                    adminApi.getUsers(),
                    adminApi.getTickets()
                ]);
                setStats(statsData);
                setUsersList(usersData || []);
                setTickets(ticketsData || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    // Ticketni Yopish
    const handleCloseTicket = async (ticketId) => {
        try {
            await adminApi.updateTicketStatus(ticketId, 'Closed');
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'Closed' } : t));
        } catch (error) {
            alert("Xatolik yuz berdi");
        }
    };

    // Userni o'chirish
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) return;
        try {
            await adminApi.deleteUserDoc(userId);
            setUsersList(usersList.filter(u => u.id !== userId));
        } catch (error) {
            alert("O'chirishda xato yuz berdi");
        }
    };

    // Userlarni filterlash
    const filteredUsers = useMemo(() => {
        let result = usersList;
        if (roleFilter !== "All") {
            result = result.filter(u => u.role === roleFilter.toLowerCase());
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u => 
                u.name?.toLowerCase().includes(q) || 
                u.email?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [usersList, roleFilter, searchQuery]);

    // Rol ranglarini aniqlash
    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
            case 'teacher': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'chef': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            default: return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <header className="mb-8 md:mb-12">
                <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Admin Bosh Paneli</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Tizim boshqaruvi va monitoringi</p>
            </header>

            {/* Top Stats - Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                {[
                    { title: stats?.totalUsers || 0, label: "Foydalanuvchilar", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { title: stats?.activeTickets || 0, label: "Ochiq Shikoyatlar", icon: LifeBuoy, color: "text-rose-500", bg: "bg-rose-500/10" },
                    { title: stats?.serverStatus || "100%", label: "Server Holati", icon: Server, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: stats?.storageUsed || "0%", label: "Xotira Bandligi", icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" }
                ].map((stat, idx) => (
                    <Card key={idx} className="p-5 md:p-6 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[32px] shadow-sm flex items-center space-x-4">
                        <div className={`p-4 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.title}</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
                
                {/* Chap qism: Foydalanuvchilarni Boshqarish */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8">
                    <Card className="p-0 overflow-hidden bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
                        <div className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Foydalanuvchilar</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text" placeholder="Ism yoki Email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                                    />
                                </div>
                                <select 
                                    value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                                >
                                    <option value="All">Barcha Rollar</option>
                                    <option value="Student">Talabalar</option>
                                    <option value="Teacher">O'qituvchilar</option>
                                    <option value="Admin">Adminlar</option>
                                    <option value="Chef">Oshxonalar</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                        <th className="py-4 pl-6 md:pl-8">Foydalanuvchi</th>
                                        <th className="py-4">Rol</th>
                                        <th className="py-4">Qo'shilgan sana</th>
                                        <th className="py-4 pr-6 md:pr-8 text-right">Amal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan="4" className="py-10 text-center text-sm font-bold text-slate-400">Yuklanmoqda...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="py-10 text-center text-sm font-bold text-slate-400">Foydalanuvchi topilmadi</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-3 md:py-4 pl-6 md:pl-8">
                                                    <div className="flex items-center space-x-3">
                                                        <img src={u.avatar || FALLBACK_AVATAR} onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                                        <div>
                                                            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{u.name || "Ismsiz"}</p>
                                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 md:py-4">
                                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${getRoleBadge(u.role || 'student')}`}>
                                                        {u.role || 'student'}
                                                    </span>
                                                </td>
                                                <td className="py-3 md:py-4 text-[10px] md:text-[11px] font-bold text-slate-500">
                                                    Yaqinda
                                                </td>
                                                <td className="py-3 md:py-4 pr-6 md:pr-8 text-right">
                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* O'ng qism: Support Tickets */}
                <div className="space-y-6 md:space-y-8">
                    <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-2">
                                <LifeBuoy className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Yordam So'rovlari</h2>
                            </div>
                            <span className="px-2 py-1 bg-indigo-500 text-white rounded-md text-[10px] font-black">{tickets.filter(t => t.status === 'Open').length} Ochiq</span>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                            {loading ? (
                                <p className="text-xs text-slate-400 text-center py-10">Yuklanmoqda...</p>
                            ) : tickets.length === 0 ? (
                                <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Barcha muammolar hal etilgan</p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div key={ticket.id} className={`p-4 rounded-2xl border ${ticket.status === 'Open' ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/20 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 opacity-70'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-[13px] font-black text-slate-900 dark:text-white line-clamp-1 flex-1">{ticket.subject}</h4>
                                            {ticket.status === 'Open' ? (
                                                <span className="shrink-0 flex items-center space-x-1 text-amber-500 text-[9px] font-black uppercase ml-2">
                                                    <Clock className="w-3 h-3" /> <span>Kutmoqda</span>
                                                </span>
                                            ) : (
                                                <span className="shrink-0 flex items-center space-x-1 text-emerald-500 text-[9px] font-black uppercase ml-2">
                                                    <CheckCircle2 className="w-3 h-3" /> <span>Yopilgan</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{ticket.message}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-400">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{ticket.userEmail}</span>
                                            </div>
                                            {ticket.status === 'Open' && (
                                                <button onClick={() => handleCloseTicket(ticket.id)} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                                    Hal qilindi
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
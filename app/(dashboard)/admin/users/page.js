"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    Search, Trash2, Edit, UserPlus, 
    Shield, GraduationCap, BookOpen, ChefHat, 
    AlertCircle, CheckCircle2, X, Loader2, Users,
    Mail, Lock, User
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { adminApi } from "../../../../lib/api/adminApi"; 

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [toast, setToast] = useState(null);

    // Edit Modal state'lari
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // --- MANA SHU QISM QOLIB KETGAN EDI ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "student" });
    // --------------------------------------

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

// XAVFSIZ FETCH USERS FUNKSIYASI
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Xavfsiz sana tekshiruvi:
                    dateAdded: data.createdAt && data.createdAt.toDate 
                        ? data.createdAt.toDate().toLocaleDateString('uz-UZ') 
                        : "Yaqinda"
                };
            });
            
            // Xavfsiz saralash: Agar sana kiritilmagan bo'lsa, xato bermaydi, oxiriga suradi
            usersData.sort((a, b) => {
                const timeA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            
            setUsers(usersData);
        } catch (error) {
            console.error("Userlarni yuklashda xato:", error);
            showToast("Ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // FOYDALANUVCHI QO'SHISH
    const handleAddUser = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const addedUser = await adminApi.createNewUser(newUserForm);
            setUsers([addedUser, ...users]); 
            setIsAddModalOpen(false);
            setNewUserForm({ name: "", email: "", password: "", role: "student" }); 
            showToast(`${addedUser.name} muvaffaqiyatli qo'shildi!`);
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setIsAdding(false);
        }
    };

    // ROLNI YANGILASH
    const handleUpdateRole = async (e) => {
        e.preventDefault();
        if (!editingUser || !newRole) return;
        setIsSaving(true);
        try {
            const userRef = doc(db, "users", editingUser.id);
            await updateDoc(userRef, { role: newRole });
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
            setIsEditModalOpen(false);
            showToast("Foydalanuvchi roli muvaffaqiyatli yangilandi!");
        } catch (error) {
            showToast("Rolni yangilashda xato yuz berdi.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // FOYDALANUVCHINI O'CHIRISH
    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`Rostdan ham ${name} bazadan o'chirilsinmi?`)) return;
        try {
            await deleteDoc(doc(db, "users", id));
            setUsers(users.filter(u => u.id !== id));
            showToast("Foydalanuvchi bazadan o'chirildi.");
        } catch (error) {
            showToast("O'chirishda xato yuz berdi.", "error");
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "All" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const getRoleConfig = (role) => {
        switch(role) {
            case 'admin': return { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20', icon: Shield };
            case 'teacher': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', icon: GraduationCap };
            case 'chef': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20', icon: ChefHat };
            default: return { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20', icon: BookOpen };
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Foydalanuvchilar</h1>
                    <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Jami {users.length} kishi</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Ism yoki Email qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 dark:text-white shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="flex-1 sm:flex-none bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 dark:text-white shadow-sm cursor-pointer"
                        >
                            <option value="All">Barcha rollar</option>
                            <option value="student">Talaba</option>
                            <option value="teacher">O'qituvchi</option>
                            <option value="admin">Admin</option>
                            <option value="chef">Oshxona</option>
                        </select>
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="flex items-center space-x-2 px-5 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 shrink-0"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Yangi Qo'shish</span>
                        </button>
                    </div>
                </div>
            </header>

            <Card className="p-0 overflow-hidden bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-3xl md:rounded-[40px] shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="py-5 pl-6 md:pl-10">Foydalanuvchi</th>
                                <th className="py-5 px-4">Holati / Roli</th>
                                <th className="py-5 px-4">Fakultet / Yo'nalish</th>
                                <th className="py-5 px-4">Ro'yxatdan o'tgan</th>
                                <th className="py-5 pr-6 md:pr-10 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Topilmadi</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const conf = getRoleConfig(u.role);
                                    const RoleIcon = conf.icon;
                                    
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="py-4 pl-6 md:pl-10">
                                                <div className="flex items-center space-x-4">
                                                    <img 
                                                        src={u.avatar || FALLBACK_AVATAR} 
                                                        onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                                        className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm" 
                                                        alt={u.name} 
                                                    />
                                                    <div>
                                                        <p className="text-sm md:text-[15px] font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">{u.name || "Ismsiz Talaba"}</p>
                                                        <p className="text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border ${conf.bg} ${conf.text} ${conf.border} shadow-sm`}>
                                                    <RoleIcon className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{u.role || 'student'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {u.major || u.department || <span className="text-slate-400 italic">Kiritilmagan</span>}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{u.dateAdded}</p>
                                            </td>
                                            <td className="py-4 pr-6 md:pr-10 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <button 
                                                        onClick={() => { setEditingUser(u); setNewRole(u.role || 'student'); setIsEditModalOpen(true); }}
                                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                                        className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ROLNI O'ZGARTIRISH MODALI */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsEditModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-8 border border-white dark:border-white/10 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ruxsatlarni Tahrirlash</h3>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">{editingUser.name}</p>
                            </div>
                            <button disabled={isSaving} onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRole} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Foydalanuvchi Roli</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[{ id: 'student', label: 'Talaba', icon: BookOpen }, { id: 'teacher', label: "O'qituvchi", icon: GraduationCap }, { id: 'admin', label: 'Admin', icon: Shield }, { id: 'chef', label: 'Oshxona', icon: ChefHat }].map(r => (
                                        <button
                                            key={r.id} type="button" onClick={() => setNewRole(r.id)}
                                            className={`flex items-center justify-center space-x-2 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                                                newRole === r.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <r.icon className="w-4 h-4" /> <span>{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex space-x-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Bekor qilish</button>
                                <button type="submit" disabled={isSaving || newRole === editingUser.role} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* YANGI FOYDALANUVCHI QO'SHISH MODALI */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isAdding && setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-8 border border-white dark:border-white/10 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Yangi Foydalanuvchi</h3>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">Tizimga a'zo qo'shish</p>
                            </div>
                            <button disabled={isAdding} onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ism va Familiya</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white" placeholder="F.I.SH" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email (Login uchun)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white" placeholder="email@campus.edu" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vaqtinchalik Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="text" minLength="6" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white" placeholder="min 6 ta belgi" />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tizimdagi Roli</label>
                                <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white cursor-pointer">
                                    <option value="student">Talaba</option>
                                    <option value="teacher">O'qituvchi</option>
                                    <option value="chef">Oshxona</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex space-x-3 mt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isAdding} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                    Bekor qilish
                                </button>
                                <button type="submit" disabled={isAdding} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50">
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'shish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    Search, Trash2, UserPlus, ShieldAlert, GraduationCap, 
    AlertCircle, CheckCircle2, X, Loader2, Mail, Lock, User, 
    Settings2, Ban, Check, BookOpen
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { adminApi } from "../../../../lib/api/adminApi"; 

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop";

// O'qituvchi uchun standart (Boshlang'ich) cheklovlar
const DEFAULT_PERMISSIONS = {
    canCreateCourse: false, // Boshida fan yarata olmaydi
    canEditGrades: true,    // Baho qo'yishga ruxsati bor
    canUploadFiles: true,   // Fayl yuklay oladi
    isBlocked: false        // Bloklanmagan
};

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState(null);

    // Qo'shish Modali
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newTeacherForm, setNewTeacherForm] = useState({ name: "", email: "", password: "", subject: "" });

    // Cheklovlar (Settings) Modali
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Faqat O'qituvchilarni bazadan tortib olish
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            // WHERE orqali faqat roli 'teacher' bo'lganlarni olamiz
            const q = query(collection(db, "users"), where("role", "==", "teacher"));
            const querySnapshot = await getDocs(q);
            
            const teachersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                permissions: doc.data().permissions || DEFAULT_PERMISSIONS, // Agar permissions yo'q bo'lsa default beriladi
                dateAdded: doc.data().createdAt?.toDate().toLocaleDateString('uz-UZ') || "Yaqinda"
            }));
            
            teachersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setTeachers(teachersData);
        } catch (error) {
            console.error("Xato:", error);
            showToast("Ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeachers(); }, []);

    // 2. YANGI O'QITUVCHI QO'SHISH
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            // Admin API orqali yaratamiz (role qat'iy teacher bo'ladi)
            const addedUser = await adminApi.createNewUser({
                ...newTeacherForm,
                role: "teacher"
            });
            
            // Yaratilgandan so'ng, qo'shimcha ma'lumotlarni (Fan va Cheklovlarni) Update qilamiz
            const userRef = doc(db, "users", addedUser.id);
            await updateDoc(userRef, {
                subject: newTeacherForm.subject,
                permissions: DEFAULT_PERMISSIONS
            });

            const completeTeacher = { ...addedUser, subject: newTeacherForm.subject, permissions: DEFAULT_PERMISSIONS };
            
            setTeachers([completeTeacher, ...teachers]); 
            setIsAddModalOpen(false);
            setNewTeacherForm({ name: "", email: "", password: "", subject: "" }); 
            showToast(`${addedUser.name} o'qituvchi sifatida qo'shildi!`);
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setIsAdding(false);
        }
    };

    // 3. CHEKLOVLARNI (PERMISSIONS) SAQLASH
    const handleSavePermissions = async () => {
        if (!selectedTeacher) return;
        setIsSavingPermissions(true);
        try {
            const userRef = doc(db, "users", selectedTeacher.id);
            await updateDoc(userRef, { permissions: permissions });
            
            // UI dagi ma'lumotni darhol yangilash
            setTeachers(teachers.map(t => t.id === selectedTeacher.id ? { ...t, permissions: permissions } : t));
            
            setIsSettingsModalOpen(false);
            showToast("O'qituvchi cheklovlari muvaffaqiyatli saqlandi!");
        } catch (error) {
            console.error(error);
            showToast("Saqlashda xatolik yuz berdi.", "error");
        } finally {
            setIsSavingPermissions(false);
        }
    };

    // 4. O'CHIRISH
    const handleDeleteTeacher = async (id, name) => {
        if (!window.confirm(`Rostdan ham ${name} o'chirilsinmi? Barcha ma'lumotlari yo'qoladi.`)) return;
        try {
            await deleteDoc(doc(db, "users", id));
            setTeachers(teachers.filter(t => t.id !== id));
            showToast("O'qituvchi bazadan o'chirildi.");
        } catch (error) {
            showToast("O'chirishda xato yuz berdi.", "error");
        }
    };

    // Qidiruv
    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => 
            t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teachers, searchQuery]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">O'qituvchilar</h1>
                    <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        <span className="flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {teachers.length} ta O'qituvchi</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Ism, Email yoki Fan qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-white shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="flex items-center space-x-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">O'qituvchi Qo'shish</span>
                    </button>
                </div>
            </header>

            <Card className="p-0 overflow-hidden bg-white/60 dark:bg-slate-900/40 border border-white dark:border-white/5 rounded-3xl md:rounded-[40px] shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="py-5 pl-6 md:pl-10">O'qituvchi</th>
                                <th className="py-5 px-4">O'tadigan Fani</th>
                                <th className="py-5 px-4">Tizimga Kirish / Holati</th>
                                <th className="py-5 pr-6 md:pr-10 text-right">Boshqaruv</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" /></td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O'qituvchi topilmadi</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((t) => (
                                    <tr key={t.id} className={`transition-colors group ${t.permissions?.isBlocked ? 'bg-rose-50/30 dark:bg-rose-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                                        <td className="py-4 pl-6 md:pl-10">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <img src={t.avatar || FALLBACK_AVATAR} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border ${t.permissions?.isBlocked ? 'border-rose-300 grayscale' : 'border-slate-200 dark:border-slate-700'}`} alt={t.name} />
                                                    {t.permissions?.isBlocked && (
                                                        <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-0.5 border-2 border-white dark:border-slate-900">
                                                            <Ban className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm md:text-[15px] font-black tracking-tight line-clamp-1 ${t.permissions?.isBlocked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{t.name}</p>
                                                    <p className="text-[10px] md:text-[11px] font-bold text-slate-500 line-clamp-1">{t.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t.subject || "Biriktirilmagan"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            {t.permissions?.isBlocked ? (
                                                <span className="px-2.5 py-1 bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center w-max">
                                                    <Ban className="w-3 h-3 mr-1" /> Bloklangan
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center w-max">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Faol
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 pr-6 md:pr-10 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* CHEKLOVLAR TUGMASI */}
                                                <button 
                                                    onClick={() => { setSelectedTeacher(t); setPermissions(t.permissions || DEFAULT_PERMISSIONS); setIsSettingsModalOpen(true); }}
                                                    className={`p-2.5 rounded-xl transition-all ${t.permissions?.isBlocked ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600'}`}
                                                    title="Cheklovlar va Ruxsatlar"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTeacher(t.id, t.name)}
                                                    className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                                                    title="Bazadan o'chirish"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 1. O'QITUVCHI QO'SHISH MODALI */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isAdding && setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 border border-white/10 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Yangi O'qituvchi</h3>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Tizimga qo'shish</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddTeacher} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ism va Familiya</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="text" value={newTeacherForm.name} onChange={e => setNewTeacherForm({...newTeacherForm, name: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold dark:text-white" placeholder="F.I.SH" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="email" value={newTeacherForm.email} onChange={e => setNewTeacherForm({...newTeacherForm, email: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold dark:text-white" placeholder="teacher@campus.edu" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="text" minLength="6" value={newTeacherForm.password} onChange={e => setNewTeacherForm({...newTeacherForm, password: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold dark:text-white" placeholder="min 6 ta belgi" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Qaysi fandan dars beradi?</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input required type="text" value={newTeacherForm.subject} onChange={e => setNewTeacherForm({...newTeacherForm, subject: e.target.value})} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold dark:text-white" placeholder="Masalan: Oliy matematika" />
                                </div>
                            </div>

                            <button type="submit" disabled={isAdding} className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50">
                                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "O'qituvchini Saqlash"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. CHEKLOVLAR VA RUXSATLAR (SETTINGS) MODALI */}
            {isSettingsModalOpen && selectedTeacher && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSavingPermissions && setIsSettingsModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-8 border border-white dark:border-white/10 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-8 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
                                    <ShieldAlert className="w-5 h-5 text-indigo-500 mr-2" /> Ruxsatnomalar
                                </h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">O'qituvchi: {selectedTeacher.name}</p>
                            </div>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            {/* Cheklov 1 */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Fan yaratish huquqi</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Tizimda yangi darsliklar qo'shishiga ruxsat</p>
                                </div>
                                <button 
                                    onClick={() => setPermissions({...permissions, canCreateCourse: !permissions.canCreateCourse})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${permissions.canCreateCourse ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${permissions.canCreateCourse ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Cheklov 2 */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Baholash huquqi</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Talabalarga baho qo'yish va o'zgartirish</p>
                                </div>
                                <button 
                                    onClick={() => setPermissions({...permissions, canEditGrades: !permissions.canEditGrades})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${permissions.canEditGrades ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${permissions.canEditGrades ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Cheklov 3 (Qat'iy Bloklash) */}
                            <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20 mt-6">
                                <div>
                                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">Tizimga kirishni bloklash</p>
                                    <p className="text-[9px] font-bold text-rose-500/70 mt-0.5">O'qituvchi profiliga kira olmaydi</p>
                                </div>
                                <button 
                                    onClick={() => setPermissions({...permissions, isBlocked: !permissions.isBlocked})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${permissions.isBlocked ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${permissions.isBlocked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleSavePermissions} 
                            disabled={isSavingPermissions} 
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isSavingPermissions ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cheklovlarni Saqlash"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
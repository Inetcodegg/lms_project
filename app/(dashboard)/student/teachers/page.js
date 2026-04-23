"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import {
    Search, Filter, Mail, Calendar, BookOpen,
    Star, MessageSquare, Globe, Plus,
    MoreHorizontal, MapPin, Users, Loader2, X, GraduationCap
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import { teachersApi } from "../../../../lib/api/teachersApi";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop";

// --- O'QITUVCHI KARTASI ---
const TeacherCard = ({ teacher, onBook, isAdmin }) => {
    const [imgSrc, setImgSrc] = useState(teacher.avatar || FALLBACK_AVATAR);

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-3xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col lg:flex-row h-full">
            {/* Rasm qismi */}
            <div className="w-full lg:w-72 h-64 lg:h-auto overflow-hidden relative shrink-0 bg-slate-100 dark:bg-slate-800">
                <img 
                    src={imgSrc} 
                    onError={() => setImgSrc(FALLBACK_AVATAR)} 
                    alt={teacher.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl flex items-center space-x-1.5 text-white border border-white/20 shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{teacher.rating || "Top Rated"}</span>
                    </div>
                </div>
                {isAdmin && (
                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-rose-500/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                        {teacher.assignedGroups?.join(', ') || 'All'}
                    </div>
                )}
            </div>

            {/* Ma'lumot qismi */}
            <div className="flex-1 p-6 md:p-10 flex flex-col">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{teacher.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:space-x-3 text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            <span>{teacher.role}</span>
                            <div className="hidden md:block w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <span className="text-slate-500 dark:text-slate-400">{teacher.department}</span>
                        </div>
                    </div>
                    {isAdmin && (
                        <button className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shrink-0">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <p className="text-xs md:text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 md:mb-8 line-clamp-3 md:line-clamp-none max-w-2xl">
                    {teacher.bio}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 border-y border-slate-50 dark:border-white/5 py-4 md:py-6">
                    <div className="space-y-1.5">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5" /> <span>Qabul vaqti & Xona</span>
                        </p>
                        <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">{teacher.officeHours}</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> <span>Mutaxassislik</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {(teacher.tags || []).slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] md:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 md:gap-4">
                    <button 
                        onClick={() => onBook(teacher)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 md:space-x-3 px-6 md:px-8 py-3 md:py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl md:rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 transform"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Qabulga yozilish</span>
                    </button>
                    <a href={`mailto:${teacher.email}`} className="p-3 md:p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-[20px] text-slate-500 hover:text-indigo-600 hover:bg-white transition-all shadow-sm">
                        <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                    <button className="p-3 md:p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-[20px] text-slate-500 hover:text-indigo-600 hover:bg-white transition-all shadow-sm">
                        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function TeachersPage() {
    const { user } = useUser();
    
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMsg, setToastMsg] = useState("");

    // Admin Add Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", role: "Professor", department: "", officeHours: "", email: "", bio: "", avatar: "", assignedGroups: "" });

    // Book Appointment Modal
    const [showBookModal, setShowBookModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [bookData, setBookData] = useState({ date: "", time: "", reason: "" });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // API ga rol va guruhni (yoki fakultetni) beramiz. 
                // Misol: user.groupId = 'Guruh-101'
                const [teachersData, statsData] = await Promise.all([
                    teachersApi.getTeachers(user?.role, user?.groupId || 'all'),
                    teachersApi.getFacultyStats()
                ]);
                setTeachers(teachersData || []);
                setStats(statsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role, user?.groupId]);

    const showToast = (msg, isError = false) => {
        setToastMsg({ msg, isError });
        setTimeout(() => setToastMsg(null), 4000);
    };

    // Admin: Yangi o'qituvchi qo'shish
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const groupsArray = formData.assignedGroups.split(',').map(g => g.trim()).filter(g => g);
            const tagsArray = ["Yangi", formData.department.substring(0, 5)];

            const newTeacher = await teachersApi.addTeacher({
                ...formData,
                assignedGroups: groupsArray.length > 0 ? groupsArray : ['all'],
                tags: tagsArray
            });

            setTeachers([newTeacher, ...teachers]);
            setShowAddModal(false);
            setFormData({ name: "", role: "Professor", department: "", officeHours: "", email: "", bio: "", avatar: "", assignedGroups: "" });
            showToast("O'qituvchi muvaffaqiyatli qo'shildi!");
        } catch (error) {
            showToast("Xatolik yuz berdi.", true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Talaba: Qabulga yozilish
    const handleBookAppointment = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await teachersApi.bookAppointment(
                selectedTeacher.id,
                selectedTeacher.name,
                bookData.date,
                bookData.time,
                bookData.reason
            );
            setShowBookModal(false);
            setBookData({ date: "", time: "", reason: "" });
            showToast(`✓ ${selectedTeacher.name} qabuliga yozildingiz!`);
        } catch (error) {
            showToast("Xatolik yuz berdi.", true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Qidiruv filtri
    const filteredTeachers = useMemo(() => {
        if (!searchQuery) return teachers;
        const q = searchQuery.toLowerCase();
        return teachers.filter(t => 
            t.name?.toLowerCase().includes(q) || 
            t.department?.toLowerCase().includes(q) ||
            t.tags?.some(tag => tag.toLowerCase().includes(q))
        );
    }, [teachers, searchQuery]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Toast Notification */}
            {toastMsg && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-xl font-bold text-xs animate-in slide-in-from-top-4 duration-300 ${toastMsg.isError ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toastMsg.msg}
                </div>
            )}

            {/* Header Section */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-12">
                <div className="w-full xl:w-auto">
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 md:mb-3">Fakultet O'qituvchilari</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        {isAdmin ? "Tizimdagi barcha o'qituvchilarni boshqarish" : "Sizning guruhingizga biriktirilgan professorlar"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 w-full sm:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Ism, kafedra bo'yicha qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl md:rounded-[32px] py-3.5 md:py-4 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        {isAdmin && (
                            <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-[32px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 transform">
                                <Plus className="w-4 h-4" />
                                <span className="sm:hidden lg:block">O'qituvchi Qo'shish</span>
                            </button>
                        )}
                        <button className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl md:rounded-[32px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm shrink-0">
                            <Filter className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* O'qituvchilar Ro'yxati */}
            <div className="space-y-6 md:space-y-10">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 md:h-80 bg-slate-100 dark:bg-slate-800 rounded-[32px] md:rounded-[40px] animate-pulse"></div>)
                ) : filteredTeachers.length === 0 ? (
                    <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] md:rounded-[40px]">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Sizga biriktirilgan o'qituvchilar topilmadi</p>
                    </div>
                ) : (
                    filteredTeachers.map(teacher => (
                        <TeacherCard 
                            key={teacher.id} 
                            teacher={teacher} 
                            isAdmin={isAdmin}
                            onBook={(t) => { setSelectedTeacher(t); setShowBookModal(true); }} 
                        />
                    ))
                )}

                {/* Horizontal Stat Bar (Footer) */}
                <Card className="p-6 md:p-8 bg-slate-900 border-none rounded-2xl md:rounded-[40px] shadow-2xl overflow-hidden relative mt-10">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-8 text-center">
                        <div className="w-full md:w-auto flex items-center justify-between md:block px-4 md:px-0 border-b border-white/10 md:border-0 pb-4 md:pb-0">
                            <p className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest md:mb-1">Faol Professorlar</p>
                            <h4 className="text-xl md:text-3xl font-black text-white">{stats?.activeProfessors || 0}</h4>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10"></div>
                        <div className="w-full md:w-auto flex items-center justify-between md:block px-4 md:px-0 border-b border-white/10 md:border-0 pb-4 md:pb-0">
                            <p className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest md:mb-1">PhD Nomzodlari</p>
                            <h4 className="text-xl md:text-3xl font-black text-white">{stats?.phdCandidates || 0}</h4>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10"></div>
                        <div className="w-full md:w-auto flex items-center justify-between md:block px-4 md:px-0">
                            <p className="text-[9px] md:text-[10px] font-black text-amber-400 uppercase tracking-widest md:mb-1">Fakultetlar</p>
                            <h4 className="text-xl md:text-3xl font-black text-white">{stats?.departments || 0}</h4>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10"></div>
                        <button className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-900 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors mt-2 md:mt-0">
                            Fakultet Boshqaruvi
                        </button>
                    </div>
                    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-24 -mt-24 md:-ml-32 md:-mt-32"></div>
                </Card>
            </div>

            {/* MODAL 1: Yordamga/Qabulga Yozilish (Talaba uchun) */}
            {showBookModal && selectedTeacher && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowBookModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Qabulga yozilish</h3>
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">{selectedTeacher.name}</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowBookModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBookAppointment} className="space-y-4 md:space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Sana</label>
                                    <input type="date" required value={bookData.date} onChange={e => setBookData({...bookData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Vaqt</label>
                                    <input type="time" required value={bookData.time} onChange={e => setBookData({...bookData, time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Maqsad</label>
                                <textarea required rows="3" placeholder="Nima masalada uchrashtirmoqchisiz?" value={bookData.reason} onChange={e => setBookData({...bookData, reason: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:text-white custom-scrollbar" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-70">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bron Qilish"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Yangi O'qituvchi Qo'shish (Faqat Admin) */}
            {isAdmin && showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">O'qituvchi Qo'shish</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Admin Boshqaruvi</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowAddModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddTeacher} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">F.I.Sh</label>
                                    <input type="text" required placeholder="Masalan: Dr. Aliyev" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Lavozim</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
                                        <option>Professor</option>
                                        <option>Dotsent</option>
                                        <option>Katta O'qituvchi</option>
                                        <option>Assistent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Kafedra / Fakultet</label>
                                    <input type="text" required placeholder="Computer Science" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Qabul vaqti</label>
                                    <input type="text" required placeholder="Du & Chor, 14:00" value={formData.officeHours} onChange={e => setFormData({...formData, officeHours: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Biriktirilgan Guruhlar (Vergul bilan)</label>
                                <input type="text" placeholder="Masalan: Guruh-101, Guruh-102 (Bo'sh = Hammaga)" value={formData.assignedGroups} onChange={e => setFormData({...formData, assignedGroups: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Email</label>
                                <input type="email" required placeholder="teacher@campus.edu" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Rasm URL (Supabase/Firebase)</label>
                                <input type="url" placeholder="https://..." value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Bio (Ma'lumot)</label>
                                <textarea required rows="3" placeholder="O'qituvchi haqida..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:text-white custom-scrollbar" />
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3">
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center min-w-[120px] shadow-lg active:scale-95 disabled:opacity-70">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
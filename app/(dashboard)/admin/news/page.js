"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    Newspaper, Plus, Trash2, Edit, Send, 
    X, Loader2, Megaphone, Users, Globe, 
    AlertCircle, CheckCircle2, Calendar, Image as ImageIcon,
    Folder, Layers, ChevronDown, Check, UserCheck, UserX, Ticket, UploadCloud, Dumbbell, BookOpen
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

const CATEGORIES = ["Umumiy", "Sport", "Tadbir", "Imtihon", "Muhim"];

// --- 🌟 PROFESSIONAL ANIMATSION IKONKALAR (Ranglarsiz, toza) ---
const AnimatedCategoryIcon = ({ category }) => {
    switch (category) {
        case "Sport": return <Dumbbell className="w-8 h-8 text-slate-400 animate-bounce transition-all" />;
        case "Tadbir": return <Ticket className="w-8 h-8 text-slate-400 animate-pulse transition-all" />;
        case "Imtihon": return <BookOpen className="w-8 h-8 text-slate-400 animate-[pulse_2s_ease-in-out_infinite]" />;
        case "Muhim": return <AlertCircle className="w-8 h-8 text-slate-400 animate-pulse" />;
        default: return <Globe className="w-8 h-8 text-slate-400 animate-[spin_4s_linear_infinite]" />;
    }
};

// --- CUSTOM SELECT KOMPONENTI ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold border transition-all duration-200 select-none outline-none
                ${disabled ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800 border-transparent cursor-pointer hover:border-indigo-500/30 dark:text-white shadow-sm'}
                ${isOpen ? 'border-indigo-500/50 ring-2 ring-indigo-500/20' : ''}`}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[600] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-2">
                        {options.length === 0 ? (
                            <p className="p-3 text-xs text-slate-400 font-bold text-center">Ma'lumot topilmadi</p>
                        ) : (
                            options.map((opt) => (
                                <div
                                    key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm font-bold transition-all mb-1 last:mb-0
                                        ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}
                                    `}
                                >
                                    <div className="flex items-center truncate pr-2">
                                        {opt.icon && <opt.icon className="w-4 h-4 mr-2 opacity-70" />}
                                        {opt.label}
                                    </div>
                                    {value === opt.value && <Check className="w-4 h-4 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AdminNewsPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("news"); 
    
    const [news, setNews] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        title: "", content: "", category: "Umumiy", 
        audienceType: "all", targetValue: "all", 
        requiresRegistration: false, maxParticipants: 50 
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const fileInputRef = useRef(null);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
                const snapNews = await getDocs(qNews);
                setNews(snapNews.docs.map(d => ({ id: d.id, ...d.data() })));

                const qGroups = query(collection(db, "groups"));
                const snapGroups = await getDocs(qGroups);
                setGroups(snapGroups.docs.map(d => ({ id: d.id, ...d.data() })));

                const qFac = query(collection(db, "structure")); 
                const snapFac = await getDocs(qFac);
                setFaculties(snapFac.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.type === 'dept'));
            } catch (err) {
                console.error(err);
            } finally { 
                setLoading(false); 
            }
        };
        fetchInitialData();
    }, []);

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) return showToast("Rasm max 5MB", "error");
            setImageFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview("");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalImageUrl = editingId ? form.image : "";

            if (imageFile) {
                // MongoDB api call bo'lishi kerak. Hozircha mock.
                finalImageUrl = "https://mock-mongo-storage.uz/images/" + imageFile.name; 
            }

            const payload = { 
                ...form,
                image: finalImageUrl || null,
                requests: form.requiresRegistration ? (editingId ? form.requests || [] : []) : [], 
                authorName: user?.name || "Admin",
                updatedAt: serverTimestamp() 
            };

            let savedId = editingId;

            if (editingId) {
                await updateDoc(doc(db, "news", editingId), payload);
                setNews(news.map(n => n.id === editingId ? { ...n, ...payload } : n));
                showToast("E'lon yangilandi");
            } else {
                const res = await addDoc(collection(db, "news"), { ...payload, createdAt: serverTimestamp() });
                savedId = res.id;
                setNews([{ ...payload, id: res.id, createdAt: { toDate: () => new Date() } }, ...news]);
                showToast("E'lon qilingdi!");
                
                let targetArray = ['all'];
                if (form.audienceType === 'role') targetArray = [form.targetValue];
                else if (form.audienceType === 'faculty') targetArray = [form.targetValue];
                else if (form.audienceType === 'group') targetArray = [form.targetValue];

                await notificationsApi.sendNotification({
                    title: `Yangilik: ${form.title}`,
                    message: form.content.substring(0, 100) + "...",
                    targetRoles: targetArray,
                    type: form.requiresRegistration ? 'warning' : form.category === 'Sport' ? 'sports' : 'info',
                    link: '/notifications'
                });
            }

            setIsModalOpen(false);
            removeImage();
            setForm({ title: "", content: "", category: "Umumiy", audienceType: "all", targetValue: "all", requiresRegistration: false, maxParticipants: 50, image: "" });
        } catch (err) { 
            showToast("Xatolik yuz berdi", "error"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Rostdan o'chirasizmi?")) return;
        await deleteDoc(doc(db, "news", id));
        setNews(news.filter(n => n.id !== id));
        showToast("O'chirildi");
    };

    const updateRequestStatus = async (newsId, studentId, newStatus) => {
        try {
            const newsItem = news.find(n => n.id === newsId);
            const updatedRequests = newsItem.requests.map(r => r.userId === studentId ? { ...r, status: newStatus } : r);
            
            await updateDoc(doc(db, "news", newsId), { requests: updatedRequests });
            setNews(news.map(n => n.id === newsId ? { ...n, requests: updatedRequests } : n));
            
            showToast(newStatus === 'approved' ? "Tasdiqlandi!" : "Rad etildi", newStatus === 'approved' ? "success" : "error");

            await notificationsApi.sendNotification({
                title: `Arizangiz ko'rib chiqildi`,
                message: `"${newsItem.title}" bo'yicha arizangiz ${newStatus === 'approved' ? "qabul qilindi" : "rad etildi"}.`,
                targetRoles: [studentId],
                type: newStatus === 'approved' ? 'info' : 'warning',
                link: '/notifications'
            });
        } catch (error) {
            showToast("Xatolik yuz berdi", "error");
        }
    };

    const categoryOptions = CATEGORIES.map(c => ({ value: c, label: c, icon: Folder }));
    const audienceOptions = [
        { value: "all", label: "Barcha uchun", icon: Globe },
        { value: "role", label: "Rol bo'yicha", icon: Users },
        { value: "faculty", label: "Fakultet bo'yicha", icon: Folder },
        { value: "group", label: "Guruh bo'yicha", icon: Layers }
    ];
    const facultyOptions = [{ value: "all", label: "Tanlang..." }, ...faculties.map(f => ({ value: f.id, label: f.name }))];
    const groupOptions = [{ value: "all", label: "Tanlang..." }, ...groups.map(g => ({ value: g.id, label: g.name }))];

    return (
        <div className="p-4 lg:p-8 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[800] px-6 py-4 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-[38px] font-black text-slate-900 dark:text-white tracking-tighter mb-1.5">Yangiliklar & Boshqaruv</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <Megaphone className="w-4 h-4 mr-2 text-indigo-500" /> Platforma e'lonlari va ishtirokchilar hisobi
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl w-full md:w-auto shadow-sm border border-slate-200 dark:border-white/5">
                    <button onClick={() => setActiveTab('news')} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'news' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Newspaper className="w-4 h-4" /> E'lonlar
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Ticket className="w-4 h-4" /> Arizalar
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : activeTab === 'news' ? (
                <>
                    <div className="flex justify-end mb-6">
                        <button onClick={() => { 
                            setEditingId(null); 
                            setForm({ title: "", content: "", category: "Umumiy", audienceType: "all", targetValue: "all", requiresRegistration: false, maxParticipants: 50 }); 
                            setImagePreview(""); setImageFile(null);
                            setIsModalOpen(true); 
                        }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Yangi E'lon
                        </button>
                    </div>

                    {/* 🌟 IXCHAM VA CHiroyli KARTALAR (Horizontal layout for better space usage) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {news.map((item) => (
                            <Card key={item.id} className="p-3 flex flex-row items-center gap-4 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl hover:shadow-lg transition-all group">
                                {/* Chap tomon - Kichik Rasm yoki Animatsiyali Ikonka */}
                                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700">
                                    {item.image && item.image !== "null" ? (
                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                                    ) : (
                                        <AnimatedCategoryIcon category={item.category} />
                                    )}
                                </div>
                                
                                {/* O'ng tomon - Matn va Boshqaruv */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{item.category}</span>
                                            {item.requiresRegistration && <span className="text-[8px] bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">Arizali</span>}
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mb-1">{item.title}</h3>
                                        <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{item.content}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-[9px] font-bold text-slate-400">{item.createdAt?.toDate().toLocaleDateString()}</span>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => { setEditingId(item.id); setForm(item); setImagePreview(item.image || ""); setIsModalOpen(true); }} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-md hover:bg-rose-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                /* 🌟 ARIZALAR TABI (Aniq qatnashuvchilar ro'yxati va counter bilan) */
                <div className="space-y-6 animate-in fade-in duration-300">
                    {news.filter(n => n.requiresRegistration).length === 0 ? (
                        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px]">
                            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Qatnashish talab qilinadigan tadbirlar yo'q</p>
                        </div>
                    ) : (
                        news.filter(n => n.requiresRegistration).map(event => {
                            // Statistika hisobi
                            const approvedCount = event.requests?.filter(r => r.status === 'approved').length || 0;
                            const percentage = Math.min(100, (approvedCount / event.maxParticipants) * 100);

                            return (
                                <Card key={event.id} className="p-0 overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl">
                                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 dark:border-white/5">
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-1.5">{event.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                                                    Tasdiqlangan: <span className="text-emerald-500 font-black">{approvedCount}</span> / {event.maxParticipants}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full md:w-48 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 md:p-5 bg-white dark:bg-slate-900">
                                        {(!event.requests || event.requests.length === 0) ? (
                                            <p className="text-center text-[10px] font-bold text-slate-400 py-4 uppercase tracking-widest">Hozircha hech kim ro'yxatdan o'tmagan</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {event.requests.map((req, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 transition-colors gap-3">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">{req.userName?.[0] || "U"}</div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white truncate">{req.userName}</p>
                                                                <p className="text-[9px] font-bold text-slate-400">Yuborilgan: {new Date(req.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="w-full sm:w-auto flex justify-end shrink-0">
                                                            {req.status === 'pending' ? (
                                                                <div className="flex gap-1.5">
                                                                    <button onClick={() => updateRequestStatus(event.id, req.userId, 'approved')} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><UserCheck className="w-3.5 h-3.5"/> Tasdiqlash</button>
                                                                    <button onClick={() => updateRequestStatus(event.id, req.userId, 'rejected')} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><UserX className="w-3.5 h-3.5"/> Rad etish</button>
                                                                </div>
                                                            ) : (
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30'}`}>
                                                                    {req.status === 'approved' ? 'Tasdiqlangan' : 'Rad Etilgan'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* --- CREATE / EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl p-6 md:p-8 border border-white/20 overflow-y-auto max-h-[90dvh] custom-scrollbar">
                        
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingId ? "Tahrirlash" : "Yangi E'lon"}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kategoriya</label>
                                    <CustomSelect icon={Folder} placeholder="Kategoriya" options={categoryOptions} value={form.category} onChange={val => setForm({...form, category: val})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kimlarga?</label>
                                    <CustomSelect icon={Globe} placeholder="Auditoriya" options={audienceOptions} value={form.audienceType} onChange={val => setForm({...form, audienceType: val, targetValue: "all"})} />
                                </div>

                                {form.audienceType === 'role' && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setForm({...form, targetValue: 'student'})} className={`flex-1 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${form.targetValue === 'student' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:border-slate-700'}`}>Talabalar</button>
                                            <button type="button" onClick={() => setForm({...form, targetValue: 'teacher'})} className={`flex-1 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${form.targetValue === 'teacher' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:border-slate-700'}`}>O'qituvchilar</button>
                                        </div>
                                    </div>
                                )}
                                
                                {form.audienceType === 'faculty' && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <CustomSelect icon={Folder} placeholder="Fakultetni tanlang..." options={facultyOptions} value={form.targetValue} onChange={val => setForm({...form, targetValue: val})} />
                                    </div>
                                )}

                                {form.audienceType === 'group' && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <CustomSelect icon={Layers} placeholder="Guruhni tanlang..." options={groupOptions} value={form.targetValue} onChange={val => setForm({...form, targetValue: val})} />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5"/> Qatnashish arizalari</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    {form.requiresRegistration && (
                                        <input type="number" min="1" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: Number(e.target.value)})} className="w-16 p-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 outline-none text-center" />
                                    )}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={form.requiresRegistration} onChange={e => setForm({...form, requiresRegistration: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E'lon Rasmi (Ixtiyoriy)</label>
                                <div onClick={() => !imagePreview && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-3 text-center transition-all relative overflow-hidden ${imagePreview ? 'border-transparent' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-indigo-400'}`}>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                    {imagePreview && imagePreview !== "null" ? (
                                        <div className="relative w-full h-24 rounded-lg overflow-hidden group">
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-2">
                                            <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rasm tanlash</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-4">
                                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30" placeholder="E'lon sarlavhasi..." />
                                <textarea required rows="3" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 resize-none custom-scrollbar" placeholder="Batafsil ma'lumot kiriting..."></textarea>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-indigo-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : <><Send className="w-3.5 h-3.5"/> Saqlash va Yuborish</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
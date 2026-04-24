"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    Newspaper, Plus, Trash2, Edit, Send, 
    X, Loader2, Megaphone, Users, Globe, 
    AlertCircle, CheckCircle2, Calendar, Image as ImageIcon,
    Target, Folder, Layers, ChevronDown, Check, UserCheck, UserX, Ticket, UploadCloud
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";

const CATEGORIES = ["Umumiy", "Sport", "Tadbir", "Imtihon", "Muhim"];

// --- MAXSUS, CHIROYLI ANIMATSION SELECT KOMPONENTI ---
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
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold border transition-all duration-200 select-none outline-none
                ${disabled ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800 border-transparent cursor-pointer hover:border-indigo-500/30 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20'}
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
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl z-[600] py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 font-bold text-center">Ma'lumot topilmadi</p>
                        ) : (
                            options.map((opt) => (
                                <div
                                    key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-bold transition-all mb-1 last:mb-0
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
    
    // Asosiy Tablar
    const [activeTab, setActiveTab] = useState("news"); // 'news' | 'requests'
    
    const [news, setNews] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [groups, setGroups] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        title: "", content: "", category: "Umumiy", 
        audienceType: "all", targetValue: "all", 
        requiresRegistration: false, maxParticipants: 50 
    });

    // Rasm uchun statelar
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

    // Rasm tanlash logikasi
    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                showToast("Rasm hajmi 5MB dan oshmasligi kerak", "error");
                return;
            }
            setImageFile(selectedFile);
            
            // Preview yaratish
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

            // Agar yangi rasm tanlangan bo'lsa MongoDB ga yuklash
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                
                // MONGODB YUKLASH APISI (Masalan: /api/upload-mongo)
                // const uploadRes = await fetch("/api/upload-mongo", { method: "POST", body: formData });
                // const uploadedData = await uploadRes.json();
                // if (!uploadRes.ok) throw new Error(uploadedData.error || "Rasm yuklanmadi");
                // finalImageUrl = uploadedData.fileUrl; 
                
                // Hozircha mock URL
                finalImageUrl = "https://mock-mongo-storage.uz/images/" + imageFile.name; 
            }

            const payload = { 
                ...form,
                image: finalImageUrl,
                requests: form.requiresRegistration ? (editingId ? form.requests || [] : []) : [], 
                authorName: user?.name || "Admin",
                updatedAt: serverTimestamp() 
            };

            if (editingId) {
                await updateDoc(doc(db, "news", editingId), payload);
                setNews(news.map(n => n.id === editingId ? { ...n, ...payload } : n));
                showToast("Yangilik yangilandi");
            } else {
                const res = await addDoc(collection(db, "news"), { ...payload, createdAt: serverTimestamp() });
                setNews([{ ...payload, id: res.id, createdAt: { toDate: () => new Date() } }, ...news]);
                showToast("E'lon qilingdi va Xabarnoma yuborildi!");
                
                // PUSH NOTIFICATION JO'NATISH
                let targetArray = ['all'];
                if (form.audienceType === 'role') targetArray = [form.targetValue]; // 'student' yoki 'teacher'
                else if (form.audienceType === 'faculty') targetArray = [form.targetValue];
                else if (form.audienceType === 'group') targetArray = [form.targetValue];

                await notificationsApi.sendNotification({
                    title: `Yangilik: ${form.title}`,
                    message: form.content.substring(0, 100) + "...",
                    targetRoles: targetArray,
                    type: form.requiresRegistration ? 'warning' : 'info',
                    link: '/news'
                });
            }

            setIsModalOpen(false);
            removeImage();
            setForm({ title: "", content: "", category: "Umumiy", audienceType: "all", targetValue: "all", requiresRegistration: false, maxParticipants: 50, image: "" });
        } catch (err) { 
            showToast("Xatolik yuz berdi", "error"); 
            console.error(err);
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("O'chirmoqchimisiz?")) return;
        await deleteDoc(doc(db, "news", id));
        setNews(news.filter(n => n.id !== id));
        showToast("O'chirildi");
    };

    // Arizalarni qabul qilish
    const updateRequestStatus = async (newsId, studentId, newStatus) => {
        try {
            const newsItem = news.find(n => n.id === newsId);
            const updatedRequests = newsItem.requests.map(r => r.userId === studentId ? { ...r, status: newStatus } : r);
            
            await updateDoc(doc(db, "news", newsId), { requests: updatedRequests });
            setNews(news.map(n => n.id === newsId ? { ...n, requests: updatedRequests } : n));
            
            showToast(newStatus === 'approved' ? "Talaba qabul qilindi!" : "Ariza rad etildi", newStatus === 'approved' ? "success" : "error");

            await notificationsApi.sendNotification({
                title: `Arizangiz ko'rib chiqildi`,
                message: `"${newsItem.title}" bo'yicha arizangiz ${newStatus === 'approved' ? "qabul qilindi" : "rad etildi"}.`,
                targetRoles: [studentId],
                type: newStatus === 'approved' ? 'info' : 'warning',
                link: '/news'
            });
        } catch (error) {
            showToast("Xatolik", "error");
        }
    };

    const getTargetLabel = (type, val) => {
        if (type === 'all') return "Barcha uchun";
        if (type === 'role') return val === 'student' ? "Talabalar" : "O'qituvchilar";
        if (type === 'faculty') return faculties.find(f => f.id === val)?.name || "Fakultet";
        if (type === 'group') return groups.find(g => g.id === val)?.name || "Guruh";
        return "Noma'lum";
    };

    // Options
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
        <div className="p-4 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[800] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Yangiliklar va Tadbirlar</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <Megaphone className="w-4 h-4 mr-2 text-indigo-500" /> Platforma faoliyatini va arizalarni boshqarish
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px] w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm border border-slate-200 dark:border-white/5">
                    <button onClick={() => setActiveTab('news')} className={`flex-1 md:flex-none px-6 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'news' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Newspaper className="w-4 h-4" /> Barcha E'lonlar
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 md:flex-none px-6 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Ticket className="w-4 h-4" /> Qatnashish Arizalari
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : activeTab === 'news' ? (
                <>
                    <div className="flex justify-end mb-6">
                        <button onClick={() => { 
                            setEditingId(null); 
                            setForm({ title: "", content: "", category: "Umumiy", audienceType: "all", targetValue: "all", requiresRegistration: false, maxParticipants: 50 }); 
                            setImagePreview(""); setImageFile(null);
                            setIsModalOpen(true); 
                        }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Qo'shish
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item) => (
                            <Card key={item.id} className="p-0 overflow-hidden group flex flex-col h-full border border-slate-100 dark:border-white/5 hover:shadow-2xl transition-all duration-500">
                                {item.image && (
                                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" alt="" />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm rounded-lg text-[10px] font-black uppercase text-indigo-600">{item.category}</span>
                                            {item.requiresRegistration && (
                                                <span className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur shadow-sm rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1">
                                                    <Ticket className="w-3 h-3"/> Arizali
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"><Target className="w-3.5 h-3.5" /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Kimlarga: <span className="text-indigo-500">{getTargetLabel(item.audienceType, item.targetValue)}</span>
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 font-medium leading-relaxed">{item.content}</p>
                                    
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {item.createdAt?.toDate().toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingId(item.id); setForm(item); setImagePreview(item.image); setIsModalOpen(true); }} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                /* 🌟 ARIZALAR TABI */
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    {news.filter(n => n.requiresRegistration).length === 0 ? (
                        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                            <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Qatnashish talab qilinadigan tadbirlar yo'q</p>
                        </div>
                    ) : (
                        news.filter(n => n.requiresRegistration).map(event => (
                            <Card key={event.id} className="p-0 overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 dark:border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest">{event.category}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.requests?.length || 0} / {event.maxParticipants} arizalar</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{event.title}</h3>
                                    </div>
                                    <div className="h-2 w-full md:w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((event.requests?.length || 0) / event.maxParticipants) * 100}%` }}></div>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    {(!event.requests || event.requests.length === 0) ? (
                                        <p className="text-center text-xs font-bold text-slate-400 py-4">Hech kim ariza tashlamagan</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {event.requests.map((req, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">{req.userName?.[0] || "U"}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{req.userName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{new Date(req.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {req.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => updateRequestStatus(event.id, req.userId, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors shadow-sm"><UserCheck className="w-4 h-4"/></button>
                                                            <button onClick={() => updateRequestStatus(event.id, req.userId, 'rejected')} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-colors shadow-sm"><UserX className="w-4 h-4"/></button>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${req.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                            {req.status === 'approved' ? 'Qabul qilindi' : 'Rad etildi'}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* --- CREATE / EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-8 border border-white/20 overflow-y-auto max-h-[90dvh] custom-scrollbar">
                        
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingId ? "Tahrirlash" : "Yangi E'lon yaratish"}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Kimga yuborilishini to'g'ri tanlang</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            
                            {/* KATEGORIYA VA AUDITORIYA */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kategoriya</label>
                                    <CustomSelect 
                                        icon={Folder} placeholder="Kategoriyani tanlang" 
                                        options={categoryOptions} value={form.category} 
                                        onChange={val => setForm({...form, category: val})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kimlarga jo'natamiz?</label>
                                    <CustomSelect 
                                        icon={Globe} placeholder="Auditoriya" 
                                        options={audienceOptions} value={form.audienceType} 
                                        onChange={val => setForm({...form, audienceType: val, targetValue: "all"})} 
                                    />
                                </div>

                                {/* Dynamic Selects */}
                                {form.audienceType === 'role' && (
                                    <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Rollar bo'yicha</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setForm({...form, targetValue: 'student'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${form.targetValue === 'student' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:border-slate-700'}`}>Faqat Talabalar</button>
                                            <button type="button" onClick={() => setForm({...form, targetValue: 'teacher'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${form.targetValue === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:border-slate-700'}`}>Faqat O'qituvchilar</button>
                                        </div>
                                    </div>
                                )}
                                
                                {form.audienceType === 'faculty' && (
                                    <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Fakultetni tanlang</label>
                                        <CustomSelect icon={Folder} placeholder="Fakultet..." options={facultyOptions} value={form.targetValue} onChange={val => setForm({...form, targetValue: val})} />
                                    </div>
                                )}

                                {form.audienceType === 'group' && (
                                    <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Aniq guruhni tanlang</label>
                                        <CustomSelect icon={Layers} placeholder="Guruh..." options={groupOptions} value={form.targetValue} onChange={val => setForm({...form, targetValue: val})} />
                                    </div>
                                )}
                            </div>

                            {/* QATNASHISH LIMITI */}
                            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2"><Ticket className="w-4 h-4 text-emerald-500"/> Qatnashish arizalari (Registratsiya)</h4>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">Talabalar bu tadbir/sportga qatnashish uchun tugma bosishadi.</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    {form.requiresRegistration && (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Joy:</span>
                                            <input type="number" min="1" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: Number(e.target.value)})} className="w-20 p-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none text-center" />
                                        </div>
                                    )}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={form.requiresRegistration} onChange={e => setForm({...form, requiresRegistration: e.target.checked})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* RASM YUKLASH (MongoDB) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E'lon Rasmi (Majburiy emas)</label>
                                <div onClick={() => !imagePreview && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[24px] p-6 text-center transition-all relative overflow-hidden ${imagePreview ? 'border-transparent' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-indigo-400'}`}>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                                    
                                    {imagePreview ? (
                                        <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="px-5 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-600"><Trash2 className="w-4 h-4" /> Rasmni O'chirish</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-3 shadow-sm"><UploadCloud className="w-5 h-5" /></div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mb-1">Rasm yuklash</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JPG, PNG (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MATN VA SARLAVHA */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sarlavha</label>
                                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="E'lon sarlavhasi..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matn</label>
                                <textarea required rows="4" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none custom-scrollbar" placeholder="Matnni kiriting..."></textarea>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Saqlash va Yuborish</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
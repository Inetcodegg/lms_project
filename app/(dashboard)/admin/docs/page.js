"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    FileText, Plus, Trash2, Edit, Send, 
    X, Loader2, AlertCircle, CheckCircle2, Calendar,
    Folder, Layers, ChevronDown, Check, Users, Globe,
    CreditCard, UploadCloud, Download, CheckSquare, XCircle, FileSignature, Search, User
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

// --- CUSTOM SELECT KOMPONENTI (Z-index va o'lchamlar to'g'irlandi) ---
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
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] font-bold border transition-all duration-200 select-none outline-none
                ${disabled ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20'}
                ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`w-4 h-4 mr-2.5 shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[900] py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-56 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <p className="p-3 text-xs text-slate-400 font-bold text-center">Ma'lumot topilmadi</p>
                        ) : (
                            options.map((opt) => (
                                <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-[13px] font-bold transition-all mb-1 last:mb-0
                                        ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
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

export default function AdminDocumentsPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("docs"); 
    
    // Data States
    const [documents, setDocuments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [usersList, setUsersList] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({ 
        title: "", description: "", type: "info", 
        audienceType: "all", targetValue: "all", 
        deadline: "", amount: "" 
    });

    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);
    const [userSearch, setUserSearch] = useState("");

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
                const snapDocs = await getDocs(qDocs);
                setDocuments(snapDocs.docs.map(d => ({ id: d.id, ...d.data() })));

                const snapGroups = await getDocs(collection(db, "groups"));
                setGroups(snapGroups.docs.map(d => ({ id: d.id, ...d.data() })));

                const snapUsers = await getDocs(collection(db, "users"));
                setUsersList(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                showToast("Ma'lumotlarni yuklashda xatolik", "error");
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return showToast("Fayl hajmi max 10MB", "error");
            setAttachedFile(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.audienceType === 'individual' && form.targetValue === 'all') return showToast("Iltimos, shaxsni tanlang!", "error");

        setIsSaving(true);
        try {
            let fileUrl = null;
            if (attachedFile) {
                fileUrl = `https://mock-storage.uz/files/${attachedFile.name}`; 
            }

            const payload = { 
                ...form,
                fileUrl,
                responses: [],
                authorName: user?.name || "Admin",
                createdAt: serverTimestamp(),
                status: "active"
            };

            const res = await addDoc(collection(db, "documents"), payload);
            setDocuments([{ ...payload, id: res.id, createdAt: { toDate: () => new Date() } }, ...documents]);
            showToast("Hujjat yuborildi!");
            
            // Xabarnoma yuborish
            let targetArray = ['all'];
            if (form.audienceType === 'role') targetArray = [form.targetValue];
            else if (form.audienceType === 'group' || form.audienceType === 'individual') targetArray = [form.targetValue];

            let typeIcon = 'info';
            if (form.type === 'financial') typeIcon = 'warning';
            if (form.type === 'request') typeIcon = 'academic';

            await notificationsApi.sendNotification({
                title: `Hujjat: ${form.title}`,
                message: form.description.substring(0, 100) + "...",
                targetRoles: targetArray,
                type: typeIcon,
                link: '/documents' 
            });

            setIsModalOpen(false);
            setAttachedFile(null);
            setUserSearch("");
            setForm({ title: "", description: "", type: "info", audienceType: "all", targetValue: "all", deadline: "", amount: "" });
        } catch (err) { showToast("Xatolik yuz berdi", "error"); } 
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hujjatni butunlay o'chirasizmi?")) return;
        await deleteDoc(doc(db, "documents", id));
        setDocuments(documents.filter(d => d.id !== id));
        showToast("O'chirildi");
    };

    const handleUpdateResponseStatus = async (docId, userId, newStatus) => {
        try {
            const documentItem = documents.find(d => d.id === docId);
            const updatedResponses = documentItem.responses.map(r => r.userId === userId ? { ...r, status: newStatus } : r);
            
            await updateDoc(doc(db, "documents", docId), { responses: updatedResponses });
            setDocuments(documents.map(d => d.id === docId ? { ...d, responses: updatedResponses } : d));
            
            showToast(newStatus === 'approved' ? "Tasdiqlandi" : "Rad etildi");

            await notificationsApi.sendNotification({
                title: `Hujjat tekshirildi`,
                message: `Sizning "${documentItem.title}" bo'yicha yuborgan hujjatingiz ${newStatus === 'approved' ? 'tasdiqlandi' : 'rad etildi'}.`,
                targetRoles: [userId],
                type: newStatus === 'approved' ? 'info' : 'warning',
                link: '/documents'
            });
        } catch (error) { showToast("Xatolik", "error"); }
    };

    const docTypes = [
        { value: "info", label: "Ma'lumotnoma", icon: FileText },
        { value: "request", label: "Hujjat so'rovi", icon: UploadCloud },
        { value: "financial", label: "Moliyaviy/To'lov", icon: CreditCard }
    ];

    const audienceOptions = [
        { value: "all", label: "Barcha uchun", icon: Globe },
        { value: "role", label: "Rol bo'yicha", icon: Users },
        { value: "group", label: "Guruh bo'yicha", icon: Layers },
        { value: "individual", label: "Shaxsga", icon: User }
    ];

    const groupOptions = [{ value: "all", label: "Tanlang..." }, ...groups.map(g => ({ value: g.id, label: g.name }))];
    
    const filteredUsers = useMemo(() => {
        if (!userSearch) return usersList.slice(0, 10);
        const q = userSearch.toLowerCase();
        return usersList.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q)).slice(0, 20);
    }, [usersList, userSearch]);

    return (
        <div className="p-4 lg:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32 relative">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[900] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-[38px] font-black text-slate-900 dark:text-white tracking-tighter mb-1.5">Hujjatlar & Moliyaviy So'rovlar</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <FileSignature className="w-4 h-4 mr-2 text-indigo-500" /> Rasmiy xatlar, qarzdorlik so'rovlari va fayllar
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[20px] w-full md:w-auto shadow-sm border border-slate-200 dark:border-white/5">
                    <button onClick={() => setActiveTab('docs')} className={`flex-1 px-5 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'docs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <FileText className="w-4 h-4" /> Barcha Hujjatlar
                    </button>
                    <button onClick={() => setActiveTab('responses')} className={`flex-1 px-5 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'responses' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <UploadCloud className="w-4 h-4" /> Kelgan Javoblar
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-4 h-4 text-inherit" /></div>
            ) : activeTab === 'docs' ? (
                <div className="animate-in fade-in">
                    <div className="flex justify-end mb-6">
                        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Yangi Hujjat Yuborish
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {documents.length === 0 ? (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px]">
                                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hujjatlar yo'q</p>
                            </div>
                        ) : documents.map((docItem) => {
                            let bgClass = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600";
                            let IconComponent = FileText;
                            if (docItem.type === 'request') { bgClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"; IconComponent = UploadCloud; }
                            if (docItem.type === 'financial') { bgClass = "bg-rose-50 dark:bg-rose-500/10 text-rose-600"; IconComponent = CreditCard; }

                            return (
                                <Card key={docItem.id} className="p-0 overflow-hidden flex flex-col border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md hover:shadow-lg transition-all group rounded-[24px]">
                                    <div className="p-5 border-b border-slate-50 dark:border-white/5 flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgClass}`}>
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black text-slate-900 dark:text-white truncate mb-1">{docItem.title}</h3>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                {docTypes.find(t => t.value === docItem.type)?.label || "Hujjat"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col gap-3">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{docItem.description}</p>
                                        
                                        {docItem.type === 'financial' && docItem.amount && (
                                            <div className="p-3 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/10">
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">To'lov miqdori:</span>
                                                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{docItem.amount} so'm</span>
                                            </div>
                                        )}

                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3"/> Muddat: {docItem.deadline || "Muddatsiz"}</span>
                                                {docItem.type !== 'info' && (
                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {docItem.responses?.length || 0} ta javob berildi</span>
                                                )}
                                            </div>
                                            <button onClick={() => handleDelete(docItem.id)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            ) : (
                /* KELGAN JAVOBLAR */
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    {documents.filter(d => d.type !== 'info').length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px]">
                            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Javob talab qiluvchi hujjatlar yo'q</p>
                        </div>
                    ) : (
                        documents.filter(d => d.type !== 'info').map(docItem => (
                            <Card key={docItem.id} className="p-0 overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl">
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${docItem.type === 'financial' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                            {docItem.type === 'financial' ? <CreditCard className="w-5 h-5"/> : <UploadCloud className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{docItem.title}</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 inline-block">{docItem.responses?.length || 0} ta javob yuklangan</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5 bg-white dark:bg-slate-900">
                                    {(!docItem.responses || docItem.responses.length === 0) ? (
                                        <p className="text-center text-[10px] font-bold text-slate-400 py-4 uppercase tracking-widest">Hozircha hech kim javob qaytarmagan</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {docItem.responses.map((req, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 transition-colors gap-4">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{req.userName?.[0] || "U"}</div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{req.userName}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(req.submittedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                                                        {req.fileUrl && (
                                                            <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Faylni ko'rish">
                                                                <Download className="w-4 h-4"/>
                                                            </a>
                                                        )}
                                                        {req.status === 'pending' ? (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => handleUpdateResponseStatus(docItem.id, req.userId, 'approved')} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5"/> Tasdiq</button>
                                                                <button onClick={() => handleUpdateResponseStatus(docItem.id, req.userId, 'rejected')} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/> Rad</button>
                                                            </div>
                                                        ) : (
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
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
                        ))
                    )}
                </div>
            )}

            {/* --- CREATE DOCUMENT MODAL (Yaxshilangan, IXCHAM va SILLIQ dizayn) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-white/20">
                        
                        {/* MODAL HEADER (Qotirilgan - Sticky) */}
                        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">Yangi Hujjat Yuborish</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Kimga yuborilishini va turini tanlang</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {/* MODAL BODY (Scroll bo'ladigan qism) */}
                        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 pb-24">
                            <form onSubmit={handleSave} className="space-y-5">
                                
                                {/* Turi va Auditoriya Card */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hujjat / So'rov Turi</label>
                                            <CustomSelect icon={Folder} placeholder="Turini tanlang" options={docTypes} value={form.type} onChange={val => setForm({...form, type: val})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kimlarga?</label>
                                            <CustomSelect 
                                                icon={Globe} placeholder="Auditoriya" options={audienceOptions} value={form.audienceType} 
                                                onChange={val => { setForm({...form, audienceType: val, targetValue: "all"}); setUserSearch(""); }} 
                                            />
                                        </div>
                                    </div>

                                    {/* Dinamik tanlovlar */}
                                    {form.audienceType === 'role' && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Qaysi rolga?</label>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setForm({...form, targetValue: 'student'})} className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${form.targetValue === 'student' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 dark:border-slate-700 hover:bg-slate-100'}`}>Talabalar</button>
                                                <button type="button" onClick={() => setForm({...form, targetValue: 'teacher'})} className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${form.targetValue === 'teacher' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 dark:border-slate-700 hover:bg-slate-100'}`}>O'qituvchilar</button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {form.audienceType === 'group' && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Guruhni tanlang</label>
                                            <CustomSelect icon={Layers} placeholder="Guruh..." options={groupOptions} value={form.targetValue} onChange={val => setForm({...form, targetValue: val})} />
                                        </div>
                                    )}

                                    {/* SHAXSNI QIDIRISH (DROPDOWN) */}
                                    {form.audienceType === 'individual' && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 relative z-[100]">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Shaxsni izlash (Ism bo'yicha)</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="text" placeholder="Ism yoki ID kiriting..." 
                                                    value={userSearch} onChange={e => setUserSearch(e.target.value)} 
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                                />
                                                {userSearch && (
                                                    <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl custom-scrollbar z-[110] animate-in fade-in slide-in-from-top-2">
                                                        {filteredUsers.length === 0 ? (
                                                            <p className="p-3 text-xs text-slate-400 font-bold text-center">Foydalanuvchi topilmadi</p>
                                                        ) : filteredUsers.map(u => (
                                                            <div key={u.id} onClick={() => { setForm({...form, targetValue: u.id}); setUserSearch(""); }} className={`p-3 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${form.targetValue === u.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-black uppercase shrink-0">{u.name[0]}</div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none truncate">{u.name}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                                {form.targetValue === u.id && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Selected User Indicator */}
                                                {form.targetValue !== 'all' && !userSearch && (
                                                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg w-max">
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> Tanlangan shaxs qabul qilingan
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* MOLIYAVIY TO'LOV MIQDORI */}
                                {form.type === 'financial' && (
                                    <div className="space-y-1.5 animate-in slide-in-from-bottom-2">
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Qarzdorlik miqdori (So'mda)</label>
                                        <input required type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-500/5 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 outline-none focus:ring-2 focus:ring-rose-500/20 border border-rose-200 dark:border-rose-500/20" placeholder="Masalan: 4500000" />
                                    </div>
                                )}

                                {/* ASOSIY MA'LUMOTLAR */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sarlavha</label>
                                        <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30" placeholder="Hujjat sarlavhasi..." />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Muddat (Deadline)</label>
                                        <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tavsif / Talablar</label>
                                    <textarea required rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 resize-none custom-scrollbar" placeholder="Talaba nima qilishi kerakligini yozing..."></textarea>
                                </div>

                                {/* FAYL YUKLASH */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ilova qilinadigan fayl (Ixtiyoriy)</label>
                                    <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-4 flex items-center justify-center transition-all cursor-pointer ${attachedFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400'}`}>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        {attachedFile ? (
                                            <div className="flex items-center gap-3 w-full px-2">
                                                <FileText className="w-6 h-6 text-emerald-500" />
                                                <div className="flex-1 truncate">
                                                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 truncate">{attachedFile.name}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600/70">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <UploadCloud className="w-5 h-5" />
                                                <span className="text-xs font-bold">Fayl biriktirish (PDF, DOCX, Image) - Max 10MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Yopishib turuvchi Submit tugmasi uchun joy ajratish */}
                                <div className="h-6"></div>
                            </form>
                        </div>

                        {/* MODAL FOOTER (Qotirilgan pastki qism) */}
                        <div className="p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
                            <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.1em] hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : <><Send className="w-4 h-4"/> Hujjatni Yuborish</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
    Inbox, Clock, ExternalLink, User, CheckCircle2, Loader2, 
    Search, Plus, FileText, UploadCloud, Trash2, Send, Users, Calendar,
    ShieldAlert, AlertCircle, BookOpen, Package, Image as ImageIcon, Check, ChevronDown
} from "lucide-react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import Spinner from "../../../../components/Spinner";

// 🌟 ZAMONAVIY SANANI TANLASH KUTUBXONASI
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css"; 

const ALLOWED_FORMATS = [
    { id: 'pdf', label: 'PDF', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 'doc', label: 'Word', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { id: 'img', label: 'Rasm', icon: ImageIcon, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { id: 'zip', label: 'Arxiv', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }
];

// --- ANIMATSIYALI CUSTOM SELECT KOMPONENTI ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-3 rounded-xl text-xs font-bold border transition-all duration-200 outline-none shadow-sm
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}
                `}
            >
                {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />}
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <div className="p-3 text-[10px] font-bold text-slate-400 text-center">Ma'lumot topilmadi</div>
                        ) : (
                            options.map((opt) => (
                                <div 
                                    key={opt.value} 
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs font-bold transition-all mb-1 last:mb-0
                                        ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}
                                    `}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {value === opt.value && <Check className="w-3 h-3 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


export default function TeacherAssignmentsPage() {
    const [activeTab, setActiveTab] = useState("submissions"); 
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [toast, setToast] = useState(null);

    const [adminTasks, setAdminTasks] = useState([]); 
    const [submissions, setSubmissions] = useState([]); 
    const [sentAssignments, setSentAssignments] = useState([]); 
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);

    // Form: Admin Topshirig'i
    const [assignForm, setAssignForm] = useState({ adminTaskId: "", targetType: "group", targetId: "", description: "" });
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // 🌟 XATOLIK TUZATILDI: deadline: "" qilib bo'sh string e'lon qilindi
    const [customForm, setCustomForm] = useState({ title: "", targetType: "group", targetId: "", description: "", deadline: "", allowedFormats: ["pdf"] });
    const [customFile, setCustomFile] = useState(null);
    const customFileInputRef = useRef(null);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!auth.currentUser?.uid) return;
            try {
                setLoading(true);
                const teacherId = auth.currentUser.uid;

                const adminQ = query(collection(db, "admin_assignments"), where("status", "==", "active"));
                const adminSnap = await getDocs(adminQ);
                setAdminTasks(adminSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const subQ = query(collection(db, "submissions"), where("teacherId", "==", teacherId));
                const subSnap = await getDocs(subQ);
                setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const assignQ = query(collection(db, "assignments"), where("teacherId", "==", teacherId));
                const assignSnap = await getDocs(assignQ);
                const sentArr = assignSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setSentAssignments(sentArr);

                const groupSnap = await getDocs(collection(db, "groups"));
                setGroups(groupSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const studentSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
                setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (err) {
                console.error(err);
                showToast("Ma'lumotlarni yuklashda xatolik", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const selectedAdminTask = adminTasks.find(t => t.id === assignForm.adminTaskId);

    const uploadFileToMongo = async (fileObj) => {
        const formData = new FormData();
        formData.append("file", fileObj);
        const uploadRes = await fetch("/api/upload-mongo", { method: "POST", body: formData });
        const uploadedData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadedData.error || "Fayl MongoDB ga yuklanmadi");
        return uploadedData.fileUrl;
    };

    // --- 1. ADMIN TOPSHIRIG'INI YUBORISH ---
    const handleCreateAdminAssignment = async (e) => {
        e.preventDefault();
        if (!assignForm.adminTaskId) return showToast("Admin topshirig'ini tanlang!", "error");
        if (!assignForm.targetId) return showToast("Guruh yoki talabani tanlang!", "error");
        if (!file) return showToast("Fayl yuklang!", "error");

        setIsSubmitting(true);
        try {
            const mongoFileUrl = await uploadFileToMongo(file);
            const targetName = assignForm.targetType === 'group' ? groups.find(g => g.id === assignForm.targetId)?.name : students.find(s => s.id === assignForm.targetId)?.name;

            const newAssignment = {
                type: 'admin-linked',
                teacherId: auth.currentUser.uid,
                teacherName: auth.currentUser.displayName || "O'qituvchi",
                adminTaskId: assignForm.adminTaskId,
                subject: selectedAdminTask.subject,
                title: selectedAdminTask.subject + " - Rasmiy Topshiriq",
                deadline: selectedAdminTask.deadline,
                templateUrl: selectedAdminTask.templateUrl,
                targetType: assignForm.targetType,
                targetId: assignForm.targetId,
                targetName: targetName || "Noma'lum",
                description: assignForm.description,
                teacherFileUrl: mongoFileUrl, 
                fileName: file.name,
                allowedFormats: ['pdf', 'doc'], 
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, "assignments"), newAssignment);
            
            await notificationsApi.sendNotification({
                title: "Rasmiy Vazifa Yuklandi",
                message: `${selectedAdminTask.subject} fani bo'yicha rasmiy vazifa yubordi.`,
                targetRoles: [assignForm.targetId], 
                type: 'warning',
                link: '/student/assignments'
            });

            setSentAssignments([{ id: docRef.id, ...newAssignment }, ...sentAssignments]);
            showToast("Rasmiy vazifa muvaffaqiyatli yuborildi!");
            
            setAssignForm({ adminTaskId: "", targetType: "group", targetId: "", description: "" });
            setFile(null);
            setActiveTab('sent');
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 2. ERKIN (KUNLIK) TOPSHIRIQ YUBORISH ---
    const handleCreateCustomAssignment = async (e) => {
        e.preventDefault();
        if (!customForm.title.trim()) return showToast("Sarlavhani kiriting!", "error");
        if (!customForm.targetId) return showToast("Guruh/Talabani tanlang!", "error");
        if (!customForm.deadline) return showToast("Muddatni belgilang!", "error");
        if (customForm.allowedFormats.length === 0) return showToast("Kamida 1 ta formatni tanlang!", "error");

        setIsSubmitting(true);
        try {
            let mongoFileUrl = null;
            let fileName = null;

            if (customFile) {
                mongoFileUrl = await uploadFileToMongo(customFile);
                fileName = customFile.name;
            }

            const targetName = customForm.targetType === 'group' ? groups.find(g => g.id === customForm.targetId)?.name : students.find(s => s.id === customForm.targetId)?.name;

            const newAssignment = {
                type: 'custom',
                title: customForm.title,
                teacherId: auth.currentUser.uid,
                teacherName: auth.currentUser.displayName || "O'qituvchi",
                deadline: new Date(customForm.deadline).toISOString(), // Parse to ISO properly
                targetType: customForm.targetType,
                targetId: customForm.targetId,
                targetName: targetName || "Noma'lum",
                description: customForm.description,
                allowedFormats: customForm.allowedFormats,
                teacherFileUrl: mongoFileUrl,
                fileName: fileName,
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, "assignments"), newAssignment);
            
            await notificationsApi.sendNotification({
                title: "Yangi Kunlik Vazifa",
                message: `Mavzu: ${customForm.title}. Muddat: ${new Date(customForm.deadline).toLocaleDateString()}`,
                targetRoles: [customForm.targetId],
                type: 'info',
                link: '/student/assignments'
            });

            setSentAssignments([{ id: docRef.id, ...newAssignment }, ...sentAssignments]);
            showToast("Kunlik vazifa muvaffaqiyatli yuborildi!");
            
            setCustomForm({ title: "", targetType: "group", targetId: "", description: "", deadline: "", allowedFormats: ["pdf"] });
            setCustomFile(null);
            setActiveTab('sent');
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFormat = (formatId) => {
        setCustomForm(prev => {
            const has = prev.allowedFormats.includes(formatId);
            return { ...prev, allowedFormats: has ? prev.allowedFormats.filter(f => f !== formatId) : [...prev.allowedFormats, formatId] };
        });
    };

    const filteredSubmissions = submissions.filter(s =>
        s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGroupOptions = () => groups.map(g => ({ label: g.name, value: g.id }));
    const getStudentOptions = () => students.map(s => ({ label: s.name, value: s.id }));
    const getAdminTaskOptions = () => adminTasks.map(t => ({ label: `${t.subject} (Muddat: ${new Date(t.deadline).toLocaleDateString()})`, value: t.id }));


    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Vazifalar Markazi</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Talabalar ishini tekshirish va yangi vazifa yuklash</p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-[24px] w-full xl:w-auto overflow-x-auto custom-scrollbar shadow-sm">
                    <button onClick={() => setActiveTab('submissions')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-5 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'submissions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Inbox className="w-4 h-4 shrink-0" /> <span>Kelgan Ishlar</span>
                    </button>
                    <button onClick={() => setActiveTab('create-admin')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-5 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'create-admin' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <ShieldAlert className="w-4 h-4 shrink-0" /> <span>Rasmiy (Admin)</span>
                    </button>
                    <button onClick={() => setActiveTab('create-custom')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-5 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'create-custom' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Plus className="w-4 h-4 shrink-0" /> <span>Erkin Vazifa</span>
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-5 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sent' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Send className="w-4 h-4 shrink-0" /> <span>Yuborilganlar</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500" /></div>
            ) : (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] p-6 md:p-8 shadow-sm">
                    
                    {/* --- TAB 1: KELIB TUSHGAN ISHLAR --- */}
                    {activeTab === 'submissions' && (
                        <div className="space-y-6 animate-in slide-in-from-left-8 duration-300">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-2 rounded-2xl max-w-md shadow-sm">
                                <Search className="ml-3 w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text" placeholder="Ism yoki vazifa bo'yicha qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-3 pr-4 py-2 bg-transparent text-xs font-bold outline-none text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {filteredSubmissions.length === 0 ? (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                                        <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Hozircha ishlar kelib tushmagan</p>
                                    </div>
                                ) : filteredSubmissions.map((sub) => (
                                    <div key={sub.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">
                                                {sub.studentName?.[0] || <User className="w-5 h-5"/>}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight truncate">{sub.studentName || "Noma'lum Talaba"}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate">{sub.taskTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-4 sm:pt-0 shrink-0">
                                            <div className="text-right">
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                    {sub.status === 'graded' ? 'Baholangan' : 'Kutilmoqda'}
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> {sub.submittedAt?.toDate().toLocaleDateString()}</p>
                                            </div>
                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-md hover:bg-indigo-600 hover:scale-105 transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: RASMIY VAZIFA YUKLASH (Admin) --- */}
                    {activeTab === 'create-admin' && (
                        <div className="max-w-4xl animate-in slide-in-from-right-8 duration-300">
                            {adminTasks.length === 0 ? (
                                <div className="py-20 text-center bg-rose-50 dark:bg-rose-500/5 border-2 border-dashed border-rose-200 dark:border-rose-500/20 rounded-[32px]">
                                    <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                                    <h2 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-2">Rejali Topshiriq Yo'q</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-md mx-auto">Admin tomonidan tasdiqlangan va muddat qoyilgan o'quv rejasi mavjud emas.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateAdminAssignment} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 bg-rose-50/50 dark:bg-rose-500/5 p-6 rounded-[24px] border border-rose-100 dark:border-rose-500/10">
                                            <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center mb-2"><ShieldAlert className="w-3 h-3 mr-1.5"/> 1-Qadam: Rasmiy Rejani Tanlash</h3>
                                            
                                            <CustomSelect 
                                                options={getAdminTaskOptions()} 
                                                value={assignForm.adminTaskId} 
                                                onChange={val => setAssignForm({...assignForm, adminTaskId: val})} 
                                                placeholder="Fanni tanlang..." 
                                                icon={BookOpen} 
                                            />

                                            {selectedAdminTask && (
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500 space-y-1.5 shadow-sm animate-in fade-in">
                                                    <p className="flex justify-between"><span>Qat'iy muddat:</span> <span className="text-rose-500 font-black">{new Date(selectedAdminTask.deadline).toLocaleString()}</span></p>
                                                    <p className="flex justify-between items-center">
                                                        <span>Cover Page:</span> 
                                                        <a href={selectedAdminTask.templateUrl} target="_blank" className="text-emerald-500 flex items-center hover:underline"><FileText className="w-3 h-3 mr-1"/> Ko'rish</a>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">2-Qadam: Kimga yuborilmoqda?</h3>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setAssignForm({...assignForm, targetType: 'group', targetId: ""})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${assignForm.targetType === 'group' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Guruhga</button>
                                                <button type="button" onClick={() => setAssignForm({...assignForm, targetType: 'student', targetId: ""})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${assignForm.targetType === 'student' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Talabaga</button>
                                            </div>
                                            
                                            <CustomSelect 
                                                options={assignForm.targetType === 'group' ? getGroupOptions() : getStudentOptions()} 
                                                value={assignForm.targetId} 
                                                onChange={val => setAssignForm({...assignForm, targetId: val})} 
                                                placeholder={assignForm.targetType === 'group' ? "Guruhni tanlang..." : "Talabani tanlang..."} 
                                                icon={assignForm.targetType === 'group' ? Users : User} 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-5">
                                        <div className="space-y-2">
                                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">3-Qadam: Izoh</h3>
                                            <textarea required rows="4" placeholder="Vazifa bo'yicha tushuntirish..." value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500/20 custom-scrollbar dark:text-white resize-none shadow-sm"></textarea>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">4-Qadam: Fayl (Majburiy)</h3>
                                            <div onClick={() => !file && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[20px] h-[100px] flex flex-col items-center justify-center text-center transition-all ${file ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-rose-400'}`}>
                                                <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                                                {file ? (
                                                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 px-4">
                                                        <p className="text-xs font-black text-slate-800 dark:text-white mb-1 line-clamp-1">{file.name}</p>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-3 py-1.5 bg-rose-200/50 text-rose-700 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-200"><Trash2 className="w-3 h-3" /> O'chirish</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                                        <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Faylni yuklang</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button type="submit" disabled={isSubmitting || !file} className="w-full md:w-auto px-8 py-3.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center min-w-[150px] active:scale-95">
                                            {isSubmitting ? <Spinner className="w-4 h-4"/> : "Yuborish"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* --- TAB 3: 🌟 ERKIN KUNLIK VAZIFA (COMPACT) --- */}
                    {activeTab === 'create-custom' && (
                        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
                            <form onSubmit={handleCreateCustomAssignment} className="space-y-6">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-500/5 p-5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/10">
                                        <h3 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center mb-1"><BookOpen className="w-3 h-3 mr-1.5"/> 1-Qadam: Mavzu va Muddat</h3>
                                        
                                        <input required type="text" placeholder="Vazifa sarlavhasi (Masalan: 5-Konspekt)" value={customForm.title} onChange={e => setCustomForm({...customForm, title: e.target.value})} className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm dark:text-white"/>
                                        
                                        {/* 🌟 PREMIUM DATE PICKER (react-flatpickr) - Xato oldi olindi! */}
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                                            <Flatpickr
                                                data-enable-time
                                                value={customForm.deadline || ""}
                                                onChange={([date]) => setCustomForm({...customForm, deadline: date})}
                                                options={{
                                                    minDate: "today",
                                                    time_24hr: true,
                                                    dateFormat: "d.m.Y, H:i",
                                                    disableMobile: true, // Telefonlarda noqulaylikni oldini oladi
                                                }}
                                                placeholder="Topshirish muddatini tanlang"
                                                className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm dark:text-white cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">2-Qadam: Qabul Qiluvchi</h3>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setCustomForm({...customForm, targetType: 'group', targetId: ""})} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${customForm.targetType === 'group' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Guruhga</button>
                                            <button type="button" onClick={() => setCustomForm({...customForm, targetType: 'student', targetId: ""})} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${customForm.targetType === 'student' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Talabaga</button>
                                        </div>
                                        
                                        <CustomSelect 
                                            options={customForm.targetType === 'group' ? getGroupOptions() : getStudentOptions()} 
                                            value={customForm.targetId} 
                                            onChange={val => setCustomForm({...customForm, targetId: val})} 
                                            placeholder={customForm.targetType === 'group' ? "Guruhni tanlang..." : "Talabani tanlang..."} 
                                            icon={customForm.targetType === 'group' ? Users : User} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 dark:border-slate-800 pt-5">
                                    <div className="space-y-2">
                                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">3-Qadam: Formatlar</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ALLOWED_FORMATS.map(format => {
                                                const isSelected = customForm.allowedFormats.includes(format.id);
                                                return (
                                                    <button 
                                                        key={format.id} type="button" onClick={() => toggleFormat(format.id)}
                                                        className={`p-2.5 rounded-xl flex items-center justify-center text-center gap-1.5 border transition-all active:scale-95
                                                            ${isSelected ? `${format.bg} border-${format.color.split('-')[1]}-300 shadow-sm ring-1 ring-${format.color.split('-')[1]}-500/20` : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                                        `}
                                                    >
                                                        <format.icon className={`w-4 h-4 ${isSelected ? format.color : 'text-slate-400'}`} />
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? format.color : 'text-slate-500'}`}>{format.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">4-Qadam: Izoh va Fayl</h3>
                                        <textarea required rows="2" placeholder="Vazifa bo'yicha tushuntirish..." value={customForm.description} onChange={e => setCustomForm({...customForm, description: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 custom-scrollbar dark:text-white resize-none shadow-sm mb-2"></textarea>
                                        
                                        <div onClick={() => !customFile && customFileInputRef.current?.click()} className={`border-2 border-dashed rounded-[16px] p-3 text-center transition-all ${customFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-emerald-400'}`}>
                                            <input type="file" ref={customFileInputRef} onChange={(e) => setCustomFile(e.target.files[0])} className="hidden" />
                                            {customFile ? (
                                                <div className="flex items-center justify-between px-2 animate-in zoom-in-95 duration-300">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-emerald-600" />
                                                        <p className="text-xs font-black text-slate-800 dark:text-white line-clamp-1 max-w-[150px]">{customFile.name}</p>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setCustomFile(null); }} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                                    <UploadCloud className="w-4 h-4" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Fayl yuklash (Ixtiyoriy)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={isSubmitting || !customForm.deadline} className="w-full md:w-auto px-8 py-3.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center min-w-[150px] active:scale-95">
                                        {isSubmitting ? <Spinner className="w-4 h-4"/> : "Yuborish"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- TAB 4: YUBORILGAN VAZIFALAR --- */}
                    {activeTab === 'sent' && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                {sentAssignments.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Siz hali vazifa yuklamagansiz</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                                        <div className="hidden md:grid grid-cols-12 gap-3 p-3 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                                            <div className="col-span-5 pl-2">Mavzu / Topshiriq</div>
                                            <div className="col-span-3">Kimga yuborildi</div>
                                            <div className="col-span-3">Muddat</div>
                                            <div className="col-span-1 text-right pr-2">Fayl</div>
                                        </div>
                                        
                                        {sentAssignments.map(assign => (
                                            <div key={assign.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative overflow-hidden">
                                                {assign.type === 'custom' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>}
                                                {assign.type === 'admin-linked' && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>}

                                                <div className="col-span-1 md:col-span-5 flex items-center gap-2.5 pl-2 md:pl-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border
                                                        ${assign.type === 'custom' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-100' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 border-rose-100'}
                                                    `}>
                                                        <BookOpen className="w-3.5 h-3.5"/>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate group-hover:text-indigo-600 transition-colors">{assign.title || assign.subject}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{assign.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-span-1 md:col-span-3 min-w-0 flex items-center">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 truncate max-w-full">
                                                        {assign.targetType === 'group' ? <Users className="w-3 h-3 shrink-0"/> : <User className="w-3 h-3 shrink-0"/>}
                                                        <span className="truncate">{assign.targetName}</span>
                                                    </span>
                                                </div>

                                                <div className="col-span-1 md:col-span-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                                                    <Calendar className={`w-3 h-3 shrink-0 ${assign.type === 'custom' ? 'text-emerald-500' : 'text-rose-500'}`} /> 
                                                    <span className="truncate">{new Date(assign.deadline).toLocaleString()}</span>
                                                </div>
                                                
                                                <div className="col-span-1 flex items-center justify-end pr-2">
                                                    {assign.teacherFileUrl ? (
                                                        <a href={assign.teacherFileUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
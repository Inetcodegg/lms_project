"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../../../../lib/UserContext";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import Spinner from "../../../../components/Spinner";
import { 
    BookOpen, Calendar, Clock, FileText, UploadCloud, 
    CheckCircle2, X, Loader2, Search, Filter, AlertCircle, 
    ArrowRight, ChevronDown, Check, GraduationCap, Zap, ChevronRight, Trash2
} from "lucide-react";

// --- ANIMATSIYALI CUSTOM SELECT ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || { label: value };

    return (
        <div className="relative w-full md:w-56 shrink-0" ref={dropdownRef}>
            <button 
                type="button" onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between pl-11 pr-4 py-3.5 rounded-xl text-xs font-bold border transition-all duration-200 outline-none shadow-sm
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'}
                `}
            >
                {Icon && <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />}
                <span className="truncate">{selectedOption.label || placeholder}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-56 overflow-y-auto custom-scrollbar px-1.5">
                        {options.map((opt) => (
                            <div 
                                key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-xs font-bold transition-all mb-1 last:mb-0
                                    ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}
                                `}
                            >
                                <span className="truncate pr-2">{opt.label}</span>
                                {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function StudentAssignmentsPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending"); 
    const [toast, setToast] = useState(null);

    // Ma'lumotlar
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [grades, setGrades] = useState([]);

    // Filtrlar
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSubject, setFilterSubject] = useState("Barchasi");

    // Modal (Topshirish)
    const [selectedTask, setSelectedTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitForm, setSubmitForm] = useState({ text: "" });
    const [submitFile, setSubmitFile] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) return;
            try {
                setLoading(true);

                const targets = [user.uid, user.groupId].filter(Boolean);
                const qAssign = query(collection(db, "assignments"), where("targetId", "in", targets));
                const snapAssign = await getDocs(qAssign);
                const allTasks = snapAssign.docs.map(d => ({ id: d.id, ...d.data() }));

                const qSubs = query(collection(db, "submissions"), where("studentId", "==", user.uid));
                const snapSubs = await getDocs(qSubs);
                const mySubs = snapSubs.docs.map(d => ({ id: d.id, ...d.data() }));

                const qGrades = query(collection(db, "grades"), where("studentId", "==", user.uid));
                const snapGrades = await getDocs(qGrades);
                const myGrades = snapGrades.docs.map(d => ({ id: d.id, ...d.data() }));

                setAssignments(allTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
                setSubmissions(mySubs);
                setGrades(myGrades);

            } catch (error) {
                console.error(error);
                showToast("Ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Topshirish funksiyasi (MongoDB API orqali)
    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        if (!submitFile && !submitForm.text.trim()) return showToast("Fayl yuklang yoki matn kiriting!", "error");

        try {
            setIsSubmitting(true);
            let mongoFileUrl = null;
            let fileName = null;

            if (submitFile) {
                const formData = new FormData();
                formData.append("file", submitFile);
                
                const uploadRes = await fetch("/api/upload-mongo", { method: "POST", body: formData });
                const uploadedData = await uploadRes.json();
                
                if (!uploadRes.ok) throw new Error(uploadedData.error || "Fayl MongoDB ga yuklanmadi");
                
                mongoFileUrl = uploadedData.fileUrl;
                fileName = submitFile.name;
            }

            const newSubmission = {
                assignmentId: selectedTask.id,
                taskTitle: selectedTask.title || selectedTask.subject,
                studentId: user.uid,
                studentName: user.name,
                groupId: user.groupId,
                teacherId: selectedTask.teacherId,
                fileUrl: mongoFileUrl,
                fileName: fileName,
                text: submitForm.text,
                submittedAt: serverTimestamp(),
                status: 'pending' // Hali tekshirilmagan
            };

            await addDoc(collection(db, "submissions"), newSubmission);

            // 🌟 PUSH NOTIFICATION YUBORISH (Faqat O'qituvchiga!)
            await notificationsApi.sendNotification({
                title: "Vazifa Topshirildi",
                message: `${user.name} "${selectedTask.title || selectedTask.subject}" bo'yicha vazifa yukladi.`,
                targetRoles: [selectedTask.teacherId], 
                type: 'info',
                link: '/teacher/assignments' 
            });

            setSubmissions([...submissions, { id: "temp", ...newSubmission, submittedAt: { toDate: () => new Date() } }]);
            showToast("Vazifa muvaffaqiyatli topshirildi!");
            setSelectedTask(null);
            setSubmitFile(null);
            setSubmitForm({ text: "" });

        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mantiqiy ajratish va Filtrlash
    const processedTasks = useMemo(() => {
        let pending = [];
        let completed = [];

        assignments.forEach(task => {
            const sub = submissions.find(s => s.assignmentId === task.id);
            if (sub) {
                const grade = grades.find(g => g.assignmentId === task.id);
                completed.push({ ...task, submission: sub, grade });
            } else {
                pending.push(task);
            }
        });

        const activeList = activeTab === 'pending' ? pending : completed;
        
        return activeList.filter(item => {
            const matchesSearch = (item.title || item.subject)?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterSubject === 'Barchasi' || item.subject === filterSubject;
            return matchesSearch && matchesFilter;
        });

    }, [assignments, submissions, grades, activeTab, searchQuery, filterSubject]);

    const uniqueSubjects = useMemo(() => {
        const subs = new Set(assignments.map(a => a.subject).filter(Boolean));
        return [{label: 'Barcha Fanlar', value: 'Barchasi'}, ...Array.from(subs).map(s => ({label: s, value: s}))];
    }, [assignments]);


    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Mening Vazifalarim</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">O'qituvchilar tomonidan yuklatilgan barcha topshiriqlar</p>
                </div>

                <div className="flex bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-[24px] w-full xl:w-auto shadow-sm">
                    <button onClick={() => setActiveTab('pending')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <AlertCircle className="w-4 h-4 shrink-0" /> <span>Yangi Vazifalar</span>
                    </button>
                    <button onClick={() => setActiveTab('submitted')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'submitted' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>Topshirilganlar</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative w-full group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text" placeholder="Mavzu yoki fan bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                </div>
                <CustomSelect 
                    options={uniqueSubjects} 
                    value={filterSubject} 
                    onChange={setFilterSubject} 
                    placeholder="Barcha Fanlar" 
                    icon={Filter} 
                />
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500" /></div>
            ) : processedTasks.length === 0 ? (
                <div className="py-24 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] animate-in fade-in">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        {activeTab === 'pending' ? "Barcha vazifalarni bajargansiz! Barakalla 🎉" : "Siz hali vazifa topshirmagansiz."}
                    </h3>
                </div>
            ) : (
                /* 🌟 PREMIUM LIST VIEW */
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[24px] overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-500">
                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                        
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="col-span-5 pl-2">Mavzu / Topshiriq</div>
                            <div className="col-span-3">Muddat / Sana</div>
                            <div className="col-span-2">Holati</div>
                            <div className="col-span-2 text-right pr-2">Harakat / Natija</div>
                        </div>
                        
                        {/* List Items */}
                        {processedTasks.map(task => {
                            const isDeadlinePassed = new Date(task.deadline) < new Date();
                            
                            return (
                                <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-5 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative">
                                    
                                    {/* Color Indicator */}
                                    <div className={`absolute top-0 left-0 w-1 h-full 
                                        ${activeTab === 'pending' ? (isDeadlinePassed ? 'bg-rose-500' : 'bg-indigo-500') : 'bg-emerald-500'}
                                    `}></div>

                                    {/* Col 1: Title & Subject */}
                                    <div className="col-span-1 md:col-span-5 flex items-center gap-3 md:gap-4 pl-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border
                                            ${activeTab === 'pending' ? (isDeadlinePassed ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10') : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10'}
                                        `}>
                                            <BookOpen className="w-4 h-4"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                                {task.title || task.subject}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">
                                                {task.subject} • {task.teacherName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Col 2: Date */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest pl-3 md:pl-0">
                                        {activeTab === 'submitted' ? (
                                            <>
                                                <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> 
                                                <span className="text-slate-600 dark:text-slate-300 truncate">Topshirildi: {task.submission?.submittedAt?.toDate().toLocaleDateString()}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDeadlinePassed ? 'text-rose-500' : 'text-indigo-400'}`}/> 
                                                <span className={isDeadlinePassed ? 'text-rose-500 truncate' : 'text-slate-600 dark:text-slate-300 truncate'}>
                                                    Muddat: {new Date(task.deadline).toLocaleString()}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Col 3: Status Badge */}
                                    <div className="col-span-1 md:col-span-2 pl-3 md:pl-0 flex items-center">
                                        {activeTab === 'submitted' ? (
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${task.grade ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20'} border`}>
                                                {task.grade ? 'Baholangan' : 'Kutilmoqda'}
                                            </span>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${isDeadlinePassed ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20'} border`}>
                                                {isDeadlinePassed ? 'Muddati o\'tgan' : 'Jarayonda'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Col 4: Action / Result */}
                                    <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-end pr-3 md:pr-4 pl-3 md:pl-0 mt-2 md:mt-0">
                                        {activeTab === 'submitted' ? (
                                            task.grade ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500">
                                                    <Zap className="w-4 h-4 shrink-0"/> 
                                                    <span className="text-xl font-black leading-none">{task.grade.score}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 self-end mb-0.5">/5</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">-</span>
                                            )
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedTask(task)}
                                                className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5
                                                    ${isDeadlinePassed ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}
                                                `}
                                            >
                                                Topshirish <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* --- TOPSHIRISH MODALI --- */}
            {selectedTask && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => !isSubmitting && setSelectedTask(null)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 max-h-[90vh]">
                        
                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/30">
                            <div>
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm inline-block mb-3">
                                    {selectedTask.subject}
                                </span>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedTask.title}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5"/> O'qituvchi: {selectedTask.teacherName}</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setSelectedTask(null)} className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 rounded-full text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleTaskSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
                            
                            {/* Agar O'qituvchi Fayl bergan bo'lsa */}
                            {selectedTask.teacherFileUrl && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5">Vazifa materiallari</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ustozingiz fayl biriktirgan</p>
                                    </div>
                                    <a href={selectedTask.teacherFileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600 hover:text-indigo-700 transition-colors">
                                        <FileText className="w-5 h-5"/>
                                    </a>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Vazifa yuzasidan izohingiz (Ixtiyoriy)</label>
                                <textarea 
                                    rows="3" placeholder="Ustozingiz uchun qo'shimcha tushuntirish yozishingiz mumkin..." 
                                    value={submitForm.text} onChange={e => setSubmitForm({ text: e.target.value })}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none dark:text-white shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fayl Yuklash</label>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Max: 15MB</span>
                                </div>
                                <div onClick={() => !submitFile && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all ${submitFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-400'}`}>
                                    <input type="file" ref={fileInputRef} onChange={(e) => setSubmitFile(e.target.files[0])} className="hidden" />
                                    {submitFile ? (
                                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-sm"><FileText className="w-6 h-6" /></div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mb-2 line-clamp-1 px-4">{submitFile.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setSubmitFile(null); }} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-200 mt-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /> O'chirish</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"><UploadCloud className="w-6 h-6" /></div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mb-1">Vazifa faylini shu yerga yuklang</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {selectedTask.allowedFormats?.join(', ')?.toUpperCase() || "PDF, DOC, ZIP"} formatlari
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                                <button type="submit" disabled={isSubmitting || (!submitFile && !submitForm.text.trim())} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? <Spinner className="w-5 h-5"/> : <><CheckCircle2 className="w-4 h-4"/> Javobni Yuborish</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    FileText, Plus, Trash2, Edit, Search, 
    AlertCircle, CheckCircle2, X, Loader2, Clock, 
    UploadCloud, ShieldAlert, Settings, 
    Users, Target, FileIcon, BookOpen, Layers, GraduationCap
} from "lucide-react";
import { assignmentApi } from "../../../../lib/api/assignmentApi";

export default function AdminAssignmentPage() {
    // --- DB STATES (Dinamik Ma'lumotlar) ---
    const [assignments, setAssignments] = useState([]);
    const [grades, setGrades] = useState([]); // Guruhlardan olingan Bosqichlar/Yillar
    const [specialties, setSpecialties] = useState([]); // DB dagi Yo'nalishlar (Majors)
    const [allSubjects, setAllSubjects] = useState([]); // DB dagi barcha Fanlar
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState(null);

    // Modal & Tabs
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form
    const [form, setForm] = useState({
        targetGrade: "", targetSpecialtyId: "", targetSpecialtyName: "", 
        subjectId: "", subjectName: "", 
        title: "", description: "", rules: "", files: [], 
        startDate: "", deadline: "", allowLate: false, latePenaltyPercent: 0,
        gradingMethod: "points", maxScore: 100,
        targetRoles: ["student"], attemptLimit: 1, prerequisiteId: ""
    });

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    // 1. Barcha ma'lumotlarni bazadan tortish
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [assignData, groupsData, academicData] = await Promise.all([
                    assignmentApi.getAllAssignments(),
                    assignmentApi.getGroupsData(),
                    assignmentApi.getAcademicStructure()
                ]);
                
                setAssignments(assignData);
                setGrades(groupsData.uniqueGrades); // Masalan: ["1-bosqich", "2-bosqich"]
                setSpecialties(academicData.specialties); // DB dan Yo'nalishlar
                setAllSubjects(academicData.subjects); // DB dan Fanlar
            } catch (err) { 
                showToast("Ma'lumotlarni yuklashda xato", "error"); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchInitialData();
    }, []);

    // Form funksiyalari
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm({ ...form, files: [...form.files, { name: file.name, size: (file.size / 1024).toFixed(1) + " KB" }] });
    };
    const removeFile = (index) => setForm({ ...form, files: form.files.filter((_, i) => i !== index) });

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                const updated = await assignmentApi.updateAssignment(editingId, form);
                setAssignments(assignments.map(a => a.id === editingId ? updated : a));
                showToast("Topshiriq yangilandi!");
            } else {
                const created = await assignmentApi.createAssignment(form);
                setAssignments([created, ...assignments]);
                showToast("Yangi topshiriq e'lon qilindi!");
            }
            setIsModalOpen(false);
        } catch (err) { showToast("Saqlashda xato", "error"); } 
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("O'chirilsinmi?")) return;
        try {
            await assignmentApi.deleteAssignment(id);
            setAssignments(assignments.filter(a => a.id !== id));
            showToast("O'chirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    const openModal = (item = null) => {
        if (item) {
            setForm(item); setEditingId(item.id);
        } else {
            setForm({
                targetGrade: "", targetSpecialtyId: "", targetSpecialtyName: "", subjectId: "", subjectName: "", 
                title: "", description: "", rules: "", files: [], 
                startDate: "", deadline: "", allowLate: false, latePenaltyPercent: 0,
                gradingMethod: "points", maxScore: 100, targetRoles: ["student"], attemptLimit: 1, prerequisiteId: ""
            });
            setEditingId(null);
        }
        setActiveTab("general");
        setIsModalOpen(true);
    };

    // --- FILTRLAR VA ZANJIRLAR ---
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.targetSpecialtyName?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [assignments, searchQuery]);

    // 1. Fanlar zanjiri (Faqat tanlangan Yo'nalishga tegishli fanlar ko'rinadi)
    const filteredSubjects = useMemo(() => {
        if (!form.targetSpecialtyId) return [];
        return allSubjects.filter(s => s.parentId === form.targetSpecialtyId);
    }, [allSubjects, form.targetSpecialtyId]);

    // 2. Prerequisite zanjiri (Faqat o'sha fan doirasidagi eski topshiriqlar)
    const validPrerequisites = useMemo(() => {
        return assignments.filter(a => a.subjectId === form.subjectId && a.targetGrade === form.targetGrade && a.id !== editingId);
    }, [assignments, form.subjectId, form.targetGrade, editingId]);


    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[600] px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Topshiriqlar Bazasi</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Barcha dinamik ma'lumotlar bazadan olingan
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Topshiriq yoki yo'nalish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <button onClick={() => openModal()} className="w-full sm:w-auto flex justify-center items-center space-x-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all font-black text-xs uppercase tracking-widest shrink-0">
                        <Plus className="w-4 h-4" /> <span>Yaratish</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : filteredAssignments.length === 0 ? (
                <div className="py-20 text-center bg-white/60 dark:bg-slate-900/40 rounded-[32px] border border-dashed border-slate-200 dark:border-white/10">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Topshiriqlar mavjud emas</h2>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAssignments.map(item => (
                        <Card key={item.id} className="p-0 flex flex-col group border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300">
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest w-max flex items-center">
                                            <GraduationCap className="w-3 h-3 mr-1" /> {item.targetGrade || "Barcha bosqich"}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 flex items-center">
                                            <Layers className="w-3 h-3 mr-1" /> {item.targetSpecialtyName || "Barcha yo'nalishlar"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                
                                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{item.title}</h3>
                                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center"><BookOpen className="w-3 h-3 mr-1"/> {item.subjectName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                                
                                {item.prerequisiteId && (
                                    <div className="mb-4 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
                                        <ShieldAlert className="w-3 h-3 mr-1.5 shrink-0" /> Zanjirli shart mavjud
                                    </div>
                                )}
                                
                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Muddat:</span>
                                    <span className={!item.deadline ? "text-emerald-500" : ""}>{item.deadline ? new Date(item.deadline).toLocaleString('uz-UZ', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : "Cheksiz"}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* MOBILE-FIRST MODAL (Bottom Sheet / Side Panel) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex flex-col justify-end md:flex-row md:justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full h-[95vh] md:h-screen md:max-w-xl bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-none md:rounded-l-[32px] shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
                        
                        <div className="w-full flex justify-center pt-3 pb-1 md:hidden"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>

                        <div className="px-6 pb-4 pt-2 md:pt-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{editingId ? "Tahrirlash" : "Yangi Topshiriq"}</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Dinamik Ierarxiya bilan ishlash</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
                        </div>

                        {/* Scrolling Tabs */}
                        <div className="flex px-4 md:px-6 py-3 border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar gap-2 shrink-0">
                            {[
                                { id: "general", label: "Kurs & Asosiy", icon: BookOpen },
                                { id: "grading", label: "Vaqt & Baholash", icon: Settings },
                                { id: "restrictions", label: "Cheklovlar", icon: ShieldAlert }
                            ].map(tab => (
                                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                                    <tab.icon className="w-3.5 h-3.5 mr-1.5"/> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Container */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-28 md:pb-32">
                            <form id="assignment-form" onSubmit={handleSave} className="space-y-6">
                                
                                {activeTab === 'general' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        {/* HIERARCHY SELECTION (Grade -> Specialty -> Subject) */}
                                        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center"><Target className="w-3.5 h-3.5 mr-1.5"/> Zanjirli Tanlov</h4>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Bosqich / Yil</label>
                                                    <select required value={form.targetGrade} onChange={e => setForm({...form, targetGrade: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/30">
                                                        <option value="" disabled>Tanlang...</option>
                                                        {grades.length === 0 ? <option disabled>Bazada yo'q</option> : grades.map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Mutaxassislik</label>
                                                    <select required value={form.targetSpecialtyId} onChange={(e) => {
                                                        const spec = specialties.find(s => s.id === e.target.value);
                                                        setForm({...form, targetSpecialtyId: spec?.id || "", targetSpecialtyName: spec?.name || "", subjectId: "", subjectName: ""});
                                                    }} className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/30">
                                                        <option value="" disabled>Yo'nalishni tanlang</option>
                                                        {specialties.length === 0 ? <option disabled>Bazada yo'q</option> : specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fan (Kurs)</label>
                                                <div className="relative">
                                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                    <select required disabled={!form.targetSpecialtyId} value={form.subjectId} onChange={(e) => {
                                                        const subj = filteredSubjects.find(s => s.id === e.target.value);
                                                        setForm({...form, subjectId: subj?.id || "", subjectName: subj?.name || "", prerequisiteId: ""});
                                                    }} className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50">
                                                        <option value="" disabled>Avval yo'nalishni tanlang...</option>
                                                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Topshiriq nomi</label>
                                            <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Masalan: Yakuniy loyiha (Final)" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Batafsil Tavsif</label>
                                            <textarea required rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" placeholder="Vazifani tushuntirib bering..."></textarea>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fayllar (Ilova qilish)</label>
                                            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-6 text-center relative overflow-hidden group">
                                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <UploadCloud className="w-8 h-8 mx-auto text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                                                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Fayl yuklash uchun bosing</p>
                                            </div>
                                            {form.files.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {form.files.map((file, i) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-center space-x-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                <FileIcon className="w-4 h-4 text-emerald-500"/><span className="line-clamp-1">{file.name}</span>
                                                            </div>
                                                            <button type="button" onClick={() => removeFile(i)} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-lg"><X className="w-3.5 h-3.5"/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'grading' && (
                                    <div className="space-y-5 animate-in fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Boshlanish Vaqti</label>
                                                <input type="datetime-local" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1">Deadline</label>
                                                <input required type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500/30" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Baholash Tizimi</label>
                                                <select value={form.gradingMethod} onChange={e => setForm({...form, gradingMethod: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none">
                                                    <option value="points">Ball (Points)</option><option value="percentage">Foiz (%)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Max Qiymat</label>
                                                <input required type="number" min="1" value={form.maxScore} onChange={e => setForm({...form, maxScore: Number(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none" />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 mt-2">
                                            <label className="flex items-center justify-between cursor-pointer w-full">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">Kechikishlarga ruxsat</span>
                                                <div className="relative">
                                                    <input type="checkbox" checked={form.allowLate} onChange={e => setForm({...form, allowLate: e.target.checked})} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                                </div>
                                            </label>
                                            {form.allowLate && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Jarima foizi (%)</label>
                                                    <input type="number" min="0" max="100" value={form.latePenaltyPercent} onChange={e => setForm({...form, latePenaltyPercent: Number(e.target.value)})} className="w-full p-3.5 mt-1 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm font-bold text-rose-600 outline-none" placeholder="Masalan: 10" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'restrictions' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rollar (Kim ishtirok etadi?)</label>
                                            <div className="flex gap-2">
                                                {['student', 'teacher'].map(role => (
                                                    <label key={role} className={`flex-1 p-3 rounded-xl border cursor-pointer text-center transition-all ${form.targetRoles.includes(role) ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-slate-50 border-transparent text-slate-500 dark:bg-slate-800'}`}>
                                                        <input type="checkbox" className="hidden" checked={form.targetRoles.includes(role)} onChange={(e) => {
                                                            const updated = e.target.checked ? [...form.targetRoles, role] : form.targetRoles.filter(r => r !== role);
                                                            if(updated.length > 0) setForm({...form, targetRoles: updated}); 
                                                        }} />
                                                        <span className="text-xs font-black uppercase tracking-widest">{role === 'student' ? 'Talaba' : "O'qituvchi"}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                                                <span>Majburiy Shart (Prerequisite)</span>
                                                {form.prerequisiteId && <span className="text-amber-500">Faol</span>}
                                            </label>
                                            <div className="p-4 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                                                <select disabled={!form.subjectId || !form.targetGrade} value={form.prerequisiteId} onChange={e => setForm({...form, prerequisiteId: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none disabled:opacity-50">
                                                    <option value="">Talab yo'q (Ixtiyoriy ochiladi)</option>
                                                    {validPrerequisites.map(a => <option key={a.id} value={a.id}>{a.title} (Bajarilishi shart)</option>)}
                                                </select>
                                                <p className="text-[9px] font-bold text-amber-600/70 dark:text-amber-400/70 mt-2">Faqat yuqorida tanlangan fan va bosqich bo'yicha oldingi topshiriqlar ro'yxatda chiqadi.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Urinishlar soni</label>
                                            <input type="number" min="0" value={form.attemptLimit} onChange={e => setForm({...form, attemptLimit: Number(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none" />
                                            <p className="text-[9px] font-bold text-slate-400 pl-1">0 = Cheksiz marta jo'natishi mumkin</p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Sticky Bottom Footer */}
                        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-white/5 rounded-b-[32px] md:rounded-none md:rounded-bl-[32px]">
                            <button form="assignment-form" type="submit" disabled={isSaving || !form.targetGrade || !form.targetSpecialtyId || !form.subjectId} className="w-full py-4 md:py-4.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "O'zgarishlarni Saqlash" : "Vazifani E'lon Qilish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    Plus, Search, AlertCircle, CheckCircle2, X, Loader2, 
    UploadCloud, BookOpen, Calendar, Users, Send, FileText
} from "lucide-react";
import { db, storage } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { notificationsApi } from "../../../../lib/api/notificationsApi";

export default function AdminAssignmentPage() {
    const [assignments, setAssignments] = useState([]);
    const [groups, setGroups] = useState([]); 
    const [subjects, setSubjects] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Xuddi siz xohlagandek toza va aniq forma
    const [form, setForm] = useState({
        subject: "",
        deadline: "",
        selectedGroups: [] // Ko'p guruh tanlash uchun
    });
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const grpSnap = await getDocs(collection(db, "groups"));
                setGroups(grpSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                
                const structSnap = await getDocs(collection(db, "structure"));
                setSubjects(structSnap.docs.map(d => d.data()).filter(s => s.type === 'subject'));

                const assignSnap = await getDocs(collection(db, "assignments"));
                setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { 
                showToast("Ma'lumotlarni yuklashda xato", "error"); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchInitialData();
    }, []);

    // Multi-select guruhlar logikasi
    const toggleGroup = (groupId) => {
        setForm(prev => {
            const isSelected = prev.selectedGroups.includes(groupId);
            return {
                ...prev,
                selectedGroups: isSelected 
                    ? prev.selectedGroups.filter(id => id !== groupId) 
                    : [...prev.selectedGroups, groupId]
            };
        });
    };

    // 🌟 ASOSIY SAQLASH VA NOTIFICATION YUBORISH
    const handleSave = async (e) => {
        e.preventDefault();
        if (form.selectedGroups.length === 0) return showToast("Kamida bitta guruhni tanlang!", "error");
        if (!file) return showToast("Iltimos, Cover Page (DOCX) faylini yuklang!", "error");
        if (!file.name.endsWith('.docx')) return showToast("Faqat .docx formatidagi Word fayl qabul qilinadi!", "error");

        setIsSaving(true);
        try {
            // 1. Qolipni (Template) Firebase Storage ga yuklash
            const fileRef = ref(storage, `assignment_templates/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const templateFileUrl = await getDownloadURL(fileRef);

            // 2. Har bir tanlangan guruh uchun alohida vazifa yaratish
            for (const groupId of form.selectedGroups) {
                const groupObj = groups.find(g => g.id === groupId);
                
                const newAssign = {
                    subject: form.subject,
                    groupId: groupId,
                    groupName: groupObj?.name || "Noma'lum",
                    deadline: form.deadline,
                    templateUrl: templateFileUrl, // Buni talaba yuklab oladi
                    fileName: file.name,
                    createdAt: serverTimestamp(),
                    status: 'active'
                };

                const docRef = await addDoc(collection(db, "assignments"), newAssign);
                setAssignments(prev => [{ id: docRef.id, ...newAssign }, ...prev]);

                // 3. JONLI NOTIFICATION YUBORISH (Shu guruh talabalari uchun)
                await notificationsApi.sendNotification({
                    title: "Yangi Topshiriq: " + form.subject,
                    message: `${form.subject} fani bo'yicha yangi vazifa yuklandi. Oxirgi muddat: ${new Date(form.deadline).toLocaleString()}`,
                    targetRoles: ['all', groupId], // Faqat shu guruhga boradi!
                    type: 'warning',
                    link: '/student/applications'
                });
            }

            showToast("Vazifa e'lon qilindi va xabarnomalar yuborildi!");
            setIsModalOpen(false);
            setForm({ subject: "", deadline: "", selectedGroups: [] });
            setFile(null);
        } catch (err) { 
            console.error(err);
            showToast("Saqlashda xato yuz berdi", "error"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const openModal = () => {
        setForm({ subject: "", deadline: "", selectedGroups: [] });
        setFile(null);
        setIsModalOpen(true);
    };

    const filteredAssignments = assignments.filter(a => a.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || a.groupName?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[600] px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Topshiriqlar Markazi</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        Topshiriq yuborish va avtomat Cover Page biriktirish
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Fan yoki guruhni izlash..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <button onClick={openModal} className="w-full sm:w-auto flex justify-center items-center space-x-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all font-black text-xs uppercase tracking-widest shrink-0">
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
                        <Card key={item.id} className="p-5 flex flex-col group border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center">
                                    <Users className="w-3 h-3 mr-1" /> {item.groupName}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{item.subject}</h3>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center"><FileText className="w-3 h-3 mr-1"/> {item.fileName}</p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Muddat:</span>
                                <span>{new Date(item.deadline).toLocaleString('uz-UZ', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* --- MODAL (QOLIP YUKLASH) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Yangi Topshiriq</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Avtomat Cover Page Biriktirish</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fan</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30">
                                            <option value="" disabled>Fanni tanlang...</option>
                                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Deadline</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input required type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex justify-between">
                                    <span>Guruhlarni Tanlang</span>
                                    <span className="text-indigo-500">{form.selectedGroups.length} ta tanlandi</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {groups.map(g => (
                                        <div 
                                            key={g.id} onClick={() => toggleGroup(g.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${form.selectedGroups.includes(g.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300 shadow-sm scale-[1.02]' : 'bg-slate-50 border-transparent text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:border-indigo-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${form.selectedGroups.includes(g.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`}>
                                                {form.selectedGroups.includes(g.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider truncate">{g.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cover Page Qolipi (Faqat DOCX)</label>
                                <div onClick={() => !file && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-indigo-400'}`}>
                                    <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" accept=".docx" />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3"><FileText className="w-7 h-7" /></div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mb-2">{file.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-5 py-2 bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-200"><X className="w-3.5 h-3.5" /> O'chirish</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm"><UploadCloud className="w-8 h-8" /></div>
                                            <p className="text-base font-black text-slate-800 dark:text-white mb-1">Docx qolipni yuklang</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2 max-w-sm mx-auto">
                                                Fayl ichida <span className="text-indigo-500 font-black">&#123;ism&#125;</span>, <span className="text-indigo-500 font-black">&#123;familiya&#125;</span> kabi kalit so'zlar bo'lishi kerak. Tizim ularni o'zi to'ldiradi.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Barcha Guruhlarga Yuborish</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
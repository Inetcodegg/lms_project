"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
    Inbox, Clock, ExternalLink, User, CheckCircle2, Loader2, 
    Search, Plus, FileText, UploadCloud, Trash2, Send, Users, Calendar,
    ShieldAlert, AlertCircle, BookOpen
} from "lucide-react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";

export default function TeacherAssignmentsPage() {
    const [activeTab, setActiveTab] = useState("submissions"); // 'submissions' | 'create' | 'sent'
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Ma'lumotlar ---
    const [adminTasks, setAdminTasks] = useState([]); // ADMIN YARATGAN ASOSIY VAZIFALAR
    const [submissions, setSubmissions] = useState([]); // Talabalardan kelgan javoblar
    const [sentAssignments, setSentAssignments] = useState([]); // Ustoz yuborganlari
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);

    // --- Form ---
    const [assignForm, setAssignForm] = useState({
        adminTaskId: "",
        targetType: "group",
        targetId: "",
        description: "",
    });
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!auth.currentUser?.uid) return;
            try {
                setLoading(true);
                const teacherId = auth.currentUser.uid;

                // 1. Admin yaratgan Asosiy Topshiriqlar (admin_assignments)
                const adminQ = query(collection(db, "admin_assignments"), where("status", "==", "active"));
                const adminSnap = await getDocs(adminQ);
                setAdminTasks(adminSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // 2. Kelib tushgan javoblar
                const subQ = query(collection(db, "submissions"), where("teacherId", "==", teacherId));
                const subSnap = await getDocs(subQ);
                setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // 3. Ustoz yuborganlari
                const assignQ = query(collection(db, "assignments"), where("teacherId", "==", teacherId));
                const assignSnap = await getDocs(assignQ);
                setSentAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Guruhlar va Talabalar
                const groupSnap = await getDocs(collection(db, "groups"));
                setGroups(groupSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const studentSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
                setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Tanlangan Admin topshirig'ini topish (Deadline va Fanni olish uchun)
    const selectedAdminTask = adminTasks.find(t => t.id === assignForm.adminTaskId);

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!assignForm.adminTaskId) return alert("Iltimos, Admin ochgan topshiriqni tanlang!");
        if (!assignForm.targetId) return alert("Iltimos, guruh yoki talabani tanlang!");
        if (!file) return alert("Iltimos, o'z savollaringiz faylini yuklang!");

        setIsSubmitting(true);
        try {
            // 1. MONGODB API ORQALI FAYL YUKLASH (Tepa qismda yozilgan API ga uramiz)
            const formData = new FormData();
            formData.append("file", file);
            
            const uploadRes = await fetch("/api/upload-mongo", { method: "POST", body: formData });
            const uploadedData = await uploadRes.json();
            
            if (!uploadRes.ok) throw new Error(uploadedData.error || "Fayl yuklanmadi");

            const mongoFileUrl = uploadedData.fileUrl; 

            // 2. FIREBASE GA YAKUNIY VAZIFANI YOZISH
            const targetName = assignForm.targetType === 'group' 
                ? groups.find(g => g.id === assignForm.targetId)?.name 
                : students.find(s => s.id === assignForm.targetId)?.name;

            const newAssignment = {
                teacherId: auth.currentUser.uid,
                teacherName: auth.currentUser.displayName || "O'qituvchi",
                adminTaskId: assignForm.adminTaskId,
                subject: selectedAdminTask.subject,
                deadline: selectedAdminTask.deadline,
                templateUrl: selectedAdminTask.templateUrl, // Adminning auto-cover page qolipi
                
                targetType: assignForm.targetType,
                targetId: assignForm.targetId,
                targetName: targetName || "Noma'lum",
                
                description: assignForm.description,
                teacherFileUrl: mongoFileUrl, // MongoDB dan kelgan fayl
                fileName: file.name,
                createdAt: serverTimestamp(),
                status: 'active'
            };

            const docRef = await addDoc(collection(db, "assignments"), newAssignment);
            
            // 3. 🌟 QIZIL PUSH NOTIFICATION YUBORISH (Faqat shu guruh/talabaga)
            await notificationsApi.sendNotification({
                title: "Yangi Vazifa Yuklandi",
                message: `${selectedAdminTask.subject} fani bo'yicha ustozingiz vazifa yubordi. Muddat: ${new Date(selectedAdminTask.deadline).toLocaleString()}`,
                targetRoles: ['all', assignForm.targetId], // Faqat shu guruh yoki talabaga boradi!
                type: 'warning',
                link: '/student/applications'
            });

            setSentAssignments([{ id: docRef.id, ...newAssignment }, ...sentAssignments]);
            alert("Vazifa muvaffaqiyatli yuborildi va Talabalarga xabarnoma ketdi!");
            
            setAssignForm({ adminTaskId: "", targetType: "group", targetId: "", description: "" });
            setFile(null);
            setActiveTab('sent');

        } catch (error) {
            console.error(error);
            alert("Xatolik yuz berdi: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSubmissions = submissions.filter(s =>
        s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
            
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Vazifalar Markazi</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Talabalar ishini tekshirish va yangi vazifa yuklash</p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-[20px] w-full xl:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    <button onClick={() => setActiveTab('submissions')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'submissions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Inbox className="w-4 h-4 shrink-0" /> <span>Kelgan Ishlar</span>
                    </button>
                    <button onClick={() => setActiveTab('create')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'create' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Plus className="w-4 h-4 shrink-0" /> <span>Vazifa Yuklash</span>
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`flex-1 xl:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sent' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Send className="w-4 h-4 shrink-0" /> <span>Yuborilganlar</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
            ) : (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] p-6 md:p-8 shadow-sm">
                    
                    {/* --- TAB 1: KELIB TUSHGAN ISHLAR --- */}
                    {activeTab === 'submissions' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-2 rounded-2xl max-w-md">
                                <Search className="ml-3 w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text" placeholder="Ism yoki vazifa bo'yicha qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-3 pr-4 py-2 bg-transparent text-xs font-bold outline-none text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredSubmissions.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">Hozircha ishlar kelib tushmagan</div>
                                ) : filteredSubmissions.map((sub) => (
                                    <div key={sub.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">
                                                {sub.studentName?.[0] || <User className="w-5 h-5"/>}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight line-clamp-1">{sub.studentName || "Noma'lum Talaba"}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 line-clamp-1">{sub.taskTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-4 sm:pt-0">
                                            <div className="text-right">
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {sub.status === 'graded' ? 'Baholangan' : 'Kutilmoqda'}
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> {sub.submittedAt?.toDate().toLocaleDateString()}</p>
                                            </div>
                                            {/* BU YERDA HAM MONGODB FAYLNI OCHISH UCHUN LINK */}
                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-md hover:bg-indigo-600 hover:scale-105 transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: VAZIFA YUKLASH (Admin bog'liqligi bilan) --- */}
                    {activeTab === 'create' && (
                        <div className="max-w-4xl animate-in slide-in-from-right-8 duration-300">
                            
                            {/* QULF: Admin hali topshiriq yaratmagan bo'lsa */}
                            {adminTasks.length === 0 ? (
                                <div className="py-20 text-center bg-rose-50 dark:bg-rose-500/5 border-2 border-dashed border-rose-200 dark:border-rose-500/20 rounded-[32px]">
                                    <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                                    <h2 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-2">Tizim Qulflangan</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-md mx-auto">Admin tomonidan tasdiqlangan va muddat qoyilgan o'quv rejasi mavjud emas. Vazifa yuklash uchun admin ruxsatini kuting.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateAssignment} className="space-y-8">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        
                                        {/* 1. Admin Topshirig'ini tanlash */}
                                        <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                                            <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center mb-4"><ShieldAlert className="w-3.5 h-3.5 mr-1.5"/> 1-Qadam: Asosiy Rejani Tanlash</h3>
                                            <div className="relative">
                                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <select required value={assignForm.adminTaskId} onChange={e => setAssignForm({...assignForm, adminTaskId: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer dark:text-white">
                                                    <option value="">Admin yaratgan fanni tanlang...</option>
                                                    {adminTasks.map(t => <option key={t.id} value={t.id}>{t.subject} (Deadline: {new Date(t.deadline).toLocaleDateString()})</option>)}
                                                </select>
                                            </div>
                                            
                                            {selectedAdminTask && (
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 space-y-1.5">
                                                    <p className="flex justify-between"><span>Belgilangan muddat:</span> <span className="text-rose-500 font-black">{new Date(selectedAdminTask.deadline).toLocaleString()}</span></p>
                                                    <p className="flex justify-between items-center">
                                                        <span>Avtomat Cover Page:</span> 
                                                        <a href={selectedAdminTask.templateUrl} target="_blank" className="text-emerald-500 flex items-center hover:underline"><FileText className="w-3 h-3 mr-1"/> Biriktirilgan</a>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Kimga yuboriladi? */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">2-Qadam: Kime yuborilmoqda?</h3>
                                            
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setAssignForm({...assignForm, targetType: 'group', targetId: ""})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${assignForm.targetType === 'group' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Guruhga</button>
                                                <button type="button" onClick={() => setAssignForm({...assignForm, targetType: 'student', targetId: ""})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${assignForm.targetType === 'student' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Alohida Talabaga</button>
                                            </div>

                                            <div className="relative">
                                                {assignForm.targetType === 'group' ? <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> : <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                                                <select required value={assignForm.targetId} onChange={e => setAssignForm({...assignForm, targetId: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer dark:text-white">
                                                    <option value="">{assignForm.targetType === 'group' ? "Guruhni tanlang..." : "Talabani tanlang..."}</option>
                                                    {assignForm.targetType === 'group' 
                                                        ? groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                                                        : students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.groupId})</option>)
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Fayl Yuklash & Izoh */}
                                    <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">3-Qadam: O'z savollaringizni yuklang</h3>
                                        <textarea required rows="3" placeholder="Vazifa bo'yicha qo'shimcha izoh yoki savollar ro'yxati..." value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 custom-scrollbar dark:text-white resize-none"></textarea>
                                        
                                        <div onClick={() => !file && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[24px] p-10 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-emerald-400'}`}>
                                            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                                            {file ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><FileText className="w-8 h-8" /></div>
                                                    <p className="text-base font-black text-slate-800 dark:text-white mb-2">{file.name}</p>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-5 py-2 bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-200 mt-2"><Trash2 className="w-4 h-4" /> O'chirish</button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm"><UploadCloud className="w-8 h-8" /></div>
                                                    <p className="text-base font-black text-slate-800 dark:text-white mb-2">Savollar faylini yuklang</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MongoDB da xavfsiz saqlanadi (PDF, DOC, ZIP)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button type="submit" disabled={isSubmitting || !file} className="w-full md:w-auto px-10 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center min-w-[200px] active:scale-95">
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "Talabalarga Yuborish"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* --- TAB 3: YUBORILGAN VAZIFALAR --- */}
                    {activeTab === 'sent' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-left-8 duration-300">
                            {sentAssignments.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">Siz hali vazifa yuklamagansiz</div>
                            ) : sentAssignments.map(assign => (
                                <div key={assign.id} className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${assign.targetType === 'group' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
                                            {assign.targetType === 'group' ? <Users className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                                            {assign.targetName}
                                        </span>
                                        <a href={assign.teacherFileUrl} target="_blank" className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors"><ExternalLink className="w-4 h-4"/></a>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">{assign.subject}</h3>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1">{assign.description}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5 text-rose-400"/> Deadline: {new Date(assign.deadline).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../../../../lib/UserContext";
import { db } from "../../../../lib/firebase";
import { 
    collection, query, where, getDocs, 
    writeBatch, doc, serverTimestamp 
} from "firebase/firestore";
import {
    Users, BookOpen, Calendar, ChevronDown, CheckCircle2, 
    XCircle, Eye, X, Loader2, Save, MessageSquare, 
    AlertCircle, Check, Download, FileText, Zap, Award, Clock, RefreshCcw
} from "lucide-react";
import { intervalToDuration, isAfter } from "date-fns";

// --- 1. JONLI TAYMER ---
const LiveCountdown = ({ deadline }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const target = new Date(deadline);
    const expired = isAfter(now, target);
    const duration = intervalToDuration({ start: now, end: target });

    const formatNum = (num) => String(num || 0).padStart(2, '0');

    if (expired) {
        return (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 text-rose-600 rounded-2xl border border-rose-200 animate-pulse">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Muddat o'tgan</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 border border-indigo-400">
            <Clock className="w-6 h-6 animate-spin-slow" />
            <div className="flex items-center gap-1 font-mono text-xl font-black">
                <span>{formatNum(duration.days * 24 + duration.hours)}</span>:
                <span>{formatNum(duration.minutes)}</span>:
                <span className="text-indigo-200">{formatNum(duration.seconds)}</span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest border-l border-indigo-400 pl-3">Qoldi</span>
        </div>
    );
};

// --- 2. UNIVERSAL FILE PREVIEW MODAL ---
const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
    if (!isOpen || !fileUrl) return null;
    const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    const isPDF = fileUrl.toLowerCase().includes('.pdf');
    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                        <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate">{fileName}</h3>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-indigo-600 transition-colors"><Download className="w-5 h-5" /></a>
                        <button onClick={onClose} className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-slate-950">
                    {isImage ? <div className="flex justify-center p-10"><img src={fileUrl} className="max-w-full rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800" /></div> :
                     isPDF ? <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full min-h-[80vh] border-none" /> :
                     <iframe src={officeUrl} className="w-full h-full min-h-[80vh] border-none" />}
                </div>
            </div>
        </div>
    );
};

// --- MATRIX OPTIONS ---
const GRADE_OPTIONS = [
    { id: 'fail', label: 'FAIL', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/5 hover:border-rose-300', active: 'bg-rose-600 text-white shadow-lg border-transparent' },
    { id: 'pass', label: 'PASS', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-300', active: 'bg-emerald-600 text-white shadow-lg border-transparent' },
    { id: 'merit', label: 'MERIT', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/5 hover:border-blue-300', active: 'bg-blue-600 text-white shadow-lg border-transparent' },
    { id: 'distinction', label: 'DIST.', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/5 hover:border-purple-300', active: 'bg-purple-600 text-white shadow-lg border-transparent' },
];

export default function TeacherGradingPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    
    const [students, setStudents] = useState([]);
    const [preview, setPreview] = useState({ isOpen: false, url: null, name: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Kutilayotganlar va Baholanganlar Tablari
    const [gradeTab, setGradeTab] = useState("pending");

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

    // Fetch Groups
    useEffect(() => {
        const fetchInit = async () => {
            if (!user?.uid) return;
            try {
                const snap = await getDocs(query(collection(db, "groups")));
                setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchInit();
    }, [user]);

    // Fetch Assignments
    useEffect(() => {
        const fetchTasks = async () => {
            if (!selectedGroup) return;
            setLoading(true);
            try {
                const q = query(collection(db, "assignments"), where("targetId", "==", selectedGroup.id));
                const snap = await getDocs(q);
                setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
                setSelectedAssignment(null);
                setStudents([]);
                setGradeTab("pending");
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchTasks();
    }, [selectedGroup]);

    // Fetch Students and Grades
    useEffect(() => {
        const fetchGrading = async () => {
            if (!selectedAssignment) return;
            setLoading(true);
            try {
                const isLate = new Date() > new Date(selectedAssignment.deadline);
                const [uSnap, sSnap, gSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("groupId", "==", selectedGroup.id), where("role", "==", "student"))),
                    getDocs(query(collection(db, "submissions"), where("assignmentId", "==", selectedAssignment.id))),
                    getDocs(query(collection(db, "grades"), where("assignmentId", "==", selectedAssignment.id)))
                ]);

                const subs = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const grads = gSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                const merged = uSnap.docs.map(d => {
                    const sData = { id: d.id, ...d.data() };
                    const sub = subs.find(s => s.studentId === sData.id);
                    const grade = grads.find(g => g.studentId === sData.id);
                    
                    let defaultScore = grade?.score || null;
                    if (!sub && isLate && !grade?.score) defaultScore = 'fail';

                    return {
                        ...sData,
                        hasSubmission: !!sub,
                        subUrl: sub?.fileUrl || null,
                        subId: sub?.id || null,
                        score: defaultScore,
                        comment: grade?.comment || "",
                        gradeId: grade?.id || null,
                        isGraded: !!grade
                    };
                }).sort((a, b) => a.name.localeCompare(b.name));

                setStudents(merged);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchGrading();
    }, [selectedAssignment]);

    const handleSaveAll = async () => {
        const activeStudents = gradeTab === 'pending' ? students.filter(s => !s.isGraded) : students.filter(s => s.isGraded);
        const invalid = activeStudents.find(s => s.score && !s.hasSubmission && !s.comment.trim());
        
        if (invalid) {
            showToast(`${invalid.name} ish yuklamagan. Izoh yozish shart!`, "error");
            return;
        }

        try {
            setIsSaving(true);
            const batch = writeBatch(db);
            let changesMade = false;

            activeStudents.forEach(s => {
                if (s.score) {
                    changesMade = true;
                    const ref = s.gradeId ? doc(db, "grades", s.gradeId) : doc(collection(db, "grades"));
                    batch.set(ref, {
                        assignmentId: selectedAssignment.id,
                        studentId: s.id,
                        teacherId: user.uid,
                        score: s.score,
                        comment: s.comment.trim(),
                        updatedAt: serverTimestamp()
                    }, { merge: true });

                    setStudents(prev => prev.map(item => item.id === s.id ? { ...item, isGraded: true, gradeId: ref.id } : item));
                }
            });

            if(changesMade){
                await batch.commit();
                showToast(gradeTab === 'pending' ? "Baholar saqlandi!" : "O'zgarishlar saqlandi!");
            } else {
                showToast("Hech qanday baho qo'yilmadi", "error");
            }
            
        } catch (err) { showToast("Xatolik yuz berdi!", "error"); } finally { setIsSaving(false); }
    };

    const displayStudents = useMemo(() => {
        if (gradeTab === 'pending') return students.filter(s => !s.isGraded);
        if (gradeTab === 'graded') return students.filter(s => s.isGraded);
        return [];
    }, [students, gradeTab]);

    return (
        <div className="p-4 md:p-8 max-w-[1500px] mx-auto animate-in fade-in pb-32">
            {toast && <div className={`fixed top-6 right-6 z-[11000] px-8 py-4 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white animate-in slide-in-from-right`}>{toast.text}</div>}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3"><Zap className="w-8 h-8 text-indigo-500"/> Matrix Grading</h1>
                </div>
                {selectedAssignment && <LiveCountdown deadline={selectedAssignment.deadline} />}
            </header>

            {/* SELECTION AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm">
                    <h2 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Guruh</h2>
                    <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                            <button key={g.id} onClick={() => setSelectedGroup(g)} className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase transition-all ${selectedGroup?.id === g.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}>{g.name}</button>
                        ))}
                    </div>
                </div>

                <div className={`lg:col-span-3 p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm transition-opacity ${!selectedGroup && 'opacity-40 pointer-events-none'}`}>
                    <h2 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500"/> Topshiriq</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                        {assignments.map(a => (
                            <button key={a.id} onClick={() => setSelectedAssignment(a)} className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${selectedAssignment?.id === a.id ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'}`}>
                                <div className="min-w-0 flex-1 pr-2">
                                    <p className={`text-sm md:text-base font-black truncate ${selectedAssignment?.id === a.id ? 'text-emerald-700' : 'text-slate-700 dark:text-slate-300'}`}>{a.title}</p>
                                </div>
                                {selectedAssignment?.id === a.id && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GRADING CONSOLE */}
            {selectedAssignment && (
                <div className="animate-in slide-in-from-bottom-4">
                    
                    {/* TABS VA ACTIONS */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 px-1">
                        <div className="flex bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-2xl shadow-sm w-full lg:w-auto">
                            <button onClick={() => setGradeTab('pending')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-widest transition-all ${gradeTab === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                                <Clock className="w-4 h-4"/> Baholanmagan
                                <span className="px-2 py-0.5 rounded bg-white/50 dark:bg-black/20 text-[10px]">{students.filter(s => !s.isGraded).length}</span>
                            </button>
                            <button onClick={() => setGradeTab('graded')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-widest transition-all ${gradeTab === 'graded' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                                <RefreshCcw className="w-4 h-4"/> Qayta Baholash
                                <span className="px-2 py-0.5 rounded bg-white/50 dark:bg-black/20 text-[10px]">{students.filter(s => s.isGraded).length}</span>
                            </button>
                        </div>

                        <button onClick={handleSaveAll} disabled={isSaving || displayStudents.length === 0} className="w-full lg:w-auto px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} {gradeTab === 'pending' ? 'Barchasini Tasdiqlash' : "O'zgarishlarni Saqlash"}
                        </button>
                    </div>

                    {/* JADVAL */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[32px] shadow-xl overflow-hidden">
                        {displayStudents.length === 0 ? (
                            <div className="py-24 text-center">
                                <CheckCircle2 className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bu ro'yxatda talabalar qolmadi</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-[900px]">
                                    <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">№ / Talaba</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ishni Ko'rish</th>
                                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrix Grading</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Izoh (Feedback)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {displayStudents.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                                <td className="px-6 py-5 border-r border-slate-50 dark:border-slate-800/50">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs md:text-sm font-black text-slate-400 w-5 shrink-0">{idx + 1}</span>
                                                        <div>
                                                            <p className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight mb-1">{s.name}</p>
                                                            <div className={`flex items-center gap-1.5 ${s.hasSubmission ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {s.hasSubmission ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{s.hasSubmission ? 'Yuklangan' : 'Topshirmagan'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5 text-center border-r border-slate-50 dark:border-slate-800/50">
                                                    {s.hasSubmission ? (
                                                        <button onClick={() => setPreview({ isOpen: true, url: s.subUrl, name: s.name })} className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-[14px] flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all mx-auto shadow-sm">
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    ) : <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 dark:bg-slate-800/50 rounded-[14px] flex items-center justify-center text-slate-300 mx-auto"><XCircle className="w-5 h-5 opacity-20" /></div>}
                                                </td>
                                                
                                                <td className="px-8 py-5 border-r border-slate-50 dark:border-slate-800/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {GRADE_OPTIONS.map((opt) => {
                                                            const isActive = s.score === opt.id;
                                                            const isDisabled = !s.hasSubmission && !s.comment.trim();
                                                            return (
                                                                <button key={opt.id} disabled={isDisabled} onClick={() => setStudents(prev => prev.map(item => item.id === s.id ? {...item, score: opt.id} : item))}
                                                                    className={`w-[70px] md:w-20 h-10 md:h-12 rounded-xl border-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${isActive ? opt.active : `${opt.color} border-transparent hover:border-slate-300 dark:hover:border-slate-600`}`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5 min-w-[300px]">
                                                    <div className="flex items-center gap-3">
                                                        <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${!s.hasSubmission && !s.comment.trim() ? 'text-rose-400' : 'text-slate-300'}`} />
                                                        <input type="text" value={s.comment} onChange={(e) => setStudents(prev => prev.map(item => item.id === s.id ? {...item, comment: e.target.value} : item))} 
                                                            placeholder={s.hasSubmission ? "Izoh (Ixtiyoriy)..." : "Avval izoh yozish shart!"} 
                                                            className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 ${!s.hasSubmission && !s.comment.trim() ? 'ring-2 ring-rose-500/10 border-rose-200 text-rose-700 placeholder:text-rose-400' : ''}`}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <FilePreviewModal 
                isOpen={preview.isOpen} onClose={() => setPreview({ isOpen: false, url: null, name: "" })}
                fileUrl={preview.url} fileName={preview.name} 
            />
        </div>
    );
}
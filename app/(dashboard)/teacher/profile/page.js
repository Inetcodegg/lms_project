"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    User, Mail, Phone, BookOpen, GraduationCap, 
    Award, Save, Loader2, Plus, Trash2, CheckCircle2, AlertCircle, ChevronDown, Check, Building2
} from "lucide-react";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";

const DEGREES = ["Bakalavr", "Magistr", "PhD (Falsafa doktori)", "DSc (Fan doktori)", "Professor", "Akademik"];

// --- Z-INDEX MUAMMOSI HAL QILINGAN CUSTOM SELECT ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o === value) || value;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold border transition-all duration-200 select-none outline-none bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-indigo-500/30 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent'}`}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`w-4 h-4 mr-2.5 shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedLabel || placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                // 🌟 z-[999] qo'yildi va absolute orqali ustiga chiqadi
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar px-1.5">
                        {options.map((opt) => (
                            <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-xs font-bold transition-all mb-1 last:mb-0 ${value === opt ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                                <span className="truncate pr-2">{opt}</span>
                                {value === opt && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function TeacherProfilePage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Universitet Bazadagi fanlar ro'yxati (Multi-select uchun)
    const [availableSubjects, setAvailableSubjects] = useState([]);

    const [form, setForm] = useState({
        name: "", phone: "", bio: "", department: "",
        degree: "Magistr", subjects: [], certificates: [] // subjects endi Array bo'ldi
    });

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.uid) return;
            try {
                // 1. Profilni tortish
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);
                
                // 2. Fanlarni tortish (Structure kolleksiyasidan type: 'subject' larni olamiz)
                const qSubjects = query(collection(db, "structure"), where("type", "==", "subject"));
                const snapSubjects = await getDocs(qSubjects);
                const subList = snapSubjects.docs.map(d => d.data().name);
                setAvailableSubjects(subList);

                if (snap.exists()) {
                    const data = snap.data();
                    let currentSubjects = [];
                    // Bazada string bo'lib qolgan bo'lsa arrayga o'tkazamiz
                    if (Array.isArray(data.subjects)) currentSubjects = data.subjects;
                    else if (typeof data.subjects === 'string' && data.subjects.trim()) currentSubjects = data.subjects.split(",").map(s=>s.trim());

                    setForm({
                        name: data.name || "", phone: data.phone || "", bio: data.bio || "",
                        department: data.department || "", degree: data.degree || "Magistr",
                        subjects: currentSubjects,
                        certificates: data.certificates || []
                    });
                }
            } catch (error) { showToast("Ma'lumotlarni yuklashda xatolik", "error"); } 
            finally { setLoading(false); }
        };
        fetchInitialData();
    }, [user]);

    const toggleSubject = (subjectName) => {
        setForm(prev => {
            const hasSub = prev.subjects.includes(subjectName);
            const newSubs = hasSub ? prev.subjects.filter(s => s !== subjectName) : [...prev.subjects, subjectName];
            return { ...prev, subjects: newSubs };
        });
    };

    const addCertificate = () => setForm(prev => ({ ...prev, certificates: [...prev.certificates, { title: "", url: "" }] }));
    const removeCertificate = (index) => setForm(prev => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== index) }));
    const handleCertChange = (index, field, value) => {
        const newCerts = [...form.certificates];
        newCerts[index][field] = value;
        setForm(prev => ({ ...prev, certificates: newCerts }));
    };

    const handleSave = async (e) => {
        if(e) e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: form.name, phone: form.phone, bio: form.bio, department: form.department,
                degree: form.degree, subjects: form.subjects, certificates: form.certificates
            });
            showToast("Profil yangilandi!");
        } catch (error) { showToast("Xatolik yuz berdi", "error"); } 
        finally { setIsSaving(false); }
    };

    if (loading) return <div className="py-40 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

    return (
        <div className="p-4 lg:p-10 w-full max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-32">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* HEADER VA SAVE TUGMASI (Sticky Layout) */}
            <div className="sticky top-4 z-[900] mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[24px] p-4 px-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Kasbiy Profil</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-0.5 flex items-center">
                        <GraduationCap className="w-3 h-3 mr-1.5 text-indigo-500" /> Ilmiy daraja va sertifikatlar
                    </p>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSaving ? <Spinner className="w-4 h-4 text-inherit" /> : <><Save className="w-4 h-4" /> Saqlash</>}
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                
                <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center"><User className="w-4 h-4 mr-2 text-indigo-500"/> Asosiy Ma'lumotlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">F.I.SH</label>
                            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Telefon</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200" placeholder="+998 90 ..." />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qisqacha Bio (Tajriba)</label>
                            <textarea rows="3" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none custom-scrollbar border border-transparent focus:border-indigo-200" placeholder="O'zingiz va ish tajribangiz haqida..."></textarea>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm relative z-50">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center"><GraduationCap className="w-4 h-4 mr-2 text-emerald-500"/> Akademik va Fanlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 relative z-50">
                        <div className="space-y-1.5 relative z-50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ilmiy Daraja</label>
                            <CustomSelect icon={Award} placeholder="Daraja tanlang" options={DEGREES} value={form.degree} onChange={val => setForm({...form, degree: val})} />
                        </div>
                        <div className="space-y-1.5 relative z-40">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kafedra / Fakultet</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-200" placeholder="Kompyuter Injiniringi" />
                            </div>
                        </div>
                    </div>

                    {/* 🌟 MUKAMMAL MULTI-SELECT (Fanlar uchun) */}
                    <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Siz dars beradigan fanlarni tanlang</label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            {availableSubjects.length === 0 ? (
                                <p className="text-xs font-bold text-slate-400">Universitet bazasida fanlar topilmadi.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {availableSubjects.map(sub => {
                                        const isSelected = form.subjects.includes(sub);
                                        return (
                                            <button
                                                key={sub} type="button" onClick={() => toggleSubject(sub)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border
                                                    ${isSelected 
                                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-105' 
                                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                                    }
                                                `}
                                            >
                                                {sub}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 md:p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center"><Award className="w-4 h-4 mr-2 text-amber-500"/> Sertifikatlar</h3>
                        <button type="button" onClick={addCertificate} className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Qo'shish
                        </button>
                    </div>

                    {form.certificates.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 text-center py-8 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-700 uppercase tracking-widest">Sertifikatlar yuklanmagan</p>
                    ) : (
                        <div className="space-y-4">
                            {form.certificates.map((cert, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex-1 w-full space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Sertifikat Nomi</label>
                                        <input type="text" value={cert.title} onChange={e => handleCertChange(index, 'title', e.target.value)} className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-amber-200 shadow-sm" placeholder="Masalan: IELTS 7.5" required />
                                    </div>
                                    <div className="flex-1 w-full space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Rasm havolasi (URL)</label>
                                        <input type="url" value={cert.url} onChange={e => handleCertChange(index, 'url', e.target.value)} className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-amber-200 shadow-sm" placeholder="https://..." />
                                    </div>
                                    <button type="button" onClick={() => removeCertificate(index)} className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors md:mt-5 shrink-0"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </form>
        </div>
    );
}
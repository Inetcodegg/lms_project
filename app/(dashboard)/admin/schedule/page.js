"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    CalendarDays, Plus, Trash2, Edit, Search, 
    AlertCircle, CheckCircle2, X, Loader2, Clock, MapPin, Users, BookOpen, GraduationCap, LayoutGrid, List, Bot, Sparkles, Send
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const PAIRS = [
    { id: 1, time: "09:00 - 10:20" },
    { id: 2, time: "10:30 - 11:50" },
    { id: 3, time: "12:00 - 13:20" },
    { id: 4, time: "13:30 - 14:50" },
    { id: 5, time: "15:00 - 16:20" },
    { id: 6, time: "16:30 - 17:50" },
];

export default function AdminSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [teachers, setTeachers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' yoki 'list'
    
    // Filtrlar
    const [searchGroup, setSearchGroup] = useState("");
    const [toast, setToast] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // AI Chat state'lari
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiMessages, setAiMessages] = useState([
        { role: 'ai', text: "Salom! Men AI yordamchingizman. Menga jadvallarni matn ko'rinishida yozing, men ularni avtomat yarataman. Masalan: 'KI-21 guruhiga Dushanba 1-para A-102 xonada Matematika darsini qo'sh.'" }
    ]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    
    // Forma
    const [form, setForm] = useState({ group: "", day: "Dushanba", pair: 1, subject: "", teacherId: "", teacherName: "", room: "" });

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Dars va O'qituvchilarni yuklash
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const schedSnap = await getDocs(collection(db, "schedules"));
                setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // O'qituvchilarni va ularning fanlarini tortamiz
                const tq = query(collection(db, "users"), where("role", "==", "teacher"));
                const teacherSnap = await getDocs(tq);
                setTeachers(teacherSnap.docs.map(d => ({ id: d.id, name: d.data().name, subject: d.data().subject })));
            } catch (error) {
                showToast("Ma'lumotlarni yuklashda xato yuz berdi", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. QAT'IY MANTIQ: Ziddiyatlarni aniqlash (Collision Detection)
    const checkConflicts = (currentForm) => {
        return schedules.find(s => {
            // O'zini tahrirlayotganda o'ziga urilmasligi uchun
            if (editingId && s.id === editingId) return false;
            
            // Vaqt va kun bir xil bo'lsa tekshiramiz
            if (s.day === currentForm.day && Number(s.pair) === Number(currentForm.pair)) {
                if (s.teacherId === currentForm.teacherId) return `Bu vaqtda o'qituvchi ${s.teacherName} band! (${s.group} guruhida darsi bor)`;
                if (s.room.toLowerCase() === currentForm.room.toLowerCase()) return `Bu vaqtda ${s.room}-xona band! (${s.group} guruhi darsda)`;
                if (s.group.toLowerCase() === currentForm.group.toLowerCase()) return `${s.group} guruhining bu vaqtda boshqa darsi bor!`;
            }
            return false;
        });
    };

    const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userMsg = { role: 'user', text: aiPrompt };
    setAiMessages(prev => [...prev, userMsg]);
    const currentPrompt = aiPrompt;
    setAiPrompt("");
    setIsAiTyping(true);

    try {
        const response = await fetch("/api/ai/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                prompt: currentPrompt, 
                teachers: teachers, // O'qituvchilar ro'yxatini yuboramiz
                currentSchedules: schedules 
            })
        });

        const data = await response.json();

        if (data && !data.error) {
            // Ziddiyatni tekshirish
            const conflict = checkConflicts(data);
            if (conflict) {
                setAiMessages(prev => [...prev, { role: 'ai', text: `⚠️ Xatolik: ${conflict}` }]);
            } else {
                // Firebase'ga saqlash
                const docRef = await addDoc(collection(db, "schedules"), {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                setSchedules(prev => [...prev, { ...data, id: docRef.id }]);
                setAiMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: `✅ Bajarildi! ${data.group} uchun ${data.day} kuni ${data.pair}-paraga ${data.subject} darsi qo'shildi (${data.room}-xona, Ustoz: ${data.teacherName}).` 
                }]);
                showToast("AI jadvalni yangiladi!");
            }
        } else {
            setAiMessages(prev => [...prev, { role: 'ai', text: "Tushunmadim. Iltimos, guruh, kun va o'qituvchini aniqroq yozing." }]);
        }
    } catch (error) {
        setAiMessages(prev => [...prev, { role: 'ai', text: "Server bilan bog'lanishda xato." }]);
    } finally {
        setIsAiTyping(false);
    }
};

    // 3. SAQLASH
    const handleSave = async (e) => {
        e.preventDefault();
        
        // Ziddiyatni tekshirish
        const conflict = checkConflicts(form);
        if (conflict) {
            showToast(conflict, "error");
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave = { ...form, updatedAt: serverTimestamp() };

            if (editingId) {
                await updateDoc(doc(db, "schedules", editingId), dataToSave);
                setSchedules(schedules.map(s => s.id === editingId ? { ...dataToSave, id: editingId } : s));
                showToast("Dars jadvali yangilandi!");
            } else {
                const docRef = await addDoc(collection(db, "schedules"), { ...dataToSave, createdAt: serverTimestamp() });
                setSchedules([...schedules, { ...dataToSave, id: docRef.id }]);
                showToast("Yangi dars jadvalga qo'shildi!");
            }
            closeModal();
        } catch (error) {
            showToast("Saqlashda xatolik yuz berdi", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // 4. O'CHIRISH
    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Click cell events ishlamasligi uchun
        if (!window.confirm("Bu darsni o'chirib tashlaysizmi?")) return;
        try {
            await deleteDoc(doc(db, "schedules", id));
            setSchedules(schedules.filter(s => s.id !== id));
            showToast("Dars o'chirildi.");
        } catch (error) {
            showToast("Xato yuz berdi", "error");
        }
    };

    // MODAL BOSHQARUVI
    const openAddModal = (day = "Dushanba", pair = 1) => {
        setForm({ group: searchGroup || "", day, pair, subject: "", teacherId: "", teacherName: "", room: "" });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (schedule, e) => {
        if(e) e.stopPropagation();
        setForm(schedule);
        setEditingId(schedule.id);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    // Qidiruv natijasi
    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => s.group?.toLowerCase().includes(searchGroup.toLowerCase()));
    }, [schedules, searchGroup]);

    // O'qituvchi tanlanganda fanni avtomat yozish
    const handleTeacherChange = (teacherId) => {
        const t = teachers.find(x => x.id === teacherId);
        setForm({ ...form, teacherId: t.id, teacherName: t.name, subject: t.subject || "Fan biriktirilmagan" });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Dars Jadvali</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Markaziy boshqaruv matritsasi</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-56">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text" placeholder="Qaysi guruh jadvali?" value={searchGroup} onChange={(e) => setSearchGroup(e.target.value)}
                            className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex items-center bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-1 w-full sm:w-auto">
                        <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => openAddModal()} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Yangi Dars</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <>
                    {!searchGroup && viewMode === 'grid' && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start text-amber-700 dark:text-amber-400 text-xs font-bold">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                            Matritsa (Grid) ko'rinishidan foydalanish uchun yuqoridagi qidiruvga birorta guruh nomini yozing (Masalan: KI-21). Shunda faqat shu guruhning 1 haftalik ochiq jadvali chiqadi va bo'sh kataklarni bosib bemalol to'ldirishingiz mumkin.
                        </div>
                    )}

                    {/* MATRITSA KO'RINISHi (Google Calendar Style) */}
                    {viewMode === 'grid' && searchGroup && (
                        <div className="overflow-x-auto pb-4">
                            <div className="min-w-[1000px] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/40">
                                <div className="grid grid-cols-7 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/5">
                                    <div className="p-4 text-center border-r border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock className="w-4 h-4 mx-auto mb-1"/> Vaqt</div>
                                    {DAYS.map(day => <div key={day} className="p-4 text-center border-r border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{day}</div>)}
                                </div>
                                
                                {PAIRS.map(pair => (
                                    <div key={pair.id} className="grid grid-cols-7 border-b border-slate-200/50 dark:border-white/5 last:border-0 group/row">
                                        <div className="p-4 flex flex-col justify-center items-center border-r border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/10">
                                            <span className="text-[10px] font-black text-indigo-500">{pair.id}-para</span>
                                            <span className="text-[9px] font-bold text-slate-400">{pair.time}</span>
                                        </div>
                                        
                                        {DAYS.map(day => {
                                            const cellSchedule = filteredSchedules.find(s => s.day === day && Number(s.pair) === pair.id);
                                            
                                            return (
                                                <div 
                                                    key={`${day}-${pair.id}`} 
                                                    onClick={() => !cellSchedule && openAddModal(day, pair.id)}
                                                    className={`p-2 min-h-[100px] border-r border-slate-200/50 dark:border-white/5 last:border-0 relative transition-colors ${cellSchedule ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer group/cell'}`}
                                                >
                                                    {cellSchedule ? (
                                                        <div onClick={(e) => openEditModal(cellSchedule, e)} className="h-full bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-400 cursor-pointer relative group/item">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-md text-[9px] font-black tracking-widest">{cellSchedule.room}</span>
                                                                <button onClick={(e) => handleDelete(cellSchedule.id, e)} className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                                                            </div>
                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight mb-1">{cellSchedule.subject}</p>
                                                            <p className="text-[9px] font-bold text-slate-500 flex items-center mt-auto absolute bottom-3"><GraduationCap className="w-3 h-3 mr-1"/> {cellSchedule.teacherName}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                            <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 rounded-full"><Plus className="w-4 h-4"/></div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RO'YXAT KO'RINISHi (Mobile va Umumiy kuzatuv uchun) */}
                    {(viewMode === 'list' || (!searchGroup && viewMode === 'grid')) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredSchedules.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                    <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guruh uchun darslar topilmadi</p>
                                </div>
                            ) : (
                                filteredSchedules.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)).map(s => {
                                    const pairInfo = PAIRS.find(p => p.id === Number(s.pair));
                                    return (
                                        <Card key={s.id} className="p-5 flex flex-col relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                    <Users className="w-3.5 h-3.5 mr-1.5" />
                                                    <span className="text-xs font-black uppercase tracking-wider">{s.group}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => openEditModal(s)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-xl"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => handleDelete(s.id, e)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 line-clamp-2">{s.subject}</h3>
                                            
                                            <div className="mt-auto space-y-2">
                                                <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                                                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                                    {s.day}, {s.pair}-para ({pairInfo?.time})
                                                </div>
                                                <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                                                    <GraduationCap className="w-4 h-4 mr-2 text-emerald-500" />
                                                    <span className="truncate">{s.teacherName}</span>
                                                </div>
                                                <div className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-xl">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    {s.room}-auditoriya
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    )}
                </>
            )}

            {/* QO'SHISH / TAHRIRLASH MODALI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && closeModal()}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 md:p-8 border border-white/10 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingId ? "Darsni Tahrirlash" : "Yangi Dars Qo'shish"}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Ziddiyatlar tekshiriladi</p>
                            </div>
                            <button disabled={isSaving} onClick={closeModal} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Guruh (Kurs)</label>
                                    <div className="relative">
                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input required type="text" value={form.group} onChange={e => setForm({...form, group: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white uppercase" placeholder="KI-21" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Xona</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                                        <input required type="text" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white uppercase" placeholder="A-204" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hafta Kuni</label>
                                    <select required value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white cursor-pointer">
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Vaqti (Para)</label>
                                    <select required value={form.pair} onChange={e => setForm({...form, pair: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white cursor-pointer">
                                        {PAIRS.map(p => <option key={p.id} value={p.id}>{p.id}-para ({p.time})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5 pb-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mas'ul O'qituvchini Tanlang</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <select 
                                        required 
                                        value={form.teacherId} 
                                        onChange={(e) => handleTeacherChange(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold dark:text-white cursor-pointer"
                                    >
                                        <option value="" disabled>Ro'yxatdan tanlang...</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject || "Fan yo'q"})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">O'tiladigan Fan (Avtomatik)</label>
                                <div className="relative opacity-70">
                                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input readOnly type="text" value={form.subject} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold dark:text-white cursor-not-allowed" placeholder="O'qituvchi tanlang..." />
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? "O'zgarishlarni Saqlash" : "Jadvalga Qo'shish")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
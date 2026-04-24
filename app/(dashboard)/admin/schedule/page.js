"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    CalendarDays, Plus, Trash2, Edit3, Search, 
    AlertCircle, CheckCircle2, X, Loader2, Clock, MapPin, 
    Users, BookOpen, GraduationCap, LayoutGrid, List,
    ChevronDown, Folder, Check, Send
} from "lucide-react";
import { managementApi } from "../../../../lib/api/managementApi";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import Spinner from "../../../../components/Spinner";

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const PAIRS = [
    { id: 1, time: "09:00 - 10:20" }, { id: 2, time: "10:30 - 11:50" },
    { id: 3, time: "12:00 - 13:20" }, { id: 4, time: "13:30 - 14:50" },
    { id: 5, time: "15:00 - 16:20" }, { id: 6, time: "16:30 - 17:50" }
];

// --- HAKIQIY ANIMATSION CUSTOM SELECT KOMPONENTI ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold border transition-all duration-200 select-none outline-none
                ${disabled 
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/30'
                }
                ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
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
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 font-bold text-center">Ma'lumot topilmadi</p>
                        ) : (
                            options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-bold transition-all mb-1 last:mb-0
                                        ${value === opt.value 
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                        }
                                    `}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
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

export default function AdminSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [groups, setGroups] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid");
    const [toast, setToast] = useState(null);

    const [selectedDept, setSelectedDept] = useState("all");
    const [activeGroupId, setActiveGroupId] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // --- PENDING NOTIFICATIONS LOGIKASI ---
    const [pendingChanges, setPendingChanges] = useState([]);
    const [isSendingNotifs, setIsSendingNotifs] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('pendingScheduleChanges');
        if (saved) setPendingChanges(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('pendingScheduleChanges', JSON.stringify(pendingChanges));
    }, [pendingChanges]);

    const INITIAL_FORM = { 
        groupId: "", groupName: "", 
        roomId: "", roomName: "",
        teacherId: "", teacherName: "", subject: "",
        day: "Dushanba", pair: 1 
    };
    const [form, setForm] = useState(INITIAL_FORM);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const data = await managementApi.fetchAllData();
                setGroups(data.groups || []);
                setRooms(data.rooms || []);
                setTeachers(data.teachers || []);

                const schedSnap = await getDocs(collection(db, "schedules"));
                const schedData = schedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // XAVFSIZLIK: Sana/obyektlarni tozalash
                const safeSchedules = schedData.map(s => {
                    const cleaned = { ...s };
                    if (cleaned.createdAt) delete cleaned.createdAt;
                    if (cleaned.updatedAt) delete cleaned.updatedAt;
                    return cleaned;
                });
                
                setSchedules(safeSchedules);
            } catch (error) {
                showToast("Ma'lumotlarni yuklashda xato", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const departments = useMemo(() => {
        const depts = new Set(groups.map(g => g.deptName).filter(Boolean));
        return ["all", ...Array.from(depts)];
    }, [groups]);

    const filteredGroups = useMemo(() => {
        if (selectedDept === "all") return groups;
        return groups.filter(g => g.deptName === selectedDept);
    }, [groups, selectedDept]);

    const currentSchedules = useMemo(() => {
        return activeGroupId ? schedules.filter(s => s.groupId === activeGroupId) : [];
    }, [schedules, activeGroupId]);

    // 🌟 XATONI TUZATDIK: .find() ni for...of sikliga o'tkazdik (aniq xato matnini qaytaradi)
    const checkConflicts = (currentForm) => {
        for (let s of schedules) {
            if (editingId && s.id === editingId) continue;
            
            if (s.day === currentForm.day && Number(s.pair) === Number(currentForm.pair)) {
                if (s.teacherId === currentForm.teacherId) return `Ustoz ${s.teacherName} bu vaqtda band!`;
                if (s.roomId === currentForm.roomId) return `${s.roomName}-xona band!`;
                if (s.groupId === currentForm.groupId) return `${s.groupName} guruhi band!`;
            }
        }
        return null; // Ziddiyat yo'q bo'lsa null
    };

    // --- SAQLASH LOGIKASI ---
    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!form.groupId || !form.groupName) return showToast("Guruhni tanlang!", "error");
        if (!form.roomId || !form.roomName) return showToast("Xonani tanlang!", "error");
        if (!form.teacherId || !form.teacherName) return showToast("Ustozni tanlang!", "error");

        const conflict = checkConflicts(form);
        if (conflict) {
            return showToast(conflict, "error"); // Endi bu yerga faqatgina String (Matn) keladi!
        }

        setIsSaving(true);
        try {
            const dataToSave = {
                groupId: form.groupId, groupName: form.groupName,
                roomId: form.roomId, roomName: form.roomName,
                teacherId: form.teacherId, teacherName: form.teacherName,
                subject: form.subject, day: form.day, pair: form.pair
            };

            const changeLog = {
                id: Date.now().toString(),
                ...dataToSave,
                type: editingId ? 'edit' : 'new'
            };

            if (editingId) {
                await updateDoc(doc(db, "schedules", editingId), { ...dataToSave, updatedAt: serverTimestamp() });
                setSchedules(schedules.map(s => s.id === editingId ? { ...dataToSave, id: editingId } : s));
                showToast("Dars yangilandi!");
            } else {
                const docRef = await addDoc(collection(db, "schedules"), { ...dataToSave, createdAt: serverTimestamp() });
                setSchedules([...schedules, { ...dataToSave, id: docRef.id }]);
                showToast("Yangi dars saqlandi!");
            }

            setPendingChanges(prev => [...prev, changeLog]);
            closeModal();
        } catch (error) { 
            console.error(error);
            showToast("Xatolik yuz berdi", "error"); 
        } 
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); 
        if (!window.confirm("Bu darsni butunlay o'chirasizmi?")) return;
        try {
            const deletedSched = schedules.find(s => s.id === id);
            await deleteDoc(doc(db, "schedules", id));
            setSchedules(schedules.filter(s => s.id !== id));
            
            if (deletedSched) {
                setPendingChanges(prev => [...prev, {
                    id: Date.now().toString(),
                    groupId: deletedSched.groupId, groupName: deletedSched.groupName,
                    teacherId: deletedSched.teacherId, teacherName: deletedSched.teacherName,
                    subject: deletedSched.subject, day: deletedSched.day, pair: deletedSched.pair,
                    type: 'delete'
                }]);
            }
            showToast("Dars o'chirildi.");
        } catch (error) { showToast("Xato", "error"); }
    };

    const handlePublishChanges = async () => {
        setIsSendingNotifs(true);
        try {
            for (const change of pendingChanges) {
                const q = query(collection(db, "users"), where("groupId", "==", change.groupId));
                const studentSnap = await getDocs(q);
                const studentIds = studentSnap.docs.map(doc => doc.id);

                const targets = [change.teacherId, ...studentIds].filter(Boolean);
                if (targets.length === 0) continue; 

                let title = "";
                let message = "";

                if (change.type === 'new') {
                    title = "Yangi dars e'lon qilindi";
                    message = `${change.groupName} guruhi uchun ${change.day} kuni ${change.pair}-parada ${change.subject} darsi belgilandi. Xona: ${change.roomName}, Ustoz: ${change.teacherName}.`;
                } else if (change.type === 'edit') {
                    title = "Dars jadvali o'zgardi";
                    message = `${change.groupName} darsi ${change.day} kuni ${change.pair}-paraga ko'chirildi. Yangi xona: ${change.roomName}, Ustoz: ${change.teacherName}.`;
                } else {
                    title = "Dars bekor qilindi";
                    message = `${change.groupName} guruhining ${change.day} kuni ${change.pair}-paradagi ${change.subject} darsi bekor qilindi.`;
                }
                
                await notificationsApi.sendNotification({
                    title: title,
                    message: message,
                    targetRoles: targets,
                    type: 'schedule'
                });
            }
            
            showToast("Barcha o'zgarishlar foydalanuvchilarga jo'natildi!");
            setPendingChanges([]); 
            localStorage.removeItem('pendingScheduleChanges'); 
        } catch (error) {
            console.error(error);
            showToast("Xabarnoma yuborishda xatolik", "error");
        } finally {
            setIsSendingNotifs(false);
        }
    };

    const openAddModal = (day = "Dushanba", pair = 1) => {
        const activeGroup = groups.find(g => g.id === activeGroupId);
        setForm({ 
            ...INITIAL_FORM,
            groupId: activeGroup?.id || "", groupName: activeGroup?.name || "", 
            day, pair 
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (schedule, e) => {
        if(e) e.stopPropagation();
        
        setForm({ 
            groupId: schedule.groupId || "", groupName: schedule.groupName || "",
            roomId: schedule.roomId || "", roomName: schedule.roomName || "",
            teacherId: schedule.teacherId || "", teacherName: schedule.teacherName || "",
            subject: schedule.subject || "", day: schedule.day || "Dushanba", pair: schedule.pair || 1
        }); 
        
        setEditingId(schedule.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm(INITIAL_FORM); 
        setEditingId(null);
    };

    const groupOptions = groups.map(g => ({ value: g.id, label: `${g.name} (${g.majorName || "Noma'lum"})` }));
    const roomOptions = rooms.filter(r => r.status === 'open').map(r => ({ value: r.id, label: `${r.name} (${r.capacity} kishi)` }));
    const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.name} (${t.subject || "Fan biriktirilmagan"})` }));
    const dayOptions = DAYS.map(d => ({ value: d, label: d }));
    const pairOptions = PAIRS.map(p => ({ value: p.id, label: `${p.id}-para (${p.time})` }));

    return (
        <div className="p-4 md:p-8 w-full max-w-[1500px] mx-auto animate-in fade-in duration-500 relative pb-32">
            
            {toast && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-full shadow-2xl font-black text-[11px] uppercase tracking-widest flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-4 w-max max-w-[90vw] ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* --- XABARNOMALARNI YUBORISH TUGMASI --- */}
            {pendingChanges.length > 0 && (
                <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[400] animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <button 
                        disabled={isSendingNotifs}
                        onClick={handlePublishChanges}
                        className="group flex items-center space-x-3 bg-indigo-600 text-white px-5 md:px-6 py-3.5 md:py-4 rounded-full shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all overflow-hidden relative"
                    >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        
                        <div className="bg-white/20 p-2 rounded-full relative">
                            {isSendingNotifs ? <Spinner className="w-4 h-4 text-inherit" /> : <Send className="w-4 h-4" />}
                            {!isSendingNotifs && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-indigo-600 animate-ping"></span>
                            )}
                        </div>
                        <div className="text-left flex flex-col">
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none mb-0.5">O'zgarishlarni Yuborish</span>
                            <span className="text-[9px] text-indigo-200 font-bold tracking-wider leading-none">{pendingChanges.length} ta xabarnoma kutmoqda</span>
                        </div>
                    </button>
                </div>
            )}

            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Dars Jadvali</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <LayoutGrid className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Barcha kurslar va auditoriyalar nazorati
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-1.5 w-full sm:w-auto shadow-sm">
                        <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none p-3 px-5 rounded-xl transition-all flex items-center justify-center text-xs font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <CalendarDays className="w-4 h-4 mr-2" /> Matritsa
                        </button>
                        <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none p-3 px-5 rounded-xl transition-all flex items-center justify-center text-xs font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <List className="w-4 h-4 mr-2" /> Ro'yxat
                        </button>
                    </div>

                    <button onClick={() => openAddModal()} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Yangi Dars</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="flex flex-col gap-6">
                    <Card className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 flex flex-col gap-5">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => { setSelectedDept(dept); setActiveGroupId(""); }} 
                                    className={`px-5 py-2.5 rounded-[14px] text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center ${
                                        selectedDept === dept 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <Folder className={`w-3 h-3 mr-2 ${selectedDept === dept ? 'text-white' : 'text-amber-500'}`} />
                                    {dept === 'all' ? 'Barcha Fakultetlar' : dept}
                                </button>
                            ))}
                        </div>

                        {filteredGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {filteredGroups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setActiveGroupId(g.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            activeGroupId === g.id 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 shadow-sm' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                                        }`}
                                    >
                                        <Users className="w-3 h-3 inline mr-1.5 opacity-50" />
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 p-2">Bu bo'limda guruhlar topilmadi</p>
                        )}
                    </Card>

                    {viewMode === 'grid' && !activeGroupId && (
                        <div className="py-20 text-center bg-indigo-50/50 dark:bg-slate-900/30 rounded-[32px] border border-dashed border-indigo-100 dark:border-white/5">
                            <CalendarDays className="w-14 h-14 text-indigo-300 dark:text-slate-600 mx-auto mb-4" />
                            <h2 className="text-lg font-black text-indigo-900/60 dark:text-slate-400">Matritsani ko'rish uchun yuqoridan aniq bir guruhni tanlang</h2>
                        </div>
                    )}

                    {viewMode === 'grid' && activeGroupId && (
                        <div className="overflow-x-auto pb-6">
                            <div className="min-w-[1100px] bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
                                <div className="grid grid-cols-7 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/5">
                                    <div className="p-5 text-center border-r border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-col items-center justify-center gap-1.5">
                                        <Clock className="w-4 h-4" /> Vaqt
                                    </div>
                                    {DAYS.map(day => <div key={day} className="p-5 text-center border-r border-slate-100 dark:border-white/5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{day}</div>)}
                                </div>
                                
                                {PAIRS.map(pair => (
                                    <div key={pair.id} className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5 last:border-0 group/row">
                                        <div className="p-5 flex flex-col justify-center items-center border-r border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/10">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{pair.id}-para</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">{pair.time}</span>
                                        </div>
                                        
                                        {DAYS.map(day => {
                                            const cellSchedule = currentSchedules.find(s => s.day === day && Number(s.pair) === pair.id);
                                            return (
                                                <div 
                                                    key={`${day}-${pair.id}`} 
                                                    onClick={() => !cellSchedule && openAddModal(day, pair.id)}
                                                    className={`p-3 min-h-[140px] border-r border-slate-100 dark:border-white/5 last:border-0 relative transition-colors group/cell ${cellSchedule ? 'bg-indigo-50/20 dark:bg-indigo-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer'}`}
                                                >
                                                    {cellSchedule ? (
                                                        <div onClick={(e) => openEditModal(cellSchedule, e)} className="h-full bg-white dark:bg-slate-800 border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer relative group/item flex flex-col">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-black tracking-widest flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1 text-rose-400"/> {cellSchedule.roomName}
                                                                </span>
                                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                    <button onClick={(e) => openEditModal(cellSchedule, e)} className="text-slate-400 hover:text-indigo-500 p-1"><Edit3 className="w-3.5 h-3.5"/></button>
                                                                    <button onClick={(e) => handleDelete(cellSchedule.id, e)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2">{cellSchedule.subject}</h4>
                                                            <p className="text-[10px] font-bold text-slate-500 flex items-center mt-auto line-clamp-1">
                                                                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0"/> {cellSchedule.teacherName}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity scale-90 group-hover/cell:scale-100">
                                                            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-500/20"><Plus className="w-5 h-5"/></div>
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

                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4">
                            {currentSchedules.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white/40 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
                                    <List className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bu guruhda darslar yo'q</p>
                                </div>
                            ) : (
                                currentSchedules.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.pair - b.pair).map(s => {
                                    const pairInfo = PAIRS.find(p => p.id === Number(s.pair));
                                    return (
                                        <Card key={s.id} className="p-6 flex flex-col group border border-slate-100 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all bg-white dark:bg-slate-900">
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> {s.day}, {s.pair}-para
                                                </div>
                                                <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(s)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={(e) => handleDelete(s.id, e)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:text-rose-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-5 line-clamp-2 leading-tight">{s.subject}</h3>
                                            
                                            <div className="mt-auto space-y-2">
                                                <div className="flex items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                                    <GraduationCap className="w-4 h-4 mr-2 text-emerald-500 shrink-0" /> <span className="truncate">{s.teacherName}</span>
                                                </div>
                                                <div className="flex items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                                    <MapPin className="w-4 h-4 mr-2 text-rose-500 shrink-0" /> {s.roomName} - auditoriya
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isSaving && closeModal()}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        
                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{editingId ? "Tahrirlash" : "Yangi Dars"}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Avtomatlashtirilgan Form</p>
                            </div>
                            <button disabled={isSaving} onClick={closeModal} className="p-2.5 bg-white dark:bg-slate-800 shadow-sm rounded-full text-slate-400 hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
                            <form id="schedule-form" onSubmit={handleSave} className="space-y-6">
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qaysi Guruhga?</label>
                                        <CustomSelect 
                                            icon={Users} placeholder="Guruhni tanlang" options={groupOptions} value={form.groupId} 
                                            onChange={(val) => {
                                                const g = groups.find(x => x.id === val);
                                                if (g) setForm(prev => ({...prev, groupId: g.id, groupName: g.name}));
                                            }} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qaysi Xonada?</label>
                                        <CustomSelect 
                                            icon={MapPin} placeholder="Auditoriyani tanlang" options={roomOptions} value={form.roomId} 
                                            onChange={(val) => {
                                                const r = rooms.find(x => x.id === val);
                                                if (r) setForm(prev => ({...prev, roomId: r.id, roomName: r.name}));
                                            }} 
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-white/5" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kuni</label>
                                        <CustomSelect icon={CalendarDays} placeholder="Kun" options={dayOptions} value={form.day} onChange={(val) => setForm(prev => ({...prev, day: val}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Para (Vaqt)</label>
                                        <CustomSelect icon={Clock} placeholder="Para" options={pairOptions} value={form.pair} onChange={(val) => setForm(prev => ({...prev, pair: val}))} />
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-white/5" />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O'qituvchi</label>
                                        <CustomSelect 
                                            icon={GraduationCap} placeholder="O'qituvchini tanlang" options={teacherOptions} value={form.teacherId} 
                                            onChange={(val) => {
                                                const t = teachers.find(x => x.id === val);
                                                if (t) setForm(prev => ({...prev, teacherId: t.id, teacherName: t.name, subject: t.subject || "Fan biriktirilmagan"}));
                                            }} 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                            <span>Biriktirilgan Fani</span>
                                            <span className="text-emerald-500 font-bold tracking-normal normal-case">Avtomatik</span>
                                        </label>
                                        <div className="w-full pl-11 pr-4 py-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-500 border border-transparent relative">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            {form.subject || "Ustoz tanlanmagan"}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 md:p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 shrink-0">
                            <button form="schedule-form" type="submit" disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isSaving ? <Spinner className="w-5 h-5 animate-spin" /> : (editingId ? "Saqlash va Navbatga qo'shish" : "Saqlash va Navbatga qo'shish")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
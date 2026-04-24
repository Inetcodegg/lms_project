"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Users, Search, Loader2, Filter, ChevronDown, Check
} from "lucide-react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Spinner from "../../../../components/Spinner";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80&auto=format&fit=crop";

// --- 🌟 MUKAMMAL ANIMATSIYALI CUSTOM SELECT ---
const CustomSelect = ({ value, onChange, options = [], placeholder }) => {
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
        <div className="relative w-full sm:w-64 shrink-0 z-[100]" ref={dropdownRef}>
            <button 
                type="button" onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between pl-11 pr-4 py-3.5 rounded-2xl text-xs font-bold border transition-all duration-200 outline-none shadow-sm
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-300'}
                `}
            >
                <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="truncate">{selectedOption.label || placeholder}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl py-1.5 animate-in fade-in slide-in-from-top-2 z-[999]">
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

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState("all");

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;

                if (!user) {
                    setLoading(false);
                    return;
                }

                // 1. O'qituvchiga tegishli barcha GURUHLARNI olish
                const groupsQ = query(collection(db, "groups")); // Agar filtr kerak bo'lsa: where("teacherId", "==", user.uid)
                const groupsSnap = await getDocs(groupsQ);
                const groupsData = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setGroups(groupsData);

                const groupIds = groupsData.map(g => g.id);

                if (groupIds.length > 0) {
                    // 2. Guruhga tegishli talabalarni tortish
                    let allStudents = [];
                    const chunks = [];
                    for (let i = 0; i < groupIds.length; i += 10) {
                        chunks.push(groupIds.slice(i, i + 10));
                    }

                    for (const chunk of chunks) {
                        const studentsQ = query(
                            collection(db, "users"),
                            where("role", "==", "student"),
                            where("groupId", "in", chunk)
                        );
                        const snap = await getDocs(studentsQ);
                        allStudents = [...allStudents, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
                    }
                    
                    allStudents.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                    setStudents(allStudents);
                } else {
                    setStudents([]);
                }

            } catch (err) {
                console.error("Xato:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, []);

    // Filter Logic
    const filteredStudents = students.filter(s => {
        const fullName = (s.name || s.fullName || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = fullName.includes(search);
        const matchesGroup = selectedGroupId === "all" || s.groupId === selectedGroupId;

        return matchesSearch && matchesGroup;
    });

    // Format options for CustomSelect
    const groupOptions = [
        { value: 'all', label: 'Barcha Guruhlar' },
        ...groups.map(g => ({ value: g.id, label: g.name }))
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-32">
            
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" /> Talabalar Ro'yxati
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Mening guruhlarimdagi barcha o'quvchilar
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ism bo'yicha qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                        />
                    </div>
                    
                    {/* 🌟 YANGI CUSTOM SELECT FILTRI */}
                    <CustomSelect 
                        options={groupOptions}
                        value={selectedGroupId}
                        onChange={setSelectedGroupId}
                        placeholder="Guruhni tanlang"
                    />
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Spinner className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="py-24 text-center bg-white/40 dark:bg-slate-900/40 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                    <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Talabalar topilmadi
                    </p>
                </div>
            ) : (
                /* TOZALANGAN UZUN JADVAL DIZAYNI */
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-6 relative z-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">№</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Talaba Ismi va ID</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">O'qiydigan Guruhi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {filteredStudents.map((student, index) => {
                                    const studentGroup = groups.find(g => g.id === student.groupId);
                                    
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5 text-center border-r border-slate-50 dark:border-slate-800/50">
                                                <span className="text-xs font-black text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-5">
                                                    <img 
                                                        src={student.avatar || FALLBACK_AVATAR} 
                                                        onError={(e) => {e.target.onerror = null; e.target.src = FALLBACK_AVATAR}}
                                                        alt="Avatar" 
                                                        className="w-12 h-12 rounded-[14px] object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                                            {student.name || student.fullName || "Noma'lum"}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            ID: {student.id.substring(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-5 text-right">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                    {studentGroup?.name || "Guruhsiz"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
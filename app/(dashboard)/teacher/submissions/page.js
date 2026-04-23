"use client";
import React, { useState, useEffect } from "react";
import { Inbox, Clock, ExternalLink, User, CheckCircle2, Loader2, Search } from "lucide-react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAllSubmissions = async () => {
            try {
                // O'qituvchiga tegishli barcha topshiriqlar bo'yicha kelgan javoblar
                const q = query(
                    collection(db, "submissions"),
                    where("teacherId", "==", auth.currentUser?.uid),
                    orderBy("submittedAt", "desc")
                );
                const snap = await getDocs(q);
                setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Xatolik:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllSubmissions();
    }, []);

    const filtered = submissions.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.taskTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic">Kelib tushgan ishlar</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Barcha guruhlar bo'yicha topshiriqlar feedi</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold outline-none"
                    />
                </div>
            </header>

            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div> : (
                <div className="space-y-3">
                    {filtered.map((sub) => (
                        <div key={sub.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-indigo-500/50 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500 font-black">
                                    {sub.studentName?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{sub.studentName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{sub.taskTitle}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="flex flex-col items-end">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {sub.status === 'graded' ? 'Baholangan' : 'Kutilmoqda'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock size={10} /> {sub.submittedAt?.toDate().toLocaleTimeString()}
                                    </span>
                                </div>
                                <a href={sub.fileUrl} target="_blank" className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
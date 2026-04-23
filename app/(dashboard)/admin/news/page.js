"use client";
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { 
    Newspaper, Plus, Trash2, Edit, Search, Sparkles, Send, 
    X, Loader2, Megaphone, Users, GraduationCap, Globe, 
    AlertCircle, CheckCircle2, Calendar, Eye, Image as ImageIcon
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useUser } from "../../../../lib/UserContext";

const CATEGORIES = ["Umumiy", "E'lon", "Tadbir", "Imtihon", "Muhim"];
const TARGETS = [
    { id: "all", label: "Hamma uchun", icon: Globe, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "students", label: "Faqat Talabalar", icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "teachers", label: "Faqat O'qituvchilar", icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-50" }
];

export default function AdminNewsPage() {
    const { user } = useUser();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        title: "", content: "", category: "Umumiy", 
        targetAudience: "all", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80" 
    });

    // AI States
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Ma'lumotlarni yuklash
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { showToast("Yangiliklarni yuklashda xato", "error"); }
            finally { setLoading(false); }
        };
        fetchNews();
    }, []);

    // 2. AI orqali matn tayyorlash
    const handleAiDraft = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await fetch("/api/ai/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt })
            });
            const data = await res.json();
            if (data && !data.error) {
                setForm({ ...form, title: data.title, content: data.content, category: data.category, targetAudience: data.targetAudience });
                setAiPrompt("");
                showToast("AI yangilikni tayyorladi!");
            }
        } catch (err) { showToast("AI bilan bog'lanishda xato", "error"); }
        finally { setIsAiLoading(false); }
    };

    // 3. Saqlash
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { 
                ...form, 
                authorName: user?.name || "Admin",
                updatedAt: serverTimestamp() 
            };

            if (editingId) {
                await updateDoc(doc(db, "news", editingId), payload);
                setNews(news.map(n => n.id === editingId ? { ...payload, id: editingId } : n));
                showToast("Yangilik yangilandi");
            } else {
                const res = await addDoc(collection(db, "news"), { ...payload, createdAt: serverTimestamp() });
                setNews([{ ...payload, id: res.id, createdAt: { toDate: () => new Date() } }, ...news]);
                showToast("Yangilik chop etildi");
            }
            setIsModalOpen(false);
        } catch (err) { showToast("Xatolik yuz berdi", "error"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Ushbu yangilikni o'chirmoqchimisiz?")) return;
        try {
            await deleteDoc(doc(db, "news", id));
            setNews(news.filter(n => n.id !== id));
            showToast("Yangilik o'chirildi");
        } catch (err) { showToast("Xatolik", "error"); }
    };

    return (
        <div className="p-4 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-6 right-6 z-[300] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Yangiliklar & E'lonlar</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <Megaphone className="w-4 h-4 mr-2 text-indigo-500" /> Barcha platforma a'zolari uchun bildirishnomalar
                    </p>
                </div>
                <button onClick={() => { setEditingId(null); setForm({ title: "", content: "", category: "Umumiy", targetAudience: "all", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80" }); setIsModalOpen(true); }} className="flex items-center space-x-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase tracking-widest">
                    <Plus className="w-4 h-4" />
                    <span>Yangi Yangilik</span>
                </button>
            </header>

            {/* AI QUICK GENERATOR BAR */}
            <div className="mb-10 p-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-[28px] shadow-lg">
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-4 flex flex-col md:flex-row items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="AI yordamida yangilik yozish (masalan: Ertaga futbol turniri bo'lishi haqida e'lon)..." 
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold dark:text-white placeholder-slate-400"
                    />
                    <button 
                        onClick={handleAiDraft}
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className="w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Matn yaratish</>}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => {
                        const target = TARGETS.find(t => t.id === item.targetAudience);
                        const TargetIcon = target?.icon || Globe;
                        return (
                            <Card key={item.id} className="p-0 overflow-hidden group flex flex-col h-full border border-slate-100 dark:border-white/5 hover:shadow-2xl transition-all duration-500">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm rounded-lg text-[10px] font-black uppercase text-indigo-600">{item.category}</span>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`p-2 rounded-lg ${target?.bg} ${target?.color}`}>
                                            <TargetIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${target?.color}`}>{target?.label}</span>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 font-medium leading-relaxed">{item.content}</p>
                                    
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {item.createdAt?.toDate().toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingId(item.id); setForm(item); setIsModalOpen(true); }} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-8 lg:p-12 border border-white/20 overflow-y-auto max-h-[90dvh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingId ? "Yangilikni tahrirlash" : "Yangi yangilik"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategoriya</label>
                                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kimlar ko'radi?</label>
                                    <select value={form.targetAudience} onChange={e => setForm({...form, targetAudience: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none">
                                        {TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sarlavha</label>
                                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500/20" placeholder="Yangilik sarlavhasini kiriting..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rasm manzili (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full pl-11 pr-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yangilik matni</label>
                                <textarea required rows="6" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none border-2 border-transparent focus:border-indigo-500/20 resize-none" placeholder="Yangilik tafsilotlarini yozing..."></textarea>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Yangilash" : "Chop etish"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
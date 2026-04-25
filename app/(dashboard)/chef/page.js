"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit2, X, ChevronDown } from "lucide-react";
import { cafeteriaApi } from "../../../lib/api/cafeteriaApi";

export default function ChefPage() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", price: "", category: "Asosiy", desc: "" });

    const categories = ["Asosiy", "Suyuq", "Xamirli", "Desert", "Ichimlik"];

    const loadData = async () => {
        const data = await cafeteriaApi.getMenu();
        setMenu(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await cafeteriaApi.updateDish(editingId, { ...form, price: Number(form.price) });
                setEditingId(null);
            } else {
                await cafeteriaApi.addDish({ ...form, isAvailable: true, isSpecial: false });
            }
            setForm({ name: "", price: "", category: "Asosiy", desc: "" });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setForm({ name: item.name, price: item.price, category: item.category || "Asosiy", desc: item.desc || "" });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: "", price: "", category: "Asosiy", desc: "" });
    };

    const handleToggle = async (id, field, currentValue) => {
        await cafeteriaApi.updateDish(id, { [field]: !currentValue });
        loadData();
    };

    const handleCleanup = async () => {
        if (!confirm("Takrorlangan taomlarni o'chirib, har biridan bittadan qoldirmoqchimisiz?")) return;
        setLoading(true);
        try {
            const seen = new Set();
            for (const item of menu) {
                if (seen.has(item.name.toLowerCase())) {
                    await cafeteriaApi.deleteDish(item.id);
                } else {
                    seen.add(item.name.toLowerCase());
                }
            }
            await loadData();
            alert("Tozalash yakunlandi!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 flex-1 text-slate-900 dark:text-white transition-colors duration-500">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-black italic uppercase border-l-8 border-orange-600 pl-6 tracking-tighter">Chef Terminal</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleCleanup}
                            className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/30 px-6 py-3 rounded-2xl bg-white dark:bg-transparent hover:bg-orange-50 dark:hover:bg-orange-500 hover:text-orange-700 dark:hover:text-white transition-all shadow-sm"
                        >
                            Takrorlarni o'chirish
                        </button>
                        <button
                            onClick={async () => { if (confirm("Barcha ovqatlarni o'chirmoqchimisiz?")) { for (let item of menu) await cafeteriaApi.deleteDish(item.id); loadData(); } }}
                            className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/30 px-6 py-3 rounded-2xl bg-white dark:bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500 hover:text-rose-700 dark:hover:text-white transition-all shadow-sm"
                        >
                            Hammasini o'chirish
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Forma qismi */}
                    <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white dark:bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[40px] border border-slate-200 dark:border-white/5 space-y-8 h-fit sticky top-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
                                {editingId ? "Taomni tahrirlash" : "Yangi taom qo'shish"}
                            </h2>
                            {editingId && (
                                <button type="button" onClick={cancelEdit} className="text-rose-500 hover:rotate-90 transition-transform">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nomi</label>
                                <input
                                    type="text" placeholder="MASALAN: OSH" required
                                    className="w-full p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 ring-orange-500/50 text-sm font-bold text-slate-900 dark:text-white transition-all uppercase"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Narxi (UZS)</label>
                                <input
                                    type="number" placeholder="0" required
                                    className="w-full p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 ring-orange-500/50 text-sm font-bold text-slate-900 dark:text-white transition-all"
                                    value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Kategoriya</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat} type="button"
                                            onClick={() => setForm({ ...form, category: cat })}
                                            className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${form.category === cat
                                                ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/40 scale-[1.02]"
                                                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:border-orange-500/30"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tavsif</label>
                                <textarea
                                    placeholder="TAOM HAQIDA QISQACHA..."
                                    className="w-full p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 outline-none focus:ring-2 ring-orange-500/50 text-sm font-bold text-slate-900 dark:text-white transition-all h-28 resize-none"
                                    value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${editingId
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/30"
                                : "bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-500/30"
                                }`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Yangilash" : "Menyuga Qo'shish")}
                        </button>
                    </form>

                    {/* Jadval qismi */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
                                    <tr>
                                        <th className="p-8">Ma'lumot</th>
                                        <th className="p-8">Holat</th>
                                        <th className="p-8 text-right">Boshqaruv</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-900 dark:text-white">
                                    {menu.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors">
                                            <td className="p-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-[20px] bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-xl shadow-inner uppercase">
                                                        {item.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-black uppercase tracking-tight mb-1">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.1em] flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5">{item.category}</span>
                                                            <span className="text-orange-500 font-black">{item.price?.toLocaleString()} UZS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleToggle(item.id, 'isAvailable', item.isAvailable ?? true)}
                                                        className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase transition-all border-2 border-transparent ${(item.isAvailable ?? true)
                                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                                                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                                            }`}
                                                    >
                                                        {(item.isAvailable ?? true) ? "Qoldi" : "Tugadi"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggle(item.id, 'isSpecial', item.isSpecial ?? false)}
                                                        className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase transition-all border-2 border-transparent ${item.isSpecial
                                                            ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20"
                                                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                                            }`}
                                                    >
                                                        Special
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => startEdit(item)} className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl transition-all">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={async () => { if (confirm("O'chirilsinmi?")) { await cafeteriaApi.deleteDish(item.id); loadData(); } }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {menu.length === 0 && !loading && (
                            <div className="p-32 text-center">
                                <div className="inline-flex p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] mb-4">
                                    <Plus className="text-slate-300 dark:text-slate-800" size={32} />
                                </div>
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Hozircha menyu bo'sh</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

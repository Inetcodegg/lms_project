"use client";
import React, { useState, useEffect } from "react";
import {
    FolderOpen, File, Download, Upload,
    MoreVertical, Trash2, Search, Plus,
    X, Loader2, Book, FileText, Video
} from "lucide-react";
import Card from "../../../../components/Card";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";

const FILE_ICONS = {
    pdf: FileText,
    doc: File,
    docx: File,
    video: Video,
    other: File
};

export default function ResourcesPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newResource, setNewResource] = useState({ title: "", description: "", type: "pdf", url: "" });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) return;

                const q = query(collection(db, "resources"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchResources();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const user = auth.currentUser;
            const data = {
                ...newResource,
                teacherId: user.uid,
                uploadedAt: serverTimestamp(),
                size: "1.2 MB" // Mock size
            };
            const docRef = await addDoc(collection(db, "resources"), data);
            setResources([{ id: docRef.id, ...data, uploadedAt: { toDate: () => new Date() } }, ...resources]);
            setShowUploadModal(false);
            setNewResource({ title: "", description: "", type: "pdf", url: "" });
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("O'chirilsinmi?")) return;
        try {
            await deleteDoc(doc(db, "resources", id));
            setResources(resources.filter(r => r.id !== id));
        } catch (err) { alert("Xato"); }
    };

    const filtered = resources.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Resurslar markazi</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">O'quv materiallari va qo'llanmalar kutubxonasi</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Yuklash
                    </button>
                </div>
            </header>

            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map((res) => {
                        const Icon = FILE_ICONS[res.type] || FILE_ICONS.other;
                        return (
                            <Card key={res.id} className="p-5 border-slate-100 dark:border-white/5 group hover:border-emerald-500/50 transition-all flex flex-col items-center text-center">
                                <div className="absolute top-2 right-2">
                                    <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                                    <Icon size={32} />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase line-clamp-1 mb-1">{res.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">{res.size || "-- MB"} • {res.type}</p>

                                <button className="w-full py-2.5 bg-slate-900 dark:bg-white dark:text-black text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                    <Download size={14} /> Ko'rish
                                </button>
                            </Card>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <FolderOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Resurslar mavjud emas</p>
                        </div>
                    )}
                </div>
            )}

            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-8 border border-white/20">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Resurs yuklash</h2>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpload} className="space-y-6">
                            <input required type="text" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none" placeholder="Fayl nomi" />
                            <input required type="url" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none" placeholder="Fayl URL (Google Drive yoki b.)" />
                            <div className="grid grid-cols-2 gap-4">
                                <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none" value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}>
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="docx">Docx</option>
                                    <option value="other">Boshqa</option>
                                </select>
                            </div>
                            <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                                {saving ? <Loader2 className="animate-spin" /> : <Upload size={20} />} Saqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

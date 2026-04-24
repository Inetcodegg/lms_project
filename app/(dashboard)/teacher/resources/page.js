"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    FolderOpen, File, Download, Upload,
    Trash2, Search, Plus, X, Loader2, 
    Book, FileText, Video, AlertCircle, HardDrive, Image as ImageIcon
} from "lucide-react";
import Card from "../../../../components/Card";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import Spinner from "../../../../components/Spinner";

// Fayl formatiga mos ikonkalarni tanlash
const FILE_ICONS = {
    pdf: FileText,
    doc: File,
    docx: File,
    mp4: Video,
    avi: Video,
    mkv: Video,
    jpg: ImageIcon,
    jpeg: ImageIcon,
    png: ImageIcon,
    other: File
};

const MAX_STORAGE_BYTES = 200 * 1024 * 1024; // 200 MB

export default function ResourcesPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Upload Modal States
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [resourceTitle, setResourceTitle] = useState("");
    const [saving, setSaving] = useState(false);
    
    // Storage Quota States
    const [usedStorage, setUsedStorage] = useState(0);
    const fileInputRef = useRef(null);

    // Bazadan resurslarni va ularning jami hajmini hisoblash
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) return;

                const q = query(collection(db, "resources"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                
                let totalBytes = 0;
                const fetchedData = snap.docs.map(d => {
                    const data = d.data();
                    totalBytes += (data.sizeInBytes || 0);
                    return { id: d.id, ...data };
                });

                // Sanaga qarab saralash (eng yangisi birinchi)
                fetchedData.sort((a, b) => {
                    const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(0);
                    const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(0);
                    return dateB - dateA;
                });

                setResources(fetchedData);
                setUsedStorage(totalBytes);

            } catch (err) {
                console.error("Xatolik:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    // Faylni tanlash va Limitni tekshirish
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (usedStorage + file.size > MAX_STORAGE_BYTES) {
            alert(`Xatolik! Ushbu fayl yuklansa sizning 200MB limitdan oshib ketadi.`);
            e.target.value = ""; // Inputni tozalash
            return;
        }

        setSelectedFile(file);
        if (!resourceTitle) {
            setResourceTitle(file.name.split('.').slice(0, -1).join('.')); // Fayl nomini avtomat qoyish
        }
    };

    // Faylni bazaga saqlash
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !resourceTitle.trim()) {
            alert("Fayl va nomini kiritish shart!");
            return;
        }

        setSaving(true);
        try {
            const user = auth.currentUser;
            
            // 1. Faylni Backend (Mongo yoki Cloud) ga yuklash
            const formData = new FormData();
            formData.append("file", selectedFile);
            
            // Dasturingizdagi mavjud Upload API ni ishlatish
            const uploadRes = await fetch("/api/upload-mongo", { 
                method: "POST", 
                body: formData 
            });
            const uploadedData = await uploadRes.json();
            
            if (!uploadRes.ok) throw new Error(uploadedData.error || "Fayl yuklanmadi");
            const fileUrl = uploadedData.fileUrl;

            // 2. Fayl ma'lumotlarini ajratib olish
            const ext = selectedFile.name.split('.').pop().toLowerCase();
            const sizeInBytes = selectedFile.size;
            
            // 3. Firestore ga ma'lumotni yozish
            const newDocData = {
                title: resourceTitle.trim(),
                originalName: selectedFile.name,
                url: fileUrl,
                type: ext,
                sizeInBytes: sizeInBytes,
                teacherId: user.uid,
                uploadedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "resources"), newDocData);
            
            // 4. Local State larni yangilash
            setResources([{ id: docRef.id, ...newDocData, uploadedAt: { toDate: () => new Date() } }, ...resources]);
            setUsedStorage(prev => prev + sizeInBytes);
            
            // Modalni yopish va tozalash
            setShowUploadModal(false);
            setSelectedFile(null);
            setResourceTitle("");

        } catch (err) { 
            alert("Xatolik yuz berdi: " + err.message); 
        } finally { 
            setSaving(false); 
        }
    };

    const handleDelete = async (id, sizeInBytes) => {
        if (!confirm("Haqiqatan ham o'chirilsinmi?")) return;
        try {
            await deleteDoc(doc(db, "resources", id));
            setResources(resources.filter(r => r.id !== id));
            setUsedStorage(prev => Math.max(0, prev - (sizeInBytes || 0)));
        } catch (err) { 
            alert("O'chirishda xatolik yuz berdi!"); 
        }
    };

    // Helper functions
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 MB';
        const k = 1024 * 1024; // MB
        return (bytes / k).toFixed(1) + ' MB';
    };

    const storagePercent = Math.min(100, (usedStorage / MAX_STORAGE_BYTES) * 100);

    const filtered = resources.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
            
            {/* --- HEADER VA QUOTA --- */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3 flex items-center gap-3">
                        <FolderOpen className="w-8 h-8 text-indigo-500" /> Resurslar Markazi
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        O'quv materiallari va qo'llanmalar kutubxonasi
                    </p>
                </div>

                {/* 🌟 200MB KVOTA PROGRESS BAR */}
                <div className="w-full xl:w-72 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <HardDrive className="w-3.5 h-3.5" /> Xotira holati
                        </div>
                        <span className={`text-[11px] font-black ${storagePercent > 90 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {formatBytes(usedStorage)} / 200 MB
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${storagePercent > 90 ? 'bg-rose-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{ width: `${storagePercent}%` }}
                        ></div>
                    </div>
                </div>
            </header>

            {/* --- QIDIRUV VA YUKLASH TUGMASI --- */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Fayl nomi bo'yicha qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    disabled={storagePercent >= 100}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                    <Plus size={16} /> Yangi Fayl Yuklash
                </button>
            </div>

            {/* --- RO'YXAT --- */}
            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="animate-spin w-10 h-10 text-indigo-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-white/60 dark:bg-slate-900/40 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                    <FolderOpen className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Resurslar mavjud emas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {filtered.map((res) => {
                        const Icon = FILE_ICONS[res.type] || FILE_ICONS.other;
                        return (
                            <Card key={res.id} className="p-5 border-slate-100 dark:border-white/5 group hover:border-indigo-300 hover:shadow-xl transition-all flex flex-col items-center text-center relative bg-white/80 dark:bg-slate-900/80">
                                
                                {/* Delete Button */}
                                <div className="absolute top-3 right-3">
                                    <button onClick={() => handleDelete(res.id, res.sizeInBytes)} className="p-2 bg-white/80 dark:bg-slate-800 text-slate-300 hover:text-rose-500 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[18px] flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                                    <Icon size={28} />
                                </div>
                                
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase line-clamp-2 mb-1 w-full" title={res.title}>{res.title}</h3>
                                
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                                    {formatBytes(res.sizeInBytes || 0)} • {res.type}
                                </p>

                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                                    <Download size={14} /> OCHISH
                                </a>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* --- UPLOAD MODAL --- */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => !saving && setShowUploadModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">YANGI FAYL YUKLASH</h2>
                            <button onClick={() => setShowUploadModal(false)} disabled={saving} className="p-2 bg-slate-100 dark:bg-slate-800 hover:text-rose-500 rounded-full transition-colors disabled:opacity-50"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-5">
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fayl nomini kiriting</label>
                                <input 
                                    required type="text" 
                                    value={resourceTitle} 
                                    onChange={(e) => setResourceTitle(e.target.value)} 
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                    placeholder="Masalan: 1-Mavzu taqdimoti" 
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Faylni tanlang</label>
                                <div 
                                    onClick={() => !saving && fileInputRef.current?.click()} 
                                    className={`border-2 border-dashed rounded-[20px] p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]
                                        ${selectedFile ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-400'}
                                    `}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" disabled={saving} />
                                    
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center animate-in zoom-in">
                                            <FileText className="w-8 h-8 text-indigo-500 mb-2" />
                                            <p className="text-xs font-black text-slate-800 dark:text-white mb-1 line-clamp-1 px-2">{selectedFile.name}</p>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{formatBytes(selectedFile.size)}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 shadow-sm rounded-full flex items-center justify-center text-slate-400 mb-3"><Upload size={20} /></div>
                                            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Faylni shu yerga yuklang</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {storagePercent > 90 && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Xotirangiz to'lmoqda. Keraksiz fayllarni o'chiring.</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={saving || !selectedFile} 
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors active:scale-95 shadow-xl shadow-indigo-500/20"
                            >
                                {saving ? <Spinner className="w-5 h-5 animate-spin" /> : <><Upload size={16} /> Saqlash</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
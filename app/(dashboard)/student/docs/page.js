"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    FileText, CreditCard, UploadCloud, FileCheck2,
    Calendar, Loader2, AlertCircle, CheckCircle2,
    Search, ExternalLink, Send, FileWarning, Clock, User
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";


// Yordamchi UI elementlar
const STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
};

const STATUS_LABELS = {
    pending: "Kutilmoqda",
    approved: "Qabul Qilindi",
    rejected: "Rad Etildi"
};

export default function MyDocumentsPage() {
    const { user } = useUser();
    const [filter, setFilter] = useState("all"); // 'all' | 'info' | 'request' | 'financial'
    
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Javob berish Formasi/Modali (Fayl Yuklash uchun)
    const [activeDoc, setActiveDoc] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        if (!user?.uid) return;

        const fetchMyDocuments = async () => {
            try {
                setLoading(true);
                const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                
                // Faqat Menga aloqador bo'lgan hujjatlarni filtrlash
                const myDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(doc => {
                    const targets = doc.audienceType;
                    const val = doc.targetValue;

                    if (targets === 'all') return true;
                    if (targets === 'role' && val === user.role) return true;
                    if (targets === 'group' && val === user.groupId) return true;
                    if (targets === 'faculty' && val === user.deptId) return true;
                    if (targets === 'individual' && val === user.uid) return true;

                    return false;
                });

                setDocuments(myDocs);
            } catch (err) {
                console.error(err);
                showToast("Hujjatlarni yuklashda xatolik", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchMyDocuments();
    }, [user]);


    // Filtrni qo'llash
    const filteredDocs = useMemo(() => {
        if (filter === "all") return documents;
        return documents.filter(d => d.type === filter);
    }, [documents, filter]);


    // Fayl tanlash logikasi
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return showToast("Fayl hajmi 10MB dan oshmasligi kerak", "error");
            setUploadFile(file);
        }
    };


    // Talaba hujjat yuklaganda/javob jo'natganda
    const handleSubmitResponse = async (e) => {
        e.preventDefault();
        if (!activeDoc || !uploadFile) return showToast("Iltimos, fayl biriktiring", "error");

        setIsSubmitting(true);
        try {
            // Aslida bu yerda Fayl (PDF/Image) Storagega yuklanadi.
            // Biz hozircha uni Mock qilib olyapmiz.
            const fakeFileUrl = `https://mock-storage.uz/uploads/${user.uid}/${uploadFile.name}`;

            const newResponse = {
                userId: user.uid,
                userName: user.name || "Foydalanuvchi",
                fileUrl: fakeFileUrl,
                fileName: uploadFile.name,
                status: 'pending', // Yuborilganda kutilmoqda bo'ladi
                submittedAt: new Date().toISOString()
            };

            const docRef = doc(db, "documents", activeDoc.id);
            
            // Avval javob bergan bo'lsa uni olib tashlab, yangisini qo'shamiz (Update)
            const otherResponses = (activeDoc.responses || []).filter(r => r.userId !== user.uid);
            const updatedResponses = [...otherResponses, newResponse];

            await updateDoc(docRef, { responses: updatedResponses });

            // Mahalliy (Local) state ni yangilash
            setDocuments(documents.map(d => d.id === activeDoc.id ? { ...d, responses: updatedResponses } : d));
            
            showToast("Arizangiz muvaffaqiyatli yuborildi!");
            setActiveDoc(null);
            setUploadFile(null);
            
        } catch (error) {
            showToast("Xatolik yuz berdi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };


    const getIcon = (type) => {
        if (type === 'financial') return <CreditCard className="w-5 h-5 text-rose-500" />;
        if (type === 'request') return <UploadCloud className="w-5 h-5 text-emerald-500" />;
        return <FileText className="w-5 h-5 text-indigo-500" />;
    };

    const getBgColor = (type) => {
        if (type === 'financial') return 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
        if (type === 'request') return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
        return 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20';
    };


    return (
        <div className="p-4 lg:p-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-32 relative">
            
            {toast && (
                <div className={`fixed top-6 right-6 z-[900] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Hujjatlar & So'rovlar</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center">
                        <FileCheck2 className="w-4 h-4 mr-2 text-indigo-500" /> Sizga yuborilgan rasmiy hujjatlar va moliyaviy arizalar
                    </p>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex flex-nowrap items-center gap-2 mb-6 md:mb-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 w-full overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'all', label: 'Barchasi', icon: FileCheck2 },
                    { id: 'info', label: 'Ma\'lumotnomalar', icon: FileText }, 
                    { id: 'request', label: 'Fayl So\'rovlari', icon: UploadCloud },
                    { id: 'financial', label: 'Moliyaviy To\'lovlar', icon: CreditCard }
                ].map((tab) => {
                    const active = filter === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id} onClick={() => setFilter(tab.id)}
                            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-slate-900 dark:bg-indigo-600 shadow-md text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            <TabIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${active ? 'opacity-100' : 'opacity-60'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Spinner className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : filteredDocs.length === 0 ? (
                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sizga tegishli hujjatlar topilmadi</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDocs.map((docItem) => {
                        // Userning ushbu hujjatga qaytargan javobini qidiramiz
                        const myResponse = (docItem.responses || []).find(r => r.userId === user?.uid);

                        return (
                            <Card key={docItem.id} className="p-0 flex flex-col h-full overflow-hidden border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md hover:shadow-xl transition-all duration-300 group rounded-[28px]">
                                
                                {/* KARTA TEPASI (Header) */}
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getBgColor(docItem.type)}`}>
                                        {getIcon(docItem.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                            {docItem.type === 'financial' ? "Moliyaviy So'rov" : docItem.type === 'request' ? "Hujjat Talab Qilinadi" : "Rasmiy Ma'lumot"}
                                        </span>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight line-clamp-2">{docItem.title}</h3>
                                    </div>
                                </div>

                                {/* KARTA TANASI (Body) */}
                                <div className="p-5 flex-1 flex flex-col relative">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">{docItem.description}</p>
                                    
                                    {/* Agar admin fayl ilova qilgan bo'lsa */}
                                    {docItem.fileUrl && (
                                        <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-4 inline-flex items-center justify-between w-full p-3 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl group/link hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 truncate">Ilova qilingan fayl</span>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400 opacity-50 group-hover/link:opacity-100" />
                                        </a>
                                    )}

                                    {/* Moliyaviy so'rov bo'lsa (To'lov miqdori chiqadi) */}
                                    {docItem.type === 'financial' && docItem.amount && (
                                        <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> To'lov Miqdori:</span>
                                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">{docItem.amount} UZS</span>
                                        </div>
                                    )}

                                    {/* Hujjat Muddati */}
                                    <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-50 dark:border-white/5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Muddat: <span className={docItem.deadline ? 'text-slate-600 dark:text-slate-300 font-black' : 'text-slate-400'}>{docItem.deadline || "Belgilanmagan"}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* KARTA PASTKI QISMI (Actions & Status) */}
                                <div className="p-4 pt-0">
                                    {docItem.type === 'info' ? (
                                        <div className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-white/5">
                                            Faqat O'qish Uchun
                                        </div>
                                    ) : myResponse ? (
                                        /* 🌟 JAVOB YUBORILGAN BO'LSA STATUS KO'RINADI */
                                        <div className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between border ${STATUS_COLORS[myResponse.status]}`}>
                                            <div className="flex items-center gap-2">
                                                {myResponse.status === 'approved' ? <CheckCircle2 className="w-4 h-4"/> : myResponse.status === 'rejected' ? <AlertCircle className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{STATUS_LABELS[myResponse.status]}</span>
                                            </div>
                                            {myResponse.status === 'rejected' && (
                                                <button onClick={() => setActiveDoc(docItem)} className="text-[10px] font-black underline hover:opacity-80">Qayta Yuborish</button>
                                            )}
                                        </div>
                                    ) : (
                                        /* 🌟 JAVOB YUBORILMAGAN BO'LSA TUGMA CHIQADI */
                                        <button 
                                            onClick={() => setActiveDoc(docItem)} 
                                            className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all
                                            ${docItem.type === 'financial' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'}`}
                                        >
                                            <UploadCloud className="w-4 h-4" /> {docItem.type === 'financial' ? "Kvitansiya Yuklash" : "Hujjat Yuborish"}
                                        </button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}


            {/* --- JAVOB YUBORISH MODALI (Fayl Yuklash) --- */}
            {activeDoc && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setActiveDoc(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in-95 border border-white/10 overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className={`p-6 md:p-8 text-white ${activeDoc.type === 'financial' ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    {activeDoc.type === 'financial' ? <CreditCard className="w-6 h-6"/> : <UploadCloud className="w-6 h-6"/>}
                                </div>
                                <button onClick={() => !isSubmitting && setActiveDoc(null)} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black mb-2 leading-tight">{activeDoc.title}</h3>
                            <p className="text-xs font-medium opacity-90 line-clamp-2">{activeDoc.description}</p>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitResponse} className="p-6 md:p-8 flex flex-col flex-1">
                            
                            {activeDoc.type === 'financial' && (
                                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To'lanishi kerak:</span>
                                    <span className="text-lg font-black text-rose-500">{activeDoc.amount} UZS</span>
                                </div>
                            )}

                            <div className="space-y-2 mb-8">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                    Ilova qilinadigan fayl <span className="text-rose-500">*</span>
                                </label>
                                <div onClick={() => fileInputRef.current?.click()} className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${uploadFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400'}`}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" required />
                                    
                                    {uploadFile ? (
                                        <div className="flex flex-col items-center text-center w-full">
                                            <FileCheck2 className="w-10 h-10 text-emerald-500 mb-3" />
                                            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 line-clamp-1 w-full px-4">{uploadFile.name}</p>
                                            <p className="text-[10px] font-bold text-emerald-600/70 mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB • Bosib almashtirish mumkin</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3">
                                                <UploadCloud className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white mb-1">Yuklash uchun bosing</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PDF, Image (Max 10MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting || !uploadFile} className="w-full mt-auto py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none">
                                {isSubmitting ? <Spinner className="w-4 h-4 text-inherit" /> : <><Send className="w-4 h-4"/> Yuborish va Tasdiqlash</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
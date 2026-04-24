"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { applicationsApi } from "../../../../lib/api/applicationsApi";
import { useUser } from "../../../../lib/UserContext"; // User ID ni olish uchun
import { db, storage } from "../../../../lib/firebase"; // Firebase ulanishi
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  FileText, FileCheck, Clock, AlertCircle,
  Plus, Search, Filter, MoreHorizontal, 
  ChevronRight, Send, ShieldCheck, History, Info, X,
  UploadCloud, File, Trash2, CheckCircle2, Briefcase, Loader2
} from "lucide-react";
import { useLanguage } from "../../../../lib/LanguageContext";
import Card from "../../../../components/Card";

// Fayl uchun xavfsizlik qoidalari
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-zip-compressed"
];

export default function ApplicationPage() {
  const { t } = useLanguage();
  const { user } = useUser();
  
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'assignments'

  // Ma'lumot va UI statelari
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]); // Endi bu ham API dan keladi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('All'); 

  // --- ARIZA MODALI ---
  const [showAppModal, setShowAppModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appForm, setAppForm] = useState({ title: "", type: "Standard", category: "Ma'lumotnoma", purpose: "", details: "" });

  // --- TOPSHIRIQ MODALI (Fayl yuklash) ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Bazadan ma'lumotlarni tortish (Real data)
  const fetchAllData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Arizalarni tortish
      const appData = await applicationsApi.getApplications();
      setRequests(appData || []);

      // 2. Topshiriqlarni tortish (Faqat shu talabaning guruhiga tegishli)
      if (user.groupId) {
          const assignQuery = query(collection(db, "assignments"), where("groupId", "==", user.groupId));
          const assignSnap = await getDocs(assignQuery);
          
          // Talabaning o'z javoblarini (submission) tekshirish
          const mySubmissionsQuery = query(collection(db, "submissions"), where("studentId", "==", user.uid));
          const subSnap = await getDocs(mySubmissionsQuery);
          const completedIds = subSnap.docs.map(d => d.data().assignmentId);

          const assignData = assignSnap.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data(),
              // Agar talaba topshirgan bo'lsa 'Completed' bo'ladi, yo'qsa 'Pending'
              status: completedIds.includes(doc.id) ? 'Completed' : 'Pending' 
          }));
          
          setAssignments(assignData);
      }

    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // 2. Ariza yuborish
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    if (!appForm.title || !appForm.purpose) return;

    try {
      setIsSubmitting(true);
      // Agar backend arizaga category qabul qilsa, uni ham beramiz
      const newReq = await applicationsApi.createApplication(appForm);
      setRequests([{...newReq, id: newReq.id || Date.now()}, ...requests]);
      setShowAppModal(false);
      // Formani tozalash
      setAppForm({ title: "", type: "Standard", category: "Ma'lumotnoma", purpose: "", details: "" });
    } catch (err) {
      alert("Arizani yuborishda xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tezkor xizmatni bosganda ishlaydigan funksiya
  const openQuickService = (serviceTitle) => {
      setAppForm({ ...appForm, title: serviceTitle });
      setShowAppModal(true);
  };

  // 3. Topshiriq (Assignment) faylini tekshirish va tanlash
  const handleFileChange = (e) => {
      const selected = e.target.files[0];
      if (!selected) return;

      if (!ALLOWED_TYPES.includes(selected.type) && !selected.name.endsWith('.rar')) {
          alert("Faqat PDF, DOC, DOCX, TXT yoki ZIP/RAR formatlariga ruxsat berilgan.");
          return;
      }

      if (selected.size > MAX_FILE_SIZE) {
          alert("Fayl hajmi 5 MB dan oshmasligi kerak!");
          return;
      }

      setFile(selected);
  };

  // 4. Topshiriq yuborish (Haqiqiy Firebase Storage orqali)
  const handleAssignSubmit = async (e) => {
      e.preventDefault();
      if (!file || !user) return alert("Iltimos, ruxsat etilgan fayl yuklang!");

      try {
          setIsSubmitting(true);
          
          // 1. Faylni Firebase Storage ga yuklash
          const fileRef = ref(storage, `assignments/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);

          // 2. Submission (javob) ni DB ga yozish
          await addDoc(collection(db, "submissions"), {
              assignmentId: selectedAssignment.id,
              studentId: user.uid,
              studentName: user.name || "Noma'lum Talaba",
              fileUrl: fileUrl,
              fileName: file.name,
              submittedAt: serverTimestamp()
          });

          // 3. Ekranni darhol yangilash (Status: Completed)
          const updatedAssignments = assignments.map(a => 
              a.id === selectedAssignment.id ? { ...a, status: 'Completed' } : a
          );
          setAssignments(updatedAssignments);
          
          setShowAssignModal(false);
          setFile(null);
          
      } catch (error) {
          console.error("Fayl yuklashda xato:", error);
          alert("Kechirasiz, faylni yuklashda xatolik yuz berdi. Internetni tekshiring.");
      } finally {
          setIsSubmitting(false);
      }
  };


  const filteredRequests = useMemo(() => {
    let source = activeTab === 'applications' ? requests : assignments;
    if (filterStatus === 'All') return source;
    return source.filter(req => req.status === filterStatus);
  }, [requests, assignments, activeTab, filterStatus]);


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Xatolik</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={fetchAllData} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold">Qayta urinish</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">

      {/* --- HEADER VA TABLAR --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">
              Talaba Xizmatlari
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
              Arizalar va O'quv Topshiriqlari
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px] w-full md:w-max overflow-x-auto no-scrollbar">
            <button 
                onClick={() => { setActiveTab('applications'); setFilterStatus('All'); }} 
                className={`flex-1 md:flex-none flex items-center space-x-2 px-6 py-3 rounded-[18px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'applications' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
                <FileText className="w-4 h-4 shrink-0" /> <span>Arizalar</span>
            </button>
            <button 
                onClick={() => { setActiveTab('assignments'); setFilterStatus('All'); }} 
                className={`flex-1 md:flex-none flex items-center space-x-2 px-6 py-3 rounded-[18px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'assignments' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
                <Briefcase className="w-4 h-4 shrink-0" /> <span>Topshiriqlar</span>
            </button>
        </div>
      </header>

      {/* --- ASOSIY KONTENT --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">

        {/* 1-Qism: Ro'yxat */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'applications' ? "Mening Arizalarim" : "Mening Topshiriqlarim"}
            </h2>
            <div className="flex items-center space-x-2 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl md:rounded-2xl w-full sm:w-auto">
              {['All', 'Pending', 'Completed'].map(status => (
                <button 
                  key={status} onClick={() => setFilterStatus(status)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
                >
                  {status === 'All' ? 'Barchasi' : status === 'Pending' ? (activeTab === 'applications' ? 'Kutilmoqda' : "Topshirilmagan") : 'Bajarildi'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {loading ? (
               <div className="text-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div></div>
            ) : filteredRequests.length === 0 ? (
               <div className="text-center py-12 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                   <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-500 text-sm font-medium">Hozircha ma'lumot yo'q</p>
               </div>
            ) : (
                filteredRequests.map(item => (
                    <Card key={item.id} className="p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            
                            <div className="flex items-center space-x-4">
                                <div className={`p-4 rounded-2xl shrink-0 ${item.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                                    {activeTab === 'applications' ? (item.status === 'Completed' ? <FileCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />) : <Briefcase className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{item.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                        <span>{activeTab === 'applications' ? (item.category || "Ariza") : item.subject}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className={activeTab === 'assignments' && item.status === 'Pending' ? "text-rose-500" : ""}>
                                            {activeTab === 'applications' ? item.formattedDate : `Muddat: ${item.deadline}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-3 sm:pt-0">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${item.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                    {item.status === 'Pending' ? (activeTab === 'applications' ? 'Kutilmoqda' : "Topshirilmagan") : 'Bajarildi'}
                                </span>
                                
                                {activeTab === 'assignments' && item.status === 'Pending' && (
                                    <button 
                                        onClick={() => { setSelectedAssignment(item); setShowAssignModal(true); }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                    >
                                        <UploadCloud className="w-3 h-3" /> Fayl Yuklash
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))
            )}
          </div>
        </div>

        {/* 2-Qism: Sidebar */}
        <div className="space-y-6 md:space-y-8">
          
          <Card className="p-6 md:p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl md:rounded-[40px] shadow-xl border border-white/5 text-center">
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 {activeTab === 'applications' ? <FileText className="w-8 h-8 text-indigo-400"/> : <UploadCloud className="w-8 h-8 text-emerald-400" />}
             </div>
             <h3 className="text-xl font-black mb-2">{activeTab === 'applications' ? "Yangi Ariza Berish" : "Fayl Yuklash"}</h3>
             <p className="text-xs font-bold text-slate-400 mb-6">
                 {activeTab === 'applications' ? "Tezkor so'rov yuborish yoki ma'lumotnoma olish." : "Fayllaringizni PDF, DOC yoki ZIP farmatida yuboring."}
             </p>
             
             {activeTab === 'applications' && (
                <button onClick={() => { setAppForm({ title: "", type: "Standard", category: "Ma'lumotnoma", purpose: "", details: "" }); setShowAppModal(true); }} className="w-full py-4 bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all">
                    Ariza Boshlash
                </button>
             )}
          </Card>

          {/* TEZKOR XIZMATLAR (Endi ishlaydi!) */}
          {activeTab === 'applications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest pl-2">Tezkor Xizmatlar</h3>
                {[
                    { title: "Akademik Trankript", icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { title: "Tavsiyanoma so'rash", icon: Send, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { title: "Kutubxona varaqasi", icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                ].map((service, idx) => (
                    <Card key={idx} onClick={() => openQuickService(service.title)} className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group border border-slate-100 dark:border-white/5">
                        <div className={`p-3 rounded-xl ${service.bg} group-hover:scale-110 transition-transform`}><service.icon className={`w-5 h-5 ${service.color}`} /></div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-white">{service.title}</h4>
                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Card>
                ))}
              </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: YANGA ARIZA BERISH --- */}
      {showAppModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowAppModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Yangi Ariza</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Rasmiy so'rovnoma</p>
              </div>
              <button disabled={isSubmitting} onClick={() => setShowAppModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAppSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hujjat nomi</label>
                <input required type="text" value={appForm.title} onChange={e => setAppForm({...appForm, title: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Trankript, Ma'lumotnoma..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Xizmat Turi</label>
                    <select value={appForm.type} onChange={e => setAppForm({...appForm, type: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer">
                      <option value="Standard">Standard</option>
                      <option value="Express">Tezkor</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Toifasi</label>
                    <select value={appForm.category} onChange={e => setAppForm({...appForm, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none cursor-pointer">
                      <option value="Ma'lumotnoma">Ma'lumotnoma</option>
                      <option value="Shikoyat">Shikoyat</option>
                      <option value="Taklif">Taklif</option>
                    </select>
                  </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Maqsad</label>
                <input required type="text" value={appForm.purpose} onChange={e => setAppForm({...appForm, purpose: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Viza uchun, Ish joyiga..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "Arizani Yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TOPSHIRIQ (ASSIGNMENT) YUKLASH --- */}
      {showAssignModal && selectedAssignment && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowAssignModal(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Vazifani Topshirish</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 line-clamp-1">{selectedAssignment.title}</p>
              </div>
              <button disabled={isSubmitting} onClick={() => setShowAssignModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-6">
              <div 
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-400'}`}
              >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt,.zip,.rar" />
                  
                  {file ? (
                      <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                              <File className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-white mb-1 line-clamp-1">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-200">
                              <Trash2 className="w-3 h-3" /> O'chirish
                          </button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center">
                          <div className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                              <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-white mb-1">Faylni tanlang yoki shu yerga tashlang</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">PDF, DOC, TXT, ZIP (Max 5MB)</p>
                      </div>
                  )}
              </div>

              <button type="submit" disabled={isSubmitting || !file} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "Ustozga Yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
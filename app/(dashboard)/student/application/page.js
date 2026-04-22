"use client";

import { useState, useEffect, useMemo } from "react";
import { applicationsApi } from "../../../../lib/api/applicationsApi";
import {
  FileText, FileCheck, Clock, AlertCircle,
  Plus, Search, Filter, MoreHorizontal, 
  ChevronRight, Send, ShieldCheck, History, Info, X
} from "lucide-react";
import { useLanguage } from "../../../../lib/LanguageContext";
import Card from "../../../../components/Card";

export default function ApplicationPage() {
  const { t } = useLanguage();
  
  // Ma'lumot va UI statelari
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Completed
  
  // Modal statelari
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", type: "Standard", purpose: "", details: "" });

  // 1. Bazadan ma'lumotlarni tortish
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await applicationsApi.getApplications();
      setRequests(data || []);
    } catch (err) {
      setError("Arizalarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Yangi ariza modalini ochish
  const handleNewRequest = (preTitle = "") => {
    setFormData({ title: preTitle, type: "Standard", purpose: "", details: "" });
    setShowModal(true);
  };

  // 3. Ariza yuborish mantiqi
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.purpose) return;

    try {
      setIsSubmitting(true);
      const newReq = await applicationsApi.createApplication({
        title: formData.title,
        type: formData.type,
        purpose: formData.purpose,
        details: formData.details
      });
      
      // Yangi arizani darhol UI ga qo'shish (Optimistic Update)
      setRequests([newReq, ...requests]);
      setShowModal(false);
    } catch (err) {
      alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Qidiruv va Filter
  const filteredRequests = useMemo(() => {
    if (filterStatus === 'All') return requests;
    return requests.filter(req => req.status === filterStatus);
  }, [requests, filterStatus]);


  // Xato UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Xatolik</h3>
        <button onClick={fetchRequests} className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold">
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section - Mobile First */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">{t('docServiceTitle') || "Hujjatlar xizmati"}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">{t('docServiceSubtitle') || "Ma'lumotnomalar va arizalar"}</p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto">
          <button
            onClick={() => handleNewRequest()}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t('newRequest') || "Yangi Ariza"}</span>
          </button>
          <button onClick={fetchRequests} className="p-3.5 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl md:rounded-[24px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group">
            <History className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : 'group-hover:-rotate-45 transition-transform'}`} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">

        {/* Asosiy Arizalar Ro'yxati */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('myApplications') || "Mening Arizalarim"}</h2>
            <div className="flex items-center space-x-2 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl md:rounded-2xl w-full sm:w-auto">
              {['All', 'Pending', 'Completed'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
                >
                  {status === 'All' ? (t('all') || 'Barchasi') : status === 'Pending' ? (t('pending') || 'Kutilmoqda') : (t('completed') || 'Bajarildi')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {loading ? (
               <div className="text-center py-12">
                   <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
               </div>
            ) : filteredRequests.length === 0 ? (
               <div className="text-center py-12 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                   <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-500 text-sm font-medium">Hozircha arizalar yo'q</p>
               </div>
            ) : (
                filteredRequests.map(req => (
                    <RequestCard key={req.id} {...req} />
                ))
            )}
          </div>

          {/* Quick Request Grid (Xizmatlar katalogi) */}
          <div className="pt-6 md:pt-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6 md:mb-8">{t('serviceCatalog') || "Xizmatlar Katalogi"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {[
                { title: t('academicTranscript') || "Akademik Trankript", desc: 'Baholar va natijalar', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                { title: t('recommendationLetter') || "Tavsiyanoma", desc: "Professorlardan so'rov", icon: Send, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { title: t('visaVerification') || "Viza Ma'lumotnomasi", desc: "Sayohat va o'qish uchun", icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { title: t('libraryClearance') || "Kutubxona varaqasi", desc: "Kitoblar holati", icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              ].map((service, idx) => (
                <Card
                  key={idx}
                  onClick={() => handleNewRequest(service.title)}
                  className="p-6 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group cursor-pointer"
                >
                  <div className={`p-3 md:p-4 ${service.bg} rounded-xl md:rounded-3xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`w-5 h-5 md:w-7 md:h-7 ${service.color}`} />
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-1 md:mb-2 uppercase tracking-tight">{service.title}</h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{service.desc}</p>
                  <div className="mt-6 md:mt-8 flex items-center text-indigo-600 dark:text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>{t('applyNow') || "Ariza berish"}</span>
                    <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Status */}
        <div className="space-y-6 md:space-y-8">
          <Card className="p-6 md:p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl md:rounded-[40px] shadow-xl overflow-hidden relative border border-white/5">
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6 md:mb-8">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Info className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-black tracking-tight uppercase">{t('limits') || "Limitlar"}</h3>
              </div>

              <div className="space-y-5 md:space-y-6">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{t('digitalCerts') || "Elektron Sertifikatlar"}</span>
                    <span className="text-white">8/10 {t('used') || "ishlatildi"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[80%] rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{t('expressMail') || "Tezkor pochta"}</span>
                    <span className="text-white">1/3 {t('used') || "ishlatildi"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[33%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-3">{t('reminder') || "Eslatma"}</h3>
            <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 md:mb-8">{t('reminderDesc') || "Hujjatlar tayyor bo'lishi standart tarifda 3 kungacha vaqt oladi. Tasdiqlangan hujjatlar to'g'ridan-to'g'ri tizimga biriktiriladi."}</p>
            <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-3xl flex items-center space-x-4">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('avgWait') || "O'rtacha kutish"}</p>
                <p className="text-xs md:text-sm font-black text-slate-800 dark:text-white tracking-tight">2.5 {t('daysCount') || "Kun"}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* YANGI ARIZA MODALI (To'liq Moslashuvchan va Firebase Submitli) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t('newRequest') || "Yangi Ariza"}</h3>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('docServiceSubtitle') || "Ma'lumotnomalar"}</p>
              </div>
              <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-full md:rounded-2xl text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{t('docName') || "Hujjat nomi"}</label>
                <input
                  type="text"
                  required
                  placeholder={t('docNamePlaceholder') || "Masalan: Trankript"}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{t('serviceType') || "Xizmat turi"}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-slate-300"
                >
                  <option value="Standard">Standard (3 kun)</option>
                  <option value="Express">Tezkor (Bugun)</option>
                  <option value="Digital">Raqamli (Darhol)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{t('purpose') || "Maqsad"}</label>
                <input
                  type="text"
                  required
                  placeholder="Nima maqsadda kerak?"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{t('additionalInfo') || "Qo'shimcha izoh"}</label>
                <textarea
                  placeholder="Agar kerak bo'lsa..."
                  rows="3"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                />
              </div>

              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3 md:space-x-4">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 md:px-10 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 transform flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Yuborish"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Qator (Card) komponenti - Responsive
function RequestCard({ id, title, formattedDate, status, type }) {
  const { t } = useLanguage();
  const statusLabel = status === 'Pending' ? 'Kutilmoqda' : status === 'Completed' ? 'Bajarildi' : 'Jarayonda';

  return (
    <Card className="p-4 md:p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
            {status === 'Completed' ? <FileCheck className="w-5 h-5 md:w-6 md:h-6" /> : <Clock className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div>
            <h4 className="text-sm md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{title}</h4>
            <div className="flex flex-wrap items-center gap-2 md:space-x-3 text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              <span>{id?.substring(0, 8) || "REQ-..."}</span>
              <span className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-3 sm:pt-0 mt-1 sm:mt-0">
          <div className="text-right">
            <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {statusLabel}
            </span>
          </div>
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { gradesApi } from "../../../../lib/api/gradesApi"; // To'g'ri yo'lni ko'rsating
import Card from '../../../../components/Card';
import {
  Award, BookOpen, Download, Filter,
  MoreHorizontal, Search, Star, TrendingUp, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { useUser } from '../../../../lib/UserContext';

// --- Kichik Komponentlar ---
const GradeCard = ({ title, score, targetScore, credit, color }) => (
  <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl md:rounded-[32px] p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border-t-4" style={{ borderTopColor: color || '#6366f1' }}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-slate-700 dark:text-slate-300" />
      </div>
      <div className="bg-slate-900 dark:bg-indigo-500 text-white px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase">
        {credit || 0} Kredit
      </div>
    </div>
    <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-white mb-1 truncate">{title || "Noma'lum kurs"}</h3>
    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Joriy Baho</p>

    <div className="flex items-end justify-between">
      <div className="flex items-baseline space-x-1.5 md:space-x-2">
        <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-none">{score || 0}</span>
        <span className="text-xs md:text-sm font-bold text-slate-400">/ 100</span>
      </div>
      <div className="text-right">
        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maqsad</p>
        <p className="text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400">{targetScore || 100}%</p>
      </div>
    </div>

    <div className="mt-4 md:mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score || 0}%`, backgroundColor: color || '#6366f1' }}></div>
    </div>
  </div>
);

// --- ASOSIY SAHIFA ---
export default function Gradebook() {
  const { user } = useUser();
  
  // State'lar
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Firebase'dan ma'lumotlarni tortish
  useEffect(() => {
    const fetchGradesData = async () => {
      try {
        setLoading(true);
        const [profData, gradesData] = await Promise.all([
          gradesApi.getAcademicProfile(),
          gradesApi.getGrades()
        ]);
        
        setProfile(profData);
        setGrades(gradesData || []);
      } catch (err) {
        console.error("Fetch xatosi:", err);
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchGradesData();
  }, []);

  // Jadval uchun qidiruv filtri
  const filteredGrades = useMemo(() => {
    if (!searchQuery) return grades;
    return grades.filter(course => 
      course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.prof?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [grades, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ulanishda xatolik</h3>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold">
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
          <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3 md:mb-4">Akademik Natijalar</h1>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Umumiy GPA: <span className="text-slate-900 dark:text-white font-black">{profile?.gpa || '0.0'}</span></span>
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Reyting: <span className="text-slate-900 dark:text-white font-black">{profile?.rank || 'N/A'}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-3 md:py-3.5 bg-[#1e293b] text-white rounded-xl md:rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
            <Download className="w-4 h-4" />
            <span>Trankript (PDF)</span>
          </button>
          <button className="p-3 md:p-3.5 bg-white/40 dark:bg-slate-800 border border-white dark:border-slate-700 rounded-xl md:rounded-[20px] text-slate-600 dark:text-slate-300 hover:bg-white transition-all shadow-sm">
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      {/* GPA Highlights Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {grades.length === 0 ? (
           <div className="col-span-full text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
               <p className="text-slate-500 font-medium">Hozircha baholangan kurslar yo'q</p>
           </div>
        ) : (
            grades.slice(0, 4).map((course, idx) => (
                <GradeCard 
                    key={course.id || idx} 
                    title={course.name} 
                    score={course.score} 
                    targetScore={course.targetScore || 100} 
                    credit={course.credit} 
                    color={course.color} 
                />
            ))
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

        {/* Detailed Grade Table */}
        <div className="xl:col-span-2">
          <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Trankript Tafsilotlari</h2>
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kursni qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-4 md:pb-6 pl-2">Kod</th>
                    <th className="pb-4 md:pb-6">Kurs nomi</th>
                    <th className="pb-4 md:pb-6">O'qituvchi</th>
                    <th className="pb-4 md:pb-6">Kredit</th>
                    <th className="pb-4 md:pb-6">Yakuniy Baho</th>
                    <th className="pb-4 md:pb-6 text-right pr-2">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredGrades.length === 0 ? (
                     <tr>
                         <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">Ma'lumot topilmadi</td>
                     </tr>
                  ) : (
                      filteredGrades.map((row, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 md:py-5 pl-2">
                            <span className="text-[11px] md:text-[13px] font-black text-slate-400">{row.code || 'N/A'}</span>
                          </td>
                          <td className="py-4 md:py-5">
                            <span className="text-xs md:text-[14px] font-black text-slate-800 dark:text-white">{row.name}</span>
                          </td>
                          <td className="py-4 md:py-5">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] uppercase font-bold text-slate-500 dark:text-slate-300">
                                  {row.prof ? row.prof.charAt(0) : '?'}
                              </div>
                              <span className="text-[11px] md:text-[13px] font-bold text-slate-500 dark:text-slate-400">{row.prof || "Biriktirilmagan"}</span>
                            </div>
                          </td>
                          <td className="py-4 md:py-5">
                            <span className="text-[11px] md:text-[13px] font-black text-slate-500">{row.credit || 0}</span>
                          </td>
                          <td className="py-4 md:py-5">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black ${(row.letterGrade || 'B').startsWith('A') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'}`}>
                                {row.letterGrade || 'B'}
                              </div>
                              <span className="text-[11px] md:text-[13px] font-black text-slate-400">{row.score || 0}%</span>
                            </div>
                          </td>
                          <td className="py-4 md:py-5 text-right pr-2">
                            <button className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                              <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Vertical Distribution / Trends */}
        <div className="space-y-6 md:space-y-8">
          <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm">
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6 md:mb-8">Semestr Dinamikasi</h2>

            <div className="space-y-5 md:space-y-6">
              {profile?.trends?.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{item.label}</span>
                    <span className="text-slate-900 dark:text-white">{item.val}%</span>
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color || 'bg-indigo-500'} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 p-4 md:p-5 rounded-[20px] md:rounded-[24px] bg-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-400 mb-2 md:mb-3" />
                <h4 className="text-xs md:text-sm font-black uppercase tracking-widest mb-1">Prezident Stipendiyasi</h4>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 leading-relaxed mb-4">Maksimal grant olish uchun atigi 0.1 GPA yetishmayapti!</p>
                <button className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                  Talablarni ko'rish
                </button>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl -mr-12 -mt-12"></div>
            </div>
          </Card>

          <Card className="p-5 md:p-8 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl md:rounded-[40px] shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center mb-3 md:mb-4">
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-2">Tasdiqlangan Trankript</h3>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 leading-relaxed max-w-[200px] mb-5 md:mb-6">Sizning akademik qaydlaringiz Universitet tomonidan elektron tasdiqlangan.</p>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 w-full">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFIED_TRANSCRIPT_${user?.id || 'DEMO'}`} className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 opacity-60 contrast-125 dark:invert" alt="QR Code" />
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tekshirish uchun skanerlang</p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
"use client";
import { useState, useEffect, useMemo } from "react";
import Card from "../../../../components/Card";
import { scheduleApi } from "../../../../lib/api/scheduleApi";
import { useUser } from "../../../../lib/UserContext";
import { 
    Calendar as CalendarIcon, Clock, MapPin, 
    User, Users, ChevronLeft, ChevronRight, 
    BookOpen, FlaskConical, Laptop, GraduationCap
} from "lucide-react";

// Dars turiga qarab rang va ikonka beruvchi funksiya
const getClassTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
        case 'lecture': return { color: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: BookOpen };
        case 'practice': return { color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: Laptop };
        case 'lab': return { color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: FlaskConical };
        default: return { color: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', icon: GraduationCap };
    }
};

// --- DARS KARTOCHKASI (Bento Style) ---
const ClassCard = ({ item, userRole }) => {
    const config = getClassTypeConfig(item.type);
    const Icon = config.icon;

    return (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            {/* Kartaning yuqori qismidagi rangli chiziq */}
            <div className={`h-2 w-full ${config.color} transition-all duration-500 group-hover:h-3`}></div>
            
            <div className="p-5 md:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text} flex items-center space-x-1.5`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.type || 'Dars'}</span>
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 tracking-wider">{item.time}</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.para}-Para</h4>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.course}
                    </h3>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center space-x-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{item.room || "Xona belgilanmagan"}</span>
                    </div>
                    
                    {/* Rolga qarab Footer o'zgaradi */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                        {userRole === 'teacher' ? (
                            <div className="flex items-center space-x-2.5 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                <Users className="w-4 h-4 text-indigo-500" />
                                <span>{item.studentsList?.length || 0} ta Talaba</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2.5 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest truncate">
                                <User className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="truncate">{item.teacherName || "O'qituvchi"}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

// --- ASOSIY SAHIFA ---
export default function Schedule() {
    const { user } = useUser();
    const days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    
    // Bugungi kunni avtomatik topish
    const todayIndex = new Date().getDay();
    const defaultDay = todayIndex > 0 && todayIndex < 7 ? days[todayIndex - 1] : "Dushanba";
    
    const [activeDay, setActiveDay] = useState(defaultDay);
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                // API ga foydalanuvchi rolini uzatamiz
                const data = await scheduleApi.getSchedule(user?.role || 'student');
                setScheduleData(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [user?.role]);

    // Faqat faol kundagi darslarni ajratib olish
    const dailySchedule = useMemo(() => {
        return scheduleData.filter(s => s.day === activeDay);
    }, [scheduleData, activeDay]);

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-3xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">
                        {user?.role === 'teacher' ? "O'qituvchi Jadvali" : "Dars Jadvali"}
                    </h1>
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                        <span>Akademik haftalik (Bahorgi Semestr)</span>
                    </div>
                </div>

                <div className="flex items-center w-full md:w-auto justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5">
                    <button className="p-2.5 md:p-3 hover:bg-white dark:hover:bg-slate-800 rounded-[14px] md:rounded-2xl text-slate-600 dark:text-slate-300 transition-all active:scale-95">
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    <div className="px-4 md:px-6 py-2">
                        <span className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Joriy Hafta</span>
                    </div>
                    <button className="p-2.5 md:p-3 hover:bg-white dark:hover:bg-slate-800 rounded-[14px] md:rounded-2xl text-slate-600 dark:text-slate-300 transition-all active:scale-95">
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                </div>
            </div>

            {/* Kunlar Filtri (Scrollable Pills) */}
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-4 md:pb-8 scroll-smooth no-scrollbar w-full custom-scrollbar">
                {days.map(day => (
                    <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`group relative px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-[24px] text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 shrink-0 ${
                            activeDay === day
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                : "bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        {day}
                        {activeDay === day && (
                            <div className="absolute -bottom-1 md:-bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Darslar Setkasi (Modern Grid) */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[24px] animate-pulse"></div>)}
                </div>
            ) : dailySchedule.length === 0 ? (
                <div className="py-20 text-center bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200/60 dark:border-white/10 rounded-[32px] md:rounded-[40px]">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm">
                        <CalendarIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Dars mavjud emas</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Bu kun uchun jadval bo'sh.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {dailySchedule.map((item) => (
                        <ClassCard key={item.id} item={item} userRole={user?.role} />
                    ))}
                </div>
            )}
        </div>
    );
}
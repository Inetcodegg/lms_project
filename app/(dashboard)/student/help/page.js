"use client";
import React, { useState, useEffect } from "react";
import { HelpCircle, Mail, MessageSquare, Phone, ExternalLink, X, Send } from "lucide-react";
import { useLanguage } from "../../../../lib/LanguageContext";
import { useUser } from "../../../../lib/UserContext"; // User rolini olish
import { helpApi } from "../../../../lib/api/helpApi";
import Card from "../../../../components/Card";

export default function HelpPage() {
    const { t } = useLanguage();
    const { user } = useUser();
    
    // State'lar
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal va Form statelari
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketMsg, setTicketMsg] = useState({ subject: "", message: "" });
    const [successMsg, setSuccessMsg] = useState("");

    // Firebase'dan FAQ larni yuklash
    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                setLoading(true);
                const data = await helpApi.getFAQs(user?.role || 'student');
                setFaqs(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchFAQs();
    }, [user?.role]);

    // Yordam xabarini yuborish
    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (!ticketMsg.subject || !ticketMsg.message) return;

        try {
            setIsSubmitting(true);
            await helpApi.submitTicket({
                subject: ticketMsg.subject,
                message: ticketMsg.message,
                userRole: user?.role || 'student'
            });
            
            setShowTicketModal(false);
            setTicketMsg({ subject: "", message: "" });
            setSuccessMsg("Xabaringiz yuborildi! Tez orada aloqaga chiqamiz.");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (error) {
            alert("Xato yuz berdi. Tizimga kirganingizga ishonch hosil qiling.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Yordam kanallari va funksional tugmalar
    const handleChannelAction = (type) => {
        if (type === 'chat') {
            setShowTicketModal(true);
        } else if (type === 'email') {
            window.location.href = "mailto:support@campus.edu";
        } else if (type === 'phone') {
            window.location.href = "tel:+998901234567"; // O'zingizning raqamingizni qo'ying
        }
    };

    const supportChannels = [
        { id: 'chat', name: t('supportChat') || "Support Chat", desc: t('supportChatDesc') || "Jonli yordam operatori bilan", icon: MessageSquare, action: t('startChat') || "Chatni boshlash", color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
        { id: 'email', name: t('emailSupport') || "Email Yordam", desc: t('emailSupportDesc') || "Batafsil so'rovlar uchun", icon: Mail, action: t('writeEmail') || "Xat yozish", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
        { id: 'phone', name: t('hotline') || "Ishonch Telefoni", desc: t('hotlineDesc') || "Shoshilinch holatlar uchun", icon: Phone, action: t('callNow') || "Qo'ng'iroq qilish", color: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Muaffaqiyatli yuborilganlik xabari (Toast) */}
            {successMsg && (
                <div className="fixed top-6 right-6 z-[200] px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-top-4 duration-300">
                    ✓ {successMsg}
                </div>
            )}

            <header className="mb-8 md:mb-12">
                <h1 className="text-2xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 md:mb-3">{t('helpCenterTitle') || "Yordam Markazi"}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">{t('helpCenterSubtitle') || "Qanday yordam bera olamiz?"}</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                
                {/* Chap qism: FAQ va Qo'llanma */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8 order-2 xl:order-1">
                    
                    {/* FAQ Kartasi */}
                    <Card className="p-5 md:p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[40px] shadow-sm">
                        <div className="flex items-center space-x-3 mb-6 md:mb-8">
                            <div className="p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl">
                                <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                            </div>
                            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('faqTitle') || "Ko'p beriladigan savollar"}</h2>
                        </div>
                        
                        <div className="space-y-3 md:space-y-4">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-24 md:h-28 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl animate-pulse"></div>)
                            ) : faqs.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-400 font-bold text-sm">Hozircha savol-javoblar bazasi bo'sh</p>
                                </div>
                            ) : (
                                faqs.map((item, idx) => (
                                    <div key={idx} className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-colors">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight leading-snug">{item.q || item.question}</h4>
                                        <p className="text-xs md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.a || item.answer}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Banner Card */}
                    <Card className="p-6 md:p-8 bg-indigo-600 text-white rounded-2xl md:rounded-[40px] shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[200px] md:min-h-[240px]">
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4 tracking-tighter">{t('guidesTitle') || "Tizim Yo'riqnomasi"}</h3>
                            <p className="text-indigo-100 text-xs md:text-sm font-medium mb-6 md:mb-8 max-w-md leading-relaxed">{t('guidesDesc') || "Barcha funksiyalardan qanday foydalanish haqida PDF qo'llanmani yuklab oling."}</p>
                            <button className="w-max px-6 md:px-8 py-3 md:py-3.5 bg-white text-indigo-600 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2 active:scale-95 transform shadow-md">
                                <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>{t('downloadGuide') || "Qo'llanmani yuklash"}</span>
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 md:-mr-32 md:-mt-32"></div>
                    </Card>
                </div>

                {/* O'ng qism: Kontakt Kanallari */}
                <div className="space-y-4 md:space-y-6 order-1 xl:order-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight px-1 md:px-2">{t('contactSupport') || "Aloqa Kanallari"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 md:gap-6">
                        {supportChannels.map((channel) => (
                            <Card key={channel.id} className="p-5 md:p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                                <div className={`p-3 md:p-4 ${channel.color} rounded-xl md:rounded-2xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                                    <channel.icon className="w-6 h-6 md:w-7 md:h-7" />
                                </div>
                                <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{channel.name}</h4>
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 md:mb-8 flex-1">{channel.desc}</p>
                                <button 
                                    onClick={() => handleChannelAction(channel.id)}
                                    className="w-full py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group-hover:bg-indigo-600 group-hover:text-white active:scale-95 transform"
                                >
                                    {channel.action}
                                </button>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* YORDAM CHIPTASI MODALI (Support Ticket) */}
            {showTicketModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmitting && setShowTicketModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Yordam So'rovi</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Adminlarga xabar yozish</p>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowTicketModal(false)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleTicketSubmit} className="space-y-5">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Mavzu</label>
                                <input
                                    type="text" required placeholder="Masalan: Tizimga kirolmayapman"
                                    value={ticketMsg.subject} onChange={(e) => setTicketMsg({ ...ticketMsg, subject: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Xabar matni</label>
                                <textarea
                                    required rows="5" placeholder="Muammoni batafsil tushuntiring..."
                                    value={ticketMsg.message} onChange={(e) => setTicketMsg({ ...ticketMsg, message: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none dark:text-white custom-scrollbar"
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end space-x-3">
                                <button type="button" disabled={isSubmitting} onClick={() => setShowTicketModal(false)} className="px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[120px]">
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span>Yuborish</span>
                                            <Send className="w-3.5 h-3.5" />
                                        </div>
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
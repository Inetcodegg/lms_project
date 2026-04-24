"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Card from "../../../../components/Card";
import {
    Search, Plus, MapPin, Clock, Info, CheckCircle2,
    X, Loader2, PackageSearch, Image as ImageIcon, ChevronDown, Check, HandHeart, Bell
} from "lucide-react";
import { lostFoundApi } from "../../../../lib/api/lostFoundApi";
import { notificationsApi } from "../../../../lib/api/notificationsApi";
import { useUser } from "../../../../lib/UserContext";
import Spinner from "../../../../components/Spinner";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?w=800&q=80&auto=format&fit=crop";

// --- CUSTOM SELECT (Animatsiyali va z-index muammosiz) ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || { label: value };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold border transition-all duration-200 select-none outline-none bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-indigo-500/30 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent'}`}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`w-4 h-4 mr-2.5 shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedOption.label || placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar px-1.5">
                        {options.map((opt) => (
                            <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-xs font-bold transition-all mb-1 last:mb-0 ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                                <span className="truncate pr-2">{opt.label}</span>
                                {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ASOSIY SAHIFA ---
export default function LostFoundPage() {
    const { user } = useUser();
    
    const [itemList, setItemList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Barchasi");
    const [toast, setToast] = useState(null);

    // Modal Statelari
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", location: "", category: "Electronics", status: "Lost", description: "", image: "" });

    // Details Modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const categories = ['Barchasi', 'Electronics', 'Academic', 'Accessories', 'Personal'];

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 3500); };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const data = await lostFoundApi.getItems();
                setItemList(data || []);
            } catch (error) {
                showToast("Ma'lumotlarni yuklashda xatolik", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const newItem = await lostFoundApi.createItem({
                ...formData,
                authorId: user.uid,
                authorName: user.name,
                // Agar status "Topilgan" bo'lsa, qayerdan topilgani yashirilishi (anonimlashtirilishi) tavsiya etiladi.
                location: formData.status === 'Lost' ? formData.location : "Markaziy bo'limga (A-bino) topshirilgan",
                image: formData.image || FALLBACK_IMAGE 
            });
            
            setItemList([newItem, ...itemList]);
            setShowModal(false);
            setFormData({ title: "", location: "", category: "Electronics", status: "Lost", description: "", image: "" });
            showToast("E'lon muvaffaqiyatli qo'shildi!");
        } catch (error) {
            showToast("Xato yuz berdi. Qayta urinib ko'ring.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🌟 MANTIQLI ACTION: "Topdim" deb xabar berish
    const handleFoundItAction = async () => {
        if (!selectedItem || isProcessingAction) return;
        try {
            setIsProcessingAction(true);
            
            // API chaqirig'i (E'lonni topildi deb belgilash yoki statusini almashtirish)
            // faraz qilamiz lostFoundApi.markAsResolved(selectedItem.id) funksiyasi bor
            
            // Xabarnoma yuborish (E'lon egasiga)
            await notificationsApi.sendNotification({
                title: "Buyumingiz topildi! 🎉",
                message: `Siz qidirayotgan "${selectedItem.title}" nomli buyum ${user.name} tomonidan topildi. Iltimos bog'laning.`,
                targetRoles: [selectedItem.authorId], // Faqat e'lon egasiga
                type: 'info',
                link: '/lost-found'
            });

            showToast("Egasi xabardor qilindi. Rahmat!");
            setSelectedItem(null);
            
        } catch (error) {
            showToast("Xatolik yuz berdi.", "error");
        } finally {
            setIsProcessingAction(false);
        }
    };

    const filteredItems = useMemo(() => {
        let result = itemList;
        if (activeCategory !== 'Barchasi') result = result.filter(i => i.category === activeCategory);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i => i.title?.toLowerCase().includes(q));
        }
        return result;
    }, [itemList, activeCategory, searchQuery]);


    return (
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">

            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Yo'qotilgan va Topilgan</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        Kampus hududidagi buyumlar xabarnomasi
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setShowModal(true)} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all shrink-0">
                        <Plus className="w-4 h-4" /> <span>E'lon berish</span>
                    </button>
                </div>
            </header>

            {/* QIDIRUV VA FILTRLAR */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text" placeholder="Buyumni qidiring..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center w-full md:w-auto bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 shadow-inner overflow-x-auto custom-scrollbar no-scrollbar">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ITEMS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[24px] animate-pulse"></div>)
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px]">
                        <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ushbu toifada buyumlar topilmadi</p>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <Card key={item.id} onClick={() => setSelectedItem(item)} className="p-0 overflow-hidden flex flex-col cursor-pointer border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md hover:shadow-xl hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 group rounded-[24px]">
                            
                            <div className="h-40 overflow-hidden relative bg-slate-100 dark:bg-slate-800 shrink-0">
                                <img src={item.image || FALLBACK_IMAGE} onError={(e) => {e.target.onerror=null; e.target.src=FALLBACK_IMAGE}} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
                                
                                <div className="absolute top-3 left-3 flex gap-1.5">
                                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                                        {item.category}
                                    </span>
                                </div>
                                <div className="absolute bottom-3 left-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md ${item.status === 'Found' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        {item.status === 'Found' ? 'Topilgan' : "Yo'qolgan"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 md:p-5 flex-1 flex flex-col bg-white dark:bg-slate-900">
                                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 leading-tight line-clamp-1 group-hover:text-indigo-500 transition-colors">{item.title}</h3>
                                {item.status === 'Lost' && item.location && (
                                    <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span className="truncate">{item.location}</span>
                                    </div>
                                )}
                                <div className="mt-auto pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Batafsil ma'lumot</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* --- BATAFSIL MA'LUMOT MODALI --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessingAction && setSelectedItem(null)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 max-h-[90vh]">
                        
                        <div className="relative h-48 md:h-64 shrink-0 bg-slate-100 dark:bg-slate-800">
                            <img src={selectedItem.image || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
                            
                            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm z-10"><X className="w-4 h-4" /></button>

                            <div className="absolute bottom-5 left-5 right-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-md ${selectedItem.status === 'Found' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        {selectedItem.status === 'Found' ? 'Topilgan Buyum' : "Yo'qolgan Buyum"}
                                    </span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{selectedItem.title}</h2>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><Info className="w-3.5 h-3.5 mr-1.5"/> Tavsif</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {selectedItem.description || "Tavsif kiritilmagan."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {selectedItem.status === 'Lost' && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/10">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Ehtimoliy Joy</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedItem.location}</p>
                                    </div>
                                )}
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Vaqt</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedItem.formattedDate || "Yaqinda"}</p>
                                </div>
                            </div>

                            {/* 🌟 MANTIQIY TUGMALAR (Action Buttons) */}
                            {selectedItem.status === 'Lost' && selectedItem.authorId !== user?.uid && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <button 
                                        onClick={handleFoundItAction} disabled={isProcessingAction}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isProcessingAction ? <Spinner className="w-4 h-4 text-inherit" /> : <><HandHeart className="w-4 h-4" /> Men Topdim!</>}
                                    </button>
                                    <p className="text-[9px] font-bold text-slate-400 text-center mt-3 uppercase tracking-widest">Egasiga xabarnoma yuboriladi</p>
                                </div>
                            )}

                            {selectedItem.status === 'Found' && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Buyumni qaytarib olish uchun</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">A-Bino markaziy ofisiga murojaat qiling</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- E'LON QO'SHISH MODALI --- */}
            {showModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-8 border border-white dark:border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                        
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Yangi E'lon</h3>
                            </div>
                            <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Holati</label>
                                    <CustomSelect 
                                        options={[
                                            {label: 'Yo\'qotdim', value: 'Lost'},
                                            {label: 'Topib oldim', value: 'Found'}
                                        ]} 
                                        value={formData.status} onChange={val => setFormData({ ...formData, status: val })} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Kategoriya</label>
                                    <CustomSelect 
                                        options={[
                                            {label: 'Electronics', value: 'Electronics'},
                                            {label: 'Academic', value: 'Academic'},
                                            {label: 'Accessories', value: 'Accessories'},
                                            {label: 'Personal', value: 'Personal'}
                                        ]} 
                                        value={formData.category} onChange={val => setFormData({ ...formData, category: val })} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Buyum Nomi</label>
                                <input required type="text" placeholder="Masalan: Qora hamyon" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white" />
                            </div>

                            {/* 🌟 MANTIQ: Faqat Yo'qolgan bo'lsa joylashuv so'raladi */}
                            {formData.status === 'Lost' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Ehtimoliy Joylashuv</label>
                                    <input required type="text" placeholder="Masalan: Kutubxona 2-qavat" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white" />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Rasm Havolasi (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="url" placeholder="https://..." value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Tavsif / Belgilar</label>
                                <textarea required rows="3" placeholder="Rangi, shakli va o'ziga xos belgilari..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white custom-scrollbar" />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Spinner className="w-4 h-4 text-inherit" /> : "E'lonni Joylash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
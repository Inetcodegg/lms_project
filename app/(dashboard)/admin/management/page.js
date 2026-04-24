"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Card from "../../../../components/Card";
import { 
    Users, GraduationCap, BookOpen, Plus, Trash2, 
    ChevronRight, ChevronDown, Folder, FileText, Layers,
    Loader2, Search, Settings2, CheckCircle2, AlertCircle, 
    Edit3, MoveRight, X, DoorOpen, MapPin, AlignLeft,
    Check, Filter, UserX, Hash
} from "lucide-react";
import { managementApi } from "../../../../lib/api/managementApi";

// --- ANIMATSIYALI VA IXCHAMLASHGAN CUSTOM SELECT ---
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon, disabled = false, small = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between font-bold border transition-all duration-200 select-none outline-none
                ${small ? 'px-3 py-2.5 rounded-xl text-xs' : 'px-4 py-3.5 rounded-2xl text-sm'}
                ${disabled 
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/30'
                }
                ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`${small ? 'w-3.5 h-3.5 mr-2' : 'w-4 h-4 mr-3'} shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`${small ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 font-bold text-center">Ma'lumot yo'q</p>
                        ) : (
                            options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer font-bold transition-all mb-1 last:mb-0
                                        ${small ? 'text-[11px]' : 'text-sm'}
                                        ${value === opt.value 
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                        }
                                    `}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


export default function AdminManagementPage() {
    const [activeTab, setActiveTab] = useState("users"); 
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // --- BAZA MA'LUMOTLARI ---
    const [structure, setStructure] = useState([]);
    const [groups, setGroups] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);

    // --- UI VA QIDIRUV ---
    const [expanded, setExpanded] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    
    // Foydalanuvchilar Filtr state'lari
    const [userRoleTab, setUserRoleTab] = useState("student"); 
    const [userStatusFilter, setUserStatusFilter] = useState("all"); 
    const [selectedGroupFilter, setSelectedGroupFilter] = useState("all"); // YANGI: Guruh filtri

    // --- MODAL LARI ---
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState({ id: null, name: "", type: "", parentId: null });

    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState({ id: null, name: "", capacity: "", stage: "1-qavat", status: "open", description: "" });

    const showToast = (text, type = "success") => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);
                const data = await managementApi.fetchAllData();
                setStructure(data.structure || []);
                setGroups(data.groups || []);
                setRooms(data.rooms || []);
                setTeachers(data.teachers || []);
                setStudents(data.students || []);
            } catch (err) { 
                showToast("Ma'lumotlarni yuklashda xatolik", "error"); 
            } finally { 
                setLoading(false); 
            }
        };
        loadAll();
    }, []);

    // --- AQLLI FILTRLAR (Foydalanuvchilar) ---
    const filteredUsers = useMemo(() => {
        let list = userRoleTab === 'student' ? students : teachers;

        // 1. Qidiruv (Ism, Email yoki ID bo'yicha)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(u => 
                u.name?.toLowerCase().includes(q) || 
                u.email?.toLowerCase().includes(q) ||
                u.id?.toLowerCase().includes(q)
            );
        }

        // 2. Status bo'yicha
        if (userStatusFilter === 'assigned') {
            list = list.filter(u => userRoleTab === 'student' ? u.groupId : u.subjectId);
        } else if (userStatusFilter === 'unassigned') {
            list = list.filter(u => userRoleTab === 'student' ? !u.groupId : !u.subjectId);
        }

        // 3. Guruh bo'yicha (Faqat studentlar uchun)
        if (userRoleTab === 'student' && selectedGroupFilter !== 'all') {
            list = list.filter(u => u.groupId === selectedGroupFilter);
        }

        return list;
    }, [students, teachers, userRoleTab, userStatusFilter, selectedGroupFilter, searchQuery]);


    // --- STRUKTURA LOGIKASI ---
    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    const openNodeModal = (type, parentId = null, currentItem = null) => {
        if (currentItem) setEditingNode(currentItem);
        else setEditingNode({ id: null, name: "", type, parentId });
        setIsNodeModalOpen(true);
    };

    const handleSaveNode = async (e) => {
        e.preventDefault();
        try {
            const saved = await managementApi.saveStructureNode(editingNode.id, {
                name: editingNode.name, type: editingNode.type, parentId: editingNode.parentId
            });
            if (editingNode.id) {
                setStructure(structure.map(s => s.id === editingNode.id ? saved : s));
                showToast("Muvaffaqiyatli yangilandi");
            } else {
                setStructure([...structure, saved]);
                showToast("Tugun yaratildi");
                setExpanded(prev => ({...prev, [editingNode.parentId]: true}));
            }
            setIsNodeModalOpen(false);
        } catch (err) { showToast("Xato yuz berdi", "error"); }
    };

    const handleDeleteNode = async (id) => {
        if (!window.confirm("Barcha ichki tarmoqlari bilan o'chib ketadi. Rozimisiz?")) return;
        try {
            await managementApi.deleteStructureNode(id);
            setStructure(structure.filter(s => s.id !== id && s.parentId !== id));
            showToast("O'chirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    // --- XONALAR LOGIKASI ---
    const openRoomModal = (room = null) => {
        if (room) setEditingRoom(room);
        else setEditingRoom({ id: null, name: "", capacity: "", stage: "1-qavat", status: "open", description: "" });
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        try {
            const { id, ...roomData } = editingRoom;
            const saved = await managementApi.saveRoom(id, roomData);
            if (id) {
                setRooms(rooms.map(r => r.id === id ? saved : r));
                showToast("Xona yangilandi");
            } else {
                setRooms([...rooms, saved]);
                showToast("Yangi xona qo'shildi");
            }
            setIsRoomModalOpen(false);
        } catch (err) { showToast("Saqlashda xato", "error"); }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm("Bu xonani butunlay o'chirasizmi?")) return;
        try {
            await managementApi.deleteRoom(id);
            setRooms(rooms.filter(r => r.id !== id));
            showToast("Xona o'chirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    // --- GURUH VA FOYDALANUVCHI BIRIKTIRISH LOGIKASI ---
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        const form = e.target;
        const majorId = form.major.value;
        const majorNode = structure.find(s => s.id === majorId);
        
        if (!majorNode) return showToast("Avval Yo'nalishni tanlang!", "error");

        const deptNode = structure.find(s => s.id === majorNode.parentId);

        const newGroupData = {
            name: form.name.value.toUpperCase(),
            majorId: majorNode.id, majorName: majorNode.name,
            deptId: deptNode.id, deptName: deptNode.name,
            year: form.year.value
        };

        try {
            const created = await managementApi.createGroup(newGroupData);
            setGroups([...groups, created]);
            form.reset();
            showToast("Guruh yaratildi");
        } catch (err) { showToast("Xato yuz berdi", "error"); }
    };

    const assignStudent = async (studentId, groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const payload = { groupId, groupName: group.name, majorName: group.majorName, department: group.deptName, majorId: group.majorId };
        try {
            await managementApi.assignStudentToGroup(studentId, payload);
            setStudents(students.map(s => s.id === studentId ? { ...s, ...payload } : s));
            showToast("Talaba guruhga biriktirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    const assignTeacher = async (teacherId, subjectId) => {
        const subject = structure.find(s => s.id === subjectId);
        if (!subject) return;
        const payload = { subjectId: subject.id, subject: subject.name };
        try {
            await managementApi.assignTeacherToSubject(teacherId, payload);
            setTeachers(teachers.map(t => t.id === teacherId ? { ...t, ...payload } : t));
            showToast("Fan o'qituvchiga biriktirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    // --- RENDER TREE ---
    const renderTree = (parentId = null, level = 0) => {
        const nodes = structure.filter(s => s.parentId === parentId);
        return nodes.map(node => (
            <div key={node.id} className="select-none animate-in fade-in duration-300">
                <div 
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all group border border-transparent ${level === 0 ? 'bg-white dark:bg-slate-800 shadow-sm mb-3' : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-100 dark:hover:border-indigo-500/20'}`}
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    <div onClick={() => toggleExpand(node.id)} className="flex items-center flex-1 cursor-pointer">
                        {node.type !== 'subject' ? (
                            expanded[node.id] ? <ChevronDown className="w-4 h-4 mr-2 text-indigo-500" /> : <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />
                        ) : <div className="w-4 mr-2"></div>}
                        
                        {node.type === 'dept' && <Folder className="w-4 h-4 mr-2 text-amber-500 fill-amber-500/20" />}
                        {node.type === 'major' && <Layers className="w-4 h-4 mr-2 text-indigo-500" />}
                        {node.type === 'subject' && <FileText className="w-4 h-4 mr-2 text-emerald-500" />}
                        
                        <span className={`text-sm font-bold tracking-tight ${node.type === 'dept' ? 'uppercase font-black text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {node.name}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openNodeModal(node.type, node.parentId, node)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-indigo-600 rounded-lg"><Edit3 className="w-3.5 h-3.5"/></button>
                        {node.type === 'dept' && <button onClick={() => openNodeModal('major', node.id)} className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg" title="Yo'nalish qo'shish"><Plus className="w-3.5 h-3.5"/></button>}
                        {node.type === 'major' && <button onClick={() => openNodeModal('subject', node.id)} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg" title="Fan qo'shish"><Plus className="w-3.5 h-3.5"/></button>}
                        <button onClick={() => handleDeleteNode(node.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                </div>
                {expanded[node.id] && renderTree(node.id, level + 1)}
            </div>
        ));
    };

    // Options
    const stageOptions = ["1-qavat", "2-qavat", "3-qavat", "4-qavat", "5-qavat", "Yerto'la"].map(s => ({ value: s, label: s }));
    const statusOptions = [{ value: "open", label: "Ochiq (Ishchi)" }, { value: "closed", label: "Yopiq (Ta'mirda)" }];
    const moveOptions = structure.filter(s => s.type === (editingNode.type === 'major' ? 'dept' : 'major')).map(parent => ({ value: parent.id, label: parent.name }));
    const studentGroupOptions = groups.map(g => ({ value: g.id, label: `${g.name} (${g.majorName || "Noma'lum"})` }));
    const teacherSubjectOptions = structure.filter(s => s.type === 'subject').map(sub => ({ value: sub.id, label: sub.name }));
    const groupFilterOptions = [{ value: "all", label: "Barcha Guruhlar" }, ...groups.map(g => ({ value: g.id, label: g.name }))];

    return (
        <div className="p-4 lg:p-10 w-full max-w-[1500px] mx-auto animate-in fade-in duration-500 relative">
            
            {toast && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-full shadow-2xl font-black text-[11px] uppercase tracking-widest flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-4 w-max max-w-[90vw] ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="mb-10">
                <h1 className="text-3xl md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight mb-6">Infratuzilma & Boshqaruv</h1>
                
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px] w-full md:w-max overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: "tree", label: "Struktura", icon: Layers },
                        { id: "rooms", label: "Xonalar", icon: DoorOpen },
                        { id: "groups", label: "Guruhlar", icon: Users },
                        { id: "users", label: "Foydalanuvchilar", icon: GraduationCap }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-5 py-3 rounded-[18px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
                            <tab.icon className="w-4 h-4 shrink-0" /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="py-40 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
                    
                    {/* STRUKTURA */}
                    {activeTab === 'tree' && (
                        <>
                            <div className="xl:col-span-8">
                                <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/20 p-4 md:p-8 rounded-[32px] border border-slate-100 dark:border-white/5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
                                        <div>
                                            <h2 className="text-xl font-black dark:text-white">Ierarxiya</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fakultet → Yo'nalish → Fanlar</p>
                                        </div>
                                        <button onClick={() => openNodeModal('dept')} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                                            <Plus className="w-4 h-4" /> <span>Fakultet qo'shish</span>
                                        </button>
                                    </div>
                                    {structure.filter(s => s.type === 'dept').length === 0 ? <p className="text-center py-10 text-slate-400 font-bold text-sm">Hozircha ma'lumot yo'q</p> : renderTree(null)}
                                </div>
                            </div>
                            <div className="xl:col-span-4 hidden xl:block">
                                <Card className="p-8 bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-500/20 sticky top-10">
                                    <Settings2 className="w-10 h-10 mb-6 opacity-50" />
                                    <h3 className="text-xl font-black mb-2">Xavfsiz Boshqaruv</h3>
                                    <p className="text-sm opacity-80 leading-relaxed font-medium">Tizim elementlarini joyini o'zgartirish (Move) yoki tahrirlash uchun ularning yonidagi qalamchani bosing.</p>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* XONALAR (ROOMS) */}
                    {activeTab === 'rooms' && (
                        <div className="xl:col-span-12">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Auditoriyalar Bazasi</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Infratuzilma nazorati</p>
                                </div>
                                <button onClick={() => openRoomModal()} className="flex items-center space-x-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all font-black text-xs uppercase tracking-widest">
                                    <Plus className="w-4 h-4" /> <span>Yangi Xona</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {(!rooms || rooms.length === 0) ? (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
                                        <DoorOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Xonalar bazasi bo'sh</p>
                                    </div>
                                ) : rooms.map(room => (
                                    <Card key={room.id} className="p-0 overflow-hidden flex flex-col group border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm">
                                        <div className={`p-5 border-b border-slate-50 dark:border-white/5 flex justify-between items-start ${room.status === 'closed' ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{room.name}</h3>
                                                <span className={`mt-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center w-max ${room.status === 'open' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                    {room.status === 'open' ? 'Ochiq' : 'Yopiq (Ta\'mirda)'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openRoomModal(room)} className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm"><Edit3 className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-4 flex-1">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                <span className="flex items-center"><Layers className="w-4 h-4 mr-2 text-indigo-400" /> Qavat:</span>
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">{room.stage}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                <span className="flex items-center"><Users className="w-4 h-4 mr-2 text-amber-400" /> Sig'imi:</span>
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">{room.capacity} kishi</span>
                                            </div>
                                            {room.description && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-50 dark:border-white/5 line-clamp-2">
                                                    {room.description}
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GURUHLAR BO'LIMI */}
                    {activeTab === 'groups' && (
                        <>
                            <div className="xl:col-span-4">
                                <Card className="p-6 md:p-8 sticky top-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                                    <h3 className="text-xl font-black mb-6">Yangi Guruh</h3>
                                    <form onSubmit={handleCreateGroup} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guruh Nomi</label>
                                            <input name="name" required placeholder="Masalan: KI-21" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm uppercase focus:ring-2 focus:ring-indigo-500/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yo'nalish (Major)</label>
                                            <select name="major" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30">
                                                <option value="">Tanlang...</option>
                                                {structure.filter(d => d.type === 'major').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O'quv Yili (Bosqich)</label>
                                            <input name="year" required placeholder="Masalan: 1-bosqich" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500/20" />
                                        </div>
                                        <button className="w-full mt-2 py-4 bg-indigo-600 text-white rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Saqlash</button>
                                    </form>
                                </Card>
                            </div>
                            <div className="xl:col-span-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(!groups || groups.length === 0) ? <p className="text-slate-400 font-bold p-4">Guruhlar yo'q</p> : groups.map(g => (
                                        <Card key={g.id} className="p-5 group hover:border-indigo-500 transition-all border border-slate-100 dark:border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{g.name}</span>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-3 line-clamp-1">{g.majorName}</h4>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 flex items-center">
                                                        <Folder className="w-3 h-3 mr-1" /> {g.deptName}
                                                    </p>
                                                </div>
                                                <button onClick={async () => {
                                                    if(window.confirm("O'chirasizmi?")) {
                                                        await managementApi.deleteGroup(g.id);
                                                        setGroups(groups.filter(gr => gr.id !== g.id));
                                                    }
                                                }} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* FOYDALANUVCHILAR BO'LIMI (YANGI VA IXCHAM) */}
                    {activeTab === 'users' && (
                        <div className="xl:col-span-12 flex flex-col gap-6">
                            
                            {/* Control Panel */}
                            <Card className="p-4 md:p-5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5">
                                <div className="flex flex-col lg:flex-row justify-between gap-4">
                                    
                                    {/* Role Tabs */}
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar shrink-0">
                                        <button 
                                            onClick={() => {setUserRoleTab('student'); setSearchQuery(''); setSelectedGroupFilter('all');}} 
                                            className={`flex-1 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${userRoleTab === 'student' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Talabalar ({students.length})
                                        </button>
                                        <button 
                                            onClick={() => {setUserRoleTab('teacher'); setSearchQuery(''); setSelectedGroupFilter('all');}} 
                                            className={`flex-1 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${userRoleTab === 'teacher' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Ustozlar ({teachers.length})
                                        </button>
                                    </div>

                                    {/* Filters & Search */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
                                        
                                        {/* Status Filtri */}
                                        <div className="w-full sm:w-44">
                                            <CustomSelect
                                                small={true}
                                                icon={Filter}
                                                placeholder="Barchasi"
                                                options={[
                                                    {label: "Barchasi", value: "all"},
                                                    {label: "Biriktirilgan", value: "assigned"},
                                                    {label: "Kutilmoqda", value: "unassigned"}
                                                ]}
                                                value={userStatusFilter}
                                                onChange={(val) => setUserStatusFilter(val)}
                                            />
                                        </div>

                                        {/* Guruh Filtri (Faqat Studentlar uchun) */}
                                        {userRoleTab === 'student' && (
                                            <div className="w-full sm:w-48">
                                                <CustomSelect
                                                    small={true}
                                                    icon={Users}
                                                    placeholder="Barcha Guruhlar"
                                                    options={groupFilterOptions}
                                                    value={selectedGroupFilter}
                                                    onChange={(val) => setSelectedGroupFilter(val)}
                                                />
                                            </div>
                                        )}

                                        {/* Qidiruv (Name, Email, ID) */}
                                        <div className="relative w-full sm:w-64 lg:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Ism, email yoki ID..." 
                                                value={searchQuery} 
                                                onChange={e => setSearchQuery(e.target.value)} 
                                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/20 shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Foydalanuvchilar Ro'yxati (Compact Grid) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-40">
                                {filteredUsers.length === 0 ? (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
                                        <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Ma'lumot topilmadi</p>
                                    </div>
                                ) : (
                                    filteredUsers.map(user => {
                                        const isAssigned = userRoleTab === 'student' ? !!user.groupId : !!user.subjectId;
                                        
                                        return (
                                            <Card key={user.id} className="p-4 flex flex-col group border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-md transition-all">
                                                
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <img 
                                                        src={user.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80"} 
                                                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700" 
                                                        alt="avatar"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-black text-slate-900 dark:text-white text-sm truncate leading-tight mb-0.5">{user.name}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                                                        <div className="flex items-center mt-1 text-[9px] font-bold text-slate-300 dark:text-slate-600">
                                                            <Hash className="w-3 h-3 mr-0.5" /> <span className="truncate">{user.id}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Kichik holat indikatori */}
                                                    <div className="shrink-0 self-start mt-1">
                                                        {isAssigned ? (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-500/10" title="Biriktirilgan"></div>
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50 dark:ring-rose-500/10 animate-pulse" title="Biriktirilmagan"></div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-slate-50 dark:border-white/5">
                                                    {userRoleTab === 'student' ? (
                                                        <CustomSelect 
                                                            small={true}
                                                            icon={Users}
                                                            placeholder="Guruh biriktiring..."
                                                            options={studentGroupOptions}
                                                            value={user.groupId || ""}
                                                            onChange={(val) => assignStudent(user.id, val)}
                                                        />
                                                    ) : (
                                                        <CustomSelect 
                                                            small={true}
                                                            icon={BookOpen}
                                                            placeholder="Fan biriktiring..."
                                                            options={teacherSubjectOptions}
                                                            value={user.subjectId || ""}
                                                            onChange={(val) => assignTeacher(user.id, val)}
                                                        />
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STRUKTURA MODALI */}
            {isNodeModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsNodeModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingNode.id ? "Tahrirlash" : "Yangi Qo'shish"}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                    {editingNode.type === 'dept' ? 'Fakultet' : editingNode.type === 'major' ? "Yo'nalish" : 'Fan'}
                                </p>
                            </div>
                            <button type="button" onClick={() => setIsNodeModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSaveNode} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomi</label>
                                <input required type="text" value={editingNode.name} onChange={e => setEditingNode({...editingNode, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Nomini kiriting..." />
                            </div>
                            {editingNode.type !== 'dept' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                                        <span>Qayerga joylashadi?</span><MoveRight className="w-3 h-3 text-indigo-400" />
                                    </label>
                                    <CustomSelect 
                                        icon={Layers} placeholder="Manzilni tanlang" options={moveOptions} value={editingNode.parentId} 
                                        onChange={(val) => setEditingNode({...editingNode, parentId: val})} 
                                    />
                                </div>
                            )}
                            <button type="submit" className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all">Saqlash</button>
                        </form>
                    </div>
                </div>
            )}

            {/* XONA MODALI */}
            {isRoomModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsRoomModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-8 flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingRoom.id ? "Xonani Tahrirlash" : "Yangi Xona"}</h3>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Auditoriya parametrlari</p>
                            </div>
                            <button type="button" onClick={() => setIsRoomModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSaveRoom} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Xona Nomi</label>
                                    <div className="relative">
                                        <DoorOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                        <input required type="text" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value.toUpperCase()})} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase" placeholder="A-102" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sig'imi</label>
                                    <div className="relative">
                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                        <input required type="number" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="50" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qavati (Stage)</label>
                                    <CustomSelect 
                                        icon={Layers} placeholder="Qavat" options={stageOptions} value={editingRoom.stage} 
                                        onChange={(val) => setEditingRoom({...editingRoom, stage: val})} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Holati</label>
                                    <CustomSelect 
                                        icon={Settings2} placeholder="Holati" options={statusOptions} value={editingRoom.status} 
                                        onChange={(val) => setEditingRoom({...editingRoom, status: val})} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qo'shimcha Tavsif</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3.5 top-4 w-4 h-4 text-slate-400"/>
                                    <textarea rows="3" value={editingRoom.description} onChange={e => setEditingRoom({...editingRoom, description: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Loyiha doskasi va proyektor mavjud..."></textarea>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 mt-2 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all">Saqlash</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
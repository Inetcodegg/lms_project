"use client";
import React, { useState, useEffect } from "react";
import Card from "../../../../components/Card";
import { 
    Users, DoorOpen, GraduationCap, BookOpen, Plus, Trash2, 
    ChevronRight, ChevronDown, Folder, FileText, Layers,
    Loader2, Search, Settings2, GripVertical, CheckCircle2, AlertCircle
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { 
    collection, getDocs, addDoc, doc, deleteDoc, 
    updateDoc, serverTimestamp
} from "firebase/firestore";

export default function AdminManagementPage() {
    const [activeTab, setActiveTab] = useState("tree"); // tree, groups, users
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // DB Data
    const [departments, setDepartments] = useState([]); // Tree structure
    const [groups, setGroups] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // UI States
    const [expanded, setExpanded] = useState({}); // Tree ochilib yopilishi
    const [searchQuery, setSearchQuery] = useState("");

    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. DATA SYNC - HAMMA MA'LUMOTLARNI BIRDAIGA OLISH
    const fetchEverything = async () => {
        setLoading(true);
        try {
            const [deptSnap, groupSnap, userSnap] = await Promise.all([
                getDocs(collection(db, "academic_structure")), // Tree shu yerda
                getDocs(collection(db, "groups")),
                getDocs(collection(db, "users"))
            ]);

            setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setGroups(groupSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAllUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            showToast("Ma'lumotlarni yangilashda xato", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEverything(); }, []);

    // --- TREE LOGIC (Departments -> Majors -> Subjects) ---
    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const addNode = async (parentId = null, type, label) => {
        if (!label) return;
        try {
            const newNode = {
                name: label,
                type: type, // 'dept', 'major', 'subject'
                parentId: parentId,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "academic_structure"), newNode);
            setDepartments([...departments, { ...newNode, id: docRef.id }]);
            showToast("Muvaffaqiyatli qo'shildi");
        } catch (err) { showToast("Xatolik yuz berdi", "error"); }
    };

    const deleteNode = async (id) => {
        if (!window.confirm("Bu tarmoqni o'chirsangiz, unga bog'liq barcha narsalar o'chadi. Rozimisiz?")) return;
        try {
            // Reasursiv o'chirish (Sodda ko'rinishi)
            await deleteDoc(doc(db, "academic_structure", id));
            setDepartments(departments.filter(d => d.id !== id && d.parentId !== id));
            showToast("O'chirildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    // --- GROUP LOGIC (Sinxronizatsiya bilan) ---
    const createGroup = async (e) => {
        e.preventDefault();
        const form = e.target;
        const majorId = form.major.value;
        const majorNode = departments.find(d => d.id === majorId);
        const deptNode = departments.find(d => d.id === majorNode.parentId);

        const newGroup = {
            name: form.name.value.toUpperCase(),
            majorId: majorId,
            majorName: majorNode.name,
            deptId: deptNode.id,
            deptName: deptNode.name,
            year: form.year.value,
            createdAt: serverTimestamp()
        };

        try {
            const res = await addDoc(collection(db, "groups"), newGroup);
            setGroups([...groups, { ...newGroup, id: res.id }]);
            form.reset();
            showToast("Guruh va uning akademik zanjiri yaratildi");
        } catch (err) { showToast("Xato", "error"); }
    };

    // --- STUDENT SYNC LOGIC (Eng muhim joyi) ---
    const assignStudentToGroup = async (studentId, groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const updateData = {
            groupId: groupId,
            groupName: group.name,
            majorName: group.majorName,
            department: group.deptName, // Student managementda ko'rinadigan bo'ladi
            majorId: group.majorId
        };

        try {
            await updateDoc(doc(db, "users", studentId), updateData);
            setAllUsers(allUsers.map(u => u.id === studentId ? { ...u, ...updateData } : u));
            showToast(`${group.name} guruhiga muvaffaqiyatli o'tkazildi`);
        } catch (err) { showToast("Sinxronizatsiyada xato", "error"); }
    };

    // Tree Helper
    const renderTree = (parentId = null, level = 0) => {
        const nodes = departments.filter(d => d.parentId === parentId);
        return nodes.map(node => (
            <div key={node.id} className="select-none">
                <div 
                    className={`flex items-center space-x-2 p-3 rounded-2xl transition-all cursor-pointer group ${level === 0 ? 'bg-white dark:bg-slate-800 shadow-sm mb-2' : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <div onClick={() => toggleExpand(node.id)} className="flex items-center flex-1">
                        {node.type !== 'subject' ? (
                            expanded[node.id] ? <ChevronDown className="w-4 h-4 mr-1 text-indigo-500" /> : <ChevronRight className="w-4 h-4 mr-1 text-slate-400" />
                        ) : <FileText className="w-4 h-4 mr-1 text-emerald-500" />}
                        
                        {node.type === 'dept' && <Folder className="w-4 h-4 mr-2 text-amber-500 fill-amber-500" />}
                        {node.type === 'major' && <Layers className="w-4 h-4 mr-2 text-indigo-500" />}
                        
                        <span className={`text-sm font-black tracking-tight ${node.type === 'dept' ? 'uppercase text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {node.name}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.type === 'dept' && (
                            <button onClick={() => addNode(node.id, 'major', prompt('Yo\'nalish nomini kiriting:'))} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Plus className="w-3.5 h-3.5"/></button>
                        )}
                        {node.type === 'major' && (
                            <button onClick={() => addNode(node.id, 'subject', prompt('Fan nomini kiriting:'))} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><BookOpen className="w-3.5 h-3.5"/></button>
                        )}
                        <button onClick={() => deleteNode(node.id)} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                </div>
                {expanded[node.id] && renderTree(node.id, level + 1)}
            </div>
        ));
    };

    return (
        <div className="p-4 lg:p-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-6 right-6 z-[600] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>{toast.text}</span>
                </div>
            )}

            <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Akademik Boshqaruv</h1>
                
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px] w-max">
                    {[
                        { id: "tree", label: "Shajara (Tree)", icon: Layers },
                        { id: "groups", label: "Guruhlar", icon: Users },
                        { id: "users", label: "Talaba & Ustoz", icon: GraduationCap },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            <tab.icon className="w-4 h-4" /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="py-40 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* ASOSIY TREE BO'LIMI */}
                    {activeTab === 'tree' && (
                        <>
                            <div className="xl:col-span-8">
                                <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/20 p-6 rounded-[32px] border border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-6 px-4">
                                        <h2 className="text-lg font-black dark:text-white">Struktura Ierarxiyasi</h2>
                                        <button onClick={() => addNode(null, 'dept', prompt('Fakultet nomini kiriting:'))} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                            <Plus className="w-4 h-4" /> <span>Fakultet Qo'shish</span>
                                        </button>
                                    </div>
                                    {departments.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold">Hozircha ma'lumot yo'q</p> : renderTree(null)}
                                </div>
                            </div>
                            <div className="xl:col-span-4">
                                <Card className="p-8 bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-500/20 sticky top-10">
                                    <Settings2 className="w-10 h-10 mb-6 opacity-50" />
                                    <h3 className="text-xl font-black mb-2">Tree Management</h3>
                                    <p className="text-sm opacity-80 leading-relaxed">
                                        Bu bo'limda universitetning barcha yo'nalishlarini boshqarishingiz mumkin. 
                                        Drag-and-drop orqali tartibni o'zgartiring va har bir yo'nalishga tegishli fanlarni biriktiring.
                                    </p>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* GURUHLAR BO'LIMI */}
                    {activeTab === 'groups' && (
                        <>
                            <div className="xl:col-span-4">
                                <Card className="p-8 sticky top-10">
                                    <h3 className="text-xl font-black mb-6">Yangi Guruh Yaratish</h3>
                                    <form onSubmit={createGroup} className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guruh Nomi</label>
                                            <input name="name" required placeholder="KI-21" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mt-1 outline-none font-black" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yo'nalishni Tanlang</label>
                                            <select name="major" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mt-1 outline-none font-bold">
                                                <option value="">Tanlang...</option>
                                                {departments.filter(d => d.type === 'major').map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O'quv Yili</label>
                                            <input name="year" required placeholder="2024-2025" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mt-1 outline-none font-bold" />
                                        </div>
                                        <button className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Guruhni Saqlash</button>
                                    </form>
                                </Card>
                            </div>
                            <div className="xl:col-span-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {groups.map(g => (
                                        <Card key={g.id} className="p-6 group hover:border-indigo-500 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest">{g.name}</span>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-3">{g.majorName}</h4>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 flex items-center">
                                                        <Folder className="w-3 h-3 mr-1" /> {g.deptName}
                                                    </p>
                                                </div>
                                                <button onClick={() => deleteNode(g.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* TALABALARNI TAQSIMLASH BO'LIMI */}
                    {activeTab === 'users' && (
                        <div className="xl:col-span-12">
                            <Card className="p-0 overflow-hidden border-none shadow-sm">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between gap-4">
                                    <h2 className="text-xl font-black">Talabalarni Taqsimlash</h2>
                                    <div className="relative group w-full md:w-80">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Ism yoki email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <tr><th className="p-6">Foydalanuvchi</th><th className="p-6">Fakultet / Yo'nalish</th><th className="p-6">Guruh Biriktirish</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {allUsers.filter(u => u.role === 'student' && (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))).map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-6">
                                                        <div className="flex items-center space-x-3">
                                                            <img src={s.avatar} className="w-10 h-10 rounded-2xl object-cover border border-slate-100" />
                                                            <div><p className="font-black text-sm">{s.name}</p><p className="text-[10px] font-bold text-slate-400">{s.email}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        {s.department ? (
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-black text-indigo-600 uppercase">{s.department}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.majorName}</p>
                                                            </div>
                                                        ) : <span className="text-xs font-bold text-rose-400">Taqsimlanmagan</span>}
                                                    </td>
                                                    <td className="p-6">
                                                        <select 
                                                            value={s.groupId || ""} 
                                                            onChange={(e) => assignStudentToGroup(s.id, e.target.value)}
                                                            className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border-none outline-none w-full max-w-[200px] text-xs font-black cursor-pointer"
                                                        >
                                                            <option value="">Guruhni tanlang</option>
                                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
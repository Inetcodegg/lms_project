import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
    value, 
    onChange, 
    options = [], 
    placeholder = "Tanlang...", 
    icon: Icon, 
    disabled = false 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Tashqariga bosilganda oynani yopish logikasi
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Tanlangan qiymatni topish
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* TUGMA QISMI */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold border transition-all duration-200 select-none outline-none
                ${disabled 
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/30'
                }
                ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}
                `}
            >
                <div className="flex items-center truncate">
                    {Icon && <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* OCHILADIGAN RO'YXAT (ANIMATSIYALI DROPDOWN) */}
            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5">
                        {options.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 font-bold text-center">Ma'lumot topilmadi</p>
                        ) : (
                            options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false); // Tanlangach yopiladi
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-bold transition-all mb-1 last:mb-0
                                        ${value === opt.value 
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                        }
                                    `}
                                >
                                    <span className="truncate pr-2">{opt.label}</span>
                                    
                                    {/* Tanlangan bo'lsa o'ng tomonda ptichka chiqadi */}
                                    {value === opt.value && <Check className="w-4 h-4 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
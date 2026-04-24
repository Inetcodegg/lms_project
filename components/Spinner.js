import React from 'react';

// Buni istalgan joyda <Spinner /> yoki <Spinner className="w-5 h-5 text-white" /> deb chaqira olasiz
export default function Spinner({ className = "w-5 h-5 text-indigo-600" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 1-Qatlam: Aylanuvchi Kvadrat */}
      <div className="absolute inset-0 border-2 border-current rounded-[30%] opacity-20 animate-[spin_3s_linear_infinite]"></div>
      
      {/* 2-Qatlam: Teskari Aylanuvchi Kvadrat */}
      <div className="absolute inset-0 border-2 border-current rounded-[30%] opacity-40 animate-[spin_2s_linear_infinite_reverse]"></div>
      
      {/* Markazdagi Puls nuqta */}
      <div className="w-1.5 h-1.5 bg-current rounded-full animate-ping"></div>
    </div>
  );
}
import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b-4 border-[#FFD93D] px-6 py-4 flex justify-between items-center transition-all">
      <div className="flex items-center gap-3">
        <strong className="text-3xl font-black tracking-tight text-[#2D3748]">Linaw</strong>
        <span className="text-sm text-[#4ECDC4] font-bold hidden sm:inline-block border-l-2 border-gray-200 pl-3 uppercase tracking-wider">
          Reading Superpowers
        </span>
      </div>
      <button className="px-6 py-3 rounded-2xl bg-[#4ECDC4] text-white font-bold hover:bg-[#3dbdb4] hover:scale-105 hover:rotate-1 transition-all shadow-[0_4px_0_#2b9e96] active:shadow-none active:translate-y-[4px]">
        Get Extension
      </button>
    </header>
  );
}
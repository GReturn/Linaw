import React from 'react';
import { 
  Plus, Brain, Calculator, Atom, Github, Microscope, Globe, File
} from 'lucide-react';

export default function Dashboard() {
  const scrollToDemo = () => {
    const element = document.getElementById('interactive-demo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-32 flex flex-col items-center">
      {/* 4x2 Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl">
        
        {/* 1. Upload Card */}
        <button className="group aspect-square rounded-[2rem] border-2 border-dashed border-[#4ECDC4]/50 hover:border-[#4ECDC4] bg-[#E0F7FA]/50 hover:bg-[#E0F7FA] flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_10px_30px_rgba(78,205,196,0.15)] hover:-translate-y-1">
          <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#4ECDC4] group-hover:text-white text-[#4ECDC4] transition-all duration-300">
            <Plus size={28} />
          </div>
          <span className="font-bold text-[#4ECDC4]">Upload PDF</span>
        </button>

        {/* 2. Psych Card (Triggers scroll to demo) */}
        <button onClick={scrollToDemo} className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93D]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#FFD93D] text-[#2D3748] transition-all duration-300 relative z-10">
            <Brain size={28} />
          </div>
          <span className="font-bold text-[#2D3748] relative z-10">Psychology</span>
        </button>

        {/* 3. Math Card */}
        <button className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#f0fdf4] text-[#2D3748] group-hover:text-[#4ECDC4] transition-all duration-300">
            <Calculator size={28} />
          </div>
          <span className="font-bold text-[#2D3748]">Mathematics</span>
        </button>

        {/* 4. Science Card */}
        <button className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#e0f2fe] text-[#2D3748] group-hover:text-[#0284c7] transition-all duration-300">
            <Atom size={28} />
          </div>
          <span className="font-bold text-[#2D3748]">Science</span>
        </button>

        {/* 5. GitHub Card */}
        <a href="https://github.com" target="_blank" rel="noreferrer" className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#2D3748] text-[#2D3748] group-hover:text-white transition-all duration-300">
            <Github size={28} />
          </div>
          <span className="font-bold text-[#2D3748]">GitHub</span>
        </a>

        {/* 6. Research Card */}
        <button className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#fdf4ff] text-[#2D3748] group-hover:text-[#c026d3] transition-all duration-300">
            <Microscope size={28} />
          </div>
          <span className="font-bold text-[#2D3748]">Research</span>
        </button>

        {/* 7. SDG Card */}
        <button className="group aspect-square rounded-[2rem] bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#fff7ed] text-[#2D3748] group-hover:text-[#ea580c] transition-all duration-300">
            <Globe size={28} />
          </div>
          <span className="font-bold text-[#2D3748]">SDG 4</span>
        </button>

        {/* 8. Blank / Placeholder Card */}
        <div className="aspect-square rounded-[2rem] border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center">
          <File size={32} className="text-gray-300 mb-2" />
          <span className="font-medium text-gray-400 text-sm">Empty Slot</span>
        </div>

      </div>
    </section>
  );
}

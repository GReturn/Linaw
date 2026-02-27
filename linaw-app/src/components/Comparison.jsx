import React from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

export default function Comparison() {
  return (
    <section className="relative">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-3xl font-bold inline-block relative">
          More than translation
          <span className="absolute -bottom-3 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-16 h-2 bg-[#FF6B6B] rounded-full"></span>
        </h2>
        <p className="text-[#6b7280] max-w-xl mt-6 text-lg mx-auto md:mx-0">
          Linaw does not simply convert words between languages. It explains ideas the way learners naturally understand them.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bad Example */}
        <div className="bg-white border-l-4 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 font-semibold mb-6 uppercase tracking-wider text-sm">
            <XCircle size={18} /> What most tools do
          </div>
          <h3 className="text-xl font-bold mb-4">Literal translation</h3>
          <div className="bg-gray-50 p-4 rounded-xl mb-4 font-medium text-lg flex items-center gap-3">
            Photosynthesis <ChevronRight className="text-gray-400" /> Fotosintesis
          </div>
          <p className="text-[#6b7280]">
            Direct word substitution with little regard for meaning, context, or cognitive load.
          </p>
        </div>

        {/* Good Example */}
        <div className="bg-white border-l-4 border-[#4ECDC4] rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-2 text-[#4ECDC4] font-black mb-6 uppercase tracking-wider text-sm">
            <CheckCircle2 size={18} /> The Linaw Way
          </div>
          <h3 className="text-xl font-bold mb-4">Localized understanding</h3>
          <div className="bg-[#E0F7FA] p-4 rounded-xl mb-4 font-medium text-lg flex items-center gap-3 border border-[#4ECDC4]">
            <span className="bg-[#FFD93D] px-2 rounded text-[#2D3748] font-bold">Photosynthesis</span>
            <ChevronRight className="text-[#4ECDC4] shrink-0" />
            <span className="text-[#008080] italic font-bold">Pagluto sa pagkaon gamit ang adlaw</span>
          </div>
          <p className="text-[#6b7280]">
            Concepts are explained in familiar language, grounded in how learners think and reason.
          </p>
        </div>
      </div>
    </section>
  );
}
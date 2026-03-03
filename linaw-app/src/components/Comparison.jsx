import React from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

export default function Comparison() {
  return (
    <section className="relative py-32 overflow-hidden">

      {/* Glass blur layer (smooth transition) */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>

      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-[#4ECDC4]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-extrabold tracking-tight text-[#1f2933]">
            More than translation
          </h2>

          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Linaw doesn’t just swap words between languages.
            It explains ideas in a way that actually makes sense to learners.
          </p>

          <div className="mt-8 w-20 h-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mx-auto rounded-full"></div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-12 items-stretch">

          {/* ❌ Traditional Tools */}
          <div className="
            relative
            bg-gray-50
            p-10
            rounded-[32px]
            border border-gray-200
            shadow-sm
          ">
            <div className="flex items-center gap-2 text-gray-400 font-semibold uppercase tracking-wider text-sm mb-6">
              <XCircle size={18} />
              What most tools do
            </div>

            <h3 className="text-2xl font-bold mb-6 text-[#1f2933]">
              Literal translation
            </h3>

            <div className="bg-white p-5 rounded-xl mb-6 font-medium text-lg flex items-center gap-3 border border-gray-200 shadow-sm">
              Photosynthesis
              <ChevronRight className="text-gray-400 shrink-0" />
              Fotosintesis
            </div>

            <p className="text-gray-500 leading-relaxed">
              Direct word substitution with little regard for meaning,
              context, or how students actually process information.
            </p>
          </div>

          {/* ✅ Linaw Way */}
          <div className="
            relative
            bg-white
            p-10
            rounded-[32px]
            border border-[#4ECDC4]/30
            shadow-[0_20px_60px_rgba(78,205,196,0.15)]
            hover:-translate-y-2
            transition-all
            duration-500
          ">

            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#4ECDC4]/5 to-[#FFD93D]/10 pointer-events-none"></div>

            <div className="relative">

              <div className="flex items-center gap-2 text-[#4ECDC4] font-black uppercase tracking-wider text-sm mb-6">
                <CheckCircle2 size={18} />
                The Linaw Way
              </div>

              <h3 className="text-2xl font-bold mb-6 text-[#1f2933]">
                Localized understanding
              </h3>

              <div className="bg-[#f0fdfc] p-5 rounded-xl mb-6 font-medium text-lg flex items-center gap-3 border border-[#4ECDC4]/30 shadow-sm">
                <span className="bg-[#FFD93D] px-3 py-1 rounded-lg text-[#2D3748] font-bold">
                  Photosynthesis
                </span>

                <ChevronRight className="text-[#4ECDC4] shrink-0" />

                <span className="text-[#008080] italic font-bold">
                  Pagluto sa pagkaon gamit ang adlaw
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed">
                Instead of translating words, Linaw translates meaning —
                grounded in how learners think, speak, and reason.
              </p>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
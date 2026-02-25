import React from 'react';
import { Star, MousePointer2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="text-center mb-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD93D] text-[#2D3748] font-black text-sm mb-6 animate-bounce shadow-sm border-2 border-white">
        <Star size={16} className="fill-white text-white" />
        Make it rain, make it rainnnn!
        <Star size={16} className="fill-white text-white" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-4 text-[#2D3748]">
        Unlock the <span className="text-[#FF6B6B] underline decoration-wavy decoration-[#FFD93D]">Magic Words</span>!
      </h1>
      <p className="text-xl text-[#718096] flex items-center justify-center gap-2 font-medium">
        <MousePointer2 size={24} className="text-[#4ECDC4]" />
        Tap the glowing words to see who they really are.
      </p>
    </section>
  );
}
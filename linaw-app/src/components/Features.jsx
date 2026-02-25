import React from 'react';
import { Sparkles, ImageIcon, Volume2 } from 'lucide-react';

const featuresList = [
  { icon: Sparkles, title: "Speak your language", desc: "Concepts are explained in Bisaya or Tagalog, just like how your friends talk!" },
  { icon: ImageIcon, title: "Picture this", desc: "Fun pictures and diagrams help you remember tricky science stuff." },
  { icon: Volume2, title: "Listen & Learn", desc: "Tired of reading? Just press play and listen to the explanation." }
];

export default function Features() {
  return (
    <section className="mb-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold inline-block relative">
          Superpowers for Reading
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-[#FFD93D] rounded-full"></span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {featuresList.map((feature, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-gray-100 hover:border-[#4ECDC4] group">
            <div className="w-14 h-14 bg-[#E0F7FA] text-[#4ECDC4] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#4ECDC4] group-hover:text-white transition-all duration-300 rotate-3 group-hover:rotate-6">
              <feature.icon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-[#6b7280] leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
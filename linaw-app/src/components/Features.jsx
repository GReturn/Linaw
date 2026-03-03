import React from 'react';
import { Sparkles, ImageIcon, Volume2 } from 'lucide-react';

const featuresList = [
  {
    icon: Sparkles,
    title: "Speak your language",
    desc: "Concepts are explained in Bisaya or Tagalog — naturally, the way your friends would explain it."
  },
  {
    icon: ImageIcon,
    title: "Picture this",
    desc: "Clean illustrations and visuals make complex ideas easier to remember and understand."
  },
  {
    icon: Volume2,
    title: "Listen & learn",
    desc: "Too tired to read? Tap play and let the explanation guide you."
  }
];

export default function Features() {
  return (
    <section className="relative py-32 overflow-hidden">

  {/* Soft blur glass layer */}
  <div className="absolute inset-0 bg-white/50 backdrop-blur-md"></div>

  {/* Decorative gradient blobs (stay behind content) */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#4ECDC4]/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#FFD93D]/10 rounded-full blur-3xl"></div>
  </div>

  <div className="relative max-w-6xl mx-auto px-6">

    {/* Section Header */}
    <div className="text-center mb-20">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1f2933]">
        Reading Made Easy
      </h2>

      <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
        Everything you need to turn confusing textbooks into something that actually makes sense.
      </p>

      <div className="mt-8 w-20 h-1.5 bg-gradient-to-r from-[#FFD93D] to-[#4ECDC4] mx-auto rounded-full"></div>
    </div>

    {/* Cards */}
    <div className="grid md:grid-cols-3 gap-10">
      {featuresList.map((feature, idx) => (
        <div
          key={idx}
          className="
            relative
            group
            bg-white
            p-10
            rounded-[32px]
            border border-gray-100
            shadow-[0_15px_40px_rgba(0,0,0,0.04)]
            hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)]
            hover:-translate-y-2
            transition-all
            duration-500
          "
        >
          <div className="
            w-16 h-16
            rounded-3xl
            bg-gradient-to-br from-[#4ECDC4]/15 to-[#FFD93D]/20
            flex items-center justify-center
            text-[#4ECDC4]
            mb-8
            group-hover:scale-110
            transition-transform
            duration-500
          ">
            <feature.icon size={28} strokeWidth={2.5} />
          </div>

          <h3 className="text-2xl font-bold mb-4 text-[#1f2933]">
            {feature.title}
          </h3>

          <p className="text-gray-500 leading-relaxed text-[15px]">
            {feature.desc}
          </p>

          <div className="
            absolute bottom-0 left-0
            h-1 w-0
            bg-gradient-to-r from-[#4ECDC4] to-[#FFD93D]
            rounded-full
            group-hover:w-full
            transition-all
            duration-500
          "></div>
        </div>
      ))}
    </div>

  </div>
</section>
  );
}
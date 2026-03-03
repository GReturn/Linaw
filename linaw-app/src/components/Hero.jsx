import React from 'react';
import { MousePointer2 } from 'lucide-react';

export default function Hero() {
  return (
    <div className="mb-10 text-left">
      
      <h1 className="text-8xl md:text-6xl font-bold leading-tight tracking-tight text-[#1f2933]">
        Unlock deeper understanding,
        <span className="block text-[#4ECDC4]">
          one word at a time.
        </span>
      </h1>

      <p className="mt-6 text-lg text-gray-600 flex items-center gap-3 font-medium">
        <MousePointer2 size={20} className="text-[#4ECDC4]" />
        Tap any highlighted word and see it explained in your language.
      </p>

    </div>
  );
}
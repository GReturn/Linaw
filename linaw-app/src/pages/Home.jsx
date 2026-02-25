import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import InteractiveReader from '../components/InteractiveReader';
import Features from '../components/Features';
import Comparison from '../components/Comparison';

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#2D3748] font-sans overflow-x-hidden relative selection:bg-[#FF6B6B] selection:text-white">
      {/* Dynamic Background Gradients */}
      <div
        className="fixed inset-0 pointer-events-none transition-transform duration-700 ease-out z-0"
        style={{ transform: `translate(${mousePos.x * -0.01}px, ${mousePos.y * -0.01}px)` }}
      >
        <div className="absolute top-[-10%] left-[10%] w-[800px] h-[800px] bg-[#4ECDC4] opacity-[0.1] blur-[100px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#FF6B6B] opacity-[0.08] blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[#FFD93D] opacity-[0.1] blur-[100px] rounded-full mix-blend-multiply"></div>
      </div>

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Hero />
        <InteractiveReader />
        <Features />
        <Comparison />
      </main>
    </div>
  );
}
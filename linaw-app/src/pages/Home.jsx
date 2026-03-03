import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import InteractiveReader from '../components/InteractiveReader';
import Features from '../components/Features';
import Comparison from '../components/Comparison';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {

  const navigate = useNavigate();
  const { handleGoogleSignUp } = useAuth();

  const handleSignUp = () => {
    navigate('/auth?mode=register');
  };

  return (
    <div className="min-h-screen text-[#1f2933] font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(78,205,196,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,217,61,0.06),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(255,107,107,0.05),transparent_50%)] bg-white">

      <Header />

      {/* HERO + PRODUCT */}
      <section className="pt-40 pb-32">
        <div className="max-w-[1700px] mx-auto px-6 grid lg:grid-cols-[1.85fr_1fr] gap-32 items-start">

          {/* LEFT SIDE — 60–65% */}
          <div>
            <h1 className="text-[200px] lg:text-[150px] leading-[0.92] tracking-[-2px] font-bold text-[#1f2933]">
              Unlock deeper
              <span className="block text-[#4ECDC4]">
                understanding,
              </span>
              <span className="block">
                one word at a time.
              </span>
            </h1>

            <p className="mt-12 text-3xl text-gray-600 leading-relaxed max-w-3xl">
              Tap any highlighted word and see it explained in your language — clearly and naturally.
            </p>

            {/* CTA BUTTONS */}
            <div className="mt-16 flex gap-8">

              <button 
                onClick={handleSignUp}
                className="
                w-[280px] h-[64px]
                rounded-lg
                bg-gradient-to-br from-[#4ECDC4] to-[#3dbdb4]
                text-black
                text-lg
                font-semibold
                flex items-center justify-center
                shadow-[0_8px_20px_rgba(78,205,196,0.25)]
                hover:translate-y-[-3px]
                hover:shadow-[0_14px_30px_rgba(78,205,196,0.35)]
                transition-all duration-300
              ">
                Sign up — It’s free
              </button>

              <button
              onClick={handleGoogleSignUp} 
              className="
                w-[280px] h-[64px]
                rounded-lg
                bg-white/80
                border border-gray-300
                text-gray-800
                text-lg
                font-semibold
                flex items-center justify-center
                hover:bg-white
                hover:translate-y-[-3px]
                hover:shadow-md
                transition-all duration-300
              ">
                Sign up with Google
              </button>

            </div>
          </div>

          {/* RIGHT SIDE — 35–40% */}
          <div className="scale-[0.9] origin-right">
            <InteractiveReader />
          </div>

        </div>
      </section>

      {/* SOFT DIVIDER */}
      <div className="border-t border-gray-200" />

      {/* FEATURES */}
      <section className="py-24 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6">
          <Features />
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Comparison />
        </div>
      </section>

    </div>
  );
}
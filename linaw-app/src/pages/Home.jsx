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

  const handleGoogleAndRedirect = async () => {
    await handleGoogleSignUp();
    navigate("/notebook/dashboard");
  };

  return (
    <div className="min-h-screen text-[#1f2933] font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(78,205,196,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,217,61,0.06),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(255,107,107,0.05),transparent_50%)] bg-white pt-10">

      <Header />

      {/* HERO + PRODUCT */}
      <section className="pt-28 md:pt-36 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Only this part uses grid */}
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-16 lg:gap-20 items-start">

            {/* LEFT SIDE */}
            <div className="text-center lg:text-left">

              <h1 className="
                font-bold
                leading-tight
                tracking-tight
                text-[clamp(2.5rem,6vw,4.5rem)]
                text-[#1f2933]
              ">
                Unlock deeper
                <span className="block text-[#4ECDC4]">
                  understanding,
                </span>
                <span className="block">
                  one word at a time.
                </span>
              </h1>

              <p className="
                mt-6 md:mt-8
                text-lg md:text-xl
                text-gray-600
                max-w-xl
                mx-auto lg:mx-0
              ">
                Tap any highlighted word and see it explained in your language — clearly and naturally.
              </p>

              {/* CTA BUTTONS */}
              <div className="
                mt-8 md:mt-10
                flex flex-col sm:flex-row
                items-center lg:items-start
                justify-center lg:justify-start
                gap-4 sm:gap-6
              ">

                <button 
                  onClick={handleSignUp}
                  className="
                    w-full sm:w-[260px] h-[56px]
                    rounded-lg
                    bg-gradient-to-br from-[#4ECDC4] to-[#3dbdb4]
                    text-black
                    text-base
                    font-semibold
                    flex items-center justify-center
                    shadow-[0_8px_20px_rgba(78,205,196,0.25)]
                    hover:-translate-y-1
                    hover:shadow-[0_14px_30px_rgba(78,205,196,0.35)]
                    transition-all duration-300
                  ">
                  Get Extension — It’s free
                </button>

                {/* <button
                  onClick={handleGoogleAndRedirect}
                  className="
                    w-full sm:w-[260px] h-[56px]
                    rounded-lg
                    bg-white
                    border border-gray-300
                    text-gray-800
                    text-base
                    font-semibold
                    flex items-center justify-center
                    hover:bg-gray-50
                    hover:-translate-y-1
                    hover:shadow-md
                    transition-all duration-300
                  ">
                  Sign up with Google
                </button> */}

              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full max-w-[625px] mx-auto lg:ml-auto mt-12 lg:mt-0 ">
              <InteractiveReader preview />
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES */}

          <Features />


      {/* COMPARISON */}
     
          <Comparison />

    </div>
  );
}
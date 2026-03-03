import React, { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleMouseMove = (e) =>
      setMousePos({ x: e.clientX, y: e.clientY });

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
  <div className="min-h-screen text-[#1E293B] font-sans bg-[radial-gradient(circle_at_15%_20%,rgba(78,205,196,0.06),transparent_40%),radial-gradient(circle_at_85%_70%,rgba(255,107,107,0.05),transparent_50%)] bg-[#FFFDF9]">

    <DashboardHeader />

    <main className="pt-28 pb-32 px-8">
      <div className="max-w-[1400px] mx-auto">

        {/* ===== Header Section ===== */}
        <div className="mb-16">
          <h1 className="text-6xl font-extrabold tracking-tight leading-[1.05]">
            Your notebooks,
            <span className="block text-[#4ECDC4]">
              all in one place.
            </span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-3xl leading-relaxed">
            Revisit insights, continue where you left off, and grow your understanding —
            one page at a time.
          </p>
        </div>

        {/* ===== Controls Bar ===== */}
        <div className="flex items-center justify-between mb-12">

          {/* Search */}
          <div className="relative w-[420px]">
            <input
              type="text"
              placeholder="Search notebooks..."
              className="w-full px-6 py-4 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]"
            />
          </div>

          {/* Optional subtle stat */}
          <div className="text-sm text-gray-500 font-medium">
            12 notebooks
          </div>
        </div>


        <Dashboard />

      </div>
    </main>
  </div>
);
}
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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-[#FDFCF8] to-[#F7FAFC] text-[#1E293B] font-sans relative overflow-hidden">

      {/* Subtle Animated Background */}
      <div
        className="fixed inset-0 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * -0.015}px, ${mousePos.y * -0.015}px)`
        }}
      >
        <div className="absolute top-[-10%] left-[5%] w-[700px] h-[700px] bg-[#4ECDC4] opacity-[0.06] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[#FF6B6B] opacity-[0.05] blur-[120px] rounded-full"></div>
      </div>

      <DashboardHeader />

      <main className="relative z-10 pt-28 pb-24 px-6">
  <div className="max-w-6xl mx-auto">

    {/* Title Section */}
    <div className="mb-12">
      <h1 className="text-5xl font-black tracking-tight text-[#2D3748]">
        Your Reading Workspace
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-2xl">
        Organize your thoughts, revisit insights, and build deeper understanding —
        one notebook at a time.
      </p>
    </div>

    {/* Search Bar */}
    <div className="mb-14">
      <div className="relative max-w-xl">
        <input
          type="text"
          placeholder="Search notebooks..."
          className="w-full px-6 py-4 rounded-2xl bg-white shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] transition"
        />
      </div>
    </div>

    {/* Notebook Grid (No Heavy Background Card) */}
    <div>
      <Dashboard />
    </div>

  </div>
</main>
    </div>
  );
}
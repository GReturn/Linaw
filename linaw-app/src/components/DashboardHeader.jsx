import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b-4 border-[#FFD93D] px-6 py-4 flex justify-between items-center transition-all">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <strong className="text-3xl font-black tracking-tight text-[#2D3748]">Linaw</strong>
        <span className="text-sm text-[#4ECDC4] font-bold hidden sm:inline-block border-l-2 border-gray-200 pl-3 uppercase tracking-wider">
          Reading Superpowers
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <button onClick={handleSettings} className="px-6 py-3 rounded-2xl bg-[#4ECDC4] text-black font-bold hover:bg-[#3dbdb4] hover:scale-105 hover:rotate-1 transition-all shadow-[0_4px_0_#2b9e96] active:shadow-none active:translate-y-[4px]">
          Settings
        </button>
        <button onClick={handleLogout} className="px-6 py-3 rounded-2xl bg-[#FF6B6B] text-black font-bold hover:bg-[#ff5252] hover:scale-105 hover:rotate-1 transition-all shadow-[0_4px_0_#d32f2f] active:shadow-none active:translate-y-[4px]">
          Logout
        </button>
      </div>
    </header>
  );
}
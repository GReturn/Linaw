import React, { useState, useEffect, useRef } from "react";
import { Book, History, LogOut, ChevronDown, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ExtensionAuth from "./ExtensionAuth";
import ExtensionExplain from "./ExtensionExplain";
import ExtensionDictionary from "./ExtensionDictionary";
import logoLinaw from "../../assets/logo-linaw.svg";

const WEB_APP_URL = import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export default function SidePanel() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("explain");
  const [selectedWord, setSelectedWord] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [contextText, setContextText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState("Cebuano (CEB)");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    "None (EN)",
    "Tagalog (TGL)",
    "Cebuano (CEB)",
    "Waray (WAR)",
    "Ilocano (ILO)",
    "Pangasinense (PAG)",
    "Hiligaynon (HIL)",
    "Bikolano (BIK)",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for changes from the background script
  useEffect(() => {
    if (!chrome || !chrome.storage) return;

    // Load initial word
    chrome.storage.session.get(['linawSelectedWord', 'linawWordCount', 'linawContextText'], (result) => {
      if (result.linawSelectedWord) {
        setSelectedWord(result.linawSelectedWord);
        setWordCount(result.linawWordCount || 0);
        setContextText(result.linawContextText || '');
        setActiveTab("explain");
      }
    });

    // Listen for future highlights
    const storageListener = (changes, namespace) => {
      if (namespace === 'session' && changes.linawSelectedWord) {
        setSelectedWord(changes.linawSelectedWord.newValue);
        setWordCount(changes.linawWordCount ? changes.linawWordCount.newValue : 0);
        if (changes.linawContextText) {
          setContextText(changes.linawContextText.newValue);
        }
        setActiveTab("explain");
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  const handleHistoryItemClick = (term) => {
    setSelectedWord(term);
    setContextText(term);
    setActiveTab("explain");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#3DBDB4] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <ExtensionAuth />;
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <a
          href={WEB_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Open Linaw web app"
        >
          <img src={logoLinaw} alt="Linaw Logo" className="w-6 h-6 object-contain" />
          <h2 className="font-black text-lg tracking-tight text-[#2D3748]">Linaw</h2>
        </a>
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-sm ${isDropdownOpen
                  ? 'bg-white border-[#3DBDB4]/30 shadow-[#3DBDB4]/10 ring-2 ring-[#3DBDB4]/20'
                  : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDropdownOpen ? 'text-[#3DBDB4]' : 'text-gray-500'
                }`}>
                {targetLanguage === "None (EN)" ? "NONE (EN)" : targetLanguage}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#3DBDB4]' : 'text-gray-400'
                }`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 py-2 z-50">
                <div className="px-3 py-2 mb-1 border-b border-gray-50">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Language</span>
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setTargetLanguage(lang);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all ${targetLanguage === lang
                        ? 'bg-[#3DBDB4]/10 text-[#3DBDB4]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } flex items-center justify-between group`}
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{lang}</span>
                    {targetLanguage === lang && <Check size={14} className="animate-in zoom-in-50 duration-200" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-md transition-all border border-transparent hover:border-[#FF6B6B]/20"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 mx-4 mt-4 rounded-lg shrink-0 border border-gray-200 shadow-inner">
        <button
          onClick={() => setActiveTab("explain")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === "explain" ? "bg-white shadow-sm text-[#3DBDB4]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Book size={14} /> Explain
        </button>
        <button
          onClick={() => setActiveTab("dictionary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === "dictionary" ? "bg-white shadow-sm text-[#FF6B6B]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <History size={14} /> Dictionary
        </button>
      </div >

      {/* Content Area */}
      {
        activeTab === "explain" ? (
          <ExtensionExplain
            selectedWord={selectedWord}
            wordCount={wordCount}
            targetLanguage={targetLanguage}
            contextText={contextText}
            onHistoryItemClick={handleHistoryItemClick}
          />
        ) : (
          <ExtensionDictionary
            onHistoryItemClick={handleHistoryItemClick}
          />
        )
      }
    </div >
  );
}
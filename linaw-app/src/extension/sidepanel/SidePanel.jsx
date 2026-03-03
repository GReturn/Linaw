import React, { useState, useEffect } from "react";
import { Book, History, LogOut } from "lucide-react";
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
  const [targetLanguage, setTargetLanguage] = useState("Cebuano (CEB)");

  // Listen for changes from the background script
  useEffect(() => {
    if (!chrome || !chrome.storage) return;

    // Load initial word
    chrome.storage.session.get(['linawSelectedWord', 'linawWordCount'], (result) => {
      if (result.linawSelectedWord) {
        setSelectedWord(result.linawSelectedWord);
        setWordCount(result.linawWordCount || 0);
        setActiveTab("explain");
      }
    });

    // Listen for future highlights
    const storageListener = (changes, namespace) => {
      if (namespace === 'session' && changes.linawSelectedWord) {
        setSelectedWord(changes.linawSelectedWord.newValue);
        setWordCount(changes.linawWordCount ? changes.linawWordCount.newValue : 0);
        setActiveTab("explain");
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  const handleHistoryItemClick = (term) => {
    setSelectedWord(term);
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
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200 shadow-inner">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="text-[9px] font-black text-gray-500 uppercase tracking-tighter bg-transparent outline-none cursor-pointer appearance-none text-center truncate max-w-[90px]"
              style={{ textAlignLast: 'center' }}
            >
              <option value="None (EN)">NONE (EN)</option>
              <option value="Tagalog (TGL)">TAGALOG (TGL)</option>
              <option value="Cebuano (CEB)">CEBUANO (CEB)</option>
              <option value="Waray (WAR)">WARAY (WAR)</option>
              <option value="Ilocano (ILO)">ILOCANO (ILO)</option>
              <option value="Pangasinense (PAG)">PANGASINENSE (PAG)</option>
              <option value="Hiligaynon (HIL)">HILIGAYNON (HIL)</option>
              <option value="Bikolano (BIK)">BIKOLANO (BIK)</option>
            </select>
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
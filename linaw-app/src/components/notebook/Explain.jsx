import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Volume2, Maximize2, AlertCircle, Lightbulb, Check, X, Search, ChevronDown } from 'lucide-react';
import LinawLoader from '../common/LinawLoader';

const SkeletonBlock = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const Explain = ({
    mobileView,
    loading,
    isDefining,
    isTranslating,
    selectedWord,
    pendingWord,
    definition,
    confusionTerms,
    handleHistoryItemClick,
    highlightSuggestion,
    onAcceptSuggestion,
    onDismissSuggestion,
    targetLanguage,
    setTargetLanguage,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Helper to get abbreviation for the badge
    const getAbbreviation = (langStr) => {
        if (!langStr) return "CE";
        const match = langStr.match(/\((.*?)\)/);
        return match ? match[1] : "CE";
    };

    const langAbbr = getAbbreviation(targetLanguage);

    const showEmptyState = !selectedWord && !pendingWord && !loading && !isDefining;

    return (
        <aside className={`${mobileView === 'insights' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-l border-gray-100 p-5 flex-col gap-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 text-[#3DBDB4]">
                    <Sparkles size={16} /> Explain
                </h3>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-sm ${isDropdownOpen
                                ? 'bg-white border-[#3DBDB4]/30 shadow-[#3DBDB4]/10 ring-2 ring-[#3DBDB4]/20'
                                : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isDropdownOpen ? 'text-[#3DBDB4]' : 'text-gray-500'}`}>
                            {targetLanguage === "None (EN)" ? "NONE (EN)" : targetLanguage}
                        </span>
                        <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#3DBDB4]' : 'text-gray-400'}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
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
            </div>

            {/* Empty state */}
            {showEmptyState && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-60">
                    <Search size={32} className="text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-400 mb-1">No word selected</p>
                    <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed">
                        Highlight text in the PDF and press <span className="font-bold text-[#3DBDB4]">Define</span> to get started
                    </p>
                </div>
            )}

            {/* Semantic gate loading (pre-confirm) */}
            {loading && <LinawLoader text="Checking selection..." className="py-2" />}

            {/* N-gram suggestion banner */}
            {highlightSuggestion && (
                <div className="bg-[#3DBDB4]/10 border border-[#3DBDB4]/30 rounded-xl p-4 animate-[fadeSlideIn_0.25s_ease-out]">
                    <div className="flex items-center gap-2 mb-2 text-[#3DBDB4]">
                        <Lightbulb size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Did you mean to highlight?</span>
                    </div>
                    <p className="text-base font-black text-[#2D3748] mb-3">
                        "{highlightSuggestion.suggestion}"
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onAcceptSuggestion}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#3DBDB4] text-white text-xs font-bold rounded-lg hover:bg-[#35a99f] transition-all shadow-sm"
                        >
                            <Check size={12} /> Yes, use this
                        </button>
                        <button
                            onClick={onDismissSuggestion}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all"
                        >
                            <X size={12} /> No, keep mine
                        </button>
                    </div>
                </div>
            )}

            {/* Active Term — Show immediately if we have a selected word, even if loading */}
            {selectedWord && (
                <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
                    <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
                </div>
            )}

            {/* Definition loading (post-confirm) */}
            {isDefining && <LinawLoader text="Defining..." />}

            {/* Content — only show when NOT loading the definition */}
            {!isDefining && (
                <>
                    {/* Translation Section (Phase 2) */}
                    {targetLanguage !== "None (EN)" && (
                        <>
                            {isTranslating ? (
                                <div className="border border-gray-100 rounded-xl p-4">
                                    <LinawLoader text={`Translating to ${targetLanguage.split(' ')[0]}...`} className="py-2" />
                                </div>
                            ) : definition && definition.translated_context ? (
                                <div className="bg-white border border-[#3DBDB4]/20 rounded-xl p-4 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-[#3DBDB4] text-white rounded text-[9px] font-black">{langAbbr}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{targetLanguage.split(' ')[0]} Context</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                        {definition.translated_context}
                                    </p>
                                </div>
                            ) : definition && !definition.translated_context ? (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 transition-all duration-300 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-400" />
                                    <p className="text-xs text-red-500 font-medium tracking-wide">
                                        Translation unavailable.
                                    </p>
                                </div>
                            ) : null}
                        </>
                    )}

                    {definition && (
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-[#2D3748] text-white rounded text-[9px] font-black">EN</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">English Definition</span>
                                </div>
                                <Volume2
                                    size={14}
                                    className="text-gray-300 cursor-pointer hover:text-[#3DBDB4]"
                                    onClick={() => {
                                        if (definition?.english_definition) {
                                            const utterance = new SpeechSynthesisUtterance(definition.english_definition);
                                            utterance.lang = 'en-US';
                                            window.speechSynthesis.speak(utterance);
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {definition.english_definition}
                            </p>
                        </div>
                    )}

                    <div className="bg-gray-50 aspect-video rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200">
                        <Maximize2 size={24} className="text-gray-300 mb-1" />
                        <p className="text-[9px] font-black text-gray-400 uppercase">Illustration</p>
                    </div>

                    {confusionTerms.length > 0 && (
                        <div className="bg-[#FF6B6B]/5 border border-[#FF6B6B]/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-[#FF6B6B]">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Not to be confused with</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {confusionTerms.map((term) => (
                                    <button key={term} onClick={() => handleHistoryItemClick(term)} className="text-[10px] px-3 py-1.5 bg-white border border-[#FF6B6B]/20 rounded-md font-bold text-gray-600 hover:bg-[#FF6B6B] hover:text-white transition-all shadow-sm">
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
};

export default Explain;

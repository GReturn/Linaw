import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Volume2, Maximize2, AlertCircle, Lightbulb, Check, X, Search, ChevronDown, Image as ImageIcon, ImageIcon as ImageSearchIcon, X as XIcon, ZoomIn, ZoomOut } from 'lucide-react';
import LinawLoader from '../common/LinawLoader';
import { useSettings } from "../../context/SettingsContext";

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
    // Add state for image URL and visibility
    const [imageUrl, setImageUrl] = useState(""); // Insert image address here
    const [showImage, setShowImage] = useState(false);
    // Add state for fullscreen image modal
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle escape key to close fullscreen
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isFullscreen) {
                closeFullscreen();
            }
        };
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isFullscreen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFullscreen]);

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

    const { settings } = useSettings();

    const langAbbr = getAbbreviation(targetLanguage);

    const showEmptyState = !selectedWord && !pendingWord && !loading && !isDefining;

    // Function to handle image search
    const handleImageSearch = () => {
        // You can implement actual image search logic here
        // For now, we'll just show the image that's in the state
        if (imageUrl) {
            setShowImage(true);
        } else {
            // Optionally set a default or search for an image based on selectedWord
            setImageUrl("https://static.wikia.nocookie.net/jujutsu-kaisen/images/5/5a/Satoru_Gojo_arrives_on_the_battlefield_%28Anime%29.png/revision/latest?cb=20210226205256"); // Example fallback
            setShowImage(true);
        }
    };

    // Function to open fullscreen modal
    const openFullscreen = () => {
        setIsFullscreen(true);
        setIsZoomed(false); // Reset zoom when opening
    };

    // Function to close fullscreen modal
    const closeFullscreen = () => {
        setIsFullscreen(false);
        setIsZoomed(false);
    };

    // Toggle zoom in fullscreen
    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
    };

    return (
        <>
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
                    {settings.showLanguageContext && targetLanguage !== "None (EN)" && (
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

                    {settings.showEnglish && definition && (
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

                        {/* Image Search Button - Only show if there's a selected word */}
                        {selectedWord && !showImage && (
                            <button
                                onClick={handleImageSearch}
                                className="w-full py-3 bg-gradient-to-r from-[#3DBDB4] to-[#35a99f] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#3DBDB4]/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                <ImageSearchIcon size={16} className="group-hover:scale-110 transition-transform" />
                                Search for related image
                            </button>
                        )}

                        {/* Image display component - only shows when button is clicked */}
                        {showImage && (
                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={openFullscreen}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Illustration for ${selectedWord || 'selected term'}`}
                                        className="w-full h-auto aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/400x225?text=Image+not+found";
                                        }}
                                    />
                                    {/* Overlay with zoom icon on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                            <ZoomIn size={20} className="text-[#2D3748]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 bg-white border-t border-gray-100 flex justify-between items-center">
                                    <p className="text-[8px] font-mono text-gray-400 truncate max-w-[140px]">
                                        {/* Insert image address here - the image URL is stored in state */}
                                        URL: {imageUrl || "Not set"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={openFullscreen}
                                            className="text-[8px] font-black text-[#3DBDB4] hover:text-[#35a99f] uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Maximize2 size={10} /> Expand
                                        </button>
                                        <button
                                            onClick={() => setShowImage(false)}
                                            className="text-[8px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                                        >
                                            Hide
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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

            {/* Fullscreen Image Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
                    onClick={closeFullscreen}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 transition-all duration-300 z-10"
                        onClick={closeFullscreen}
                    >
                        <XIcon size={24} />
                    </button>

                    {/* Zoom toggle button */}
                    <button
                        className={`absolute bottom-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 transition-all duration-300 z-10 ${isZoomed ? 'bg-[#3DBDB4]/20' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleZoom();
                        }}
                    >
                        {isZoomed ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
                    </button>

                    {/* Image info */}
                    <div className="absolute top-6 left-6 text-white/50 text-xs font-mono bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm">
                        {selectedWord && <span className="font-bold text-[#3DBDB4] mr-2">{selectedWord}</span>}
                        Click image or press ESC to close
                    </div>

                    {/* Image container */}
                    <div
                        className={`max-w-[90vw] max-h-[90vh] transition-all duration-300 cursor-zoom ${isZoomed ? 'scale-150' : 'scale-100'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageUrl}
                            alt={`Full size illustration for ${selectedWord || 'selected term'}`}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={toggleZoom}
                        />
                    </div>

                    {/* Instructions */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/30 text-[10px] font-mono bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                        Click image to zoom • ESC to close
                    </div>
                </div>
            )}
        </>
    );
};

export default Explain;
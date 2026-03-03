import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, AlertCircle, Maximize2, Loader, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X as XIcon, ImageIcon as ImageSearchIcon } from 'lucide-react';
import LinawLoader from '../../components/common/LinawLoader';
import { useAuth } from '../../context/AuthContext';
import { notebookService } from '../../services/notebookService';
import { MAX_WORD_COUNT, TOO_MANY_WORDS_MESSAGE } from '../../services/selectionValidator';

const ENABLE_NGRAM_SUGGESTION_UI = false; // Toggle this to show/hide "Did you mean" suggestion UI only
const USE_MOCK_DATA = false; // Toggle this to use local mock data instead of API calls

const MOCK_DEFINITION = {
    term: "Linaw",
    english_definition: "A Cebuano word meaning 'clear', 'tranquil', or 'transparent'. In the context of this application, it refers to a tool designed to make complex text clear and accessible through AI-powered explanations and translations.",
    translated_context: "Ang 'Linaw' usa ka pulong sa Sugboanon nga nagpasabut og 'tin-aw', 'malinawon', o 'dayag'. Niini nga aplikasyon, kini nagtumong sa usa ka himan nga gidisenyo aron himoon ang komplikadong teksto nga tin-aw ug masabtan pinaagi sa mga katin-awan ug hubad nga gigamitan og AI.",
    confused_with: ["Tin-aw", "Hapsay", "Kalinaw"]
};

export default function ExtensionExplain({ selectedWord, wordCount, targetLanguage, contextText, onHistoryItemClick }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [definition, setDefinition] = useState(null);
    const [suggestion, setSuggestion] = useState(null);
    const [rejectedReason, setRejectedReason] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Image state management
    const [imageUrl, setImageUrl] = useState("");
    const [showImage, setShowImage] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isSearchingImage, setIsSearchingImage] = useState(false);
    const [imageError, setImageError] = useState(null);
    const [imageSource, setImageSource] = useState("");
    const [imageOffset, setImageOffset] = useState(0); // Track which image variant we're viewing

    // Ref to prevent wiping English definition on language switch
    const lastWordRef = useRef("");

    const tooManyWords = wordCount > MAX_WORD_COUNT;

    // Clear image when word changes
    useEffect(() => {
        setImageUrl("");
        setShowImage(false);
        setImageError(null);
        setImageOffset(0);
    }, [selectedWord]);

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

    useEffect(() => {
        const fetchProgressively = async () => {
            if (!selectedWord || !user || tooManyWords) {
                setDefinition(null);
                setLoading(false);
                setIsTranslating(false);
                return;
            }

            const isLanguageChangeOnly = lastWordRef.current === selectedWord;

            if (!isLanguageChangeOnly) {
                setLoading(true);
                setDefinition(null);
            } else {
                // Clear the OLD translation immediately on language switch
                setDefinition(prev => prev ? { ...prev, translated_context: "" } : null);
            }

            setIsTranslating(false);
            setRejectedReason(null);
            setErrorMessage(null);

            try {
                if (USE_MOCK_DATA) {
                    setLoading(true);
                    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
                    setDefinition({
                        ...MOCK_DEFINITION,
                        term: selectedWord // dynamic term for better demo feel
                    });
                    setLoading(false);
                    return;
                }

                let currentDef = null;

                // --- Phase 1: Fast English Fetch (or Cache Hit) ---
                if (!isLanguageChangeOnly) {
                    const { isStopwordPhrase } = await import('../../services/wordGate.js');

                    if (isStopwordPhrase(selectedWord)) {
                        setRejectedReason("This is a common stopword or grammar filler, which usually doesn't need defining.");
                        setLoading(false);
                        return;
                    }
                    // NOTE: isSemanticallyDefinable (transformers.js) is skipped in the
                    // extension because Chrome Extension CSP blocks WebAssembly (wasm-eval).

                    console.log(`[Linaw Extension] Fetching definition for: "${selectedWord}", language: ${targetLanguage}`);
                    currentDef = await notebookService.getDefinitionOnly(
                        user.uid,
                        "extension",
                        selectedWord,
                        targetLanguage,
                        contextText
                    );
                    console.log(`[Linaw Extension] Definition result:`, currentDef);

                    setDefinition(currentDef);
                    setLoading(false);
                    lastWordRef.current = selectedWord;
                }

                // --- Phase 2: Slow Translation Fetch (if not English) ---
                if (targetLanguage !== "None (EN)") {
                    setIsTranslating(true);

                    // Re-fetch english definition from state if we didn't just load it
                    const enDefToTranslate = currentDef?.english_definition
                        || await new Promise(resolve => {
                            setDefinition(prev => { resolve(prev?.english_definition); return prev; });
                        });

                    const translationResult = await notebookService.getTranslation(
                        selectedWord,
                        enDefToTranslate,
                        targetLanguage
                    );

                    setDefinition(prev => ({
                        ...prev,
                        translated_context: translationResult?.translated_context || "",
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch progressive explanation:", error);
                setErrorMessage(`Failed to connect: ${error.message}`);
            } finally {
                setLoading(false);
                setIsTranslating(false);
            }
        };

        fetchProgressively();
    }, [selectedWord, wordCount, user, targetLanguage, tooManyWords]);

    // Check for N-gram corrections whenever the selected word or context changes
    useEffect(() => {
        if (!ENABLE_NGRAM_SUGGESTION_UI) {
            setSuggestion(null);
            return;
        }

        let isMounted = true;
        const checkSuggestion = async () => {
            if (!selectedWord || !contextText) {
                if (isMounted) setSuggestion(null);
                return;
            }
            try {
                const { findBestCandidate } = await import('../../services/ngramCorrector.js');
                const result = findBestCandidate(selectedWord, contextText);
                if (isMounted && result.suggestion) {
                    setSuggestion(result.suggestion);
                } else if (isMounted) {
                    setSuggestion(null);
                }
            } catch (err) {
                console.error("[Linaw Extension] Ngram check failed", err);
            }
        };
        checkSuggestion();
        return () => { isMounted = false; };
    }, [selectedWord, contextText]);

    /**
     * Search Unsplash for images
     */
    const searchUnsplash = async (query, page = 1) => {
        try {
            // For Vite projects - adjust based on your environment
            const apiKey = import.meta.env.VITE_APP_UNSPLASH_API_KEY;

            // For testing only - uncomment and add your key
            // const apiKey = 'YOUR_API_KEY_HERE';

            if (!apiKey) {
                console.warn('Unsplash API key not configured');
                return null;
            }

            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&page=${page}&client_id=${apiKey}`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                return data.results[0].urls.regular;
            }
            return null;
        } catch (error) {
            console.warn('Unsplash search failed:', error);
            return null;
        }
    };

    /**
     * Enhanced image search with multiple fallbacks
     */
    const handleImageSearch = async (offset = 0) => {
        if (!selectedWord) return;

        setIsSearchingImage(true);
        setImageError(null);

        try {
            // Try Unsplash first
            let imageUrl = await searchUnsplash(selectedWord, offset + 1);
            if (imageUrl) {
                setImageUrl(imageUrl);
                setImageSource("unsplash");
                setShowImage(true);
                setImageOffset(offset);
                setIsSearchingImage(false);
                return;
            }

            // If no image found
            setImageError('No images found for this term.');

        } catch (error) {
            console.error('Image search error:', error);
            setImageError('Unable to fetch image. Please try again.');
        } finally {
            setIsSearchingImage(false);
        }
    };

    // Function to handle next image
    const handleNextImage = () => {
        handleImageSearch(imageOffset + 1);
    };

    // Function to handle previous image
    const handlePreviousImage = () => {
        if (imageOffset > 0) {
            handleImageSearch(imageOffset - 1);
        }
    };

    // Function to open fullscreen modal
    const openFullscreen = () => {
        setIsFullscreen(true);
        setIsZoomed(false);
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

    const handleImageLoadError = () => {
        setImageError('Failed to load image. Please try another.');
        setShowImage(false);
    };

    const copyImageUrl = () => {
        if (imageUrl) {
            navigator.clipboard.writeText(imageUrl);
            console.log('Image URL copied to clipboard');
        }
    };

    const handleSuggestionClick = (correctedWord) => {
        if (!chrome || !chrome.storage) return;
        chrome.storage.session.set({
            linawSelectedWord: correctedWord,
            linawWordCount: correctedWord.split(/\s+/).length,
            linawContextText: contextText
        });
    };

    // Helper to get abbreviation for the badge
    const getAbbreviation = (langStr) => {
        if (!langStr) return "CE";
        const match = langStr.match(/\((.*?)\)/);
        return match ? match[1] : "CE";
    };

    const langAbbr = getAbbreviation(targetLanguage);

    // Empty state — no word selected yet
    if (!selectedWord) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={24} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">Highlight to Explain</h3>
                <p className="text-xs text-gray-400">
                    Select text on any webpage and click the Linaw tooltip to see its explanation here.
                </p>
            </div>
        );
    }

    // Too many words — show friendly error
    if (tooManyWords) {
        return (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F8FAFC]">
                <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Selected Text</p>
                    <h2 className="text-lg font-black text-[#2D3748] leading-snug break-words">{selectedWord}</h2>
                </div>

                <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-xl p-5 flex flex-col items-center text-center gap-3">
                    <span className="text-3xl">🚫</span>
                    <p className="text-sm font-black text-[#FF6B6B]">Woah there!</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{TOO_MANY_WORDS_MESSAGE}</p>
                    <p className="text-[10px] font-bold text-gray-400">
                        Try highlighting <span className="text-[#3DBDB4]">5 words or fewer</span>.
                    </p>
                </div>
            </div>
        );
    }

    const suggestionUI = (ENABLE_NGRAM_SUGGESTION_UI && suggestion) ? (
        <div className="bg-[#3DBDB4]/10 border border-[#3DBDB4]/30 rounded-xl p-4 flex flex-col gap-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-[#2D3748]">
                <Sparkles size={14} className="text-[#3DBDB4]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3DBDB4]">Did you mean?</span>
            </div>
            <button
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left text-sm font-black text-[#2D3748] hover:text-[#3DBDB4] transition-colors bg-white rounded-lg p-3 border border-[#3DBDB4]/20 shadow-sm"
            >
                {suggestion}
            </button>
        </div>
    ) : null;

    if (rejectedReason) {
        return (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F8FAFC]">
                {suggestionUI}
                <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Selected Text</p>
                    <h2 className="text-lg font-black text-[#2D3748] leading-snug break-words">{selectedWord}</h2>
                </div>

                <div className="bg-[#2D3748] rounded-xl p-5 flex flex-col items-center text-center gap-3">
                    <AlertCircle size={32} className="text-[#3DBDB4]" />
                    <p className="text-sm font-black text-white">Analysis Skipped</p>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{rejectedReason}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">
                        Try highlighting a more <span className="text-[#3DBDB4]">descriptive noun, verb, or phrase</span>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F8FAFC]">

            {suggestionUI}

            <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
                <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
            </div>

            {loading ? (
                <LinawLoader text="Analyzing term..." className="py-4" />
            ) : definition ? (
                <>
                    {/* Translation Section (Phase 2) */}
                    {targetLanguage !== "None (EN)" && (
                        <>
                            {isTranslating ? (
                                <div className="border border-gray-100 rounded-xl p-4">
                                    <LinawLoader text={`Translating to ${targetLanguage.split(' ')[0]}...`} className="py-2" />
                                </div>
                            ) : definition.translated_context ? (
                                <div className="bg-white border border-[#3DBDB4]/20 rounded-xl p-4 shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-[#3DBDB4] text-white rounded text-[9px] font-black">{langAbbr}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{targetLanguage.split(' ')[0]} Context</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                        {definition.translated_context}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 transition-all duration-300 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-400" />
                                    <p className="text-xs text-red-500 font-medium tracking-wide">
                                        Translation unavailable.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {definition.english_definition && (
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-[#2D3748] text-white rounded text-[9px] font-black">EN</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">English Definition</span>
                                </div>
                                <Volume2
                                    size={14}
                                    className="text-gray-300 cursor-pointer hover:text-[#3DBDB4] transition-colors"
                                    onClick={() => {
                                        if (definition.english_definition) {
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

                    {/* Image Error State */}
                    {imageError && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-600 font-medium">
                                {imageError}
                            </p>
                        </div>
                    )}

                    {/* Image Search Button */}
                    {!showImage && (
                        <button
                            onClick={() => handleImageSearch(0)}
                            disabled={isSearchingImage}
                            className="w-full py-3 bg-gradient-to-r from-[#3DBDB4] to-[#35a99f] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#3DBDB4]/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSearchingImage ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <ImageSearchIcon size={16} className="group-hover:scale-110 transition-transform" />
                                    Search for related image
                                </>
                            )}
                        </button>
                    )}

                    {/* Image display component */}
                    {showImage && imageUrl && !isSearchingImage && (
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div
                                className="relative group cursor-pointer"
                                onClick={openFullscreen}
                            >
                                <img
                                    src={imageUrl}
                                    alt={`Illustration for ${selectedWord || 'selected term'}`}
                                    className="w-full h-auto aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={handleImageLoadError}
                                />
                                {/* Overlay with zoom icon on hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                        <ZoomIn size={20} className="text-[#2D3748]" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-white border-t border-gray-100">
                                {/* Top row: source info and buttons */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex-1">
                                        <p className="text-[8px] font-mono text-gray-400 truncate max-w-[140px]">
                                            {imageSource && <span className="capitalize font-bold text-gray-500">[{imageSource}]</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={copyImageUrl}
                                            className="text-[8px] font-black text-gray-400 hover:text-[#3DBDB4] uppercase tracking-wider flex items-center gap-1"
                                            title="Copy image URL"
                                        >
                                            📋 Copy
                                        </button>
                                        <button
                                            onClick={openFullscreen}
                                            className="text-[8px] font-black text-[#3DBDB4] hover:text-[#35a99f] uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Maximize2 size={10} /> Expand
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowImage(false);
                                                setImageError(null);
                                            }}
                                            className="text-[8px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                                        >
                                            Hide
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom row: Navigation arrows */}
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={handlePreviousImage}
                                        disabled={imageOffset === 0 || isSearchingImage}
                                        className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-[#3DBDB4]/10 text-gray-600 hover:text-[#3DBDB4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Previous image"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-[9px] font-bold text-gray-500">
                                        {imageOffset + 1}
                                    </span>
                                    <button
                                        onClick={handleNextImage}
                                        disabled={isSearchingImage}
                                        className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-[#3DBDB4]/10 text-gray-600 hover:text-[#3DBDB4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Next image"
                                    >
                                        {isSearchingImage ? (
                                            <Loader size={16} className="animate-spin" />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {definition.confused_with && definition.confused_with.length > 0 && (
                        <div className="bg-[#FF6B6B]/5 border border-[#FF6B6B]/20 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-[#FF6B6B]">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Not to be confused with</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {definition.confused_with.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => onHistoryItemClick && onHistoryItemClick(term)}
                                        className="text-[10px] px-3 py-1.5 bg-white border border-[#FF6B6B]/20 rounded-md font-bold text-gray-600 hover:bg-[#FF6B6B] hover:text-white transition-all shadow-sm"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm text-center flex flex-col items-center">
                    <AlertCircle size={24} className={errorMessage ? "text-red-400 mb-2" : "text-gray-300 mb-2"} />
                    <p className="text-sm font-bold text-gray-600">{errorMessage ? "Connection Error" : "Definition not found"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {errorMessage || "We couldn't analyze this term right now."}
                    </p>
                    {errorMessage && (
                        <p className="text-[10px] font-bold text-gray-300 mt-2">
                            Make sure the backend server is running on <span className="text-[#3DBDB4]">localhost:8000</span>
                        </p>
                    )}
                </div>
            )}

            {/* Fullscreen Image Modal */}
            {isFullscreen && imageUrl && (
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

                    {/* Previous image button */}
                    {imageOffset > 0 && (
                        <button
                            className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 transition-all duration-300 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePreviousImage();
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Next image button */}
                    <button
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 transition-all duration-300 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNextImage();
                        }}
                    >
                        {isSearchingImage ? (
                            <Loader size={24} className="animate-spin" />
                        ) : (
                            <ChevronRight size={24} />
                        )}
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
                        Image {imageOffset + 1}
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
                        Use arrows to navigate • Click image to zoom • ESC to close
                    </div>
                </div>
            )}
        </div>
    );
}
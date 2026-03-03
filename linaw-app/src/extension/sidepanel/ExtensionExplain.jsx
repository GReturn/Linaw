import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, AlertCircle, Maximize2 } from 'lucide-react';
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

    // Ref to prevent wiping English definition on language switch
    const lastWordRef = useRef("");

    const tooManyWords = wordCount > MAX_WORD_COUNT;

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

                    <div className="bg-gray-50 aspect-video rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200">
                        <Maximize2 size={24} className="text-gray-300 mb-1" />
                        <p className="text-[9px] font-black text-gray-400 uppercase">Illustration</p>
                    </div>

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
        </div>
    );
}

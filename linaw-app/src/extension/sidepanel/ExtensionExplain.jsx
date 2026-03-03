import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Volume2, AlertCircle, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notebookService } from '../../services/notebookService';
import { MAX_WORD_COUNT, TOO_MANY_WORDS_MESSAGE } from '../../services/selectionValidator';

const ENABLE_NGRAM_CORRECTION = false; // Toggle this to enable/disable "Did you mean" suggestions
const USE_MOCK_DATA = true; // Toggle this to use local mock data instead of API calls

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

            try {
                let currentDef = null;

                // --- Phase 1: Fast English Fetch (or Cache Hit) ---
                if (!isLanguageChangeOnly) {
                    currentDef = await notebookService.getDefinitionOnly(
                        user.uid,
                        "extension",
                        selectedWord,
                        targetLanguage
                    );

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
            } finally {
                setLoading(false);
                setIsTranslating(false);
            }
        };

        fetchProgressively();
    }, [selectedWord, wordCount, user, targetLanguage, tooManyWords]);

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

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F8FAFC]">

            <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
                <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
            </div>

            {loading ? (
                <div className="flex justify-center flex-col items-center py-12 gap-3">
                    <Loader2 className="animate-spin text-[#3DBDB4]" size={28} />
                    <span className="text-xs font-bold text-gray-400">Analyzing term...</span>
                </div>
            ) : definition ? (
                <>
                    {/* Translation Section (Phase 2) */}
                    {targetLanguage !== "None (EN)" && (
                        <>
                            {isTranslating ? (
                                <div className="border border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-[#3DBDB4]" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Translating to {targetLanguage.split(' ')[0]}...
                                    </span>
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
                    <AlertCircle size={24} className="text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Definition not found</p>
                    <p className="text-xs text-gray-400 mt-1">We couldn't analyze this term right now.</p>
                </div>
            )}
        </div>
    );
}

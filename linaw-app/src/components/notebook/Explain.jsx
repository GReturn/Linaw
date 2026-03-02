import React from 'react';
import { Sparkles, Loader2, Volume2, Maximize2, AlertCircle, Lightbulb, Check, X, Search } from 'lucide-react';

const SkeletonBlock = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const DefinitionSkeleton = () => (
    <div className="flex flex-col gap-4">
        {/* Active term skeleton */}
        <div className="bg-[#FFD93C]/40 rounded-xl p-5">
            <SkeletonBlock className="h-2.5 w-16 mb-2 !bg-[#2D3748]/10 !rounded-md" />
            <SkeletonBlock className="h-5 w-32 !bg-[#2D3748]/15 !rounded-md" />
        </div>
        {/* Translation skeleton */}
        <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <SkeletonBlock className="h-5 w-5 !rounded" />
                <SkeletonBlock className="h-2.5 w-24 !rounded-md" />
            </div>
            <SkeletonBlock className="h-3 w-full mb-2 !rounded-md" />
            <SkeletonBlock className="h-3 w-3/4 !rounded-md" />
        </div>
        {/* Definition skeleton */}
        <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <SkeletonBlock className="h-5 w-5 !rounded" />
                <SkeletonBlock className="h-2.5 w-28 !rounded-md" />
            </div>
            <SkeletonBlock className="h-3 w-full mb-2 !rounded-md" />
            <SkeletonBlock className="h-3 w-5/6 mb-2 !rounded-md" />
            <SkeletonBlock className="h-3 w-2/3 !rounded-md" />
        </div>
        {/* Confusion skeleton */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <SkeletonBlock className="h-3.5 w-3.5 !rounded-full" />
                <SkeletonBlock className="h-2.5 w-36 !rounded-md" />
            </div>
            <div className="flex gap-2">
                <SkeletonBlock className="h-7 w-16 !rounded-md" />
                <SkeletonBlock className="h-7 w-20 !rounded-md" />
                <SkeletonBlock className="h-7 w-14 !rounded-md" />
            </div>
        </div>
    </div>
);

const Explain = ({
    mobileView,
    loading,
    isDefining,
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
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-transparent outline-none cursor-pointer appearance-none text-center"
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
            {loading && (
                <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="animate-spin text-gray-400" size={16} />
                    <span className="text-xs text-gray-400 font-medium">Checking selection…</span>
                </div>
            )}

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

            {/* Definition loading skeleton (post-confirm) */}
            {isDefining && <DefinitionSkeleton />}

            {/* Content — only show when NOT loading the definition */}
            {!isDefining && (
                <>
                    {selectedWord && (
                        <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
                            <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
                        </div>
                    )}

                    {definition && definition.translated_context && targetLanguage !== "None (EN)" && (
                        <div className="bg-white border border-[#3DBDB4]/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-[#3DBDB4] text-white rounded text-[9px] font-black">{langAbbr}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{targetLanguage.split(' ')[0]} Context</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                {definition.translated_context}
                            </p>
                        </div>
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

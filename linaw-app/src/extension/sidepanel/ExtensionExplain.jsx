import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Volume2, AlertCircle, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notebookService } from '../../services/notebookService';

export default function ExtensionExplain({ selectedWord, onHistoryItemClick }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [definition, setDefinition] = useState(null);

    useEffect(() => {
        const fetchDefinition = async () => {
            if (!selectedWord || !user) {
                setDefinition(null);
                return;
            }

            setLoading(true);
            try {
                // Using "extension" as a fixed notebookId for the global dictionary history
                const result = await notebookService.getDefinition(user.uid, "extension", selectedWord);
                setDefinition(result);
            } catch (error) {
                console.error("Failed to fetch explanation:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDefinition();
    }, [selectedWord, user]);

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
                    <div className="bg-white border border-[#3DBDB4]/20 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-[#3DBDB4] text-white rounded text-[9px] font-black">CE</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cebuano Context</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                            {definition.cebuano_context}
                        </p>
                    </div>

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
            ) : selectedWord ? (
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm text-center flex flex-col items-center">
                    <AlertCircle size={24} className="text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Definition not found</p>
                    <p className="text-xs text-gray-400 mt-1">We couldn't analyze this term right now.</p>
                </div>
            ) : null}
        </div>
    );
}

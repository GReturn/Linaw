import React from 'react';
import { Sparkles, Loader2, Volume2, Maximize2, AlertCircle } from 'lucide-react';

const Explain = ({
    mobileView,
    loading,
    selectedWord,
    definition,
    confusionTerms,
    handleHistoryItemClick
}) => {
    return (
        <aside className={`${mobileView === 'insights' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-l border-gray-100 p-5 flex-col gap-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 text-[#3DBDB4]">
                    <Sparkles size={16} /> Explain
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                    <span className="text-[9px] font-black text-gray-500 tracking-tighter">EN → CEB</span>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin text-[#3DBDB4]" size={24} />
                </div>
            )}

            <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
                <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
            </div>

            {definition && (
                <div className="bg-white border border-[#3DBDB4]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-[#3DBDB4] text-white rounded text-[9px] font-black">CE</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cebuano Context</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                        {definition.cebuano_context}
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
                        <Volume2 size={14} className="text-gray-300 cursor-pointer hover:text-[#3DBDB4]" />
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
        </aside>
    );
};

export default Explain;

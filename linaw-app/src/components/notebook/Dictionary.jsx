import React, { useState } from 'react';
import { Book, History, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';

const Dictionary = ({
    mobileView,
    navigate,
    documents,
    history,
    setCurrentFile,
    handleFileUpload,
    handleHistoryItemClick
}) => {
    const [activeTab, setActiveTab] = useState('sources');

    return (
        <aside className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex w-full md:w-72 bg-white border-r border-gray-200 flex-col z-20`}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Linaw Logo" className="w-8 h-8 object-contain" />
                    <h2 className="font-bold text-xl tracking-tight text-[#2D3748]">Linaw</h2>
                </div>
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div className="flex p-1 bg-gray-100 m-4 rounded-lg">
                <button
                    onClick={() => setActiveTab('sources')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'sources' ? 'bg-white shadow-sm text-[#3DBDB4]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Book size={14} /> Sources
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-[#FF6B6B]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <History size={14} /> Dictionary
                </button>
            </div>

            <input
                type="file"
                accept="application/pdf"
                id="sourceUpload"
                className="hidden"
                onChange={handleFileUpload}
            />

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {activeTab === 'sources' ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-[#3DBDB4]/5 border border-[#3DBDB4]/20 rounded-lg flex items-center gap-3">
                            {documents.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setCurrentFile(doc.fileURL)}
                                    className="p-3 bg-[#3DBDB4]/5 border border-[#3DBDB4]/20 rounded-lg flex items-center gap-3 w-full"
                                >
                                    <div className="p-2 bg-white rounded shadow-sm text-[#3DBDB4]">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-sm font-bold truncate text-[#2D3748]">
                                        {doc.fileName}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => document.getElementById("sourceUpload").click()}
                            className="w-full py-3 border border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-400 font-bold text-sm hover:border-[#3DBDB4] hover:bg-[#3DBDB4]/5 transition-all">
                            <Plus size={16} /> Add Source
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Recent Lookups</p>
                        {history.length > 0 ? history.map((term, i) => (
                            <button key={i} onClick={() => handleHistoryItemClick(term)} className="w-full p-3 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-between group hover:border-[#FF6B6B] transition-all">
                                <span className="text-sm font-semibold text-gray-600 group-hover:text-[#FF6B6B]">{term}</span>
                                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF6B6B]" />
                            </button>
                        )) : (
                            <p className="text-sm text-gray-400 text-center py-4">No history yet</p>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Dictionary;

import React, { useState, useEffect } from 'react';
import { History, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notebookService } from '../../services/notebookService';

export default function ExtensionDictionary({ onHistoryItemClick }) {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await notebookService.getHistory(user.uid, "extension");
            setHistory(result);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [user]);

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-[#FF6B6B]" />
                    <h3 className="text-sm font-black text-gray-700 tracking-tight">Recent Lookups</h3>
                </div>
                <button
                    onClick={loadHistory}
                    className="p-1.5 text-gray-400 hover:text-[#3DBDB4] hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-100 shadow-sm"
                    title="Refresh history"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading && history.length === 0 ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[#3DBDB4]" size={20} />
                </div>
            ) : history.length > 0 ? (
                <div className="space-y-2">
                    {history.map((term, i) => (
                        <button
                            key={i}
                            onClick={() => onHistoryItemClick(term)}
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between group hover:border-[#FF6B6B] transition-all hover:shadow"
                        >
                            <span className="text-sm font-bold text-gray-600 group-hover:text-[#FF6B6B]">{term}</span>
                            <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center group-hover:bg-[#FF6B6B]/10 transition-colors">
                                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF6B6B]" />
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center">
                    <History size={24} className="text-gray-200 mb-3" />
                    <p className="text-sm font-bold text-gray-500 mb-1">No history yet</p>
                    <p className="text-xs text-gray-400 px-4">Words you look up will appear here automatically.</p>
                </div>
            )}
        </div>
    );
}

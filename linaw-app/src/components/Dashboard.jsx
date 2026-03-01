import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, File, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const notebooksRef = collection(db, "users", user.uid, "notebooks");
      const snapshot = await getDocs(notebooksRef);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotebooks(data);
    } catch (err) {
      console.error("Failed to load notebooks:", err);
      setError("Failed to load your notebooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, loadData]);

  const handleCreateNotebook = async () => {
    if (!newTitle.trim() || !user) return;

    try {
      setError(null);
      const notebooksRef = collection(db, "users", user.uid, "notebooks");
      await addDoc(notebooksRef, {
        title: newTitle.trim(),
        createdAt: serverTimestamp(),
      });
      setNewTitle("");
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error("Failed to create notebook:", err);
      setError("Failed to create notebook. Please try again.");
    }
  };

  return (
    <section className="mb-32 flex flex-col items-center px-4">
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 max-w-4xl w-full">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Grid Container - Matching your 4-column layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl">

        {/* UNIQUE UPLOAD TILE */}
        <button
          onClick={() => setShowModal(true)}
          className="group aspect-square rounded-3xl border-2 border-dashed border-[#3DBDB4]/40 hover:border-[#3DBDB4] bg-[#3DBDB4]/5 hover:bg-[#3DBDB4]/10 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#3DBDB4] group-hover:text-white text-[#3DBDB4] transition-all duration-300">
            <Plus size={32} strokeWidth={3} />
          </div>
          <span className="font-bold text-[#3DBDB4] text-sm uppercase tracking-wider">Create Notebook</span>
        </button>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="aspect-square flex items-center justify-center bg-white/50 rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="animate-spin text-[#3DBDB4]" size={24} />
          </div>
        ) : (
          <>
            {/* DYNAMIC NOTEBOOK TILES */}
            {notebooks && notebooks.map((notebook) => (
              <button
                key={notebook.id || notebook.notebook_id}
                onClick={() => navigate(`/notebook/${notebook.id || notebook.notebook_id}`)}
                className="group aspect-square rounded-3xl bg-white border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Accent Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="w-14 h-14 bg-[#FFF9F0] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#2D3748] text-[#2D3748] group-hover:text-white transition-all duration-300 relative z-10">
                  <BookOpen size={28} />
                </div>

                <span className="font-bold text-[#2D3748] px-4 text-center truncate w-full relative z-10 text-sm">
                  {notebook.title}
                </span>
              </button>
            ))}

            {/* PLACEHOLDER SLOTS */}
            {notebooks && notebooks.length < 3 && Array.from({ length: 3 - notebooks.length }).map((_, i) => (
              <div key={i} className="aspect-square rounded-3xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center opacity-50">
                <File size={28} className="text-gray-300 mb-2" />
                <span className="font-medium text-gray-400 text-[10px] uppercase tracking-widest text-center px-2">Empty Slot</span>
              </div>
            ))}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">

            <h3 className="text-lg font-bold mb-4 text-[#2D3748]">
              Create Notebook
            </h3>

            <input
              type="text"
              placeholder="Notebook title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#3DBDB4]"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateNotebook}
                className="px-4 py-2 text-sm bg-[#3DBDB4] text-black rounded-lg hover:opacity-90"
              >
                Create
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
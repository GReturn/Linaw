import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, File, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from "../context/AuthContext";
import { createNotebook } from '../services/notebookService';

export default function Dashboard({ searchTerm = "" }) {
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
      // await createNotebook(user.uid, newTitle.trim());
      setNewTitle("");
      setShowModal(false);
      // await loadData();
      const newNotebook = await createNotebook(user.uid, newTitle.trim());
      setNotebooks(prev => [
        ...prev,
        newNotebook
      ]);

      navigate(`/notebook/${newNotebook.id}`);
    } catch (err) {
      console.error("Failed to create notebook:", err);
      setError("Failed to create notebook. Please try again.");
    }
  };

  const filteredNotebooks = notebooks.filter(nb =>
    nb.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="mb-32 px-6">

      {/* White Workspace Container */}
      <div className="
        max-w-[1500px] mx-auto
        bg-white
        rounded-[40px]
        border border-gray-200
        shadow-[0_30px_70px_rgba(0,0,0,0.06)]
        px-16 py-16
      ">

        {error && (
          <div className="mb-10 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="
          flex
          flex-wrap
          gap-12
          w-full
        ">

          {/* Create Notebook Tile */}
          <button
            onClick={() => setShowModal(true)}
            className="group w-[260px] h-[260px] rounded-[28px] border-2 border-dashed border-[#3DBDB4]/40 hover:border-[#3DBDB4] bg-[#3DBDB4]/5 hover:bg-[#3DBDB4]/10 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shrink-0"
          >
            <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#3DBDB4] group-hover:text-white text-[#3DBDB4] transition-all duration-300">
              <Plus size={36} strokeWidth={3} />
            </div>
            <span className="font-bold text-[#3DBDB4] text-base uppercase tracking-wider">
              Create Notebook
            </span>
          </button>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-[#3DBDB4]" size={32} />
            </div>
          )}

          {/* Notebooks */}
          {!isLoading && filteredNotebooks.map((notebook) => (
            <button
              key={notebook.id}
              onClick={() => navigate(`/notebook/${notebook.id}`)}
              className="group w-[260px] h-[260px] rounded-[28px] bg-white border border-gray-200 flex flex-col items-center justify-center transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="w-20 h-20 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2D3748] text-[#2D3748] group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
                <BookOpen size={32} />
              </div>

              <span className="font-bold text-[#2D3748] px-6 text-center truncate w-full relative z-10 text-lg block">
                {notebook.title}
              </span>
            </button>
          ))}

        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">

          <div className="w-[420px] bg-white rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#3DBDB4]/10 flex items-center justify-center text-[#3DBDB4]">
                  <Plus size={22} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#2D3748] leading-tight">
                    Create Notebook
                  </h3>
                  <p className="text-sm text-gray-400">
                    Give your new notebook a meaningful name.
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 pb-8">

              <input
                type="text"
                placeholder="e.g. Biology Review"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="
                  w-full
                  px-5 py-4
                  rounded-xl
                  bg-gray-50
                  border border-gray-200
                  text-[#2D3748]
                  font-medium
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#3DBDB4]/40
                  focus:border-[#3DBDB4]
                  transition-all
                "
              />

              <div className="flex justify-between items-center mt-6">

                <button
                  onClick={() => setShowModal(false)}
                  className="
                    text-sm
                    font-semibold
                    text-gray-400
                    hover:text-gray-600
                    transition-colors
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateNotebook}
                  className="
                    px-6 py-3
                    rounded-xl
                    bg-gradient-to-r from-[#3DBDB4] to-[#35a99f]
                    text-black
                    font-bold
                    text-sm
                    shadow-md
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    transition-all
                    duration-200
                  "
                >
                  Create Notebook
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
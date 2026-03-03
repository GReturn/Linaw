import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, File, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from "../context/AuthContext";
import { createNotebook } from '../services/notebookService';

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

        {/* Dynamic Grid */}
        <div className="
          grid
          gap-12
          w-full
          [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]
        ">

          {/* Create Notebook Tile */}
          <button
            onClick={() => setShowModal(true)}
            className="group rounded-[28px] border-2 border-dashed border-[#3DBDB4]/40 hover:border-[#3DBDB4] bg-[#3DBDB4]/5 hover:bg-[#3DBDB4]/10 flex flex-col items-center justify-center py-16 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
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
          {!isLoading && notebooks.map((notebook) => (
            <button
              key={notebook.id}
              onClick={() => navigate(`/notebook/${notebook.id}`)}
              className="group rounded-[28px] bg-white border border-gray-200 flex flex-col items-center justify-center py-16 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="w-20 h-20 bg-[#FFF9F0] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2D3748] text-[#2D3748] group-hover:text-white transition-all duration-300 relative z-10">
                <BookOpen size={32} />
              </div>

              <span className="font-bold text-[#2D3748] px-6 text-center truncate w-full relative z-10 text-lg">
                {notebook.title}
              </span>
            </button>
          ))}

        </div>

      </div>

      {/* Modal */}
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
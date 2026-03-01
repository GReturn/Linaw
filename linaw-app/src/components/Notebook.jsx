import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Maximize2, ZoomIn, ZoomOut,
  Volume2, ChevronLeft, Globe, Book, History,
  AlertCircle, ChevronRight, Loader2, Sparkles
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../api';

// Core Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { getDocs } from "firebase/firestore";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const InteractiveReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // UI State
  const [activeTab, setActiveTab] = useState('sources');
  const [mobileView, setMobileView] = useState('reader');
  const [notebook, setNotebook] = useState({ title: "Linaw", file: "/2025.nllp-1.3.pdf" });
  const [documents, setDocuments] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  // PDF State
  const [selectedWord, setSelectedWord] = useState("Voluptatem");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);

  // API States
  const [history, setHistory] = useState([]);
  const [confusionTerms, setConfusionTerms] = useState([]);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load notebook if ID exists
        if (id) {
          const notebookResponse = await api.get(`/api/notebook/${id}`);
          setNotebook(notebookResponse.data);
        }

        // Load history
        const historyResponse = await api.get('/api/history');
        setHistory(historyResponse.data);

        // Load confusion terms
        const confusionResponse = await api.get('/api/confusion-terms');
        setConfusionTerms(confusionResponse.data);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data');
      }
    };

    loadInitialData();
  }, [id]);

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user && id) {
      loadDocuments(user);
    }
  });

  return () => unsubscribe();
}, [id]);

  // Fetch definition when word is selected
  useEffect(() => {
    const fetchDefinition = async () => {
      if (!selectedWord) return;

      setLoading(true);
      try {
        const response = await api.post('/api/define', {
          word: selectedWord,
          context: "legal document"
        });
        setDefinition(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching definition:', err);
        setError('Failed to fetch definition');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [selectedWord]);

  // Add word to history
  const addToHistory = async (word) => {
      try {
        const response = await api.post('/api/history/add', { word });
        setHistory(response.data.history);
      } catch (err) {
        console.error('Error adding to history:', err);
        // Don't show error to user for history - it's not critical
      }
    };

    const loadDocuments = async (user) => {
    const querySnapshot = await getDocs(
      collection(db, "users", user.uid, "notebooks", id, "documents")
    );

    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setDocuments(docs);

    if (docs.length > 0) {
      setCurrentFile(docs[0].fileURL);
    }
  };

  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  console.log("User:", auth.currentUser);
  console.log("Notebook ID from URL:", id);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("notebook_id", id);
  formData.append("user_id", auth.currentUser.uid);

  try {
    const response = await fetch("http://localhost:8000/sources/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    console.log("Backend returned:", data);

    const docRef = await addDoc(
      collection(
        db,
        "users",
        auth.currentUser.uid,
        "notebooks",
        id,
        "documents"
      ),
      {
        fileName: data.fileName,
        fileURL: data.fileURL,
        uploadDate: serverTimestamp()
      }
    );

    console.log("Firestore doc created with ID:", docRef.id);
    await loadDocuments(auth.currentUser);

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
  }
};

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const text = selection.toString().trim();
    if (!text) return;
    const range = selection.getRangeAt(0);
    const originalStart = range.startOffset;
    const originalEnd = range.endOffset;
    const originalStartContainer = range.startContainer;
    const originalEndContainer = range.endContainer;

    const expandedRange = range.cloneRange();

    expandedRange.setStart(originalStartContainer, originalStart);
    expandedRange.setEnd(originalEndContainer, originalEnd);

    while (expandedRange.startOffset > 0 &&
          /[a-zA-Z0-9]/.test(expandedRange.startContainer.textContent[expandedRange.startOffset - 1])) {
      expandedRange.setStart(expandedRange.startContainer, expandedRange.startOffset - 1);
    }

    const endContainer = expandedRange.endContainer;
    while (expandedRange.endOffset < endContainer.textContent.length &&
          /[a-zA-Z0-9]/.test(endContainer.textContent[expandedRange.endOffset])) {
      expandedRange.setEnd(endContainer, expandedRange.endOffset + 1);
    }

    const expanded = expandedRange.toString().trim();
    if (!expanded) return;

    const cleaned = expanded.replace(/[^a-zA-Z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);

    const originalText = text.replace(/[^a-zA-Z0-9\s]/g, " ");
    const originalWords = originalText.split(/\s+/).filter(Boolean);

    let finalSelection;
    if (originalWords.length === 0 || words.length === 0) {
      finalSelection = words[0] || "";
    } else if (originalWords.length === 1 || words.length === 1) {
      finalSelection = words[0];
    } else {
      finalSelection = words.slice(0, 2).join(" ");
    }

    // Update selected word state
    setSelectedWord(finalSelection);

    // Add to history list
    await addToHistory(finalSelection);

    if (window.innerWidth < 768) {
      setMobileView("insights");
    }
  };

  // Optional: Add a function to manually clear selection
  const handleHistoryItemClick = async (term) => {
    setSelectedWord(term);
    // Optionally re-add to history to move it to front
    await addToHistory(term);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#FFF9F0] overflow-hidden font-sans text-[#2D3748]">

      {/* Error display */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* --- LEFT SIDEBAR: Sources & Recent Dictionary --- */}
      <aside className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex w-full md:w-72 bg-white border-r border-gray-200 flex-col z-20`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Linaw Logo" className="w-8 h-8 object-contain"/>
            <h2 className="font-bold text-xl tracking-tight text-[#2D3748]">Linaw</h2>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Tab Switcher - Now with sharper corners */}
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

      {/* --- CENTER: PDF Reader --- */}
      <main className={`${mobileView === 'reader' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-[#F8FAFC] relative`}>
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
          <div className="flex items-center gap-4 text-[#2D3748]">
            <h3 className="font-bold flex items-center gap-2">
               <FileText size={18} className="text-[#3DBDB4]" />
               {notebook.title}
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-full p-1">
              <button onClick={() => setScale(s => s - 0.1)} className="p-1.5 hover:bg-white rounded-full transition-all"><ZoomOut size={16}/></button>
              <span className="text-[10px] font-black px-2 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => s + 0.1)} className="p-1.5 hover:bg-white rounded-full transition-all"><ZoomIn size={16}/></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto flex justify-center py-8 px-4" onMouseUp={handleTextSelection}>
          <div className="shadow-xl bg-white h-fit border border-gray-200">
            {currentFile && (
              <Document
                file={currentFile}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                />
              </Document>
            )}
          </div>
        </div>

        {/* RESTORED: Floating Pagination */}
        {numPages && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 py-2 px-6 bg-[#2D3748] shadow-xl rounded-full z-10 text-white">
            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="hover:text-[#FFD93C] disabled:opacity-30">
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-black tracking-widest">{pageNumber} / {numPages}</span>
            <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="hover:text-[#FFD93C] disabled:opacity-30">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>

      {/* --- RIGHT SIDEBAR: Explain AI --- */}
      <aside className={`${mobileView === 'insights' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-l border-gray-100 p-5 flex-col gap-4 overflow-y-auto`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 text-[#3DBDB4]">
            <Sparkles size={16} /> Explain
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
             <span className="text-[9px] font-black text-gray-500 tracking-tighter">EN → CEB</span>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-[#3DBDB4]" size={24} />
          </div>
        )}

        {/* Selected Term Card - Palette #FFD93C */}
        <div className="bg-[#FFD93C] rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-[#2D3748]/40 uppercase tracking-widest mb-1">Active Term</p>
          <h2 className="text-xl font-black text-[#2D3748]">{selectedWord}</h2>
        </div>

        {/* CEBUANO EXPLANATION */}
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

        {/* BROUGHT BACK: ENGLISH DEFINITION */}
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

        {/* ILLUSTRATION */}
        <div className="bg-gray-50 aspect-video rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200">
            <Maximize2 size={24} className="text-gray-300 mb-1" />
            <p className="text-[9px] font-black text-gray-400 uppercase">Illustration</p>
        </div>

        {/* NOT TO BE CONFUSED WITH */}
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

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 flex items-center justify-around py-3 bg-[#2D3748] shadow-2xl rounded-xl z-50 text-white">
        <button onClick={() => setMobileView('sidebar')} className={mobileView === 'sidebar' ? 'text-[#FFD93C]' : 'opacity-40'}><Book size={20}/></button>
        <button onClick={() => setMobileView('reader')} className={mobileView === 'reader' ? 'text-[#3DBDB4]' : 'opacity-40'}><FileText size={20}/></button>
        <button onClick={() => setMobileView('insights')} className={mobileView === 'insights' ? 'text-[#FF6B6B]' : 'opacity-40'}><Sparkles size={20}/></button>
      </div>
    </div>
  );
};

export default InteractiveReader;
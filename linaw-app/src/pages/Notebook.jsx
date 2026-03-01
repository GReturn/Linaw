import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, FileText, Sparkles } from 'lucide-react';
import { pdfjs } from 'react-pdf';

// Core Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { auth } from "../services/firebase";
import { notebookService } from "../services/notebookService";

import Dictionary from '../components/notebook/Dictionary';
import Reader from '../components/notebook/Reader';
import Explain from '../components/notebook/Explain';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const InteractiveReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // UI State
  const [mobileView, setMobileView] = useState('reader');
  const [notebook, setNotebook] = useState({ title: "Linaw", file: "/2025.nllp-1.3.pdf" });
  const [documents, setDocuments] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  // PDF State
  const [selectedWord, setSelectedWord] = useState("");
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
        if (id) {
          const notebookData = await notebookService.getNotebook(id);
          setNotebook(notebookData);
        }

        const historyData = await notebookService.getHistory();
        setHistory(historyData);

        const confusionData = await notebookService.getConfusionTerms();
        setConfusionTerms(confusionData);
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
        const definitionData = await notebookService.getDefinition(selectedWord);
        setDefinition(definitionData);
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
      const historyData = await notebookService.addToHistory(word);
      setHistory(historyData);
    } catch (err) {
      console.error('Error adding to history:', err);
    }
  };

  const loadDocuments = async (user) => {
    try {
      const docs = await notebookService.getDocuments(user.uid, id);
      setDocuments(docs);
      if (docs.length > 0) {
        setCurrentFile(docs[0].fileURL);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await notebookService.uploadDocument(file, id, auth.currentUser.uid);
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

  const handleHistoryItemClick = async (term) => {
    setSelectedWord(term);
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
      <Dictionary
        mobileView={mobileView}
        navigate={navigate}
        documents={documents}
        history={history}
        setCurrentFile={setCurrentFile}
        handleFileUpload={handleFileUpload}
        handleHistoryItemClick={handleHistoryItemClick}
      />

      {/* --- CENTER: PDF Reader --- */}
      <Reader
        mobileView={mobileView}
        notebook={notebook}
        currentFile={currentFile}
        scale={scale}
        setScale={setScale}
        numPages={numPages}
        setNumPages={setNumPages}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        handleTextSelection={handleTextSelection}
      />

      {/* --- RIGHT SIDEBAR: Explain AI --- */}
      <Explain
        mobileView={mobileView}
        loading={loading}
        selectedWord={selectedWord}
        definition={definition}
        confusionTerms={confusionTerms}
        handleHistoryItemClick={handleHistoryItemClick}
      />

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 flex items-center justify-around py-3 bg-[#2D3748] shadow-2xl rounded-xl z-50 text-white">
        <button onClick={() => setMobileView('sidebar')} className={mobileView === 'sidebar' ? 'text-[#FFD93C]' : 'opacity-40'}><Book size={20} /></button>
        <button onClick={() => setMobileView('reader')} className={mobileView === 'reader' ? 'text-[#3DBDB4]' : 'opacity-40'}><FileText size={20} /></button>
        <button onClick={() => setMobileView('insights')} className={mobileView === 'insights' ? 'text-[#FF6B6B]' : 'opacity-40'}><Sparkles size={20} /></button>
      </div>
    </div>
  );
};

export default InteractiveReader;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, FileText, Sparkles } from 'lucide-react';
import { pdfjs } from 'react-pdf';
import { doc, getDoc } from 'firebase/firestore';
import { collection, onSnapshot } from "firebase/firestore";

// Core Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { auth, db } from "../services/firebase";
import { notebookService } from "../services/notebookService";
import { validateSelection, TOO_MANY_WORDS_MESSAGE } from "../services/selectionValidator";

import Dictionary from '../components/notebook/Dictionary';
import Reader from '../components/notebook/Reader';
import Explain from '../components/notebook/Explain';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Toggle n-gram highlight suggestions UI (set to true to show "Did you mean?" banner)
const ENABLE_NGRAM_SUGGESTIONS = false;

const InteractiveReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // UI State
  const [mobileView, setMobileView] = useState('reader');
  const [notebook, setNotebook] = useState({ title: "Linaw", file: "/2025.nllp-1.3.pdf" });
  const [documents, setDocuments] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState("Cebuano (CEB)");

  // PDF State
  const [selectedWord, setSelectedWord] = useState("");
  const [highlightSuggestion, setHighlightSuggestion] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);

  // API States
  const [history, setHistory] = useState([]);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (id && auth.currentUser) {
          const notebookSnap = await getDoc(
            doc(db, "users", auth.currentUser.uid, "notebooks", id)
          );
          if (notebookSnap.exists()) {
            setNotebook({ title: notebookSnap.data().title });
          }

          // Load history from Firestore (persisted, not in-memory)
          const historyData = await notebookService.getHistory(auth.currentUser.uid, id);
          setHistory(historyData);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data');
      }
    };

    loadInitialData();
  }, [id]);

  // Fetch definition when word is selected
  useEffect(() => {
    const fetchDefinition = async () => {
      if (!selectedWord || !auth.currentUser) return;

      setLoading(true);
      try {
        // Checks Firebase global_dictionary first; falls back to mock (TODO: Gemini)
        const definitionData = await notebookService.getDefinition(
          auth.currentUser.uid,
          id,
          selectedWord
        );
        setDefinition(definitionData);
        if (definitionData?.confused_with?.length > 0) {
          setConfusionTerms(definitionData.confused_with);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching definition:', err);
        setError('Failed to fetch definition');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [selectedWord, targetLanguage]);

  // History is recorded as a side-effect inside getDefinition (via dictionaryService).
  // This function just re-fetches the latest list from Firestore to refresh the sidebar.
  const addToHistory = async () => {
    try {
      if (auth.currentUser && id) {
        const historyData = await notebookService.getHistory(auth.currentUser.uid, id);
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Error refreshing history:', err);
    }
  };

  useEffect(() => {
    if (!id) return;

    let unsubscribeDocs = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      unsubscribeDocs = onSnapshot(
        collection(db, "users", user.uid, "notebooks", id, "documents"),
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setDocuments(docs);

          // if (docs.length > 0) {
          //   setCurrentFile(prev => prev || docs[0].fileURL);
          // }
        }
      );
    });

    return () => {
      if (unsubscribeDocs) unsubscribeDocs();
      unsubscribeAuth();
    };
  }, [id]);

  const handleDocumentSwitch = (fileUrl) => {
    setPageNumber(1);
    setNumPages(null);
    setCurrentFile(fileUrl);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const uploadedDoc = await notebookService.uploadDocument(
        file,
        id,
        auth.currentUser.uid
      );

      const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const uploadedDoc = await notebookService.uploadDocument(
      file,
      id,
      auth.currentUser.uid
    );

    setCurrentFile(uploadedDoc.fileURL);

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
  }
};

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

    if (words.length === 0) return;

    // Shared validation: rejects phrases longer than MAX_WORD_COUNT
    const { valid } = validateSelection(expanded);
    if (!valid) {
      setError(TOO_MANY_WORDS_MESSAGE);
      setTimeout(() => setError(null), 3500);
      return;
    }

    // Use all expanded words (no artificial clipping)
    const finalSelection = words.join(" ");

    // N-gram correction: gather surrounding context from the PDF text layer
    const { extractContextFromDOM, findBestCandidate } = await import('../services/ngramCorrector.js');
    const contextText = extractContextFromDOM(range);
    const { original, suggestion } = findBestCandidate(finalSelection, contextText);

    // Determine which text to gate-check (suggestion will be offered separately)
    const textToCheck = original;

    // LAYER 1: Stopword check
    const { isStopwordPhrase, isSemanticallyDefinable } = await import('../services/wordGate.js');
    if (isStopwordPhrase(textToCheck)) {
      console.log(`[WordGate] Rejected stopword: "${textToCheck}"`);
      return;
    }

    setLoading(true);
    try {
      // LAYER 2: Semantic check via transformers.js worker
      const isMeaningful = await isSemanticallyDefinable(textToCheck);
      if (!isMeaningful) {
        console.log(`[WordGate] Rejected meaningless phrase: "${textToCheck}"`);
        return;
      }

      // Both gates passed!
      if (suggestion && ENABLE_NGRAM_SUGGESTIONS) {
        // Show suggestion banner instead of proceeding immediately
        setHighlightSuggestion({ original, suggestion });
        setSelectedWord(original);
        console.log(`[N-gram] Suggesting correction: "${original}" → "${suggestion}"`);
      } else {
        // Auto-accept the best candidate (or original if no suggestion)
        const finalWord = original;
        setHighlightSuggestion(null);
        setSelectedWord(finalWord);
        // History is recorded inside getDefinition; just refresh the sidebar after
        await addToHistory();
      }

      if (window.innerWidth < 768) {
        setMobileView("insights");
      }
    } catch (err) {
      console.error("Semantic worker failed, bypassing gate:", err);
      setHighlightSuggestion(null);
      setSelectedWord(finalSelection);
      await addToHistory();
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!highlightSuggestion) return;
    const { suggestion } = highlightSuggestion;
    setSelectedWord(suggestion);
    setHighlightSuggestion(null);
    await addToHistory();
  };

  const dismissSuggestion = async () => {
    if (!highlightSuggestion) return;
    const { original } = highlightSuggestion;
    setHighlightSuggestion(null);
    await addToHistory();
  };

  const handleHistoryItemClick = async (term) => {
    setSelectedWord(term);
    // Definition lookup (and thus history recording) triggered by selectedWord effect
  };

  // Pre-initialize the Semantic Worker on mount
  useEffect(() => {
    import('../services/wordGate.js').then(({ initSemanticWorker }) => {
      initSemanticWorker();
    });
  }, []);

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
        setCurrentFile={handleDocumentSwitch}
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
        confusionTerms={definition?.confused_with ?? []}
        handleHistoryItemClick={handleHistoryItemClick}
        highlightSuggestion={highlightSuggestion}
        onAcceptSuggestion={acceptSuggestion}
        onDismissSuggestion={dismissSuggestion}
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
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
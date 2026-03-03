import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Plus, Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Sparkles, Clock, Loader, Maximize2, Minimize2, X as XIcon } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

/**
 * Shuffle an array using Fisher–Yates.
 */
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const FlashcardQuiz = ({ history, userId, notebookId }) => {
    // ─── View state ───
    const [view, setView] = useState('list');          // 'list' | 'quiz' | 'results'
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // ─── Active quiz state ───
    const [activeQuiz, setActiveQuiz] = useState(null);     // full quiz doc + id
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);

    const quizzesRef = userId && notebookId
        ? collection(db, 'users', userId, 'notebooks', notebookId, 'quizzes')
        : null;

    // Escape key to collapse expanded view
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isExpanded]);

    // Prevent body scroll when expanded
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isExpanded]);

    // ─── Fetch saved quizzes ───
    const fetchQuizzes = useCallback(async () => {
        if (!quizzesRef) return;
        setIsLoadingList(true);
        try {
            const q = query(quizzesRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setSavedQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('[Quiz] Error fetching quizzes:', err);
        } finally {
            setIsLoadingList(false);
        }
    }, [userId, notebookId]);

    useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

    // ─── Generate a new quiz ───
    const generateQuiz = async () => {
        if (!quizzesRef || history.length < 4) return;
        setIsGenerating(true);

        try {
            // Pick up to 10 random terms
            const shuffled = shuffle(history);
            const candidates = shuffled.slice(0, Math.min(10, shuffled.length));

            // Fetch definitions from global_dictionary
            const items = [];
            for (const term of candidates) {
                const termKey = term.toLowerCase().trim();
                // Check all translation docs for this term (language-agnostic)
                const translationsRef = collection(db, 'global_dictionary', termKey, 'translations');
                const translationsSnap = await getDocs(translationsRef);

                let found = false;
                for (const tDoc of translationsSnap.docs) {
                    const data = tDoc.data();
                    if (data.english_definition) {
                        items.push({ term, definition: data.english_definition });
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    // Fallback: check root doc
                    const rootRef = doc(db, 'global_dictionary', termKey);
                    const rootSnap = await getDoc(rootRef);
                    if (rootSnap.exists() && rootSnap.data().english_definition) {
                        items.push({ term, definition: rootSnap.data().english_definition });
                    }
                }
            }

            if (items.length < 4) {
                console.warn('[Quiz] Not enough terms with definitions. Found:', items.length);
                setIsGenerating(false);
                return;
            }

            // Build questions
            const questions = items.map((item, idx) => {
                // Pick 3 distractors from other items
                const others = items.filter((_, i) => i !== idx);
                const distractors = shuffle(others).slice(0, 3).map(o => o.term);
                const choices = shuffle([item.term, ...distractors]);
                return {
                    term: item.term,
                    definition: item.definition,
                    choices,
                };
            });

            // Save to Firestore
            const quizDoc = {
                createdAt: serverTimestamp(),
                questionCount: questions.length,
                bestScore: 0,
                lastScore: 0,
                lastPlayedAt: null,
                questions,
            };

            const docRef = await addDoc(quizzesRef, quizDoc);
            const newQuiz = { id: docRef.id, ...quizDoc, createdAt: new Date() };

            setSavedQuizzes(prev => [newQuiz, ...prev]);

            // Auto-start the new quiz
            startQuiz(newQuiz);
        } catch (err) {
            console.error('[Quiz] Error generating quiz:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // ─── Start / retake a quiz ───
    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setView('quiz');
    };

    // ─── Handle answer ───
    const handleAnswer = (choice) => {
        if (answered) return;
        setSelectedAnswer(choice);
        setAnswered(true);

        const isCorrect = choice === activeQuiz.questions[currentIndex].term;
        if (isCorrect) setScore(prev => prev + 1);

        // Advance after delay
        setTimeout(() => {
            const nextIdx = currentIndex + 1;
            if (nextIdx >= activeQuiz.questions.length) {
                // Quiz complete
                const finalScore = isCorrect ? score + 1 : score;
                finishQuiz(finalScore);
            } else {
                setCurrentIndex(nextIdx);
                setSelectedAnswer(null);
                setAnswered(false);
            }
        }, 1200);
    };

    // ─── Finish quiz → save scores ───
    const finishQuiz = async (finalScore) => {
        setView('results');
        setScore(finalScore);

        if (!activeQuiz?.id || !quizzesRef) return;

        try {
            const quizRef = doc(db, 'users', userId, 'notebooks', notebookId, 'quizzes', activeQuiz.id);
            const newBest = Math.max(finalScore, activeQuiz.bestScore || 0);

            await updateDoc(quizRef, {
                lastScore: finalScore,
                bestScore: newBest,
                lastPlayedAt: serverTimestamp(),
            });

            // Update local state
            setActiveQuiz(prev => ({ ...prev, lastScore: finalScore, bestScore: newBest }));
            setSavedQuizzes(prev =>
                prev.map(q => q.id === activeQuiz.id
                    ? { ...q, lastScore: finalScore, bestScore: newBest }
                    : q
                )
            );
        } catch (err) {
            console.error('[Quiz] Error saving score:', err);
        }
    };

    // ─── Back to list ───
    const backToList = () => {
        setView('list');
        setActiveQuiz(null);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setIsExpanded(false);
    };

    // ─────────────────── CONTENT RENDERERS ───────────────────

    // === RESULTS CONTENT ===
    const renderResults = () => {
        const total = activeQuiz.questions.length;
        const pct = Math.round((score / total) * 100);
        const isGreat = pct >= 80;
        const isPerfect = pct === 100;

        return (
            <div className={`space-y-4 animate-[fadeSlideIn_0.3s_ease-out] ${isExpanded ? 'max-w-lg mx-auto w-full' : ''}`}>
                {/* Expand/Collapse + Close */}
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <Minimize2 size={14} className="text-gray-400" /> : <Maximize2 size={14} className="text-gray-400" />}
                    </button>
                </div>

                {/* Results Card */}
                <div className={`rounded-2xl ${isExpanded ? 'p-10' : 'p-6'} text-center ${isPerfect ? 'bg-gradient-to-br from-[#FFD93C]/20 to-[#3DBDB4]/20 border border-[#FFD93C]/30' : 'bg-white border border-gray-100'} shadow-sm`}>
                    <div className="flex justify-center mb-3">
                        {isPerfect ? (
                            <div className={`${isExpanded ? 'w-24 h-24' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-[#FFD93C] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#FFD93C]/30 animate-[bounceIn_0.5s_ease-out]`}>
                                <Trophy size={isExpanded ? 40 : 28} className="text-white" />
                            </div>
                        ) : isGreat ? (
                            <div className={`${isExpanded ? 'w-24 h-24' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-[#3DBDB4] to-[#2CA39B] flex items-center justify-center shadow-lg shadow-[#3DBDB4]/30`}>
                                <CheckCircle2 size={isExpanded ? 40 : 28} className="text-white" />
                            </div>
                        ) : (
                            <div className={`${isExpanded ? 'w-24 h-24' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
                                <Brain size={isExpanded ? 40 : 28} className="text-gray-500" />
                            </div>
                        )}
                    </div>

                    <h3 className={`${isExpanded ? 'text-3xl' : 'text-2xl'} font-black text-[#2D3748] mb-1`}>
                        {isPerfect ? 'Perfect!' : isGreat ? 'Great Job!' : 'Keep Practicing!'}
                    </h3>
                    <p className={`${isExpanded ? 'text-base' : 'text-sm'} text-gray-400 mb-4`}>
                        {isPerfect ? 'You got every single one right!' : isGreat ? 'Almost perfect — impressive!' : 'Every attempt makes you stronger.'}
                    </p>

                    {/* Score circle */}
                    <div className={`inline-flex flex-col items-center bg-gray-50 rounded-2xl ${isExpanded ? 'px-12 py-6' : 'px-8 py-4'} mb-4`}>
                        <span className={`${isExpanded ? 'text-5xl' : 'text-4xl'} font-black text-[#2D3748]`}>{score}<span className={`${isExpanded ? 'text-2xl' : 'text-lg'} text-gray-400`}>/{total}</span></span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{pct}% correct</span>
                    </div>

                    {activeQuiz.bestScore > 0 && score > activeQuiz.bestScore && (
                        <div className="flex items-center justify-center gap-1.5 text-[#FFD93C] mb-4">
                            <Sparkles size={14} />
                            <span className="text-xs font-black uppercase tracking-wider">New Best Score!</span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => startQuiz(activeQuiz)}
                        className={`flex-1 flex items-center justify-center gap-2 ${isExpanded ? 'py-4 text-sm' : 'py-3 text-xs'} bg-gradient-to-r from-[#3DBDB4] to-[#35a99f] text-white rounded-xl font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-[#3DBDB4]/20 transition-all`}
                    >
                        <RotateCcw size={14} /> Retake
                    </button>
                    <button
                        onClick={backToList}
                        className={`flex-1 flex items-center justify-center gap-2 ${isExpanded ? 'py-4 text-sm' : 'py-3 text-xs'} bg-gray-100 text-gray-600 rounded-xl font-bold uppercase tracking-wider hover:bg-gray-200 transition-all`}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                </div>
            </div>
        );
    };

    // === ACTIVE QUIZ CONTENT ===
    const renderQuiz = () => {
        const question = activeQuiz.questions[currentIndex];
        const total = activeQuiz.questions.length;
        const progress = ((currentIndex) / total) * 100;

        return (
            <div className={`space-y-4 animate-[fadeSlideIn_0.3s_ease-out] ${isExpanded ? 'max-w-2xl mx-auto w-full' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={backToList} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={16} className="text-gray-400" />
                    </button>
                    <span className={`${isExpanded ? 'text-sm' : 'text-xs'} font-black text-gray-400 uppercase tracking-wider`}>
                        {currentIndex + 1} / {total}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-[#3DBDB4]/10 px-2.5 py-1 rounded-full">
                            <Trophy size={12} className="text-[#3DBDB4]" />
                            <span className="text-xs font-black text-[#3DBDB4]">{score}</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <Minimize2 size={14} className="text-gray-400" /> : <Maximize2 size={14} className="text-gray-400" />}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className={`${isExpanded ? 'h-2' : 'h-1.5'} bg-gray-100 rounded-full overflow-hidden`}>
                    <div
                        className="h-full bg-gradient-to-r from-[#3DBDB4] to-[#35a99f] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Definition Card */}
                <div className={`bg-gradient-to-br from-[#2D3748] to-[#1a2332] rounded-2xl ${isExpanded ? 'p-8' : 'p-5'} shadow-lg`}>
                    <p className={`${isExpanded ? 'text-xs mb-3' : 'text-[10px] mb-2'} font-black text-white/40 uppercase tracking-widest`}>
                        What word matches this definition?
                    </p>
                    <p className={`${isExpanded ? 'text-lg' : 'text-sm'} text-white/90 leading-relaxed font-medium`}>
                        "{question.definition}"
                    </p>
                </div>

                {/* Choices (2×2 grid) */}
                <div className="grid grid-cols-2 gap-2">
                    {question.choices.map((choice, i) => {
                        const isSelected = selectedAnswer === choice;
                        const isCorrectChoice = choice === question.term;
                        const showCorrect = answered && isCorrectChoice;
                        const showWrong = answered && isSelected && !isCorrectChoice;

                        let btnClass = 'bg-white border border-gray-200 text-gray-700 hover:border-[#3DBDB4] hover:bg-[#3DBDB4]/5';
                        if (showCorrect) {
                            btnClass = 'bg-[#10B981]/10 border-2 border-[#10B981] text-[#10B981] ring-2 ring-[#10B981]/20';
                        } else if (showWrong) {
                            btnClass = 'bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] text-[#FF6B6B] ring-2 ring-[#FF6B6B]/20';
                        } else if (answered) {
                            btnClass = 'bg-gray-50 border border-gray-100 text-gray-300';
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(choice)}
                                disabled={answered}
                                className={`${isExpanded ? 'p-5 text-sm' : 'p-3 text-xs'} rounded-xl font-bold transition-all duration-200 ${btnClass} ${answered ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {showCorrect && <CheckCircle2 size={isExpanded ? 18 : 14} className="text-[#10B981] flex-shrink-0" />}
                                    {showWrong && <XCircle size={isExpanded ? 18 : 14} className="text-[#FF6B6B] flex-shrink-0" />}
                                    <span className="truncate">{choice}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ESC hint in expanded mode */}
                {isExpanded && (
                    <p className="text-center text-[10px] text-gray-300 font-mono mt-2">
                        Press ESC to collapse
                    </p>
                )}
            </div>
        );
    };

    // MAIN RENDER

    // === Expanded overlay for quiz/results ===
    if (isExpanded && (view === 'quiz' || view === 'results')) {
        return (
            <>
                {/* Sidebar placeholder so layout doesn't collapse */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                        Flashcard Quizzes
                    </p>
                    <div className="flex items-center justify-center py-8">
                        <p className="text-xs text-gray-400 text-center">
                            Quiz is expanded.
                            <button onClick={() => setIsExpanded(false)} className="text-[#3DBDB4] font-bold ml-1 hover:underline">
                                Collapse
                            </button>
                        </p>
                    </div>
                </div>

                {/* Fullscreen overlay */}
                <div className="fixed inset-0 z-[9999] bg-[#FFF9F0]/98 backdrop-blur-xl flex items-center justify-center p-6 animate-[fadeSlideIn_0.2s_ease-out]">
                    {/* Close button */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-gray-200/50 rounded-full transition-colors"
                        title="Close expanded view (ESC)"
                    >
                        <XIcon size={20} className="text-gray-500" />
                    </button>

                    {view === 'results' ? renderResults() : renderQuiz()}
                </div>
            </>
        );
    }

    // === RESULTS (inline) ===
    if (view === 'results' && activeQuiz) {
        return renderResults();
    }

    // === ACTIVE QUIZ (inline) ===
    if (view === 'quiz' && activeQuiz) {
        return renderQuiz();
    }

    // === QUIZ LIST VIEW (default) ===
    const notEnoughWords = history.length < 4;

    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Flashcard Quizzes
            </p>

            {/* Generate button */}
            <button
                onClick={generateQuiz}
                disabled={notEnoughWords || isGenerating}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${notEnoughWords
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#3DBDB4] to-[#35a99f] text-white hover:shadow-lg hover:shadow-[#3DBDB4]/20 active:scale-[0.98]'
                    }`}
            >
                {isGenerating ? (
                    <>
                        <Loader size={14} className="animate-spin" />
                        Generating…
                    </>
                ) : (
                    <>
                        <Plus size={14} />
                        Generate New Quiz
                    </>
                )}
            </button>

            {notEnoughWords && (
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    Look up at least <span className="font-bold text-[#3DBDB4]">4 words</span> in the dictionary to generate a quiz.
                </p>
            )}

            {/* Loading state */}
            {isLoadingList && (
                <div className="flex items-center justify-center py-6">
                    <Loader size={20} className="animate-spin text-gray-300" />
                </div>
            )}

            {/* Saved quizzes */}
            {!isLoadingList && savedQuizzes.length === 0 && !notEnoughWords && (
                <p className="text-sm text-gray-400 text-center py-4">
                    No quizzes yet. Generate one!
                </p>
            )}

            {!isLoadingList && savedQuizzes.map((quiz) => {
                const pct = quiz.questionCount > 0
                    ? Math.round(((quiz.bestScore || 0) / quiz.questionCount) * 100)
                    : 0;
                const dateStr = quiz.createdAt?.toDate
                    ? quiz.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : quiz.createdAt instanceof Date
                        ? quiz.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'Just now';

                return (
                    <button
                        key={quiz.id}
                        onClick={() => startQuiz(quiz)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between group hover:border-[#3DBDB4]/40 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${pct === 100
                                ? 'bg-gradient-to-br from-[#FFD93C]/20 to-[#F59E0B]/20'
                                : pct >= 80
                                    ? 'bg-[#3DBDB4]/10'
                                    : 'bg-gray-100'
                                }`}>
                                {pct === 100 ? (
                                    <Trophy size={16} className="text-[#F59E0B]" />
                                ) : (
                                    <Brain size={16} className={pct >= 80 ? 'text-[#3DBDB4]' : 'text-gray-400'} />
                                )}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-[#2D3748] group-hover:text-[#3DBDB4] transition-colors">
                                    {quiz.questionCount} Questions
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Clock size={10} className="text-gray-300" />
                                    <span className="text-[10px] text-gray-400">{dateStr}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-[#2D3748]">
                                {quiz.bestScore || 0}<span className="text-gray-300">/{quiz.questionCount}</span>
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Best</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default FlashcardQuiz;

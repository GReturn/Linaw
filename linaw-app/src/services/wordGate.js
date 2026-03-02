// src/services/wordGate.js

// A lightweight list of common English stopwords to instantly reject.
const STOPWORDS = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd",
    "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its",
    "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's",
    "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when",
    "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why",
    "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves", "is in",
]);

/**
 * Checks if a phrase is entirely composed of stopwords.
 */
export const isStopwordPhrase = (text) => {
    if (!text) return true;

    // Clean text and split by whitespace
    const words = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return true;

    // If EVERY word in the phrase is a stopword, reject the phrase.
    return words.every(word => STOPWORDS.has(word));
};

let worker = null;
let resolveClassification = null;
let rejectClassification = null;

/**
 * Initializes the Semantic ML worker. Need to call this on mount.
 */
export const initSemanticWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./semanticWorker.js', import.meta.url), {
            type: 'module'
        });

        worker.addEventListener('message', (e) => {
            const data = e.data;
            if (data.status === 'complete' && resolveClassification) {
                resolveClassification(data.isMeaningful);
                resolveClassification = null;
                rejectClassification = null;
            } else if (data.status === 'error' && rejectClassification) {
                rejectClassification(new Error(data.error));
                resolveClassification = null;
                rejectClassification = null;
            } else if (data.status === 'analyzing') {
                // Optional: hook a global loading state here if needed
            }
        });
    }
};

/**
 * Checks if a phrase has semantic meaning using the local ML Worker.
 */
export const isSemanticallyDefinable = async (text) => {
    if (!worker) initSemanticWorker();

    return new Promise((resolve, reject) => {
        resolveClassification = resolve;
        rejectClassification = reject;

        // Post message to the worker to start inference
        worker.postMessage({ text });
    });
};

// content.js
// Injected into all pages. Expands highlighted text to word boundaries
// and provides the result to the background script on demand via messaging.

var BLOCK_TAGS = ["P", "DIV", "LI", "TD", "TH", "SECTION", "ARTICLE", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "BODY"];

// A lightweight list of common English stopwords to instantly reject.
var STOPWORDS = new Set([
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
function isStopwordPhrase(text) {
    if (!text) return true;
    var words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    return words.every(function (word) { return STOPWORDS.has(word); });
}

/**
 * Walk up the DOM from `el` to the nearest block-level parent.
 */
function findBlockParent(el) {
    while (el && el.parentElement && BLOCK_TAGS.indexOf(el.tagName) === -1) {
        el = el.parentElement;
    }
    return el;
}

/**
 * Expand a raw selected string to full word boundaries by scanning the
 * surrounding text from the nearest block-level parent element.
 */
function expandToWordBoundaries(rawText, range) {
    var ancestor = range.commonAncestorContainer;
    if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentElement;
    ancestor = findBlockParent(ancestor);

    var rawSurrounding = ancestor ? ancestor.textContent : rawText;
    if (!rawSurrounding) return rawText;

    // Normalize whitespace in both strings so matching works on real webpages
    var surrounding = rawSurrounding.replace(/\s+/g, " ");
    var needle = rawText.replace(/\s+/g, " ").trim();

    if (!needle) return rawText;

    var idx = surrounding.indexOf(needle);
    if (idx === -1) {
        idx = surrounding.toLowerCase().indexOf(needle.toLowerCase());
    }
    if (idx === -1) {
        console.log("[Linaw] Could not find selection in surrounding text.",
            "Needle:", JSON.stringify(needle),
            "Surrounding (first 200):", JSON.stringify(surrounding.slice(0, 200)));
        return rawText;
    }

    // Expand backwards to word boundary
    var startIdx = idx;
    while (startIdx > 0 && /[a-zA-Z0-9]/.test(surrounding[startIdx - 1])) {
        startIdx--;
    }

    // Expand forwards to word boundary
    var endIdx = idx + needle.length;
    while (endIdx < surrounding.length && /[a-zA-Z0-9]/.test(surrounding[endIdx])) {
        endIdx++;
    }

    var expanded = surrounding.slice(startIdx, endIdx).trim();
    console.log("[Linaw] Expansion:", JSON.stringify(rawText), "→", JSON.stringify(expanded));
    return expanded;
}

/**
 * Extract and truncate block-level context text around the selection.
 */
function extractContext(range, rawText, cleaned) {
    var contextNode = range.commonAncestorContainer;
    if (contextNode.nodeType === Node.TEXT_NODE) {
        contextNode = contextNode.parentElement;
    }
    contextNode = findBlockParent(contextNode);

    var fullContext = contextNode ? contextNode.textContent : cleaned;
    // Normalize whitespace
    if (fullContext) fullContext = fullContext.replace(/\s+/g, " ").trim();

    // Truncate if too long
    if (fullContext && fullContext.length > 1000) {
        var normalizedRaw = rawText.replace(/\s+/g, " ").trim();
        var idx = fullContext.indexOf(normalizedRaw);
        if (idx === -1) idx = fullContext.toLowerCase().indexOf(normalizedRaw.toLowerCase());
        if (idx !== -1) {
            var start = Math.max(0, idx - 250);
            var end = Math.min(fullContext.length, idx + normalizedRaw.length + 250);
            return fullContext.slice(start, end);
        }
        return fullContext.slice(0, 500);
    }
    return fullContext || cleaned;
}

// --- N-gram Correction Logic ---

function ngramsOf(words, n) {
    var result = [];
    for (var i = 0; i <= words.length - n; i++) {
        result.push(words.slice(i, i + n).join(' '));
    }
    return result;
}

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function findSubsequencePosition(words, subseq) {
    if (subseq.length > words.length) return -1;
    for (var i = 0; i <= words.length - subseq.length; i++) {
        var match = true;
        for (var j = 0; j < subseq.length; j++) {
            if (words[i + j] !== subseq[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }
    return -1;
}

function generateOverlappingNgrams(contextText, selectedText, maxN) {
    if (!maxN) maxN = 6;
    var contextWords = normalize(contextText).split(/\s+/).filter(Boolean);
    var selectedWords = normalize(selectedText).split(/\s+/).filter(Boolean);

    if (selectedWords.length === 0 || contextWords.length === 0) return [];

    var seen = new Set();
    var candidates = [];

    var minN = selectedWords.length + 1;
    for (var n = minN; n <= Math.min(maxN, contextWords.length); n++) {
        var grams = ngramsOf(contextWords, n);
        for (var i = 0; i < grams.length; i++) {
            var gram = grams[i];
            if (seen.has(gram)) continue;

            var gramWords = gram.split(/\s+/);
            var pos = findSubsequencePosition(gramWords, selectedWords);
            if (pos === -1) continue;

            seen.add(gram);

            var direction;
            if (pos === 0 && gramWords.length > selectedWords.length) {
                direction = 'forward';
            } else if (pos + selectedWords.length === gramWords.length) {
                direction = 'backward';
            } else {
                direction = 'both';
            }

            candidates.push({ text: gram, direction: direction });
        }
    }
    return candidates;
}

function detectTruncationDirection(contextText, selectedText) {
    var normContext = normalize(contextText);
    var normSelection = normalize(selectedText);
    var idx = normContext.indexOf(normSelection);
    if (idx === -1) return null;

    var before = normContext.slice(0, idx).trim();
    var after = normContext.slice(idx + normSelection.length).trim();

    var truncatedAfter = after.length > 0 && /^[a-z0-9]/.test(after);
    var truncatedBefore = before.length > 0 && /[a-z0-9]$/.test(before);

    if (truncatedAfter && truncatedBefore) return 'both';
    if (truncatedAfter) return 'forward';
    if (truncatedBefore) return 'backward';
    return null;
}

function recoverCasing(normalizedPhrase, contextText) {
    var contextLower = contextText.toLowerCase();
    var idx = contextLower.indexOf(normalizedPhrase);
    if (idx !== -1) {
        return contextText.slice(idx, idx + normalizedPhrase.length);
    }
    return normalizedPhrase.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function findBestCandidate(selectedText, contextText) {
    var selected = normalize(selectedText);
    var selectedWords = selected.split(/\s+/).filter(Boolean);

    if (selectedWords.length <= 1) {
        return { original: selectedText.trim(), suggestion: null };
    }

    var truncationDir = detectTruncationDirection(contextText, selectedText);
    if (!truncationDir) {
        return { original: selectedText.trim(), suggestion: null };
    }

    var candidates = generateOverlappingNgrams(contextText, selectedText);
    if (candidates.length === 0) {
        return { original: selectedText.trim(), suggestion: null };
    }

    var scored = candidates.map(function (c) {
        var wordLen = c.text.split(/\s+/).length;
        var lenDiff = Math.abs(wordLen - (selectedWords.length + 1));
        var dirScore;
        if (c.direction === truncationDir) {
            dirScore = 0;
        } else if (c.direction === 'both') {
            dirScore = 1;
        } else {
            dirScore = 10;
        }
        return Object.assign({}, c, { score: dirScore * 100 + lenDiff });
    });

    scored.sort(function (a, b) { return a.score - b.score; });
    var best = scored[0];

    if (best.text === selected) {
        return { original: selectedText.trim(), suggestion: null };
    }

    var properCased = recoverCasing(best.text, contextText);
    return {
        original: selectedText.trim(),
        suggestion: properCased,
    };
}

/**
 * Perform expansion on the browser selection and return the result.
 * Called on demand when the background script sends GET_EXPANDED_SELECTION.
 */
function getExpandedSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) {
        console.log("[Linaw] No active selection found");
        return null;
    }

    var rawText = sel.toString().trim();
    var range = sel.getRangeAt(0);

    console.log("[Linaw] Raw selection:", JSON.stringify(rawText));

    // Expand to full word boundaries
    var expanded = expandToWordBoundaries(rawText, range);
    var cleaned = expanded.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    if (!cleaned) return null;

    var contextText = extractContext(range, rawText, cleaned);

    // N-gram correction: see if we should suggest a better phrase
    var correction = findBestCandidate(expanded, contextText);
    var finalWord = cleaned;

    if (correction && correction.suggestion) {
        console.log("[Linaw] Correction suggested:", correction.suggestion);
        // In the extension, we'll automatically use the suggestion if it helps "capture the meaning"
        finalWord = correction.suggestion.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    }

    console.log("[Linaw] Final result - word:", JSON.stringify(finalWord), "context length:", contextText.length);

    return {
        word: finalWord,
        wordCount: finalWord.split(/\s+/).filter(Boolean).length,
        contextText: contextText
    };
}

// Listen for messages from the background script asking for the expanded text.
// This does the expansion ON DEMAND using the CURRENT selection, not a cached value.
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "GET_EXPANDED_SELECTION") {
        var result = getExpandedSelection();
        sendResponse(result || { word: "", wordCount: 0, contextText: "" });
    }
});


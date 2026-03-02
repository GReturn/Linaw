// src/services/ngramCorrector.js
// N-gram based highlight correction for PDF text selection.
// Walks DOM siblings to gather surrounding context, generates overlapping
// n-gram candidates, and picks the best match for what the user intended.

/**
 * Walk DOM siblings of the selection range to collect surrounding text.
 * PDF.js renders each text run as a separate <span> inside `.textLayer`,
 * so we need to traverse siblings to reconstruct the full sentence.
 *
 * @param {Range} range - The browser Selection range
 * @param {number} windowSize - Max words to collect on each side
 * @returns {string} The combined context text
 */
export function extractContextFromDOM(range, windowSize = 30) {
    if (!range) return '';

    // Find the nearest textLayer ancestor — that's the PDF page container
    let textLayerEl = range.startContainer;
    while (textLayerEl && !textLayerEl.classList?.contains('textLayer')) {
        textLayerEl = textLayerEl.parentElement;
    }
    if (!textLayerEl) {
        // Fallback: just return whatever text the range itself contains
        return range.toString().trim();
    }

    // Collect all text spans inside the text layer
    const allSpans = Array.from(textLayerEl.querySelectorAll('span'));
    if (allSpans.length === 0) return range.toString().trim();

    // Find which span(s) the selection intersects
    const selectionSpanIndices = [];
    for (let i = 0; i < allSpans.length; i++) {
        if (range.intersectsNode(allSpans[i])) {
            selectionSpanIndices.push(i);
        }
    }

    if (selectionSpanIndices.length === 0) return range.toString().trim();

    const firstIdx = selectionSpanIndices[0];
    const lastIdx = selectionSpanIndices[selectionSpanIndices.length - 1];

    // Expand outward to collect context spans
    // We go `windowSize` words in each direction
    const contextParts = [];
    let wordsBefore = 0;
    for (let i = firstIdx - 1; i >= 0 && wordsBefore < windowSize; i--) {
        const text = allSpans[i].textContent.trim();
        if (text) {
            contextParts.unshift(text);
            wordsBefore += text.split(/\s+/).length;
        }
    }

    // Add the selected span(s) text
    for (let i = firstIdx; i <= lastIdx; i++) {
        contextParts.push(allSpans[i].textContent.trim());
    }

    // After
    let wordsAfter = 0;
    for (let i = lastIdx + 1; i < allSpans.length && wordsAfter < windowSize; i++) {
        const text = allSpans[i].textContent.trim();
        if (text) {
            contextParts.push(text);
            wordsAfter += text.split(/\s+/).length;
        }
    }

    return contextParts.join(' ');
}

/**
 * Generate all n-grams from a word array.
 * @param {string[]} words
 * @param {number} n
 * @returns {string[]}
 */
function ngramsOf(words, n) {
    const result = [];
    for (let i = 0; i <= words.length - n; i++) {
        result.push(words.slice(i, i + n).join(' '));
    }
    return result;
}

/**
 * Clean text for comparison: lowercase, strip non-alphanumeric except spaces.
 */
function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate n-gram candidates from context that overlap with the selected text.
 *
 * @param {string} contextText - The wider context string
 * @param {string} selectedText - What the user actually selected
 * @param {number} maxN - Max n-gram size to generate
 * @returns {string[]} Candidate phrases sorted longest-first
 */
export function generateOverlappingNgrams(contextText, selectedText, maxN = 6) {
    const contextWords = normalize(contextText).split(/\s+/).filter(Boolean);
    const selectedWords = normalize(selectedText).split(/\s+/).filter(Boolean);

    if (selectedWords.length === 0 || contextWords.length === 0) return [];

    const candidates = new Set();

    // Generate n-grams from n=selectedWords.length to maxN
    const minN = Math.max(selectedWords.length, 2);
    for (let n = minN; n <= Math.min(maxN, contextWords.length); n++) {
        const grams = ngramsOf(contextWords, n);
        for (const gram of grams) {
            // Check if this n-gram contains ALL selected words in order
            if (containsSubsequence(gram.split(/\s+/), selectedWords)) {
                candidates.add(gram);
            }
        }
    }

    // Sort by length descending (longest candidates first), but prefer
    // candidates closest to selectedWords.length + 1 (likely one word was missed)
    return Array.from(candidates).sort((a, b) => {
        const aLen = a.split(/\s+/).length;
        const bLen = b.split(/\s+/).length;
        // Prefer the candidate that's just slightly longer than what was selected
        const aDiff = Math.abs(aLen - (selectedWords.length + 1));
        const bDiff = Math.abs(bLen - (selectedWords.length + 1));
        return aDiff - bDiff || aLen - bLen;
    });
}

/**
 * Check if `words` contains `subseq` as a contiguous subsequence.
 */
function containsSubsequence(words, subseq) {
    if (subseq.length > words.length) return false;
    for (let i = 0; i <= words.length - subseq.length; i++) {
        let match = true;
        for (let j = 0; j < subseq.length; j++) {
            if (words[i + j] !== subseq[j]) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }
    return false;
}

/**
 * Check whether the selected text appears to be "cut off" — i.e. in the
 * context, the selected words are followed by another word that is
 * alphanumeric (suggesting the user wanted to include it).
 */
function selectionLooksTruncated(contextText, selectedText) {
    const normContext = normalize(contextText);
    const normSelection = normalize(selectedText);

    const idx = normContext.indexOf(normSelection);
    if (idx === -1) return false;

    const afterSelection = normContext.slice(idx + normSelection.length).trim();
    // If a word immediately follows and the selection doesn't end at a
    // natural boundary (period, comma, colon, etc.), it's likely truncated
    if (afterSelection.length > 0 && /^[a-z0-9]/.test(afterSelection)) {
        return true;
    }

    return false;
}

/**
 * Main entry point. Given the raw selection text and the surrounding context,
 * determines if a correction should be suggested.
 *
 * @param {string} selectedText - What `handleTextSelection` initially picked
 * @param {string} contextText - Surrounding text from `extractContextFromDOM`
 * @returns {{ original: string, suggestion: string | null }}
 */
export function findBestCandidate(selectedText, contextText) {
    const selected = normalize(selectedText);
    const selectedWords = selected.split(/\s+/).filter(Boolean);

    // Single words don't need n-gram correction
    if (selectedWords.length <= 1) {
        return { original: selectedText.trim(), suggestion: null };
    }

    // If the selection doesn't look truncated, no suggestion needed
    if (!selectionLooksTruncated(contextText, selectedText)) {
        return { original: selectedText.trim(), suggestion: null };
    }

    const candidates = generateOverlappingNgrams(contextText, selectedText);

    if (candidates.length === 0) {
        return { original: selectedText.trim(), suggestion: null };
    }

    // The best candidate is the first one (sorted by closeness to +1 word)
    const best = candidates[0];

    // Don't suggest if it's the same as what was already selected
    if (best === selected) {
        return { original: selectedText.trim(), suggestion: null };
    }

    // Reconstruct with proper casing from contextText
    const properCased = recoverCasing(best, contextText);

    return {
        original: selectedText.trim(),
        suggestion: properCased,
    };
}

/**
 * Recover the original casing of a normalized phrase from the context string.
 */
function recoverCasing(normalizedPhrase, contextText) {
    // Try to find the phrase in the original context (case-insensitive)
    const contextLower = contextText.toLowerCase();
    const idx = contextLower.indexOf(normalizedPhrase);
    if (idx !== -1) {
        return contextText.slice(idx, idx + normalizedPhrase.length);
    }
    // Fallback: title case
    return normalizedPhrase.replace(/\b\w/g, c => c.toUpperCase());
}

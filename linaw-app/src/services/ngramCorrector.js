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
 * Each candidate is tagged with its direction relative to the selection:
 *   - 'forward'  = selected words are at the START → candidate appends words
 *   - 'backward' = selected words are at the END   → candidate prepends words
 *   - 'both'     = selected words are in the MIDDLE → extends both ways
 *   - 'exact'    = candidate IS the selection
 *
 * @param {string} contextText - The wider context string
 * @param {string} selectedText - What the user actually selected
 * @param {number} maxN - Max n-gram size to generate
 * @returns {{ text: string, direction: string }[]} Candidate phrases with direction
 */
export function generateOverlappingNgrams(contextText, selectedText, maxN = 6) {
    const contextWords = normalize(contextText).split(/\s+/).filter(Boolean);
    const selectedWords = normalize(selectedText).split(/\s+/).filter(Boolean);

    if (selectedWords.length === 0 || contextWords.length === 0) return [];

    const seen = new Set();
    const candidates = [];

    // Generate n-grams from n=selectedWords.length+1 to maxN
    // (skip same-length since those would just be the selection itself)
    const minN = selectedWords.length + 1;
    for (let n = minN; n <= Math.min(maxN, contextWords.length); n++) {
        const grams = ngramsOf(contextWords, n);
        for (const gram of grams) {
            if (seen.has(gram)) continue;

            const gramWords = gram.split(/\s+/);
            const pos = findSubsequencePosition(gramWords, selectedWords);
            if (pos === -1) continue;

            seen.add(gram);

            // Determine direction
            let direction;
            if (pos === 0 && gramWords.length > selectedWords.length) {
                direction = 'forward'; // Selected at start, new words appended
            } else if (pos + selectedWords.length === gramWords.length) {
                direction = 'backward'; // Selected at end, new words prepended
            } else {
                direction = 'both';
            }

            candidates.push({ text: gram, direction });
        }
    }

    return candidates;
}

/**
 * Find the starting position of `subseq` as a contiguous subsequence in `words`.
 * Returns the index, or -1 if not found.
 */
function findSubsequencePosition(words, subseq) {
    if (subseq.length > words.length) return -1;
    for (let i = 0; i <= words.length - subseq.length; i++) {
        let match = true;
        for (let j = 0; j < subseq.length; j++) {
            if (words[i + j] !== subseq[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }
    return -1;
}

/**
 * Detect WHERE the selection appears truncated relative to the context.
 * Returns: 'forward' (cut off at end), 'backward' (cut off at start),
 *          'both', or null (not truncated).
 */
function detectTruncationDirection(contextText, selectedText) {
    const normContext = normalize(contextText);
    const normSelection = normalize(selectedText);

    const idx = normContext.indexOf(normSelection);
    if (idx === -1) return null;

    const before = normContext.slice(0, idx).trim();
    const after = normContext.slice(idx + normSelection.length).trim();

    const truncatedAfter = after.length > 0 && /^[a-z0-9]/.test(after);
    const truncatedBefore = before.length > 0 && /[a-z0-9]$/.test(before);

    if (truncatedAfter && truncatedBefore) return 'both';
    if (truncatedAfter) return 'forward';
    if (truncatedBefore) return 'backward';
    return null;
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

    // Detect if and where the selection is truncated
    const truncationDir = detectTruncationDirection(contextText, selectedText);
    if (!truncationDir) {
        return { original: selectedText.trim(), suggestion: null };
    }

    const candidates = generateOverlappingNgrams(contextText, selectedText);

    if (candidates.length === 0) {
        return { original: selectedText.trim(), suggestion: null };
    }

    // Score candidates: strongly prefer those extending in the truncation direction.
    // E.g. if truncated at end ('forward'), prefer candidates where selected words
    // are at the START (direction === 'forward').
    const scored = candidates.map(c => {
        const wordLen = c.text.split(/\s+/).length;
        const lenDiff = Math.abs(wordLen - (selectedWords.length + 1));

        // Direction match scoring (lower = better)
        let dirScore;
        if (c.direction === truncationDir) {
            dirScore = 0;   // Perfect match — extends in the right direction
        } else if (c.direction === 'both') {
            dirScore = 1;   // Acceptable — extends both ways
        } else {
            dirScore = 10;  // Wrong direction — heavily penalized
        }

        return { ...c, score: dirScore * 100 + lenDiff };
    });

    scored.sort((a, b) => a.score - b.score);

    const best = scored[0];

    // Don't suggest if it's the same as what was already selected
    if (best.text === selected) {
        return { original: selectedText.trim(), suggestion: null };
    }

    // Reconstruct with proper casing from contextText
    const properCased = recoverCasing(best.text, contextText);

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

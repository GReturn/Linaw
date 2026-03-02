/**
 * src/services/selectionValidator.js
 *
 * Shared validation logic for highlighted text selections.
 * Used by both Notebook.jsx (PDF reader) and the Chrome extension content script.
 */

export const MAX_WORD_COUNT = 5;
export const TOO_MANY_WORDS_MESSAGE = "Woah there, that's a lot of words! Linaw can't define that for you.";

/**
 * Validates whether a selected text string is short enough to be defined.
 *
 * @param {string} text – The raw selected text (already trimmed).
 * @returns {{ valid: boolean, wordCount: number, words: string[] }}
 */
export function validateSelection(text) {
    if (!text) return { valid: false, wordCount: 0, words: [] };

    const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);

    return {
        valid: words.length > 0 && words.length <= MAX_WORD_COUNT,
        wordCount: words.length,
        words,
    };
}

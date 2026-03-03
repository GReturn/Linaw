// content.js
// Injected into all pages. Expands highlighted text to word boundaries
// and provides the result to the background script on demand via messaging.

var BLOCK_TAGS = ["P", "DIV", "LI", "TD", "TH", "SECTION", "ARTICLE", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "BODY"];

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
 *
 * Key: normalizes whitespace (\n, \t, multiple spaces) so that "ting deta"
 * is correctly found inside "listing\n    details".
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

// On mouseup, always show the tooltip for any non-empty selection
document.addEventListener("mouseup", function (e) {
    if (tooltip && tooltip.contains(e.target)) return;

    var sel = window.getSelection();
    var text = sel ? sel.toString().trim() : "";

    if (text.length > 0) {
        lastSelectedText = text;
        setTimeout(function () {
            var current = window.getSelection();
            if (current && current.toString().trim() === text) {
                showTooltip(e.pageX, e.pageY);
            }
        }, 80);
    } else {
        hideTooltip();
    }
});

// On mousedown, hide if clicking outside tooltip
document.addEventListener("mousedown", function (e) {
    if (tooltip && !tooltip.contains(e.target)) {
        hideTooltip();
    }
});

// Initialize
createTooltip();

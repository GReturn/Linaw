// content.js
// Injected into all pages. Listens for user highlighting text, shows tooltip, sends word to background.

let tooltip = null;
let lastSelectedText = ""; // Cache the selected text so it survives mousedown clearing

function createTooltip() {
    if (tooltip) return;

    tooltip = document.createElement("div");
    tooltip.id = "linaw-extension-tooltip";
    tooltip.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:14px;">✨</span><span>Explain with Linaw</span></div>';

    Object.assign(tooltip.style, {
        position: "absolute",
        display: "none",
        backgroundColor: "#2D3748",
        color: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        cursor: "pointer",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: "999999",
        transition: "opacity 0.15s ease-in-out",
        opacity: "0",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap"
    });

    // Prevent mousedown on the tooltip from clearing the text selection
    tooltip.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    // On click, send the cached word to the background
    tooltip.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        var wordToSend = lastSelectedText;
        if (wordToSend) {
            console.log("[Linaw] Sending word to background:", wordToSend);
            chrome.runtime.sendMessage(
                { type: "EXPLAIN_WORD", word: wordToSend },
                function (response) {
                    if (chrome.runtime.lastError) {
                        console.error("[Linaw] Error:", chrome.runtime.lastError.message);
                    } else {
                        console.log("[Linaw] Message sent, response:", response);
                    }
                }
            );
        }

        hideTooltip();
    });

    // Hover effects
    tooltip.addEventListener("mouseenter", function () {
        tooltip.style.backgroundColor = "#1A202C";
    });
    tooltip.addEventListener("mouseleave", function () {
        tooltip.style.backgroundColor = "#2D3748";
    });

    document.body.appendChild(tooltip);
}

function showTooltip(x, y) {
    if (!tooltip) createTooltip();

    tooltip.style.left = x + "px";
    tooltip.style.top = (y - 45) + "px";
    tooltip.style.display = "block";

    // Force reflow then show
    tooltip.offsetWidth;
    tooltip.style.opacity = "1";
    tooltip.style.pointerEvents = "auto";
}

function hideTooltip() {
    if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.pointerEvents = "none";
        setTimeout(function () {
            if (tooltip && tooltip.style.opacity === "0") {
                tooltip.style.display = "none";
            }
        }, 150);
    }
}

// On mouseup, detect selection and cache it
document.addEventListener("mouseup", function (e) {
    // Ignore clicks inside the tooltip itself
    if (tooltip && tooltip.contains(e.target)) return;

    var sel = window.getSelection();
    var text = sel ? sel.toString().trim() : "";

    if (text.length > 0 && text.length < 500) {
        lastSelectedText = text; // cache it
        setTimeout(function () {
            // Re-check selection is still there
            var current = window.getSelection();
            if (current && current.toString().trim() === text) {
                showTooltip(e.pageX, e.pageY);
            }
        }, 80);
    } else {
        hideTooltip();
    }
});

// On mousedown, hide tooltip only if clicking outside both tooltip and selection
document.addEventListener("mousedown", function (e) {
    if (tooltip && !tooltip.contains(e.target)) {
        hideTooltip();
    }
});

// Initialize
createTooltip();

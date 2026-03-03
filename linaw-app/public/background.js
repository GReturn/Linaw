// background.js
// Extension background service worker — manages side panel and context menu.

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explain-with-linaw",
    title: "Explain with Linaw",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "explain-with-linaw" || !info.selectionText) return;
  if (!tab || !tab.id) return;

  // IMPORTANT: Open the side panel FIRST, within the user gesture context.
  // If we do any async work (like sendMessage) before this, the gesture expires
  // and Edge/Chrome will silently refuse to open the panel.
  try {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "sidepanel.html",
      enabled: true
    });
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log("[Linaw BG] Side panel opened for window:", tab.windowId);
  } catch (err) {
    console.error("[Linaw BG] Failed to open side panel:", err);
  }

  // NOW do the async text expansion work (panel is already open)
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { type: "GET_EXPANDED_SELECTION" });

    if (results && results.word) {
      console.log("[Linaw BG] Got expanded text from content script:", results.word);
      await chrome.storage.session.set({
        linawSelectedWord: results.word,
        linawWordCount: results.wordCount,
        linawContextText: results.contextText
      });
    } else {
      // Fallback: use the raw selectionText from the context menu
      const fallbackText = info.selectionText.trim().replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      console.log("[Linaw BG] Falling back to raw selectionText:", fallbackText);
      await chrome.storage.session.set({
        linawSelectedWord: fallbackText,
        linawWordCount: fallbackText.split(/\s+/).length,
        linawContextText: fallbackText
      });
    }
  } catch (err) {
    // Content script not available (e.g. chrome:// pages) — use raw text
    console.warn("[Linaw BG] Could not reach content script, using raw text:", err.message);
    const fallbackText = info.selectionText.trim().replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    await chrome.storage.session.set({
      linawSelectedWord: fallbackText,
      linawWordCount: fallbackText.split(/\s+/).length,
      linawContextText: fallbackText
    });
  }
});
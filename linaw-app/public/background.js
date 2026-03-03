// Allow the side panel to read session storage
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(function (error) { console.error(error); });

// listen for messages from the content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'EXPLAIN_WORD') {
    handleExplainWord(request.word, request.wordCount || 0, sender.tab?.id, sendResponse);
    return true; // keep message channel open for async sendResponse
  }
});

// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explain-with-linaw",
    title: "Explain with Linaw",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-with-linaw" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    const wordCount = selectedText.split(/\s+/).length;
    handleExplainWord(selectedText, wordCount, tab?.id);
  }
});

// Shared handler for defining a word
function handleExplainWord(word, wordCount, tabId, sendResponse = null) {
  console.log("[Linaw BG] Received word to explain:", word);

  chrome.storage.session.set({
    linawSelectedWord: word,
    linawWordCount: wordCount,
  }).then(function () {
    console.log("[Linaw BG] Saved word to session storage:", word);

    // open the side panel
    if (tabId) {
      chrome.sidePanel.open({ tabId: tabId }).then(function () {
        console.log("[Linaw BG] Side panel opened for tab:", tabId);
        if (sendResponse) sendResponse({ success: true });
      }).catch(function (err) {
        console.error("[Linaw BG] Failed to open side panel:", err);
        if (sendResponse) sendResponse({ success: false, error: err.message });
      });
    } else {
      if (sendResponse) sendResponse({ success: false, error: "No sender tab" });
    }
  });
}
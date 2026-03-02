// Allow the side panel to read session storage
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(function (error) { console.error(error); });

// listen for messages from the content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'EXPLAIN_WORD') {
    console.log("[Linaw BG] Received EXPLAIN_WORD:", request.word);

    // store the word first so the side panel can read it immediately upon opening
    chrome.storage.session.set({ linawSelectedWord: request.word }).then(function () {
      console.log("[Linaw BG] Saved word to session storage:", request.word);

      // then open the side panel
      if (sender.tab && sender.tab.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id }).then(function () {
          console.log("[Linaw BG] Side panel opened for tab:", sender.tab.id);
          sendResponse({ success: true });
        }).catch(function (err) {
          console.error("[Linaw BG] Failed to open side panel:", err);
          sendResponse({ success: false, error: err.message });
        });
      } else {
        sendResponse({ success: false, error: "No sender tab" });
      }
    });

    return true; // Keep message channel open for async sendResponse
  }
});
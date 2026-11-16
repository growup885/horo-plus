chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId === 0 && details.url.includes('horodigital.ru')) {
      chrome.tabs.sendMessage(details.tabId, { action: "urlChanged" })
        .catch(err => console.log("Content script not ready yet:", err));
    }
    chrome.tabs.sendMessage(details.tabId, { action: "urlChanged" })
    .catch(err => console.log("Content script not ready yet:", err));
});
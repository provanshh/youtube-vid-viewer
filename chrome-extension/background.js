chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) {
    return false;
  }

  if (message.type === "LINKEE_OPENED_TABS_REQUEST") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      try {
        const result = tabs.map((tab) => ({
          id: tab.id ?? -1,
          title: tab.title ?? tab.url ?? "Untitled tab",
          url: tab.url ?? "",
          favIconUrl: tab.favIconUrl,
          active: Boolean(tab.active),
          pinned: Boolean(tab.pinned),
          incognito: Boolean(tab.incognito),
        }));
        sendResponse({ tabs: result });
      } catch (error) {
        sendResponse({ error: error instanceof Error ? error.message : "Unable to read tabs" });
      }
    });

    return true;
  }

  if (message.type === "LINKEE_ACTIVATE_TAB_REQUEST") {
    const tabId = Number(message.tabId);
    if (!Number.isInteger(tabId) || tabId < 0) {
      sendResponse({ error: "Invalid tab id" });
      return false;
    }

    chrome.tabs.update(tabId, { active: true }, (tab) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        sendResponse({ error });
        return;
      }

      const windowId = tab?.windowId;
      if (typeof windowId === "number") {
        chrome.windows.update(windowId, { focused: true }, () => {
          const focusError = chrome.runtime.lastError?.message;
          if (focusError) {
            sendResponse({ error: focusError });
            return;
          }
          sendResponse({ ok: true });
        });
        return;
      }

      sendResponse({ ok: true });
    });

    return true;
  }

  return false;
});
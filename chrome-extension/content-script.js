(function () {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const payload = event.data;
    if (!payload) return;

    if (payload.type === "LINKEE_OPENED_TABS_REQUEST") {
      chrome.runtime.sendMessage({ type: "LINKEE_OPENED_TABS_REQUEST" }, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage(
          {
            type: "LINKEE_OPENED_TABS_RESPONSE",
            requestId: payload.requestId,
            tabs: response?.tabs ?? [],
            error: response?.error ?? error,
          },
          "*",
        );
      });

      return;
    }

    if (payload.type === "LINKEE_ACTIVATE_TAB_REQUEST") {
      chrome.runtime.sendMessage({ type: "LINKEE_ACTIVATE_TAB_REQUEST", tabId: payload.tabId }, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage(
          {
            type: "LINKEE_ACTIVATE_TAB_RESPONSE",
            requestId: payload.requestId,
            ok: Boolean(response?.ok),
            error: response?.error ?? error,
          },
          "*",
        );
      });
    }
  });
})();
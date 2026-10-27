// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "status") {
    sendResponse({
      connected: false,
      studio: null,
      tools: 0,
      servers: [],
      mcpAlive: false,
    });
    return true;
  }

  if (message && message.type === "reconnect") {
    sendResponse({ ok: true });
    return true;
  }

  if (message && message.type === "restart_mcp") {
    sendResponse({ ok: true });
    return true;
  }

  sendResponse({ ok: false });
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return;
  const supported = [
    "chatgpt.com",
    "chat.openai.com",
    "claude.ai",
    "www.claude.ai",
  ].some((host) => tab.url.includes(host));

  if (supported) {
    chrome.action.setTitle({ tabId, title: "ZeroScript Free" });
  }
});

document.getElementById("open-chatgpt").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com" });
});

document.getElementById("open-claude").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://claude.ai" });
});

chrome.runtime.sendMessage({ type: "status" }, (res) => {
  if (res && res.connected) {
    document.getElementById("status").textContent = "Bridge connected";
  } else {
    document.getElementById("status").textContent = "Bridge offline";
  }
});

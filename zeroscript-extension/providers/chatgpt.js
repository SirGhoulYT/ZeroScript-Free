// providers/chatgpt.js
(() => {
  "use strict";

  const S = {
    composer: 'textarea, [contenteditable="true"]',
    sendBtn: 'button[aria-label*="Send"], button[title*="Send"], form button[type="submit"]',
  };

  function getComposer() {
    const candidates = [...document.querySelectorAll(S.composer)];
    return candidates.find((el) => !el.closest("#zs-root")) || candidates[0] || null;
  }

  function isUserMessage(node) {
    return !!node && (node.getAttribute("data-message-author-role") === "user" || node.matches('[data-message-author-role="user"]'));
  }

  function isAssistantMessage(node) {
    return !!node && !isUserMessage(node);
  }

  function findAssistantTurns() {
    return [...document.querySelectorAll('[data-message-author-role]')].filter(isAssistantMessage);
  }

  function isGenerating() {
    const send = document.querySelector(S.sendBtn);
    return !!(send && send.disabled === false && send.textContent && /stop|cancel|abort/i.test(send.textContent));
  }

  function installSendHooks(handlers) {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      const editor = getComposer();
      if (!editor || !editor.contains(e.target)) return;
      if (handlers && handlers.isBlocked && handlers.isBlocked()) return;
      if (handlers && handlers.isStarted && !handlers.isStarted()) {
        if (handlers.onBlockedAttempt) handlers.onBlockedAttempt();
        return;
      }
      if (handlers && handlers.onUserMessage) handlers.onUserMessage(findAssistantTurns().length);
    }, { capture: true });
  }

  const ZSProvider = {
    id: "chatgpt_web",
    displayName: "ChatGPT Web",
    supportsVision: false,
    timings: { GEN_IDLE_MS: 1200, REASON_IDLE_MS: 12000, WARMUP_MS: 45000, REASON_NOREPLY_MS: 90000, STABLE_MS: 9000, RESPONSE_TIMEOUT_MS: 300000 },
    allItems: () => [...document.querySelectorAll('[data-message-author-role]')],
    isUserItem: isUserMessage,
    isAssistantItem: isAssistantMessage,
    itemText: (item) => (item ? (item.innerText || item.textContent || "") : ""),
    classifyText: (item) => (item ? (item.innerText || item.textContent || "") : ""),
    assistantCount: () => findAssistantTurns().length,
    userCount: () => [...document.querySelectorAll('[data-message-author-role]')].filter(isUserMessage).length,
    lastAssistant: () => findAssistantTurns().at(-1) || null,
    lastAssistantId: () => null,
    itemKey: () => null,
    readAssistant: () => ({ present: !!findAssistantTurns().length, reply: (findAssistantTurns().at(-1)?.innerText || findAssistantTurns().at(-1)?.textContent || ""), thinking: "", item: findAssistantTurns().at(-1) || null }),
    streamLen: (item) => (item ? (item.innerText || item.textContent || "").length : 0),
    snapshot: () => ({ th: 0, rp: findAssistantTurns().at(-1)?.textContent?.length || 0 }),
    getEditor: getComposer,
    editorText: () => getComposer()?.value || getComposer()?.textContent || "",
    chatIsEmpty: () => !document.querySelector('[data-message-author-role]'),
    isFreshChat: () => true,
    composerFrame: () => getComposer()?.parentElement || null,
    barMount: () => ({ parent: getComposer()?.parentElement || document.body, before: null, inside: true }),
    setInputLock: () => {},
    typeAndSend: (text) => {
      const el = getComposer();
      if (!el) return;
      if (el.tagName === "TEXTAREA") {
        const proto = window.HTMLTextAreaElement && window.HTMLTextAreaElement.prototype;
        const setter = proto && Object.getOwnPropertyDescriptor(proto, "value");
        if (setter && setter.set) setter.set.call(el, text);
        else el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        el.textContent = text;
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
      }
      const sendBtn = document.querySelector(S.sendBtn);
      if (sendBtn) sendBtn.click();
    },
    stopGeneration: () => {
      const stop = document.querySelector('button[aria-label*="Stop"], button[title*="Stop"]');
      if (stop) stop.click();
    },
    isGenerating,
    isBusyNow: isGenerating,
    isHardGenerating: isGenerating,
    genDebug: () => ({ gen: isGenerating() }),
    enforceComposer: () => ({ ready: true }),
    ensureComposerReady: async () => ({ ready: true }),
    turnHalted: () => false,
    findContinueBtn: () => null,
    clickContinueBtn: () => false,
    scanError: () => null,
    isTooLongMsg: () => false,
    isBusyMsg: () => false,
    attachImages: () => false,
    clearAttachments: () => {},
    conversationKey: () => location.pathname,
    installSendHooks,
    findToolBlockSpot: () => null,
  };

  globalThis.ZSProvider = ZSProvider;
})();

// providers/claude.js
(() => {
  "use strict";

  const S = {
    composer: 'textarea[placeholder*="Reply"], textarea[placeholder*="Message"], textarea[data-placeholder*="Reply"], textarea[data-testid*="composer"], textarea',
    sendBtn: 'button[aria-label*="Send"], button[aria-label*="Submit"], button[data-testid*="send"], button[type="submit"]',
    stopBtn: 'button[aria-label*="Stop"], button[data-testid*="stop"]',
  };

  function getComposer() {
    const candidates = [...document.querySelectorAll(S.composer)];
    return candidates.find((el) => !el.closest("#zs-root")) || candidates[0] || null;
  }

  function isUserMessage(node) {
    return !!node && (
      node.matches('[data-is-user-message="true"], [data-message-role="user"], .user-message, .self, [class*="user"], [data-user]') ||
      !!node.closest('[data-is-user-message="true"], [data-message-role="user"], .user-message, .self, [class*="user"], [data-user]')
    );
  }

  function isAssistantMessage(node) {
    return !!node && !isUserMessage(node);
  }

  function getMessages() {
    return [...document.querySelectorAll('div[class*="message"], div[data-message-id], [role="listitem"], .claude-message')].filter((node) => {
      const text = (node.textContent || "").trim();
      return text && !node.closest("#zs-root");
    });
  }

  function isGenerating() {
    return !!document.querySelector(S.stopBtn);
  }

  const ZSProvider = {
    id: "claude_web",
    displayName: "Claude Web",
    supportsVision: false,
    timings: { GEN_IDLE_MS: 1200, REASON_IDLE_MS: 12000, WARMUP_MS: 45000, REASON_NOREPLY_MS: 90000, STABLE_MS: 9000, RESPONSE_TIMEOUT_MS: 300000 },
    allItems: getMessages,
    isUserItem: isUserMessage,
    isAssistantItem: isAssistantMessage,
    itemText: (item) => (item ? (item.innerText || item.textContent || "") : ""),
    classifyText: (item) => (item ? (item.innerText || item.textContent || "") : ""),
    assistantCount: () => getMessages().filter(isAssistantMessage).length,
    userCount: () => getMessages().filter(isUserMessage).length,
    lastAssistant: () => getMessages().filter(isAssistantMessage).at(-1) || null,
    lastAssistantId: () => null,
    itemKey: () => null,
    readAssistant: () => ({ present: !!getMessages().filter(isAssistantMessage).length, reply: (getMessages().filter(isAssistantMessage).at(-1)?.innerText || getMessages().filter(isAssistantMessage).at(-1)?.textContent || ""), thinking: "", item: getMessages().filter(isAssistantMessage).at(-1) || null }),
    streamLen: (item) => (item ? (item.innerText || item.textContent || "").length : 0),
    snapshot: () => ({ th: 0, rp: getMessages().filter(isAssistantMessage).at(-1)?.textContent?.length || 0 }),
    getEditor: getComposer,
    editorText: () => getComposer()?.value || getComposer()?.textContent || "",
    chatIsEmpty: () => getMessages().length === 0,
    isFreshChat: () => getMessages().length === 0 && !!getComposer(),
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
      const stop = document.querySelector(S.stopBtn);
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
    installSendHooks: (handlers) => {
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
        const editor = getComposer();
        if (!editor || !editor.contains(e.target)) return;
        if (handlers && handlers.isBlocked && handlers.isBlocked()) return;
        if (handlers && handlers.isStarted && !handlers.isStarted()) {
          if (handlers.onBlockedAttempt) handlers.onBlockedAttempt();
          return;
        }
        if (handlers && handlers.onUserMessage) handlers.onUserMessage(getMessages().filter(isAssistantMessage).length);
      }, { capture: true });
    },
    findToolBlockSpot: () => null,
  };

  globalThis.ZSProvider = ZSProvider;
})();

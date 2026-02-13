// Bookmark and message decoration logic.
function createMarkIcon() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("cgpt-marker-btn-icon");

  const path = document.createElementNS(ns, "path");
  path.setAttribute(
    "d",
    "M6 4.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V5.5a1 1 0 0 1 1-1Z"
  );
  svg.appendChild(path);
  return svg;
}

function tryResolveTarget(msgId) {
  // Ensure ids are assigned before resolving
  decorate();
  return findMessageByIdOrIndex(msgId);
}

async function toggleBookmark(msgId, preview) {
  const convId = getConversationId();
  const list = await loadConversation(convId);

  // check if msgId is already bookmarked
  const idx = list.findIndex((x) => x.msgId === msgId);
  // if bookmarked, remove it; else add it to the front
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ msgId, preview, ts: Date.now() });

  await saveConversation(convId, list);

  await renderPanel();
  await updateButtonStates();
}

async function updateButtonStates() {
  const list = await loadConversation(getConversationId());
  const set = new Set(list.map((x) => x.msgId));

  document.querySelectorAll(".cgpt-marker-btn").forEach((btn) => {
    const msgId = btn.getAttribute("data-msg-id");
    btn.classList.toggle("is-bookmarked", set.has(msgId));
  });
}

function decorate() {
  // Get all message nodes
  const nodes = getMessageNodes();

  nodes.forEach((el, i) => {
    const hasWrap = el.classList.contains("cgpt-marker-wrap");

    // Make it scroll-targetable
    // (MVP note: if ChatGPT re-renders, IDs could shift; we can make this more stable later.)
    // Ensure each message has a unique ID
    ensureMessageId(el, i);

    if (!hasWrap) el.classList.add("cgpt-marker-wrap");

    const article = el.closest("article");
    const actionBar =
      // user message action bar
      article?.querySelector("div.z-0.flex.justify-end") ||
      // assistant message action bar
      article?.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-start") ||
      article?.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-end") ||
      article?.querySelector('[data-testid="copy-turn-action-button"]')?.closest("div") ||
      null;
    if (!actionBar) {
      // If action bar isn't present (e.g. streaming response), don't show hover button.
      const oldBtn = el.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`);
      if (oldBtn) oldBtn.remove();
      return;
    }

    const targetHost = actionBar;

    // Remove any old button that was attached to the message box
    const oldBtn = el.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`);
    if (oldBtn) oldBtn.remove();

    if (!targetHost.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`)) {
      const btn = document.createElement("button");
      btn.className = "cgpt-marker-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Bookmark message");
      btn.title = "Bookmark message";
      btn.setAttribute("data-msg-id", el.id);
      btn.appendChild(createMarkIcon());

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmark(el.id, previewText(el));
      });

      btn.classList.add("cgpt-marker-btn-inline");
      targetHost.appendChild(btn);
    }
  });
}

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

function ensureBookmarkTooltip() {
  let tooltip = document.querySelector(".cgpt-marker-tooltip");
  if (tooltip) return tooltip;

  // Render the tooltip at the document level so ChatGPT's masked action bar cannot clip it.
  tooltip = document.createElement("div");
  tooltip.className = "cgpt-marker-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  return tooltip;
}

function positionBookmarkTooltip(btn, tooltip) {
  const rect = btn.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const left = clamp(
    rect.left + rect.width / 2 - tooltipRect.width / 2,
    8,
    window.innerWidth - tooltipRect.width - 8
  );
  const top = Math.max(8, rect.bottom + 8);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showBookmarkTooltip(btn) {
  const text = btn.getAttribute("data-tooltip");
  if (!text) return;
  const tooltip = ensureBookmarkTooltip();
  tooltip.textContent = text;
  tooltip.hidden = false;
  positionBookmarkTooltip(btn, tooltip);
}

function hideBookmarkTooltip() {
  const tooltip = document.querySelector(".cgpt-marker-tooltip");
  if (tooltip) tooltip.hidden = true;
}

function attachBookmarkTooltip(btn) {
  if (btn.dataset.tooltipBound === "true") return;
  btn.dataset.tooltipBound = "true";

  // Bind once because decorate() runs repeatedly as the SPA re-renders.
  btn.addEventListener("mouseenter", () => showBookmarkTooltip(btn));
  btn.addEventListener("mouseleave", hideBookmarkTooltip);
  btn.addEventListener("focus", () => showBookmarkTooltip(btn));
  btn.addEventListener("blur", hideBookmarkTooltip);
}

function applyBookmarkButtonState(btn, isBookmarked) {
  const label = isBookmarked ? "Remove bookmark" : "Bookmark message";
  btn.classList.toggle("is-bookmarked", isBookmarked);
  btn.setAttribute("aria-label", label);
  btn.setAttribute("data-tooltip", label);
  btn.setAttribute("title", label);
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
    applyBookmarkButtonState(btn, set.has(msgId));
  });
}

function findActionBar(el) {
  // Prefer the explicit response-actions container in the current ChatGPT DOM, then fall back to older layouts.
  return (
    el.querySelector('div[aria-label="Response actions"]') ||
    el.querySelector('[data-testid="copy-turn-action-button"]')?.closest("div") ||
    el.querySelector("div.z-0.flex.justify-end") ||
    el.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-start") ||
    el.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-end") ||
    el.closest("article")?.querySelector('div[aria-label="Response actions"]') ||
    el.closest("article")?.querySelector("div.z-0.flex.justify-end") ||
    el.closest("article")?.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-start") ||
    el.closest("article")?.querySelector("div.z-0.flex.min-h-\\[46px\\].justify-end") ||
    null
  );
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

    const actionBar = findActionBar(el);
    if (!actionBar) {
      // If action bar isn't present (e.g. streaming response), don't show hover button.
      document
        .querySelectorAll(`.cgpt-marker-btn[data-msg-id="${el.id}"]`)
        .forEach((btn) => btn.remove());
      return;
    }

    const targetHost = actionBar;

    // ChatGPT frequently re-parents action rows, so clean up copies left on stale hosts.
    document
      .querySelectorAll(`.cgpt-marker-btn[data-msg-id="${el.id}"]`)
      .forEach((btn) => {
        if (!targetHost.contains(btn)) btn.remove();
      });

    if (!targetHost.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`)) {
      const btn = document.createElement("button");
      btn.className = "cgpt-marker-btn";
      btn.type = "button";
      btn.setAttribute("data-msg-id", el.id);
      btn.appendChild(createMarkIcon());

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmark(el.id, previewText(el));
      });

      btn.classList.add("cgpt-marker-btn-inline");
      applyBookmarkButtonState(btn, false);
      attachBookmarkTooltip(btn);
      targetHost.appendChild(btn);
    }
  });
}

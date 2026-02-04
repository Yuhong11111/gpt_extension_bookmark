// content.js
// ChatGPT Marker: hover a message -> "Mark"; bottom-right launcher (always visible) -> toggles panel list

const STORAGE_KEY = "cgpt_markers_v1";

function convStorageKey(convId) {
  return `${STORAGE_KEY}:${convId}`;
}

// Chrome invalidates content script contexts on extension reloads.
function isExtensionContextValid() {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

// -------------------- conversation id --------------------
function getConversationId() {
  // ChatGPT conversations usually: https://chatgpt.com/c/<id>
  // Extract <id> from URL pathname
  const m = location.pathname.match(/\/c\/([^\/]+)/);
  return m ? m[1] : "unknown";
}

// -------------------- storage helpers --------------------
// per-conversation storage: cgpt_markers_v1:<conversationId>
function loadConversation(convId) {
  return new Promise((resolve) => {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local) {
        resolve([]);
        return;
      }
      const key = convStorageKey(convId);
      chrome.storage.local.get([key], (res) => resolve(res?.[key] || []));
    } catch {
      resolve([]);
    }
  });
}

function saveConversation(convId, list) {
  return new Promise((resolve) => {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local) {
        resolve();
        return;
      }
      const key = convStorageKey(convId);
      chrome.storage.local.set({ [key]: list }, resolve);
    } catch {
      resolve();
    }
  });
}

// -------------------- DOM helpers --------------------
// It return an array of message container elements
function getMessageNodes() {
  // Best-case selector: message containers carry this attribute
  const direct = Array.from(document.querySelectorAll("[data-message-author-role]"));
  if (direct.length) return direct;

  // Fallback: containers that contain those nodes
  const containers = Array.from(document.querySelectorAll("main div, article div"));
  return containers.filter((el) => el.querySelector?.("[data-message-author-role]"));
}

function ensureMessageId(el, index) {
  if (el.id) return el.id;
  const stable =
    el.getAttribute("data-message-id") ||
    el.getAttribute("data-testid") ||
    el.querySelector?.("[data-message-id]")?.getAttribute("data-message-id") ||
    null;
  if (stable) {
    const safe = stable.replace(/[^a-zA-Z0-9_-]/g, "_");
    el.id = `cgpt-msg-${safe}`;
    return el.id;
  }
  el.id = `cgpt-msg-${index}`;
  return el.id;
}

function findMessageByIdOrIndex(msgId) {
  if (!msgId) return null;
  let target = document.getElementById(msgId);
  if (target) return target;

  const raw = msgId.replace(/^cgpt-msg-/, "");
  target = document.querySelector(`[data-message-id="${raw}"]`);
  if (target) return target.closest?.("[data-message-author-role]") || target;

  const m = msgId.match(/^cgpt-msg-(\d+)$/);
  if (m) {
    const idx = Number(m[1]);
    const nodes = getMessageNodes();
    return Number.isFinite(idx) ? nodes[idx] : null;
  }
  return null;
}

function tryResolveTarget(msgId) {
  // Ensure ids are assigned before resolving
  decorate();
  return findMessageByIdOrIndex(msgId);
}

function previewText(el) {
  const t = (el.innerText || "").trim().replace(/\s+/g, " ");
  if (!t) return "(no text)";
  return t.slice(0, 90) + (t.length > 90 ? "…" : "");
}

function getScrollParent(el) {
  let cur = el;
  while (cur && cur !== document.body) {
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return cur;
    cur = cur.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

// -------------------- launcher + panel --------------------
const LAUNCHER_POS_KEY = "cgpt_marker_launcher_pos_v1";
const LAUNCHER_MARGIN = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadLauncherPos() {
  try {
    const raw = localStorage.getItem(LAUNCHER_POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.left !== "number" || typeof parsed?.top !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveLauncherPos(pos) {
  try {
    localStorage.setItem(LAUNCHER_POS_KEY, JSON.stringify(pos));
  } catch {
    // ignore storage errors
  }
}

function applyLauncherPos(btn, pos) {
  if (!pos) return;
  const maxLeft = window.innerWidth - btn.offsetWidth - LAUNCHER_MARGIN;
  const maxTop = window.innerHeight - btn.offsetHeight - LAUNCHER_MARGIN;
  const left = clamp(pos.left, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxLeft));
  const top = clamp(pos.top, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxTop));
  btn.style.left = `${left}px`;
  btn.style.top = `${top}px`;
  btn.style.right = "auto";
  btn.style.bottom = "auto";
}

function positionPanelNearLauncher(panel, launcher) {
  if (!panel || !launcher) return;
  const rect = launcher.getBoundingClientRect();

  // Ensure the panel has a measurable size
  const panelWidth = panel.offsetWidth || 320;
  const panelHeight = panel.offsetHeight || 360;
  const maxLeft = window.innerWidth - panelWidth - LAUNCHER_MARGIN;
  const maxTop = window.innerHeight - panelHeight - LAUNCHER_MARGIN;

  let left = rect.right - panelWidth;
  left = clamp(left, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxLeft));

  const preferredTop = rect.top - panelHeight - 12;
  let top = preferredTop;
  if (top < LAUNCHER_MARGIN) {
    top = rect.bottom + 12;
  }
  top = clamp(top, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxTop));

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}
function ensureLauncher() {
  let btn = document.querySelector(".cgpt-marker-launcher");
  if (btn) return btn;

  btn = document.createElement("button");
  btn.className = "cgpt-marker-launcher";
  btn.type = "button";
  btn.innerHTML = `
    <svg class="cgpt-marker-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 4.5h8.5a3 3 0 0 1 3 3v11.25a.75.75 0 0 1-1.14.64L12 17.5l-4.36 2.89A.75.75 0 0 1 6.5 19V4.5Z" fill="currentColor"/>
    </svg>
  `;
  btn.title = "Bookmarks";

  let wasDragged = false;

  btn.addEventListener("click", () => {
    if (wasDragged) {
      wasDragged = false;
      return;
    }
    const panel = ensurePanel();
    renderPanel();
    const isHidden =
      panel.style.display === "none" || getComputedStyle(panel).display === "none";
    panel.style.display = isHidden ? "block" : "none";
    if (panel.style.display === "block") {
      positionPanelNearLauncher(panel, btn);
    }
  });

  document.body.appendChild(btn);
  applyLauncherPos(btn, loadLauncherPos());

  let dragStart = null;
  btn.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const rect = btn.getBoundingClientRect();
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      left: rect.left,
      top: rect.top,
      moved: false,
    };
    btn.setPointerCapture(e.pointerId);
  });

  btn.addEventListener("pointermove", (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!dragStart.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      dragStart.moved = true;
      btn.classList.add("is-dragging");
    }
    if (!dragStart.moved) return;

    const maxLeft = window.innerWidth - btn.offsetWidth - LAUNCHER_MARGIN;
    const maxTop = window.innerHeight - btn.offsetHeight - LAUNCHER_MARGIN;
    const nextLeft = clamp(dragStart.left + dx, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxLeft));
    const nextTop = clamp(dragStart.top + dy, LAUNCHER_MARGIN, Math.max(LAUNCHER_MARGIN, maxTop));
    btn.style.left = `${nextLeft}px`;
    btn.style.top = `${nextTop}px`;
    btn.style.right = "auto";
    btn.style.bottom = "auto";

    const panel = document.querySelector(".cgpt-marker-panel");
    if (panel && panel.style.display === "block") {
      positionPanelNearLauncher(panel, btn);
    }
  });

  const endDrag = (e) => {
    if (!dragStart) return;
    if (dragStart.moved) {
      wasDragged = true;
      saveLauncherPos({
        left: parseFloat(btn.style.left || "0"),
        top: parseFloat(btn.style.top || "0"),
      });
    }
    btn.classList.remove("is-dragging");
    dragStart = null;
    btn.releasePointerCapture?.(e.pointerId);
  };

  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", () => {
    applyLauncherPos(btn, loadLauncherPos());
    const panel = document.querySelector(".cgpt-marker-panel");
    if (panel && panel.style.display === "block") {
      positionPanelNearLauncher(panel, btn);
    }
  });
  return btn;
}

function ensurePanel() {
  let panel = document.querySelector(".cgpt-marker-panel");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.className = "cgpt-marker-panel";
  panel.style.display = "none"; // hidden by default (per your UX)

  panel.innerHTML = `
    <header>
      <div>Bookmarks</div>
      <div style="display:flex; gap:8px;">
        <button class="cgpt-marker-header-btn" id="cgptClear" type="button">Clear</button>
        <button class="cgpt-marker-header-btn" id="cgptClose" type="button">Close</button>
      </div>
    </header>
    <div class="cgpt-marker-list"></div>
  `;
  document.body.appendChild(panel);

  panel.querySelector("#cgptClose").addEventListener("click", () => {
    panel.style.display = "none";
  });

  panel.querySelector("#cgptClear").addEventListener("click", async () => {
    await saveConversation(getConversationId(), []);
    await renderPanel();
    await updateButtonStates();
  });

  return panel;
}

async function renderPanel() {
  const panel = ensurePanel();
  const listEl = panel.querySelector(".cgpt-marker-list");

  const list = await loadConversation(getConversationId());

  if (list.length === 0) {
    listEl.innerHTML = `<div class="cgpt-marker-muted">No bookmarks yet. Hover a message and click Mark.</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const item of list) {
    const row = document.createElement("div");
    row.className = "cgpt-marker-item";
    row.innerHTML = `
      <div>${item.preview}</div>
      <div class="cgpt-marker-muted">${new Date(item.ts).toLocaleString()}</div>
    `;

    row.addEventListener("click", async () => {
      const msgId = item.msgId;
      let attempts = 0;
      const maxAttempts = 5;

      const scrollStep = async () => {
        const target = tryResolveTarget(msgId);
        if (!target) return false;

        const resolved = target.closest?.("[data-message-author-role]") || target;
        
        // 1. Force the scroll
        resolved.scrollIntoView({ behavior: "smooth", block: "start" });

        // 2. Wait for the browser to finish shifting the layout
        await new Promise(r => setTimeout(r, 450));

        // 3. Verify: Check if we actually landed at the top
        const rect = resolved.getBoundingClientRect();
        // If rect.top is near 0 (or your header offset), we are successful
        const isAtTop = Math.abs(rect.top) < 10; 

        if (!isAtTop && attempts < maxAttempts) {
          attempts++;
          return scrollStep(); // Recursive nudge
        }
        return resolved;
      };

      const finalTarget = await scrollStep();

      if (finalTarget) {
        // Flash highlight
        finalTarget.style.transition = "outline 0.2s";
        finalTarget.style.outline = "3px solid rgba(255,165,0,0.6)";
        setTimeout(() => (finalTarget.style.outline = ""), 900);
      }
    });

    listEl.appendChild(row);
  }
}

// -------------------- bookmark logic --------------------
async function toggleBookmark(msgId, preview) {
  const convId = getConversationId();
  const list = await loadConversation(convId);

//   check if msgId is already bookmarked
  const idx = list.findIndex((x) => x.msgId === msgId);
//   if bookmarked, remove it; else add it to the front
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

// -------------------- decorate messages with "Mark" button --------------------
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
      article?.querySelector("[data-testid=\"copy-turn-action-button\"]")?.closest("div") ||
      null;
    const targetHost = actionBar || el;

    if (actionBar) {
    //   Remove any old button that was attached to the message box
      const oldBtn = el.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`);
      if (oldBtn) oldBtn.remove();
    }

    if (!targetHost.querySelector(`.cgpt-marker-btn[data-msg-id="${el.id}"]`)) {
      const btn = document.createElement("button");
      btn.className = "cgpt-marker-btn";
      btn.type = "button";
      btn.textContent = "Mark"; // per your requirement
      btn.setAttribute("data-msg-id", el.id);

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmark(el.id, previewText(el));
      });

      if (actionBar) btn.classList.add("cgpt-marker-btn-inline");
      targetHost.appendChild(btn);
    }
  });
}

// -------------------- dynamic page updates --------------------
function start() {
  const ensureUI = () => {
    if (!document.body) return;
    // create launcher and panel if not exist
    ensureLauncher();
    ensurePanel();
  };

  ensureUI();

  decorate();
  renderPanel();
  updateButtonStates();

  const obs = new MutationObserver(() => {
    ensureUI();
    decorate();
    updateButtonStates();
  });

  // Observe the root so we still react if <body> is replaced by the SPA.
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Safety net for SPA navigations that replace large DOM chunks.
  setInterval(ensureUI, 2000);

  // Close panel when clicking outside
  document.addEventListener("click", (e) => {
    const panel = document.querySelector(".cgpt-marker-panel");
    const launcher = document.querySelector(".cgpt-marker-launcher");
    if (!panel || !launcher) return;
    if (panel.style.display === "none" || getComputedStyle(panel).display === "none") return;
    if (panel.contains(e.target) || launcher.contains(e.target)) return;
    panel.style.display = "none";
  });
}

start();

// content.js
// ChatGPT Marker: hover a message -> "Mark"; bottom-right launcher (always visible) -> toggles panel list

const STORAGE_KEY = "cgpt_markers_v1";

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
// all = { <conversationId>: [ { msgId, preview, ts }, ... ], ... }
function loadAll() {
  return new Promise((resolve) => {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local) {
        resolve({});
        return;
      }
      // Get the values stored under STORAGE_KEY
      chrome.storage.local.get([STORAGE_KEY], (res) => resolve(res?.[STORAGE_KEY] || {}));
    } catch {
      resolve({});
    }
  });
}
// all = { <conversationId>: [ { msgId, preview, ts }, ... ], ... }
// replaces the entire bookmark database with `all`
function saveAll(all) {
  return new Promise((resolve) => {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEY]: all }, resolve);
    } catch {
      resolve();
    }
  });
}

// -------------------- DOM helpers --------------------
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
  if (target) return target;

  const m = msgId.match(/^cgpt-msg-(\d+)$/);
  if (m) {
    const idx = Number(m[1]);
    const nodes = getMessageNodes();
    return Number.isFinite(idx) ? nodes[idx] : null;
  }
  return null;
}

function previewText(el) {
  const t = (el.innerText || "").trim().replace(/\s+/g, " ");
  if (!t) return "(no text)";
  return t.slice(0, 90) + (t.length > 90 ? "…" : "");
}

// -------------------- launcher + panel --------------------
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

  btn.addEventListener("click", () => {
    const panel = ensurePanel();
    renderPanel();
    const isHidden =
      panel.style.display === "none" || getComputedStyle(panel).display === "none";
    panel.style.display = isHidden ? "block" : "none";
  });

  document.body.appendChild(btn);
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
    const all = await loadAll();
    all[getConversationId()] = [];
    // Render the saved list for this conversation in the panel
    await saveAll(all);
    await renderPanel();
    await updateButtonStates();
  });

  return panel;
}

async function renderPanel() {
  const panel = ensurePanel();
  const listEl = panel.querySelector(".cgpt-marker-list");

  const all = await loadAll();
  const list = all[getConversationId()] || [];

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

    row.addEventListener("click", () => {
      const target = findMessageByIdOrIndex(item.msgId);
      if (!target) return;

      // First jump to the start of the message, then align its first line to mid‑screen.
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    //   setTimeout(() => {
    //     const rect = target.getBoundingClientRect();
    //     const delta = rect.top - window.innerHeight / 2;
    //     if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: "smooth" });
    //   }, 200);

      // flash highlight so you can see where you landed
      target.style.transition = "outline 0.2s";
      target.style.outline = "3px solid rgba(255,165,0,0.6)";
      setTimeout(() => (target.style.outline = ""), 900);
    });

    listEl.appendChild(row);
  }
}

// -------------------- bookmark logic --------------------
async function toggleBookmark(msgId, preview) {
    // load all bookmarks
  const all = await loadAll();
//   get current conversation's bookmark list
  const convId = getConversationId();
//   get or init the list for this conversation
  const list = all[convId] || [];

//   check if msgId is already bookmarked
  const idx = list.findIndex((x) => x.msgId === msgId);
//   if bookmarked, remove it; else add it to the front
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ msgId, preview, ts: Date.now() });

  all[convId] = list;
  await saveAll(all);

  await renderPanel();
  await updateButtonStates();
}

async function updateButtonStates() {
  const all = await loadAll();
  const set = new Set((all[getConversationId()] || []).map((x) => x.msgId));

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
      article?.querySelector("div.z-0.flex.justify-end") ||
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

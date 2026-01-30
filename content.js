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
  btn.textContent = "🔖"; // launcher icon
  btn.title = "Bookmarks";

  btn.addEventListener("click", () => {
    const panel = ensurePanel();
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
      const target = document.getElementById(item.msgId);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });

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
  const all = await loadAll();
  const convId = getConversationId();
  const list = all[convId] || [];

  const idx = list.findIndex((x) => x.msgId === msgId);
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
  const nodes = getMessageNodes();

  nodes.forEach((el, i) => {
    if (el.classList.contains("cgpt-marker-wrap")) return;

    // Make it scroll-targetable
    // (MVP note: if ChatGPT re-renders, IDs could shift; we can make this more stable later.)
    if (!el.id) el.id = `cgpt-msg-${i}`;

    el.classList.add("cgpt-marker-wrap");

    const btn = document.createElement("button");
    btn.className = "cgpt-marker-btn";
    btn.type = "button";
    btn.textContent = "Mark"; // per your requirement
    btn.setAttribute("data-msg-id", el.id);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmark(el.id, previewText(el));
    });

    el.appendChild(btn);
  });
}

// -------------------- dynamic page updates --------------------
function start() {
  ensureLauncher();
  ensurePanel();

  decorate();
  renderPanel();
  updateButtonStates();

  const obs = new MutationObserver(() => {
    decorate();
    updateButtonStates();
  });

  obs.observe(document.body, { childList: true, subtree: true });
}

start();
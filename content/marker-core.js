// Shared constants and DOM helpers.
const STORAGE_KEY = "cgpt_markers_v1";
const LAUNCHER_POS_KEY = "cgpt_marker_launcher_pos_v1";
const LAUNCHER_MARGIN = 8;

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

function getConversationId() {
  // ChatGPT conversations usually: https://chatgpt.com/c/<id>
  const m = location.pathname.match(/\/c\/([^\/]+)/);
  return m ? m[1] : "unknown";
}

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

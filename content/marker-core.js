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

function getMessageContainer(el) {
  if (!el) return null;
  // ChatGPT nests the actual message body inside a larger turn wrapper that also owns the action bar.
  return (
    el.closest?.(
      'section[data-turn-id], section[data-testid^="conversation-turn-"], article[data-testid^="conversation-turn-"], article'
    ) || el
  );
}

// It return an array of message container elements
function getMessageNodes() {
  // ChatGPT currently puts this attribute on the message content, not the whole turn.
  const direct = Array.from(document.querySelectorAll("[data-message-author-role]"));
  if (direct.length) {
    return Array.from(
      new Set(direct.map((el) => getMessageContainer(el)).filter(Boolean))
    );
  }

  // Fallback: containers that contain those nodes
  const containers = Array.from(
    document.querySelectorAll(
      'section[data-turn-id], section[data-testid^="conversation-turn-"], article[data-testid^="conversation-turn-"], article, main div'
    )
  );
  return Array.from(
    new Set(
      containers
        .filter((el) => el.querySelector?.("[data-message-author-role]"))
        .map((el) => getMessageContainer(el))
        .filter(Boolean)
    )
  );
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
  if (target) return getMessageContainer(target);

  const m = msgId.match(/^cgpt-msg-(\d+)$/);
  if (m) {
    const idx = Number(m[1]);
    const nodes = getMessageNodes();
    return Number.isFinite(idx) ? nodes[idx] : null;
  }
  return null;
}

function previewText(el) {
  // Pull preview text from the message body instead of the whole turn so action labels are excluded.
  const source = el.querySelector?.("[data-message-author-role]") || el;
  const t = (source.innerText || "").trim().replace(/\s+/g, " ");
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

let searchQuery = "";
const HOME_URL = "http://localhost:3000/";

const PANEL_UI_VERSION = "tag-v1";

const TAG_PALETTE = [
  { bg: "#fff3e0", fg: "#b45309" },
  { bg: "#f3e8ff", fg: "#6b21a8" },
  { bg: "#ffe4e6", fg: "#9f1239" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#cffafe", fg: "#0e7490" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0f2fe", fg: "#0369a1" },
];

function hashTagLabel(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function tagStyleForLabel(tag) {
  return TAG_PALETTE[hashTagLabel(tag) % TAG_PALETTE.length];
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of tags) {
    let t = String(raw).trim().replace(/^#+/, "").trim().toLowerCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function normalizeSingleTag(text) {
  return normalizeTags([text])[0] || "";
}

function closeAllBookmarkDropdowns() {
  document.querySelectorAll(".cgpt-marker-dropdown.is-open").forEach((el) => {
    el.classList.remove("is-open");
  });
}

document.addEventListener(
  "click",
  (e) => {
    const t = e.target;
    const el = t && t.nodeType === 1 ? t : t?.parentElement;
    if (el?.closest?.(".cgpt-marker-dropdown-wrap")) return;
    closeAllBookmarkDropdowns();
  },
  true
);

async function updateBookmarkInStorage(msgId, updater) {
  const convId = getConversationId();
  const list = await loadConversation(convId);
  const idx = list.findIndex((x) => x.msgId === msgId);
  if (idx < 0) return;
  const nextItem = updater({ ...list[idx] });
  if (!nextItem) return;
  list[idx] = nextItem;
  await saveConversation(convId, list);
  await renderPanel();
  await updateButtonStates();
}

// Launcher and panel UI.
function applyLauncherPos(btn, pos) {
  if (!pos) return;
  const maxLeft = window.innerWidth - btn.offsetWidth - LAUNCHER_MARGIN;
  const maxTop = window.innerHeight - btn.offsetHeight - LAUNCHER_MARGIN;
  const left = clamp(
    pos.left,
    LAUNCHER_MARGIN,
    Math.max(LAUNCHER_MARGIN, maxLeft)
  );
  const top = clamp(
    pos.top,
    LAUNCHER_MARGIN,
    Math.max(LAUNCHER_MARGIN, maxTop)
  );
  btn.style.left = `${left}px`;
  btn.style.top = `${top}px`;
  btn.style.right = "auto";
  btn.style.bottom = "auto";
}

function positionPanelNearLauncher(panel, launcher) {
  if (!panel || !launcher) return;
  const rect = launcher.getBoundingClientRect();

  // Ensure the panel has a measurable size
  const panelWidth = panel.offsetWidth || 360;
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
      panel.style.display === "none" ||
      getComputedStyle(panel).display === "none";
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
    const nextLeft = clamp(
      dragStart.left + dx,
      LAUNCHER_MARGIN,
      Math.max(LAUNCHER_MARGIN, maxLeft)
    );
    const nextTop = clamp(
      dragStart.top + dy,
      LAUNCHER_MARGIN,
      Math.max(LAUNCHER_MARGIN, maxTop)
    );
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
  if (panel) {
    const listRoot = panel.querySelector(".cgpt-marker-list");
    if (panel.dataset.cgptPanelVersion === PANEL_UI_VERSION && listRoot) return panel;
    panel.remove();
  }

  panel = document.createElement("div");
  panel.className = "cgpt-marker-panel";
  panel.dataset.cgptPanelVersion = PANEL_UI_VERSION;
  panel.style.display = "none";

  panel.innerHTML = `
    <header>
      <div>Bookmarks</div>
      <div style="display:flex; gap:8px;">
        <button class="cgpt-marker-header-btn" id="cgptClear" type="button">Clear</button>
        <button class="cgpt-marker-header-btn" id="cgptClose" type="button">Close</button>
      </div>
    </header>
    <div class="cgpt-marker-search">
    <input
      id="cgptMarkerSearch"
      class="cgpt-marker-search-input"
      type="text"
      placeholder="Search bookmarks..."
      autocomplete="off"
    />
    </div>
    <div class="cgpt-marker-list"></div>
    <div class="cgpt-marker-panel-footer">
      <button class="cgpt-marker-dashboard-btn" id="cgptDashboard" type="button">
        Go to home page
      </button>
    </div>
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

  panel.querySelector("#cgptDashboard").addEventListener("click", () => {
    window.open(HOME_URL, "_blank", "noopener,noreferrer");
  });

  const searchInput = panel.querySelector("#cgptMarkerSearch");
  searchInput.value = searchQuery;

  searchInput.addEventListener("input", async (e) => {
    searchQuery = e.target.value || "";
    await renderPanel();
  });

  return panel;
}

async function renderPanel() {
  const panel = ensurePanel();
  const listEl = panel.querySelector(".cgpt-marker-list");
  const launcher = document.querySelector(".cgpt-marker-launcher");

  if (!listEl) {
    panel.remove();
    await renderPanel();
    return;
  }

  listEl.replaceChildren();

  try {
    let list = await loadConversation(getConversationId());
    if (!Array.isArray(list)) list = [];
    list = list.filter((item) => item && typeof item === "object" && item.msgId);

    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? list.filter((item) => {
          const preview = (item.preview || "").toLowerCase();
          const tagStr = normalizeTags(item.tags).join(" ").toLowerCase();
          return preview.includes(q) || tagStr.includes(q);
        })
      : list;

    if (filtered.length === 0) {
      listEl.innerHTML = q
        ? '<div class="cgpt-marker-muted">No matching bookmarks.</div>'
        : '<div class="cgpt-marker-muted">No bookmarks yet. Hover a message and click Mark.</div>';

      if (panel.style.display === "block" && launcher) {
        positionPanelNearLauncher(panel, launcher);
      }
      return;
    }

    for (const item of filtered) {
      const tags = normalizeTags(item.tags);

      const row = document.createElement("div");
      row.className = "cgpt-marker-item";

      const titleRow = document.createElement("div");
      titleRow.className = "cgpt-marker-item-row";

      const titleEl = document.createElement("div");
      titleEl.className = "cgpt-marker-item-title";
      titleEl.textContent = item.preview || "";

      const removeBtn = document.createElement("button");
      removeBtn.className = "cgpt-marker-item-remove";
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", "Remove bookmark");
      removeBtn.title = "Remove bookmark";
      removeBtn.textContent = "×";

      titleRow.appendChild(titleEl);
      titleRow.appendChild(removeBtn);

      const tagsRow = document.createElement("div");
      tagsRow.className = "cgpt-marker-item-tags-row";

      const tagsWrap = document.createElement("div");
      tagsWrap.className = "cgpt-marker-tags";

      for (const tag of tags) {
        const pill = document.createElement("span");
        pill.className = "cgpt-marker-tag-pill";
        pill.textContent = `#${tag}`;
        const { bg, fg } = tagStyleForLabel(tag);
        pill.style.backgroundColor = bg;
        pill.style.color = fg;
        tagsWrap.appendChild(pill);
      }

      const tagEditBtn = document.createElement("button");
      tagEditBtn.className = "cgpt-marker-tag-edit-btn";
      tagEditBtn.type = "button";
      tagEditBtn.innerHTML =
        '<span class="cgpt-marker-tag-edit-star" aria-hidden="true">+</span> Add Tag';

      tagsRow.appendChild(tagsWrap);
      tagsRow.appendChild(tagEditBtn);

      const editor = document.createElement("div");
      editor.className = "cgpt-marker-tag-editor";
      editor.hidden = true;
      let editingTag = null;

      const tagInput = document.createElement("input");
      tagInput.className = "cgpt-marker-tag-input";
      tagInput.type = "text";
      tagInput.placeholder = "Add a tag";
      tagInput.autocomplete = "off";
      tagInput.value = "";

      const tagHint = document.createElement("div");
      tagHint.className = "cgpt-marker-tag-hint";
      tagHint.textContent = "Add one tag at a time. Click an existing tag to rename it.";

      const editorActions = document.createElement("div");
      editorActions.className = "cgpt-marker-tag-editor-actions";

      const saveBtn = document.createElement("button");
      saveBtn.className = "cgpt-marker-tag-save";
      saveBtn.type = "button";
      saveBtn.textContent = "Save";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "cgpt-marker-tag-cancel";
      cancelBtn.type = "button";
      cancelBtn.textContent = "Cancel";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "cgpt-marker-tag-delete";
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete Tag";
      deleteBtn.hidden = true;

      editorActions.appendChild(deleteBtn);
      editorActions.appendChild(saveBtn);
      editorActions.appendChild(cancelBtn);
      editor.appendChild(tagInput);
      editor.appendChild(tagHint);
      editor.appendChild(editorActions);

      const tsEl = document.createElement("div");
      tsEl.className = "cgpt-marker-muted cgpt-marker-item-ts";
      tsEl.textContent = new Date(item.ts).toLocaleString();

      row.appendChild(titleRow);
      row.appendChild(tagsRow);
      row.appendChild(editor);
      row.appendChild(tsEl);

      const openTagEditor = (tag = null) => {
        editingTag = tag;
        editor.hidden = false;
        tagInput.value = tag || "";
        tagInput.placeholder = tag ? "Rename tag" : "Add a tag";
        deleteBtn.hidden = !tag;
        tagInput.focus();
        tagInput.select();
      };

      const closeTagEditor = () => {
        editingTag = null;
        editor.hidden = true;
        tagInput.value = "";
        deleteBtn.hidden = true;
      };

      const scrollToBookmark = async () => {
        const msgId = item.msgId;
        let attempts = 0;
        const maxAttempts = 5;

        const scrollStep = async () => {
          const target = tryResolveTarget(msgId);
          if (!target) return false;

          const resolved =
            target.closest?.("[data-message-author-role]") || target;

          resolved.scrollIntoView({ behavior: "smooth", block: "start" });
          await new Promise((r) => setTimeout(r, 450));

          const rect = resolved.getBoundingClientRect();
          const isAtTop = Math.abs(rect.top) < 10;

          if (!isAtTop && attempts < maxAttempts) {
            attempts += 1;
            return scrollStep();
          }
          return resolved;
        };

        const finalTarget = await scrollStep();

        if (finalTarget) {
          finalTarget.style.transition = "outline 0.2s";
          finalTarget.style.outline = "3px solid rgba(255,165,0,0.6)";
          setTimeout(() => {
            finalTarget.style.outline = "";
          }, 900);
        }
      };

      removeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const next = list.filter((x) => x.msgId !== item.msgId);
        await saveConversation(getConversationId(), next);
        await renderPanel();
        await updateButtonStates();
      });

      tagEditBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (editor.hidden || editingTag) openTagEditor();
        else closeTagEditor();
      });

      tagsWrap.querySelectorAll(".cgpt-marker-tag-pill").forEach((pill, index) => {
        pill.role = "button";
        pill.tabIndex = 0;
        pill.title = "Edit tag";
        const currentTag = tags[index];
        const editCurrentTag = (e) => {
          e.stopPropagation();
          openTagEditor(currentTag);
        };
        pill.addEventListener("click", editCurrentTag);
        pill.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            editCurrentTag(e);
          }
        });
      });

      saveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const nextTag = normalizeSingleTag(tagInput.value);
        if (!nextTag) {
          closeTagEditor();
          return;
        }
        const tagBeingEdited = editingTag;
        closeTagEditor();
        await updateBookmarkInStorage(item.msgId, (b) => ({
          ...b,
          tags: tagBeingEdited
            ? normalizeTags(b.tags).map((tag) => (tag === tagBeingEdited ? nextTag : tag))
            : [...normalizeTags(b.tags), nextTag],
        }));
      });

      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!editingTag) return;
        const tagToDelete = editingTag;
        closeTagEditor();
        await updateBookmarkInStorage(item.msgId, (b) => ({
          ...b,
          tags: normalizeTags(b.tags).filter((tag) => tag !== tagToDelete),
        }));
      });

      cancelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTagEditor();
      });

      tagInput.addEventListener("click", (e) => e.stopPropagation());
      tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveBtn.click();
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeTagEditor();
        }
      });

      row.addEventListener("click", async (e) => {
        if (
          e.target.closest(
            "button, input, .cgpt-marker-tag-pill, .cgpt-marker-tag-editor"
          )
        ) {
          return;
        }
        await scrollToBookmark();
      });

      listEl.appendChild(row);
    }

    if (panel.style.display === "block" && launcher) {
      positionPanelNearLauncher(panel, launcher);
    }
  } catch (err) {
    console.error("[cgpt-marker] renderPanel failed:", err);
    listEl.innerHTML =
      '<div class="cgpt-marker-muted">Bookmark list failed to render. Check the console.</div>';
    if (panel.style.display === "block" && launcher) {
      positionPanelNearLauncher(panel, launcher);
    }
  }
}

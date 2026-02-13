let searchQuery = "";

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
  if (panel) return panel;

  panel = document.createElement("div");
  panel.className = "cgpt-marker-panel";
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

  const list = await loadConversation(getConversationId());

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? list.filter((item) => (item.preview || "").toLowerCase().includes(q))
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

  listEl.innerHTML = "";
  for (const item of filtered) {
    const row = document.createElement("div");
    row.className = "cgpt-marker-item";
    row.innerHTML = `
      <div class="cgpt-marker-item-row">
        <div>${item.preview}</div>
        <button class="cgpt-marker-item-remove" type="button" aria-label="Remove bookmark" title="Remove bookmark">
          ×
        </button>
      </div>
      <div class="cgpt-marker-muted">${new Date(item.ts).toLocaleString()}</div>
    `;

    const removeBtn = row.querySelector(".cgpt-marker-item-remove");
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const next = list.filter((x) => x.msgId !== item.msgId);
      await saveConversation(getConversationId(), next);
      await renderPanel();
      await updateButtonStates();
    });

    row.addEventListener("click", async () => {
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
          attempts++;
          return scrollStep();
        }
        return resolved;
      };

      const finalTarget = await scrollStep();

      if (finalTarget) {
        finalTarget.style.transition = "outline 0.2s";
        finalTarget.style.outline = "3px solid rgba(255,165,0,0.6)";
        setTimeout(() => (finalTarget.style.outline = ""), 900);
      }
    });

    listEl.appendChild(row);
  }

  if (panel.style.display === "block" && launcher) {
    positionPanelNearLauncher(panel, launcher);
  }
}

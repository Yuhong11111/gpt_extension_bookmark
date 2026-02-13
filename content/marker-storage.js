// Storage-related helpers.
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

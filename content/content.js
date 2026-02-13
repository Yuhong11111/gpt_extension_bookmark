// Entry point for ChatGPT Marker content scripts.
function start() {
  const ensureUI = () => {
    if (!document.body) return;
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

  // Close panel when clicking outside.
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

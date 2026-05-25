declare global {
  interface Window {
    PagefindUI?: new (opts: Record<string, unknown>) => void;
  }
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

const themeBtn = document.querySelector<HTMLButtonElement>(".theme-toggle");
if (themeBtn) {
  const labels: Record<string, string> = { auto: "Auto", light: "Light", dark: "Dark" };
  const cycle:  Record<string, string> = { auto: "light", light: "dark", dark: "auto" };

  const getTheme = () => localStorage.getItem("theme") ?? "auto";
  const applyTheme = (t: string) => {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = labels[t];
    themeBtn.setAttribute("aria-label", `Colour scheme: ${labels[t]}. Click to change.`);
  };

  themeBtn.addEventListener("click", () => {
    const next = cycle[getTheme()];
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
  applyTheme(getTheme());
}

// ─── Search ───────────────────────────────────────────────────────────────────

if (window.PagefindUI) {
  // Derive the site root from the stylesheet href so bundlePath resolves
  // correctly at any subpath (e.g. GitHub Pages at /software-architecture-wiki/).
  // The stylesheet is always at {siteRoot}/assets/style.css, so one ".." up
  // from its absolute URL gives the site root.
  const styleEl  = document.querySelector<HTMLLinkElement>('link[href*="assets/style"]');
  const siteRoot = styleEl ? new URL("..", styleEl.href).href : location.href;

  new window.PagefindUI({
    element:    "#search",
    showImages: false,
    bundlePath: new URL("pagefind/", siteRoot).href,
  });

  const searchToggle = document.querySelector<HTMLButtonElement>(".search-toggle");
  const searchDlg    = document.querySelector<HTMLDialogElement>("#search-dialog");

  const openSearch = () => {
    searchDlg?.showModal();
    setTimeout(() => searchDlg?.querySelector<HTMLInputElement>("input")?.focus(), 50);
  };

  searchToggle?.addEventListener("click", openSearch);
  searchDlg?.querySelector(".search-close")?.addEventListener("click", () => searchDlg.close());
  searchDlg?.addEventListener("click", (e) => { if (e.target === searchDlg) searchDlg.close(); });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openSearch();
    }
  });
}

// ─── Listen bar ───────────────────────────────────────────────────────────────

const listenBtn  = document.querySelector<HTMLButtonElement>(".listen-btn");
const listenStop = document.querySelector<HTMLButtonElement>(".listen-stop");

if (listenBtn) {
  if (!("speechSynthesis" in window)) {
    const bar = listenBtn.closest<HTMLElement>(".listen-bar");
    if (bar) bar.hidden = true;
  } else {
    type ListenState = "idle" | "playing" | "paused";
    let state: ListenState = "idle";

    const reset = () => {
      state = "idle";
      listenBtn.textContent = "Listen";
      listenBtn.setAttribute("aria-label", "Listen to this page");
      if (listenStop) listenStop.hidden = true;
    };

    const getPageText = (): string => {
      const body = document.querySelector(".page-body");
      if (!body) return "";
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("pre").forEach((el) => el.remove());
      const h1text = document.querySelector("h1")?.textContent ?? "";
      return `${h1text}. ${clone.innerText}`;
    };

    listenBtn.addEventListener("click", () => {
      if (state === "idle") {
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(getPageText());
        utt.addEventListener("end", reset);
        utt.addEventListener("error", reset);
        speechSynthesis.speak(utt);
        state = "playing";
        listenBtn.textContent = "Pause";
        listenBtn.setAttribute("aria-label", "Pause listening");
        if (listenStop) listenStop.hidden = false;
      } else if (state === "playing") {
        speechSynthesis.pause();
        state = "paused";
        listenBtn.textContent = "Resume";
        listenBtn.setAttribute("aria-label", "Resume listening");
      } else {
        speechSynthesis.resume();
        state = "playing";
        listenBtn.textContent = "Pause";
        listenBtn.setAttribute("aria-label", "Pause listening");
      }
    });

    listenStop?.addEventListener("click", () => {
      speechSynthesis.cancel();
      reset();
    });

    window.addEventListener("pagehide", () => speechSynthesis.cancel());
  }
}

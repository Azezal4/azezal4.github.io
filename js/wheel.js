/* ==========================================================================
   Wheel Timeline
   Finds every .wt-root section on the page and wires it up. Safe to include
   once per page. Does NOT hijack global arrow keys; keyboard nav only fires
   when the section is focused or the mouse is inside it.
   ========================================================================== */

(function () {
  "use strict";

  // -----------------------------------------------------------------
  // Your timeline entries — edit these to taste
  // -----------------------------------------------------------------
  const EVENTS = [
    {
      year: 2019,
      title: "Developer & QA engineer",
      body: "Joined Beta Analytics in Kathmandu, building Flask applications and owning automated test coverage across internal platforms."
    },
    {
      year: 2020,
      title: "Python & automation depth",
      body: "Expanded into SQLAlchemy, PostgreSQL, and REST API design while scaling Selenium and pytest suites for production releases."
    },
    {
      year: 2021,
      title: "CI/CD ownership",
      body: "Took ownership of GitLab CI/CD pipelines, Postman contract testing, and Bugzilla triage for a growing product team."
    },
    {
      year: 2023,
      title: "Moved to Canada",
      body: "Relocated to Mississauga, Ontario and began the Software Quality Assurance Management program at Lambton College."
    },
    {
      year: 2024,
      title: "QA trainee team lead",
      body: "Led a QA trainee cohort at Lambton College, coordinating test plans, peer reviews, and automation kata sessions."
    },
    {
      year: 2025,
      title: "Graduated & shipped AI project",
      body: "Completed the post-graduate certificate and shipped an AI-powered job matching system using Ollama/Gemma 3, Flask, and a Chrome extension."
    },
    {
      year: 2026,
      title: "Open to new roles",
      body: "Actively interviewing across QA, Python development, and AI-adjacent engineering roles in the GTA and across Canada."
    }
  ];

  // Angle between adjacent years on the wheel (degrees).
  const STEP = 14;

  // Initialise one .wt-root section.
  function initTimeline(root) {
    const wheel     = root.querySelector("[data-wt-wheel]");
    const yearEl    = root.querySelector("[data-wt-year]");
    const titleEl   = root.querySelector("[data-wt-title]");
    const bodyEl    = root.querySelector("[data-wt-body]");
    const contentEl = root.querySelector("[data-wt-content]");
    const prevBtn   = root.querySelector("[data-wt-prev]");
    const nextBtn   = root.querySelector("[data-wt-next]");

    if (!wheel || !yearEl || !titleEl || !bodyEl || !contentEl) return;

    // Derive the wheel radius from the CSS custom properties. The wheel is a
    // circle sitting with its center below the section; only the top arc is
    // visible. We need dots to land INSIDE the section, not clipped above it.
    //
    // Geometry: wheel's top edge sits at section_y = -peek (because CSS
    // margin-top is -peek). Wheel center is at section_y = -peek + wheelSize/2.
    // A dot placed with translateY(-R) lands at section_y = (-peek + wheelSize/2) - R.
    // We want that landing point to be ~60px inside the section (clearance for
    // the year label that sits above the dot), so:
    //   R = (wheelSize/2) - peek - 60
    function readCssVar(name, fallback) {
      const v = getComputedStyle(root).getPropertyValue(name).trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    }

    function getRadius() {
      const wheelSize = readCssVar("--wt-wheel-size", 2400);
      const peek      = readCssVar("--wt-wheel-peek", 60);
      const clearance = 60; // space above the dot for the year label
      return Math.max(200, (wheelSize / 2) - peek - clearance);
    }

    let activeIndex = 0;
    let radius = getRadius();

    // Build the dots
    const items = EVENTS.map((ev, i) => {
      const item = document.createElement("div");
      item.className = "wt-item";
      item.dataset.index = String(i);

      item.innerHTML =
        '<div class="wt-dot" role="button" tabindex="0" aria-label="' +
        ev.year + ' — ' + escapeAttr(ev.title) + '"></div>' +
        '<div class="wt-year">' + ev.year + '</div>';

      const onPick = () => goTo(i);
      item.querySelector(".wt-dot").addEventListener("click", onPick);
      item.querySelector(".wt-year").addEventListener("click", onPick);
      item.querySelector(".wt-dot").addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); }
      });

      wheel.appendChild(item);
      return item;
    });

    function layout() {
      radius = getRadius();
      items.forEach((el, i) => {
        const angle = (i - activeIndex) * STEP;
        el.style.transform = "rotate(" + angle + "deg) translateY(-" + radius + "px)";
      });
    }

    function render() {
      const rotation = -activeIndex * STEP;
      wheel.style.transform = "rotate(" + rotation + "deg)";

      items.forEach((el, i) => {
        const angleFromTop = (i - activeIndex) * STEP;
        const yr = el.querySelector(".wt-year");
        // Counter-rotate labels so they tilt naturally along the arc rather
        // than spinning with the wheel.
        yr.style.transform =
          "translateX(-50%) rotate(" + (-rotation - angleFromTop) + "deg)";
        el.classList.toggle("is-active", i === activeIndex);
      });

      contentEl.classList.add("is-fading");
      setTimeout(() => {
        const ev = EVENTS[activeIndex];
        yearEl.textContent  = ev.year;
        titleEl.textContent = ev.title;
        bodyEl.textContent  = ev.body;
        contentEl.classList.remove("is-fading");
      }, 300);
    }

    function goTo(i) {
      activeIndex = Math.max(0, Math.min(EVENTS.length - 1, i));
      render();
    }

    // Controls
    prevBtn && prevBtn.addEventListener("click", () => goTo(activeIndex - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(activeIndex + 1));

    // Keyboard nav — scoped: only fires when the section is focused or
    // the pointer is inside it, so it doesn't steal arrow keys from the page.
    let pointerInside = false;
    root.addEventListener("mouseenter", () => { pointerInside = true; });
    root.addEventListener("mouseleave", () => { pointerInside = false; });

    root.addEventListener("keydown", handleKeys);

    function handleKeys(e) {
      const focusedInside = root.contains(document.activeElement);
      if (!focusedInside && !pointerInside) return;
      if (e.key === "ArrowLeft")  { goTo(activeIndex - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { goTo(activeIndex + 1); e.preventDefault(); }
    }

    // Make the section focusable so keyboard users can tab into it
    if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "0");

    // Re-layout on resize (handles mobile breakpoint + any container change)
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { layout(); render(); }, 120);
    });

    layout();
    render();
  }

  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Track which roots we've already wired up so we never double-init.
  const INITIALIZED = new WeakSet();

  function initAll() {
    const roots = document.querySelectorAll(".wt-root");
    if (roots.length === 0) return false;
    let didInit = false;
    roots.forEach((root) => {
      if (INITIALIZED.has(root)) return;
      INITIALIZED.add(root);
      initTimeline(root);
      didInit = true;
    });
    return didInit;
  }

  function boot() {
    // Try right now
    initAll();

    // Observe the DOM for late-injected .wt-root nodes (e.g. if your site
    // renders sections via a framework, AJAX, or partial includes).
    const observer = new MutationObserver(() => { initAll(); });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    // Safety: stop observing after 10s to avoid leaving a long-running observer
    setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    // Script loaded after DOM was already parsed — run immediately
    boot();
  }
})();
/* ===========================================================
   AI SOC — Shared interactions
   nav scroll state · mobile drawer · scroll reveal ·
   accordion · pricing toggle · copy-to-clipboard ·
   docs scrollspy · live dashboard ticker
   =========================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("page-ready")));

  /* ---- ambient pointer drift ---- */
  const root = document.documentElement;
  let pointerTimer = 0;
  window.addEventListener("pointermove", (e) => {
    if (pointerTimer) return;
    pointerTimer = requestAnimationFrame(() => {
      root.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      root.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
      pointerTimer = 0;
    });
  }, { passive: true });

  /* ---- nav scroll state ---- */
  const nav = $(".site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- mobile drawer ---- */
  const burger = $(".nav-burger"), drawer = $(".mobile-drawer");
  if (burger && drawer) {
    burger.setAttribute("aria-expanded", "false");
    burger.addEventListener("click", () => {
      const open = drawer.classList.toggle("open");
      document.body.style.overflow = open ? "hidden" : "";
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".mobile-drawer a", drawer).forEach((a) =>
      a.addEventListener("click", () => {
        drawer.classList.remove("open");
        document.body.style.overflow = "";
        burger.setAttribute("aria-expanded", "false");
      })
    );
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !drawer.classList.contains("open")) return;
      drawer.classList.remove("open");
      document.body.style.overflow = "";
      burger.setAttribute("aria-expanded", "false");
    });
  }

  /* ---- tabs ---- */
  $$("[data-tabs]").forEach((tabs) => {
    const buttons = $$(".tab-btn", tabs);
    const panels = $$(".tab-panel", tabs);
    const activate = (btn) => {
      const target = $(btn.dataset.tabTarget, tabs) || $(btn.dataset.tabTarget);
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach((panel) => panel.classList.toggle("active", panel === target));
    };
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => activate(btn));
      btn.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = buttons[(i + dir + buttons.length) % buttons.length];
        next.focus();
        activate(next);
      });
    });
  });

  /* ---- hero word-by-word entrance ---- */
  const heroH1 = $(".hero-h1");
  if (heroH1) {
    heroH1.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    const spans = heroH1.querySelectorAll(".grad-text");
    const walker = document.createTreeWalker(heroH1, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);
    textNodes.forEach((tn) => {
      const parent = tn.parentNode;
      if (parent.classList && parent.classList.contains("grad-text")) return;
      const frag = document.createDocumentFragment();
      tn.textContent.split(/(\s+)/).forEach((part) => {
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        if (!part) return;
        const w = document.createElement("span");
        w.className = "word";
        w.textContent = part;
        frag.appendChild(w);
      });
      parent.replaceChild(frag, tn);
    });
    spans.forEach((s) => {
      const w = document.createElement("span");
      w.className = "word";
      w.style.display = "inline";
      s.parentNode.insertBefore(w, s);
      w.appendChild(s);
    });
    const allWords = $$(".word", heroH1);
    allWords.forEach((w, i) => { w.style.transitionDelay = `${80 + i * 55}ms`; });
    requestAnimationFrame(() => requestAnimationFrame(() => heroH1.classList.add("hero-animated")));
  }

  /* ---- scroll reveal ---- */
  const reveals = $$(".reveal");
  function checkReveals() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (const el of reveals) {
      if (el.dataset.shown) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > -10) { el.dataset.shown = "1"; el.classList.add("in"); }
    }
  }
  checkReveals();
  window.addEventListener("scroll", checkReveals, { passive: true });
  window.addEventListener("resize", checkReveals, { passive: true });
  window.addEventListener("load", checkReveals);
  setTimeout(checkReveals, 300);
  setTimeout(() => reveals.forEach((el) => el.classList.add("in")), 2400);

  /* ---- accordion ---- */
  $$(".accordion").forEach((acc) => {
    $$(".acc-head", acc).forEach((head) => {
      head.addEventListener("click", () => {
        const item = head.closest(".acc-item");
        const body = $(".acc-body", item);
        const open = item.classList.contains("open");
        if (!acc.dataset.multi) {
          $$(".acc-item.open", acc).forEach((o) => { o.classList.remove("open"); $(".acc-body", o).style.maxHeight = null; });
        }
        if (open) { item.classList.remove("open"); body.style.maxHeight = null; }
        else { item.classList.add("open"); body.style.maxHeight = body.scrollHeight + "px"; }
      });
    });
  });

  /* ---- pricing billing toggle ---- */
  const toggle = $("[data-billing-toggle]");
  if (toggle) {
    $$(".toggle-opt", toggle).forEach((opt) => {
      opt.addEventListener("click", () => {
        const mode = opt.dataset.mode; // monthly | annual
        $$(".toggle-opt", toggle).forEach((o) => o.classList.toggle("active", o === opt));
        $$("[data-price]").forEach((el) => {
          const v = el.dataset[mode === "annual" ? "annual" : "price"];
          if (v != null) el.firstChild.textContent = v;
        });
        $$("[data-per]").forEach((el) => { el.textContent = mode === "annual" ? "/mo · billed annually" : "/month"; });
      });
    });
  }

  /* ---- copy to clipboard ---- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || $(btn.dataset.copyTarget)?.textContent || "";
      try { await navigator.clipboard.writeText(text.trim()); }
      catch (e) {
        const ta = document.createElement("textarea"); ta.value = text.trim();
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      }
      btn.classList.add("copied");
      const old = btn.getAttribute("aria-label");
      btn.setAttribute("aria-label", "Copied!");
      setTimeout(() => { btn.classList.remove("copied"); if (old) btn.setAttribute("aria-label", old); }, 1400);
    });
  });

  /* ---- docs scrollspy + smooth scroll ---- */
  const docLinks = $$(".docs-link[href^='#']");
  if (docLinks.length) {
    docLinks.forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (target) { e.preventDefault(); window.scrollTo({ top: target.offsetTop - 84, behavior: "smooth" }); history.replaceState(null, "", "#" + id); }
      })
    );
    const heads = docLinks.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    function spyScroll() {
      let activeId = heads[0] && heads[0].id;
      for (const h of heads) { if (h.getBoundingClientRect().top <= 100) activeId = h.id; }
      docLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + activeId));
    }
    spyScroll();
    window.addEventListener("scroll", spyScroll, { passive: true });
  }

  /* ---- live dashboard ticker ---- */
  const feed = $("[data-alert-feed]");
  if (feed) {
    const POOL = [
      { sev: "CRITICAL", c: "#ef4444", name: "Credential dumping — T1003", host: "host-04" },
      { sev: "HIGH", c: "#f59e0b", name: "Lateral movement (SMB) — T1021", host: "host-11" },
      { sev: "HIGH", c: "#f59e0b", name: "Scheduled task created — T1053", host: "host-07" },
      { sev: "MED", c: "#00d4ff", name: "Suspicious PowerShell — T1059.001", host: "host-02" },
      { sev: "MED", c: "#00d4ff", name: "DNS tunneling suspected — T1071.004", host: "host-15" },
      { sev: "AUTO", c: "#22c55e", name: "Auto-contained by agent — playbook #44", host: "host-09" },
      { sev: "MED", c: "#00d4ff", name: "Anomalous login geo — T1078", host: "host-21" },
      { sev: "HIGH", c: "#f59e0b", name: "Registry run-key persistence — T1547", host: "host-06" },
    ];
    let i = 0;
    const stamp = () => { const d = new Date(); return d.toTimeString().slice(0, 8); };
    function row(a) {
      const el = document.createElement("div");
      el.className = "alert-row";
      el.style.animation = "fadeSlide .45s ease";
      el.innerHTML =
        `<div class="sev" style="background:${a.c};box-shadow:0 0 10px ${a.c}"></div>
         <div style="flex:1;min-width:0">
           <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</div>
           <div class="mono" style="color:var(--text-dim);font-size:11px;margin-top:2px">${a.host} · ${stamp()}</div>
         </div>
         <span class="pill" style="padding:3px 9px;font-size:10.5px;color:${a.c};border-color:${a.c}33;background:${a.c}11">${a.sev}</span>`;
      return el;
    }
    setInterval(() => {
      const a = POOL[i % POOL.length]; i++;
      feed.insertBefore(row(a), feed.firstChild);
      while (feed.children.length > 5) feed.removeChild(feed.lastChild);
    }, 2000);
  }

  /* keyframe for ticker rows */
  const st = document.createElement("style");
  st.textContent = "@keyframes fadeSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}";
  document.head.appendChild(st);

  /* ---- dot pulse on status indicators ---- */
  const st2 = document.createElement("style");
  st2.textContent = ".dot{animation:dot-pulse 2.4s ease-in-out infinite}" +
    "@keyframes dot-pulse{0%,100%{opacity:1}50%{opacity:.5}}";
  document.head.appendChild(st2);

  /* ---- CTA terminal: reveal output lines on scroll-enter ---- */
  const ctaTerminal = $(".cta-terminal");
  if (ctaTerminal) {
    const outputLines = $$(".t-output", ctaTerminal);
    outputLines.forEach((l) => { l.style.opacity = "0"; l.style.transform = "translateX(-6px)"; l.style.transition = "opacity .35s ease, transform .35s ease"; });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        outputLines.forEach((l, i) => {
          setTimeout(() => { l.style.opacity = "1"; l.style.transform = "none"; }, 400 + i * 200);
        });
        obs.disconnect();
      });
    }, { threshold: 0.5 });
    obs.observe(ctaTerminal);
  }

  /* ---- animated count-up for stats (scroll-based) ---- */
  const counters = $$("[data-count]").map((el) => ({ el, done: false }));
  function runCount(c) {
    c.done = true;
    const el = c.el;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || ""; const prefix = el.dataset.prefix || "";
    const dur = 1100; const start = performance.now();
    function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * ease);
      el.textContent = prefix + Number(val).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function checkCounters() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    counters.forEach((c) => {
      if (c.done) return;
      const r = c.el.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > 0) runCount(c);
    });
  }
  checkCounters();
  window.addEventListener("scroll", checkCounters, { passive: true });
  window.addEventListener("load", checkCounters);
  setTimeout(checkCounters, 500);
})();

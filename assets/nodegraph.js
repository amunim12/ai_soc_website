/* Animated network / node-graph background.
   Usage: <canvas data-nodegraph data-density="0.00012"></canvas>
   Draws drifting nodes with proximity links + occasional traveling pulses.
   Cyan/violet palette, low opacity so it reads as texture. */
(function () {
  function init(canvas) {
    const ctx = canvas.getContext("2d");
    const density = parseFloat(canvas.dataset.density || "0.00011");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, nodes, pulses, raf, dpr;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(26, Math.min(110, Math.floor(w * h * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.8,
        hot: Math.random() < 0.16,
      }));
      pulses = [];
    }

    function spawnPulse() {
      if (!nodes || nodes.length < 2) return;
      const a = nodes[(Math.random() * nodes.length) | 0];
      const b = nodes[(Math.random() * nodes.length) | 0];
      if (a === b) return;
      pulses.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.01 });
    }

    let last = 0;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      const linkDist = Math.min(170, w * 0.16);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const o = (1 - d / linkDist) * 0.32;
            ctx.strokeStyle = `rgba(0,212,255,${o})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        if (n.hot) {
          ctx.fillStyle = "rgba(139,92,246,0.95)";
          ctx.shadowColor = "rgba(139,92,246,0.9)"; ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = "rgba(0,212,255,0.7)";
          ctx.shadowColor = "rgba(0,212,255,0.7)"; ctx.shadowBlur = 5;
        }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      // pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowColor = "rgba(0,212,255,1)"; ctx.shadowBlur = 10;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      if (ts - last > 700 && pulses.length < 8) { last = ts; if (Math.random() < 0.8) spawnPulse(); }
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      // draw a single static frame
      frame(0); cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }
  }

  function boot() {
    document.querySelectorAll("canvas[data-nodegraph]").forEach((c) => {
      if (c.dataset.ngReady) return;
      c.dataset.ngReady = "1";
      init(c);
    });
  }
  window.bootNodeGraphs = boot;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

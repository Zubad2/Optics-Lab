(function (Lab) {
  const { S, V, P, clamp, limitPositions, zoomAt } = Lab.state;
  const { isMirror } = Lab.physics;
  const { canvas, draw } = Lab.render;

  const pointers = new Map();
  let mode = null;
  let last = null;
  let pinch = 0;

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const toWorld = (px) => (px - V.OX) / V.sc;

  function pick(p) {
    const tip = P(S.ox - S.lx, S.oh);
    if (Math.hypot(p[0] - tip[0], p[1] - tip[1]) < 26) return 'obj';
    if (
      S.showScr &&
      !isMirror(S.el) &&
      Math.abs(p[0] - (V.OX + S.sx * V.sc)) < 14 &&
      Math.abs(p[1] - V.H / 2) < 13 * V.sc
    )
      return 'scr';
    if (Math.abs(p[0] - P(0, 0)[0]) < 22 && Math.abs(p[1] - V.H / 2) < (S.D / 2) * V.sc + 10) return 'lens';
    return null;
  }

  function pinchState() {
    const [a, b] = [...pointers.values()];
    return { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: (a[0] + b[0]) / 2 };
  }

  canvas.addEventListener('pointerdown', (e) => {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      return;
    }
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 2) {
      mode = null;
      pinch = pinchState().dist;
      return;
    }
    last = local(e);
    mode = pick(last) || 'pan';
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (!pointers.has(e.pointerId)) {
      canvas.style.cursor = pick(p) ? 'grab' : 'default';
      return;
    }
    pointers.set(e.pointerId, p);
    if (pointers.size === 2) {
      const now = pinchState();
      if (pinch) zoomAt(now.mid, now.dist / pinch);
      pinch = now.dist;
      draw();
      return;
    }
    if (mode === 'pan') {
      V.OX += p[0] - last[0];
      last = p;
    } else if (mode === 'obj') {
      S.ox = toWorld(p[0]);
      S.oh = clamp((V.H / 2 - p[1]) / V.sc, 3, 20);
    } else if (mode === 'scr') {
      S.sx = toWorld(p[0]);
    } else if (mode === 'lens') {
      S.lx = toWorld(p[0]);
    } else {
      return;
    }
    limitPositions();
    draw();
  });

  function release(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (!pointers.size) {
      mode = null;
      canvas.style.cursor = 'default';
    }
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomAt(local(e)[0], Math.exp(-e.deltaY * 0.0015));
      draw();
    },
    { passive: false },
  );

  canvas.addEventListener('keydown', (e) => {
    const step = e.altKey ? 0.2 : 1;
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (e.key === '+' || e.key === '=') zoomAt(V.U / 2, 1.2);
    else if (e.key === '-') zoomAt(V.U / 2, 1 / 1.2);
    else if (e.key === '0') Lab.state.resetView();
    else if (arrows[e.key]) {
      const [dx, dy] = arrows[e.key];
      if (e.shiftKey) S.lx += dx * step;
      else {
        S.ox += dx * step;
        S.oh = clamp(S.oh + dy * step, 3, 20);
      }
      limitPositions();
    } else return;
    e.preventDefault();
    draw();
  });

  canvas.addEventListener('focus', () => {
    canvas.style.outline = '2px solid #4f86c6';
  });
  canvas.addEventListener('blur', () => {
    canvas.style.outline = '';
  });
})((window.Lab = window.Lab || {}));

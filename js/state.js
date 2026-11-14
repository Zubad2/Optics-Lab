(function (Lab) {
  const DEF = {
    tab: 'lens',
    el: 'biconvex',
    obj: 'pencil',
    rays: 'principal',
    R: 25,
    n: 1.5,
    D: 22,
    lx: 0,
    ox: -50,
    oh: 10,
    sx: 50,
    showF: true,
    showGrid: true,
    showVirt: true,
    showScr: false,
  };
  const S = Object.assign({}, DEF);
  const V = { W: 0, H: 0, U: 0, sc: 8, OX: 0, zoom: 1, stacked: false };
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2.5;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const P = (x, y) => [V.OX + (x + S.lx) * V.sc, V.H / 2 - y * V.sc];
  const tableY = () => V.H / 2 + 15 * V.sc;
  const baseScale = () => Math.max(2.5, V.U / (V.stacked ? 140 : 125));

  function limitPositions() {
    S.lx = clamp(S.lx, -30, 60);
    S.ox = clamp(S.ox, -100, S.lx - 3);
    S.sx = clamp(S.sx, S.lx + 6, 110);
  }

  function setView(w, h, stacked) {
    V.W = w;
    V.H = h;
    V.stacked = stacked;
    V.U = stacked ? w : w - 262;
    V.sc = baseScale() * V.zoom;
    V.OX = V.U / 2;
  }

  function announceView() {
    document.dispatchEvent(new CustomEvent('lab:view'));
  }

  function zoomAt(px, factor) {
    const zoom = clamp(V.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    V.OX = px - ((px - V.OX) * zoom) / V.zoom;
    V.zoom = zoom;
    V.sc = baseScale() * zoom;
    announceView();
  }

  function resetView() {
    V.zoom = 1;
    V.sc = baseScale();
    V.OX = V.U / 2;
    announceView();
  }

  Lab.state = { DEF, S, V, clamp, P, tableY, limitPositions, setView, zoomAt, resetView };
})((window.Lab = window.Lab || {}));

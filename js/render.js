(function (Lab) {
  const { S, V, P, tableY } = Lab.state;
  const { IMG, status } = Lab.assets;
  const { geometry, sagOf, mirrorX, imageOf, trace, rayHeights } = Lab.physics;

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const MAX_DPR = 2;
  const RAIL_H = 20;
  const RAY = 'rgba(255, 244, 170, 0.96)';
  const RAY_GLOW = 'rgba(255, 244, 170, 0.16)';

  let afterDraw = null;
  let frameQueued = false;
  let bench = { key: '', layer: null };
  let lensCache = { key: '' };

  function resizeCanvas(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bench.layer = document.createElement('canvas');
    bench.layer.width = canvas.width;
    bench.layer.height = canvas.height;
    bench.layer.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    bench.key = '';
  }

  function trail(points) {
    ctx.beginPath();
    points.forEach((p, i) => {
      const [x, y] = P(p[0], p[1]);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
  }

  function line(points, color, width, dash) {
    trail(points);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPictureAt(name, px, py, hp, alpha) {
    const img = IMG['obj-' + name];
    if (!img && !status.failed) return;
    const h = Math.min(Math.abs(hp), 4000);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    if (hp < 0) ctx.scale(-1, -1);
    if (img) {
      const w = (h * img.width) / img.height;
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      const w = h * 0.3;
      ctx.fillStyle = '#7be35a';
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(w / 2, -h * 0.72);
      ctx.lineTo(w / 6, -h * 0.72);
      ctx.lineTo(w / 6, 0);
      ctx.lineTo(-w / 6, 0);
      ctx.lineTo(-w / 6, -h * 0.72);
      ctx.lineTo(-w / 2, -h * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPicture(x, heightCm, alpha) {
    const [px, py] = P(x, 0);
    drawPictureAt(S.obj, px, py, heightCm * V.sc, alpha);
  }

  function paintTable(c) {
    const { W, H } = V;
    const top = tableY();
    c.fillStyle = IMG.wood ? c.createPattern(IMG.wood, 'repeat') : '#8a5a2b';
    c.fillRect(0, top, W, H - top);
    const shade = c.createLinearGradient(0, top, 0, H);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    shade.addColorStop(0.3, 'rgba(0, 0, 0, 0.05)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    c.fillStyle = shade;
    c.fillRect(0, top, W, H - top);
    if (H - top - RAIL_H > 56) {
      const book = IMG['deco-book'];
      const flask = IMG['deco-flask'];
      const bookY = V.stacked ? top + RAIL_H + 16 : H - 46;
      if (book) c.drawImage(book, V.stacked ? 14 : W - 250, bookY, 110, 31);
      if (flask) c.drawImage(flask, V.stacked ? 140 : W - 120, bookY - 10, 38, 52);
    }
  }

  function drawRuler() {
    const { W, sc, OX } = V;
    const top = tableY();
    ctx.fillStyle = IMG.ruler ? ctx.createPattern(IMG.ruler, 'repeat') : '#ecd88f';
    ctx.fillRect(0, top, W, RAIL_H);
    ctx.strokeStyle = '#5a3d12';
    ctx.lineWidth = 1;
    ctx.strokeRect(-1, top + 0.5, W + 2, RAIL_H);

    const step = sc >= 4 ? 1 : 5;
    const labelEvery = sc >= 4 ? 10 : 20;
    const first = Math.floor((-OX / sc - S.lx) / step);
    const last = Math.ceil(((W - OX) / sc - S.lx) / step);
    ctx.beginPath();
    for (let k = first; k <= last; k++) {
      const cm = k * step;
      const x = OX + (cm + S.lx) * sc;
      const len = cm % 10 === 0 ? 11 : cm % 5 === 0 ? 8 : 5;
      ctx.moveTo(x, top + 1);
      ctx.lineTo(x, top + 1 + len);
    }
    ctx.stroke();
    ctx.fillStyle = '#3d2907';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    for (let k = first; k <= last; k++) {
      const cm = k * step;
      if (cm % labelEvery === 0) ctx.fillText(cm, OX + (cm + S.lx) * sc, top + RAIL_H - 3);
    }
  }

  function drawBench() {
    const key = [
      V.W,
      V.H,
      V.sc.toFixed(3),
      V.stacked,
      !!IMG.wood,
      !!IMG['deco-book'],
      !!IMG['deco-flask'],
    ].join('|');
    if (key !== bench.key) {
      const c = bench.layer.getContext('2d');
      c.clearRect(0, 0, V.W, V.H);
      paintTable(c);
      bench.key = key;
    }
    ctx.drawImage(bench.layer, 0, 0, V.W, V.H);
    drawRuler();
  }

  function drawGrid(bottom) {
    const first = Math.floor((-V.OX / V.sc - S.lx) / 10);
    const last = Math.ceil(((V.W - V.OX) / V.sc - S.lx) / 10);
    ctx.beginPath();
    for (let k = first; k <= last; k++) {
      const x = P(k * 10, 0)[0];
      ctx.moveTo(x, 0);
      ctx.lineTo(x, bottom);
    }
    const rows = Math.ceil(V.H / 2 / (10 * V.sc));
    for (let k = -rows; k <= rows; k++) {
      const y = V.H / 2 - k * 10 * V.sc;
      if (k && y < bottom) {
        ctx.moveTo(0, y);
        ctx.lineTo(V.W, y);
      }
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();
  }

  function stand(x, top, width) {
    const floor = tableY() + 8;
    const pole = ctx.createLinearGradient(x - 4, 0, x + 4, 0);
    pole.addColorStop(0, '#5f6770');
    pole.addColorStop(0.45, '#e2e7ec');
    pole.addColorStop(1, '#5f6770');
    ctx.fillStyle = pole;
    ctx.fillRect(x - 3.5, top, 7, floor - top);
    const base = IMG['stand-base'];
    if (base) ctx.drawImage(base, x - width / 2, floor - width * 0.37 + 7, width, width * 0.37);
    else {
      ctx.fillStyle = '#333';
      ctx.fillRect(x - width / 2, floor - 3, width, 10);
    }
  }

  function lensShape(g) {
    const key = [g.id, S.R, S.n, S.D].join('|');
    if (lensCache.key !== key) {
      const half = S.D / 2;
      const [r1, r2] = g.r;
      const ys = [];
      for (let i = -24; i <= 24; i++) ys.push((half * i) / 24);
      let gap = Infinity;
      for (const y of ys) gap = Math.min(gap, sagOf(r2, y) - sagOf(r1, y));
      const t = 0.45 - gap;
      lensCache = {
        key,
        t,
        front: ys.map((y) => [-t / 2 + sagOf(r1, y), y]),
        back: ys.map((y) => [t / 2 + sagOf(r2, y), y]).reverse(),
      };
    }
    return lensCache;
  }

  function drawLens(g) {
    const { t, front, back } = lensShape(g);
    const glass = ctx.createLinearGradient(...P(-t, 0), ...P(t, 0));
    glass.addColorStop(0, 'rgba(150, 215, 255, 0.55)');
    glass.addColorStop(0.5, 'rgba(190, 235, 255, 0.3)');
    glass.addColorStop(1, 'rgba(110, 185, 240, 0.55)');
    trail(front.concat(back));
    ctx.closePath();
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 240, 255, 0.95)';
    ctx.lineWidth = 2;
    ctx.stroke();
    trail(front.map(([x, y]) => [x + 0.3, y * 0.9]));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawMirror(g) {
    const half = S.D / 2;
    const face = [];
    for (let i = 0; i <= 40; i++) {
      const y = -half + (2 * half * i) / 40;
      face.push([mirrorX(g, y), y]);
    }
    line(
      face.map((p) => [p[0] + 0.7, p[1]]),
      '#5b6673',
      7,
    );
    line(face, '#e9f1f8', 3.5);
    line(
      face.map((p) => [p[0] - 0.12, p[1]]),
      'rgba(255, 255, 255, 0.7)',
      1,
    );
    for (let i = 0; i <= 16; i++) {
      const y = -half + (2 * half * i) / 16;
      const x = mirrorX(g, y);
      line(
        [
          [x + 0.9, y],
          [x + 1.9, y - 1],
        ],
        '#6f7b88',
        1.5,
      );
    }
  }

  function drawScreen(g) {
    if (!S.showScr || g.mir) return;
    const x = V.OX + S.sx * V.sc;
    const half = 13 * V.sc;
    stand(x, V.H / 2 + half + 6, 52);
    ctx.fillStyle = '#2f343a';
    ctx.fillRect(x - 7, V.H / 2 - half - 6, 14, 2 * half + 12);
    ctx.fillStyle = '#f7f7f2';
    ctx.fillRect(x - 3, V.H / 2 - half, 6, 2 * half);
  }

  function drawInset(g, img) {
    if (!S.showScr || g.mir) return;
    const w = 150;
    const h = 150;
    const x = 10;
    const y = V.H - h - 12;
    ctx.save();
    ctx.fillStyle = '#f3ead2';
    ctx.strokeStyle = '#6b4a22';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 6, y - 26, w + 12, h + 34);
    ctx.strokeRect(x - 6, y - 26, w + 12, h + 34);
    ctx.fillStyle = '#4a2f10';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCREEN VIEW', x, y - 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (img && !img.virt) {
      const offBy = Math.abs(S.sx - (img.x + S.lx));
      const k = Math.min(7, 120 / Math.max(Math.abs(img.h), 1));
      const hp = img.h * k;
      ctx.filter = 'blur(' + Math.min(14, offBy * 0.7) + 'px)';
      drawPictureAt(S.obj, x + w / 2, y + h / 2 + hp / 2, hp, Math.max(0.2, 1 - offBy / 45));
    }
    ctx.restore();
  }

  function drawFocalPoints(g) {
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    const spots = g.mir ? [-g.f] : [g.f, -g.f];
    spots.forEach((fx) => {
      const [x, y] = P(fx, 0);
      if (IMG.focal) ctx.drawImage(IMG.focal, x - 9, y - 9, 18, 18);
      else {
        ctx.fillStyle = '#d92d2d';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.fillText('F', x, y - 14);
    });
  }

  function drawRays(g, xo, yo, img) {
    rayHeights(g, S.rays, S.D, xo, yo).forEach((yl) => {
      const r = trace(g, S.D, yl, xo, yo, img);
      if (r.blocked) {
        line([r.a, r.b], 'rgba(255, 244, 170, 0.4)', 1.3, [3, 4]);
        return;
      }
      const path = [r.a, r.h, r.out];
      line(path, RAY_GLOW, 5);
      line(path, RAY, 1.8);
      if (img && img.virt && S.showVirt) line([r.h, [img.x, img.h]], 'rgba(255, 244, 170, 0.7)', 1.5, [6, 5]);
    });
  }

  function drawGrabRing(xo, yo) {
    const [x, y] = P(xo, yo);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, 7);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    if (!V.W) return;
    const g = geometry(S.el, S.R, S.n);
    const xo = S.ox - S.lx;
    const yo = S.oh;
    const d = -xo;
    const img = imageOf(g, d, yo);

    ctx.clearRect(0, 0, V.W, V.H);
    drawBench();
    if (S.showGrid) drawGrid(tableY());
    line(
      [
        [-400, 0],
        [400, 0],
      ],
      'rgba(255, 255, 255, 0.55)',
      1.2,
      [8, 6],
    );
    stand(P(xo, 0)[0], V.H / 2, 34);
    stand(P(0, 0)[0], V.H / 2 + (S.D / 2) * V.sc, 64);
    drawScreen(g);
    if (S.showF && g.power) drawFocalPoints(g);
    if (g.mir) drawMirror(g);
    else drawLens(g);
    drawRays(g, xo, yo, img);
    drawPicture(xo, yo, 1);
    if (img && (!img.virt || S.showVirt)) drawPicture(img.x, img.h, img.virt ? 0.62 : 1);
    drawGrabRing(xo, yo);
    drawInset(g, img);
    if (afterDraw) afterDraw(g, d, img);
  }

  function requestDraw() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(() => {
      frameQueued = false;
      draw();
    });
  }

  Lab.render = {
    canvas,
    draw: requestDraw,
    drawNow: draw,
    resizeCanvas,
    setAfterDraw: (fn) => {
      afterDraw = fn;
    },
  };
})((window.Lab = window.Lab || {}));

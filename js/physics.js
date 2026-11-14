(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Lab = root.Lab || {}).physics = factory();
})(this, function () {
  const ELEMENTS = {
    biconvex: {
      kind: 'lens',
      label: 'Biconvex lens',
      r: [1, -1],
    },
    'plano-convex': {
      kind: 'lens',
      label: 'Plano-convex lens',
      r: [1, 0],
    },
    'meniscus-convex': {
      kind: 'lens',
      label: 'Converging meniscus lens',
      r: [1, 2],
    },
    biconcave: {
      kind: 'lens',
      label: 'Biconcave lens',
      r: [-1, 1],
    },
    'plano-concave': {
      kind: 'lens',
      label: 'Plano-concave lens',
      r: [0, 1],
    },
    'meniscus-concave': {
      kind: 'lens',
      label: 'Diverging meniscus lens',
      r: [2, 1],
    },
    concave: {
      kind: 'mirror',
      label: 'Concave mirror',
      r: [1],
    },
    convex: {
      kind: 'mirror',
      label: 'Convex mirror',
      r: [-1],
    },
    flat: {
      kind: 'mirror',
      label: 'Flat mirror',
      r: [0],
    },
  };

  const TABS = {
    lens: ['biconvex', 'plano-convex', 'meniscus-convex', 'biconcave', 'plano-concave', 'meniscus-concave'],
    mirror: ['concave', 'convex', 'flat'],
  };

  const isMirror = (id) => ELEMENTS[id].kind === 'mirror';

  const curvature = (k, R) => (k ? 1 / (k * R) : 0);

  function geometry(id, R, n) {
    const e = ELEMENTS[id],
      mir = e.kind === 'mirror';
    const power = mir ? 2 * curvature(e.r[0], R) : (n - 1) * (curvature(e.r[0], R) - curvature(e.r[1], R));
    return {
      id: id,
      mir: mir,
      label: e.label,
      r: e.r.map((k) => k * R),
      power: power,
      f: power ? 1 / power : Infinity,
    };
  }

  function sagOf(r, y) {
    if (!r) return 0;
    const a = Math.min(Math.abs(y), Math.abs(r) * 0.98);
    return r - Math.sign(r) * Math.sqrt(r * r - a * a);
  }

  const mirrorX = (g, y) => (g.mir ? -sagOf(g.r[0], y) : 0);

  function imageOf(g, d, h) {
    const inv = g.power - 1 / d;
    if (Math.abs(inv) < 1 / 600) return null;
    const di = 1 / inv;
    return {
      di: di,
      virt: di < 0,
      x: g.mir ? -di : di,
      h: (-h * di) / d,
      M: -di / d,
    };
  }

  function trace(g, D, yl, xo, yo, img) {
    if (Math.abs(yl) > D / 2)
      return {
        blocked: true,
        a: [xo, yo],
        b: [0, yl],
      };
    const m0 = (yl - yo) / -xo,
      m1 = m0 - yl * g.power,
      L = 300;
    if (!g.mir)
      return {
        a: [xo, yo],
        h: [0, yl],
        out: [L, yl + m1 * L],
      };
    let lo = -8,
      hi = 8;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      m - mirrorX(g, yl + m0 * m) < 0 ? (lo = m) : (hi = m);
    }
    const hx = (lo + hi) / 2,
      yh = yl + m0 * hx;
    if (Math.abs(yh) > D / 2)
      return {
        blocked: true,
        a: [xo, yo],
        b: [hx, yh],
      };
    let dx = -1,
      dy = m1;
    if (img) {
      let vx = img.x - hx,
        vy = img.h - yh;
      if (img.virt) {
        vx = -vx;
        vy = -vy;
      }
      if (vx < 0) {
        dx = vx;
        dy = vy;
      }
    }
    const n = Math.hypot(dx, dy);
    return {
      a: [xo, yo],
      h: [hx, yh],
      out: [hx + (L * dx) / n, yh + (L * dy) / n],
    };
  }

  function rayHeights(g, mode, D, xo, yo) {
    if (mode === 'principal') {
      const a = [yo, 0];
      if (g.power) {
        const dd = -g.f - xo;
        if (Math.abs(dd) > 0.001) a.push(yo + (yo * xo) / dd);
      }
      return a;
    }
    if (mode === 'marginal') return [D / 2, -D / 2];
    if (mode === 'many')
      return Array.from(
        {
          length: 13,
        },
        (_, i) => -D / 2 + (D * i) / 12,
      );
    return [];
  }

  function describe(img) {
    if (!img) return 'The object is at the focal point: the rays leave parallel, so no image forms.';
    const a = Math.abs(img.M),
      size = a > 1.05 ? 'enlarged' : a < 0.95 ? 'reduced' : 'the same size';
    return `The image is ${img.virt ? 'virtual' : 'real'}, ${img.M < 0 ? 'inverted' : 'upright'} and ${size}.`;
  }
  return { ELEMENTS, TABS, isMirror, geometry, sagOf, mirrorX, imageOf, trace, rayHeights, describe };
});

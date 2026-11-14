const test = require('node:test');
const assert = require('node:assert/strict');
const { ELEMENTS, TABS, geometry, imageOf, trace, rayHeights, describe } = require('../js/physics.js');

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `expected ${a} to be close to ${b}`);
const miss = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / Math.hypot(dx, dy);
};

test('lensmaker focal lengths', () => {
  near(geometry('biconvex', 40, 1.5).f, 40);
  near(geometry('plano-convex', 40, 1.5).f, 80);
  near(geometry('meniscus-convex', 40, 1.5).f, 160);
  near(geometry('biconcave', 40, 1.5).f, -40);
  near(geometry('plano-concave', 40, 1.5).f, -80);
  near(geometry('meniscus-concave', 40, 1.5).f, -160);
});

test('mirror focal lengths', () => {
  near(geometry('concave', 40, 1.5).f, 20);
  near(geometry('convex', 40, 1.5).f, -20);
  assert.equal(geometry('flat', 40, 1.5).f, Infinity);
});

test('thin-lens equation', () => {
  const g = geometry('biconvex', 25, 1.5);
  const img = imageOf(g, 50, 10);
  near(img.di, 50);
  near(img.M, -1);
  near(1 / 50 + 1 / img.di, 1 / g.f);
  assert.equal(img.virt, false);
});

test('object inside the focal length gives an upright virtual image', () => {
  const img = imageOf(geometry('biconvex', 25, 1.5), 15, 10);
  assert.equal(img.virt, true);
  assert.ok(img.M > 1);
});

test('no image at the focal point', () => {
  assert.equal(imageOf(geometry('biconvex', 25, 1.5), 25, 10), null);
});

test('flat mirror: virtual, upright, same size', () => {
  const img = imageOf(geometry('flat', 40, 1.5), 30, 10);
  assert.equal(img.virt, true);
  near(img.M, 1);
  near(img.x, 30);
});

test('diverging elements give reduced virtual images', () => {
  for (const id of ['biconcave', 'plano-concave', 'meniscus-concave', 'convex']) {
    const img = imageOf(geometry(id, 30, 1.5), 40, 8);
    assert.equal(img.virt, true, id);
    assert.ok(Math.abs(img.M) < 1, id);
  }
});

test('every ray reaches the image point for every element', () => {
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const id of Object.keys(ELEMENTS)) {
    for (let i = 0; i < 80; i++) {
      const g = geometry(id, 25 + rnd() * 60, 1.3 + rnd() * 0.6);
      const d = 8 + rnd() * 60;
      const h = 3 + rnd() * 9;
      const D = 14 + rnd() * 8;
      const img = imageOf(g, d, h);
      if (!img) continue;
      for (const mode of ['principal', 'marginal', 'many']) {
        for (const yl of rayHeights(g, mode, D, -d, h)) {
          const r = trace(g, D, yl, -d, h, img);
          if (r.blocked) continue;
          assert.ok(miss([img.x, img.h], r.h, r.out) < 1e-6, `${id} ${mode}`);
        }
      }
    }
  }
});

test('rays outside the aperture are blocked', () => {
  const g = geometry('biconvex', 25, 1.5);
  assert.equal(trace(g, 10, 6, -50, 8, imageOf(g, 50, 8)).blocked, true);
});

test('every element has a tab and the descriptions are sensible', () => {
  assert.deepEqual([...TABS.lens, ...TABS.mirror].sort(), Object.keys(ELEMENTS).sort());
  assert.match(describe(null), /no image/);
  assert.match(describe(imageOf(geometry('biconvex', 25, 1.5), 50, 10)), /real, inverted and the same size/);
});

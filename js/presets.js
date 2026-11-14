(function (Lab) {
  Lab.presets = [
    { label: 'Magnifying glass', tab: 'lens', el: 'biconvex', k: 0.6 },
    { label: 'Projector', tab: 'lens', el: 'biconvex', k: 1.4 },
    { label: 'Camera', tab: 'lens', el: 'biconvex', k: 2.4 },
    { label: 'Shaving mirror', tab: 'mirror', el: 'concave', k: 0.6 },
    { label: 'Car mirror', tab: 'mirror', el: 'convex', k: 2 },
    { label: 'Bathroom mirror', tab: 'mirror', el: 'flat', d: 30 },
  ];
})((window.Lab = window.Lab || {}));

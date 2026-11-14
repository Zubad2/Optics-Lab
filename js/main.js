(function (Lab) {
  const { setView } = Lab.state;
  const { canvas, draw, drawNow, resizeCanvas, setAfterDraw } = Lab.render;

  const note = document.getElementById('note');
  const columnR = document.getElementById('colR');
  let layoutQueued = false;

  function layout() {
    layoutQueued = false;
    const rect = canvas.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
    setView(rect.width, rect.height, getComputedStyle(columnR).position === 'static');
    drawNow();
  }

  new ResizeObserver(() => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(layout);
  }).observe(canvas);

  setAfterDraw(Lab.ui.readouts);
  Lab.assets.load(draw, () => {
    note.hidden = false;
  });
  document.addEventListener(
    'error',
    (e) => {
      if (e.target.tagName === 'IMG') note.hidden = false;
    },
    true,
  );
  Lab.ui.init();
})((window.Lab = window.Lab || {}));

(function (Lab) {
  const { S, V, DEF, limitPositions, zoomAt, resetView } = Lab.state;
  const { ELEMENTS, TABS, geometry, describe } = Lab.physics;
  const { draw } = Lab.render;

  const $ = (id) => document.getElementById(id);
  const fmt = (v) => v.toFixed(1).replace('-', '\u2212');

  function setText(id, text) {
    const el = $(id);
    if (el.textContent !== text) el.textContent = text;
  }

  function buildPicker() {
    const box = $('elPick');
    box.textContent = '';
    TABS[S.tab].forEach((id) => {
      const label = document.createElement('label');
      label.className = 'pic';
      label.title = ELEMENTS[id].label;
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'el';
      input.value = id;
      input.checked = id === S.el;
      const img = document.createElement('img');
      img.src = 'assets/icon-' + id + '.svg';
      img.alt = ELEMENTS[id].label;
      label.append(input, img);
      box.append(label);
    });
  }

  function sync() {
    const g = geometry(S.el, S.R, S.n);
    buildPicker();
    document
      .querySelectorAll('.tab')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === S.tab)));
    $('optTitle').textContent = g.label;
    $('nrow').classList.toggle('off', g.mir);
    $('n').disabled = g.mir;
    $('rrow').classList.toggle('off', g.mir && !g.r[0]);
    $('R').disabled = g.mir && !g.r[0];
    $('scrOpt').hidden = g.mir;
    ['R', 'n', 'D'].forEach((id) => {
      $(id).value = S[id];
    });
    draw();
  }

  function readouts(g, d, img) {
    setText('rf', isFinite(g.f) ? fmt(g.f) + ' cm' : '\u221e');
    setText('rd', fmt(d) + ' cm');
    setText('rdi', img ? fmt(Math.abs(img.di)) + ' cm' : '\u2014');
    setText('rM', img ? fmt(img.M) + '\u00d7' : '\u2014');
    setText(
      'rT',
      img ? (img.virt ? 'virtual' : 'real') + ', ' + (img.M < 0 ? 'inverted' : 'upright') : 'none',
    );
    setText('rSay', describe(img));
    setText('oR', S.R + ' cm');
    setText('on', S.n.toFixed(2));
    setText('oD', S.D + ' cm');
  }

  function applyPreset(p) {
    S.tab = p.tab;
    S.el = p.el;
    S.lx = p.tab === 'lens' ? 0 : 30;
    S.ox = S.lx - (p.d || p.k * Math.abs(geometry(S.el, S.R, S.n).f));
    S.sx = S.lx + 50;
    limitPositions();
    resetView();
    sync();
  }

  function resetAll() {
    Object.assign(S, DEF);
    ['showF', 'showGrid', 'showVirt', 'showScr'].forEach((id) => {
      $(id).checked = DEF[id];
    });
    document.querySelector('input[name=rays][value=principal]').checked = true;
    document.querySelector('input[name=obj][value=pencil]').checked = true;
    resetView();
    sync();
  }

  function init() {
    document.querySelectorAll('input[name=rays], input[name=obj]').forEach((input) => {
      input.addEventListener('change', () => {
        S[input.name] = input.value;
        draw();
      });
    });
    $('elPick').addEventListener('change', (e) => {
      S.el = e.target.value;
      sync();
    });
    document.querySelectorAll('.tab').forEach((button) => {
      button.addEventListener('click', () => {
        S.tab = button.dataset.tab;
        S.el = TABS[S.tab][0];
        S.lx = S.tab === 'lens' ? 0 : 30;
        S.ox = S.lx - 50;
        S.sx = S.lx + 50;
        limitPositions();
        sync();
      });
    });
    ['R', 'n', 'D'].forEach((id) => {
      $(id).addEventListener('input', (e) => {
        S[id] = parseFloat(e.target.value);
        draw();
      });
    });
    ['showF', 'showGrid', 'showVirt', 'showScr'].forEach((id) => {
      $(id).addEventListener('change', (e) => {
        S[id] = e.target.checked;
        draw();
      });
    });
    Lab.presets.forEach((p) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.textContent = p.label;
      button.addEventListener('click', () => applyPreset(p));
      $('presets').append(button);
    });
    $('zoomIn').addEventListener('click', () => {
      zoomAt(V.U / 2, 1.25);
      draw();
    });
    $('zoomOut').addEventListener('click', () => {
      zoomAt(V.U / 2, 0.8);
      draw();
    });
    $('zoomFit').addEventListener('click', () => {
      resetView();
      draw();
    });
    document.addEventListener('lab:view', () => {
      setText('zoomFit', Math.round(V.zoom * 100) + '%');
    });
    $('hintClose').addEventListener('click', () => {
      $('hint').hidden = true;
    });
    $('reset').addEventListener('click', resetAll);
    setText('zoomFit', '100%');
    sync();
  }

  Lab.ui = { init, readouts };
})((window.Lab = window.Lab || {}));

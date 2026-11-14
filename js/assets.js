(function (Lab) {
  const NAMES = [
    'obj-pencil',
    'obj-candle',
    'obj-star',
    'obj-arrow',
    'obj-F',
    'obj-bulb',
    'focal',
    'stand-base',
    'wood',
    'ruler',
    'deco-book',
    'deco-flask',
  ];
  const IMG = {};
  const status = { failed: false };

  function rasterize(img, scale) {
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function load(onLoad, onError) {
    NAMES.forEach((name) => {
      const img = new Image();
      img.onload = () => {
        IMG[name] = rasterize(img, name === 'wood' || name === 'ruler' ? 1 : 3);
        onLoad();
      };
      img.onerror = () => {
        status.failed = true;
        onError();
      };
      img.src = 'assets/' + name + '.svg';
    });
  }

  Lab.assets = { IMG, status, load };
})((window.Lab = window.Lab || {}));

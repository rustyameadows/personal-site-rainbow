const svgNamespace = 'http://www.w3.org/2000/svg';
const coordinates = /-?\d+(?:\.\d+)?/g;
let labelResize;

function bandOutlines(path) {
  return path.getAttribute('d').split(/\s*Z\s*/, 2);
}

function crownOffset(guide) {
  let start = 0;
  let end = guide.getTotalLength();

  while (end - start > 0.5) {
    const third = (end - start) / 3;
    const left = start + third;
    const right = end - third;
    if (guide.getPointAtLength(left).y > guide.getPointAtLength(right).y) start = left;
    else end = right;
  }

  return (start + end) / 2;
}

export function createBandLabelRenderer(view) {
  const rainbow = view.querySelector('.rainbow');
  const labels = new Map(Array.from(view.querySelectorAll('[data-band-label]'), (label) => [label.dataset.bandLabel, label]));
  const document = view.ownerDocument;
  const textMetrics = document.createElement('canvas').getContext('2d');

  return function placeLabel(band, { bend = 0.76, offset = 0, centerGuide } = {}) {
    const label = labels.get(band.dataset.band);
    const textPath = label.querySelector('textPath');
    const guide = view.querySelector(textPath.getAttribute('href'));
    const [outer, inner] = bandOutlines(band.querySelector('path'));
    const innerPoints = inner.match(coordinates).map(Number);
    const bounds = rainbow.getBoundingClientRect();
    const viewBox = rainbow.viewBox.baseVal;
    const scales = [bounds.width / viewBox.width, bounds.height / viewBox.height];
    let index = 0;

    // Draw the centerline in CSS pixels so the rainbow can resize without stretching the text.
    const centerline = outer.replace(coordinates, (coordinate) => {
      const midpoint = (Number(coordinate) + innerPoints[index]) / 2;
      return midpoint * scales[index++ % 2];
    });
    guide.setAttribute('d', centerline);
    centerGuide?.setAttribute('d', centerline);

    const name = band.getAttribute('aria-label');
    const { fontSize, fontWeight, fontFamily } = document.defaultView.getComputedStyle(label);
    textMetrics.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const { actualBoundingBoxAscent, actualBoundingBoxDescent } = textMetrics.measureText(name);
    const baselineOffset = (actualBoundingBoxAscent - actualBoundingBoxDescent) / 2;

    // Place the middle of the visible letters on the crown, then soften the curve at the ends.
    const crownY = guide.getPointAtLength(crownOffset(guide)).y;
    index = 0;
    guide.setAttribute('d', centerline.replace(coordinates, (coordinate) => {
      if (index++ % 2 === 0) return coordinate;
      return crownY + baselineOffset + offset + (Number(coordinate) - crownY) * bend;
    }));
    textPath.setAttribute('startOffset', crownOffset(guide));
    textPath.textContent = name;
    label.style.setProperty('--band', band.style.getPropertyValue('--band'));
    label.setAttribute('data-visible', '');
    return label;
  };
}

export function trackBandHover(rainbow, onChange) {
  let hoveredBand;

  function setHoveredBand(band) {
    if (band === hoveredBand) return;
    hoveredBand?.removeAttribute('data-hovered');
    band?.setAttribute('data-hovered', '');
    hoveredBand = band;
    onChange(band);
  }

  rainbow.addEventListener('pointermove', (event) => {
    const band = event.pointerType === 'touch' ? undefined : event.target.closest('[data-band]') ?? undefined;
    setHoveredBand(band);
  });
  rainbow.addEventListener('pointerleave', () => setHoveredBand(undefined));
  rainbow.addEventListener('pointercancel', () => setHoveredBand(undefined));
}

export function mountBandLabels(view) {
  labelResize?.disconnect();
  labelResize = undefined;
  const rainbow = view.querySelector('.rainbow');
  if (!rainbow) return;

  const renderBand = createBandLabelRenderer(view);
  let hoveredBand;
  let activeLabel;

  function placeLabel() {
    if (hoveredBand?.isConnected) activeLabel = renderBand(hoveredBand);
  }

  trackBandHover(rainbow, (band) => {
    activeLabel?.removeAttribute('data-visible');
    activeLabel = undefined;
    hoveredBand = band;
    placeLabel();
  });

  labelResize = new ResizeObserver(placeLabel);
  labelResize.observe(rainbow);
  document.fonts.ready.then(placeLabel);
}

function interpolateOutline(outline, target, progress) {
  let index = 0;
  return outline.replace(coordinates, (coordinate) => {
    const from = Number(coordinate);
    return (from + (target[index++] - from) * progress).toFixed(2);
  });
}

export function morphBand(band, returning = false) {
  const rainbow = band.ownerSVGElement;
  const source = band.querySelector('path');
  const [outer, inner] = bandOutlines(source);
  const bounds = rainbow.getBoundingClientRect();
  const { width, height } = rainbow.viewBox.baseVal;
  const scaleX = bounds.width / width;
  const scaleY = bounds.height / height;
  const left = (-8 - bounds.left) / scaleX;
  const right = (innerWidth + 8 - bounds.left) / scaleX;
  const top = (-8 - bounds.top) / scaleY;
  const bottom = (innerHeight + 8 - bounds.top) / scaleY;

  // Keep the original three cubic segments. The outside opens into a viewport-sized
  // rectangle while the open center closes below the bottom edge.
  const frame = [
    left, bottom,
    left, bottom, left, top, left, top,
    left, top, right, top, right, top,
    right, top, right, bottom, right, bottom,
  ];
  const center = source.getBBox();
  const innerX = center.x + center.width / 2;
  const closed = Array.from({ length: frame.length }, (_, index) => index % 2 === 0 ? innerX : bottom);

  const overlay = document.createElement('div');
  overlay.className = 'color-transition';
  overlay.setAttribute('aria-hidden', 'true');

  const haze = document.createElement('div');
  haze.className = 'transition-haze';
  const washSvg = document.createElementNS(svgNamespace, 'svg');
  washSvg.classList.add('color-wash');
  washSvg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  const shape = source.cloneNode();
  shape.setAttribute('fill', band.style.getPropertyValue('--band'));
  shape.setAttribute('transform', `translate(${bounds.left} ${bounds.top}) scale(${scaleX} ${scaleY})`);

  function paint(progress) {
    const ease = progress * progress * (3 - 2 * progress);
    const outside = interpolateOutline(outer, frame, ease);
    const opening = interpolateOutline(inner, closed, ease);
    shape.setAttribute('d', `${outside}Z ${opening}Z`);
    haze.style.setProperty('--morph-blur', `${(ease * 11).toFixed(2)}px`);
    haze.style.setProperty('--morph-white', (ease * 0.25).toFixed(3));
  }

  paint(returning ? 1 : 0);
  washSvg.append(shape);
  overlay.append(haze, washSvg);
  document.body.append(overlay);

  let frameId;
  let complete;
  const finished = new Promise((resolve) => { complete = resolve; });
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / 230, 1);
    paint(returning ? 1 - progress : progress);
    if (progress < 1) frameId = requestAnimationFrame(step);
    else complete();
  }

  frameId = requestAnimationFrame(step);
  return {
    finished,
    cancel() {
      cancelAnimationFrame(frameId);
      overlay.remove();
      complete();
    },
  };
}

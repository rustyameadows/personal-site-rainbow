let resize;
let redraw;
const coordinates = /-?\d+(?:\.\d+)?/g;

function mix(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function splitCubic([a, b, c, d], t) {
  const ab = mix(a, b, t);
  const bc = mix(b, c, t);
  const cd = mix(c, d, t);
  const abc = mix(ab, bc, t);
  const bcd = mix(bc, cd, t);
  const split = mix(abc, bcd, t);
  return { head: [a, ab, abc, split], tail: [split, bcd, cd, d] };
}

function projectedOutline(rainbow, points, startY) {
  const bounds = rainbow.getBoundingClientRect();
  const box = rainbow.viewBox.baseVal;
  const projected = points.map(({ x, y }) => ({
    x: bounds.left + (x - box.x) * bounds.width / box.width,
    y: bounds.top + (y - box.y) * bounds.height / box.height,
  }));
  const first = projected.slice(0, 4);
  let low = 0;
  let high = 1;
  while (high - low > 0.00001) {
    const mid = (low + high) / 2;
    if (splitCubic(first, mid).tail[0].y > startY) low = mid;
    else high = mid;
  }
  return [...splitCubic(first, (low + high) / 2).tail, ...projected.slice(4)];
}

function pathData([start, ...controls]) {
  const values = (point) => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
  return `M ${values(start)} C ${controls.map(values).join(' ')}`;
}

function softenTail(points) {
  const { head, tail: [join, handle, lastHandle, tip] } = splitCubic(points.slice(0, 4), 0.42);
  const lift = (points[0].y - tip.y) * 0.065;
  const rise = join.y - handle.y;
  // Move only the far endpoint so the curve keeps its tangent and curvature at the join.
  const end = { x: tip.x + (handle.x - join.x) * lift / rise, y: tip.y - lift };
  return [...head, handle, lastHandle, end];
}

function inkCorner(canvas, font, initial) {
  canvas.font = font;
  const metrics = canvas.measureText(initial);
  const left = Math.floor(-metrics.actualBoundingBoxLeft) - 1;
  const top = Math.floor(-metrics.actualBoundingBoxAscent) - 1;
  const scale = 2;
  const width = Math.ceil((metrics.actualBoundingBoxRight - left + 2) * scale);
  const height = Math.ceil((metrics.actualBoundingBoxDescent - top + 2) * scale);
  canvas.canvas.width = width;
  canvas.canvas.height = height;
  canvas.font = font;
  canvas.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);
  canvas.fillText(initial, 0, 0);
  const pixels = canvas.getImageData(0, 0, width, height).data;
  // With the straight wordmark rotated upward, the first ink column is the bottom serif edge.
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (pixels[(y * width + x) * 4 + 3] >= 128) {
        return { x: left + x / scale, y: top + y / scale, descent: metrics.fontBoundingBoxDescent };
      }
    }
  }
  return { x: -metrics.actualBoundingBoxLeft, y: top, descent: metrics.fontBoundingBoxDescent };
}

export function mountWordmark(view) {
  resize?.disconnect();
  redraw = undefined;
  const source = view.querySelector('.wordmark');
  const layer = view.querySelector('.wordmark-curve');
  if (!source || !layer) return;

  const rainbow = view.querySelector('.rainbow');
  const path = layer.querySelector('defs path');
  const placement = layer.querySelector('g');
  const text = placement.querySelector('text');
  const guide = layer.querySelector('.wordmark-baseline');
  const projection = layer.querySelector('.wordmark-projection');
  const outer = rainbow.querySelector('[data-band]:last-of-type path');
  const values = outer.getAttribute('d').split('Z', 1)[0].match(coordinates).map(Number);
  const points = [];
  for (let i = 0; i < values.length; i += 2) points.push({ x: values[i], y: values[i + 1] });
  const range = document.createRange();
  range.selectNodeContents(source);
  const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!canvas) return;
  let previousFont;
  let corner;

  function draw() {
    const style = getComputedStyle(source);
    const desktop = style.writingMode === 'vertical-rl';
    layer.toggleAttribute('hidden', !desktop);
    if (!desktop) {
      view.removeAttribute('data-wordmark-arc');
      return;
    }

    const bounds = range.getBoundingClientRect();
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    if (font !== previousFont) {
      previousFont = font;
      corner = inkCorner(canvas, font, source.textContent[0]);
    }
    text.style.font = font;
    text.style.fontKerning = style.fontKerning;
    text.style.letterSpacing = style.letterSpacing;

    const origin = { x: bounds.right - corner.descent, y: bounds.bottom };
    const edge = projectedOutline(rainbow, points, origin.y);
    const baseline = softenTail(edge);
    let outline = pathData(baseline);
    path.setAttribute('d', outline);
    const spare = bounds.height + Number.parseFloat(style.fontSize) * 0.15 - path.getTotalLength();
    if (spare > 0) {
      const end = baseline.at(-1);
      const handle = baseline.at(-2);
      const dx = end.x - handle.x;
      const dy = end.y - handle.y;
      const scale = spare / Math.hypot(dx, dy);
      outline += ` L ${end.x + dx * scale} ${end.y + dy * scale}`;
      path.setAttribute('d', outline);
    }
    const start = text.getStartPositionOfChar(0);
    const rotation = text.getRotationOfChar(0) * Math.PI / 180;
    const pivot = { x: origin.x + corner.y, y: origin.y - corner.x };
    const dx = pivot.x - (start.x + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation));
    const dy = pivot.y - (start.y + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation));
    const valid = Number.isFinite(dx) && Number.isFinite(dy);
    layer.toggleAttribute('hidden', !valid);
    view.toggleAttribute('data-wordmark-arc', valid);
    if (!valid) return;
    placement.setAttribute('transform', `translate(${dx} ${dy})`);

    if (guide) {
      const pathLength = path.getTotalLength();
      const length = Math.min(pathLength, text.getComputedTextLength());
      guide.setAttribute('d', outline);
      guide.style.strokeDasharray = `${length} ${pathLength}`;
      const end = path.getPointAtLength(length);
      path.setAttribute('d', pathData(edge));
      const edgePoint = path.getPointAtLength(length);
      path.setAttribute('d', outline);
      projection.setAttribute('d', `M ${edgePoint.x} ${edgePoint.y} L ${end.x + dx} ${end.y + dy}`);
    }
  }

  redraw = draw;
  resize = new ResizeObserver(draw);
  resize.observe(rainbow);
  document.fonts.ready.then(() => {
    if (redraw !== draw) return;
    previousFont = undefined;
    draw();
  });
  draw();
}

window.addEventListener('scroll', () => redraw?.(), { passive: true });

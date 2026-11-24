const layer = document.createElement('div');
layer.className = 'selection-paint';
layer.setAttribute('aria-hidden', 'true');
document.body.append(layer);

const forcedColors = matchMedia('(forced-colors: active)');
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null;
const resize = new ResizeObserver(schedulePaint);
let view;
let wordmark;
let colors = [];
let frame;

export function mountSelection(nextView) {
  view?.removeAttribute('data-selection-painted');
  resize.disconnect();
  view = nextView;
  wordmark = view.querySelector('.wordmark');
  const swatches = view.querySelectorAll(wordmark ? '[data-band]' : '.section-index a');
  colors = Array.from(swatches, (swatch) => swatch.style.getPropertyValue(wordmark ? '--band' : '--swatch')).reverse();
  resize.observe(view);
  if (wordmark) resize.observe(wordmark);
  paint();
}

function selectionScope() {
  if (view?.hasAttribute('data-wordmark-arc')) return view.querySelector('.wordmark-curve textPath');
  return wordmark ?? view;
}

export function clearSelection() {
  const selection = window.getSelection();
  const scope = selectionScope();
  if (scope && selection.rangeCount && selection.getRangeAt(0).intersectsNode(scope)) {
    selection.removeAllRanges();
  }
  layer.replaceChildren();
  view?.removeAttribute('data-selection-painted');
}

function selectedTextRanges() {
  const selection = window.getSelection();
  const scope = selectionScope();
  if (!scope || !selection.rangeCount || selection.isCollapsed) return [];
  const selected = selection.getRangeAt(0);
  if (!selected.intersectsNode(scope)) return [];

  const ranges = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const element = node.parentElement;
      const visible = scope instanceof SVGElement || (!element.closest('.section-index')
        && element.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) !== false);
      return visible && node.data.trim() && selected.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const start = node === selected.startContainer ? selected.startOffset : 0;
    const end = node === selected.endContainer ? selected.endOffset : node.length;
    if (start >= end) continue;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    ranges.push(range);
  }
  return ranges;
}

function curvedSelectionBoxes(glyphs, ascent, descent) {
  function edge(point, angle) {
    const radians = angle * Math.PI / 180;
    const x = Math.sin(radians);
    const y = -Math.cos(radians);
    return [
      { x: point.x + x * ascent, y: point.y + y * ascent },
      { x: point.x - x * descent, y: point.y - y * descent },
    ];
  }

  // Adjacent letters share a boundary so the outer edge stays continuous as the type turns.
  let leading = glyphs.length ? edge(glyphs[0].start, glyphs[0].angle) : [];
  return glyphs.map(({ end, angle, background }, index) => {
    const next = glyphs[index + 1];
    const point = next ? { x: (end.x + next.start.x) / 2, y: (end.y + next.start.y) / 2 } : end;
    const trailing = edge(point, next ? (angle + next.angle) / 2 : angle);
    const corners = [leading[0], trailing[0], trailing[1], leading[1]];
    leading = trailing;
    const x = corners.map((corner) => corner.x);
    const y = corners.map((corner) => corner.y);
    const left = Math.min(...x);
    const top = Math.min(...y);
    const clip = corners.map((corner) => `${corner.x - left}px ${corner.y - top}px`).join(', ');
    return { left, top, width: Math.max(...x) - left, height: Math.max(...y) - top, background, clip };
  });
}

function letterBoxes(ranges) {
  if (!segmenter) return [];
  const type = ranges[0].startContainer.parentElement.closest('.wordmark-curve text');
  const matrix = type?.getScreenCTM();
  let verticalMetrics;
  if (matrix) {
    const style = getComputedStyle(type);
    const metrics = document.createElement('canvas').getContext('2d');
    metrics.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    verticalMetrics = metrics.measureText(type.textContent);
  }
  const boxes = [];
  const range = document.createRange();
  let color = 0;
  for (const slice of ranges) {
    const node = slice.startContainer;
    const text = node.data.slice(slice.startOffset, slice.endOffset);
    for (const { segment, index } of segmenter.segment(text)) {
      range.setStart(node, slice.startOffset + index);
      range.setEnd(node, slice.startOffset + index + segment.length);
      const background = colors[color % colors.length];
      if (verticalMetrics) {
        const i = slice.startOffset + index;
        const start = type.getStartPositionOfChar(i).matrixTransform(matrix);
        const end = type.getEndPositionOfChar(i).matrixTransform(matrix);
        const angle = type.getRotationOfChar(i);
        boxes.push({ start, end, background, angle });
      } else {
        for (const { left, top, width, height } of range.getClientRects()) {
          if (width && height) boxes.push({ left, top, width, height, background });
        }
      }
      if (segment.trim()) color++;
    }
  }
  return verticalMetrics
    ? curvedSelectionBoxes(boxes, verticalMetrics.fontBoundingBoxAscent, verticalMetrics.fontBoundingBoxDescent)
    : boxes;
}

function gradientBoxes(ranges) {
  const stops = colors.map((color) => `color-mix(in srgb, ${color} 70%, var(--paper))`);
  const background = `linear-gradient(to right, ${stops.join(', ')})`;
  const lines = [];
  for (const range of ranges) {
    for (const { left, top, right, bottom, width, height } of range.getClientRects()) {
      if (!width || !height) continue;
      const line = lines.at(-1);
      if (line && Math.abs(line.top - top) < 1 && left <= line.right + 1 && right >= line.left) {
        line.left = Math.min(line.left, left);
        line.right = Math.max(line.right, right);
        line.bottom = Math.max(line.bottom, bottom);
      } else {
        lines.push({ left, top, right, bottom });
      }
    }
  }
  return lines.map(({ left, top, right, bottom }) => ({
    left, top, width: right - left, height: bottom - top, background,
  }));
}

function paint() {
  frame = undefined;
  const ranges = colors.length && !forcedColors.matches ? selectedTextRanges() : [];
  const boxes = ranges.length ? (wordmark ? letterBoxes : gradientBoxes)(ranges) : [];
  // Draw behind the original glyphs so serifs can cross color boundaries.
  layer.replaceChildren(...boxes.map(({ left, top, width, height, background, clip }) => {
    const box = document.createElement('span');
    Object.assign(box.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, background,
    });
    if (clip) box.style.clipPath = `polygon(${clip})`;
    return box;
  }));
  view?.toggleAttribute('data-selection-painted', boxes.length > 0);
}

function schedulePaint() {
  if (frame === undefined) frame = requestAnimationFrame(paint);
}

document.addEventListener('selectionchange', schedulePaint);
window.addEventListener('resize', schedulePaint);
window.addEventListener('scroll', schedulePaint, { passive: true });
forcedColors.addEventListener('change', schedulePaint);
document.fonts.ready.then(schedulePaint);

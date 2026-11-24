const canvas = document.createElement('canvas').getContext('2d');
let title;
let range;
let firstGlyph;
let lastGlyph;
let frame;

function inkBounds(style) {
  const bounds = range.getBoundingClientRect();
  if (!canvas) return bounds;
  canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const firstInk = canvas.measureText(firstGlyph.toString()).actualBoundingBoxLeft;
  const lastInk = canvas.measureText(lastGlyph.toString()).actualBoundingBoxRight;
  if (!Number.isFinite(firstInk) || !Number.isFinite(lastInk)) return bounds;

  const { fontBoundingBoxDescent, actualBoundingBoxAscent } = canvas.measureText(title.textContent);
  // The upward rotation puts the font ascent to the left of the baseline.
  const leftInk = bounds.right - fontBoundingBoxDescent - actualBoundingBoxAscent;
  // DOM ranges capture the browser's placement of each glyph, including tracking.
  return {
    bottom: firstGlyph.getBoundingClientRect().bottom + firstInk,
    top: lastGlyph.getBoundingClientRect().bottom - lastInk,
    left: Number.isFinite(leftInk) ? leftInk : bounds.left,
  };
}

function fit() {
  frame = undefined;
  if (!title) return;
  title.style.removeProperty('--wordmark-fit-size');
  title.style.removeProperty('--wordmark-fit-x');
  title.style.removeProperty('--wordmark-fit-y');
  const style = getComputedStyle(title);
  if (style.writingMode !== 'vertical-rl') return;

  const original = inkBounds(style);
  const originalHeight = original.bottom - original.top;
  const gutter = innerHeight - original.bottom;
  const available = original.bottom - gutter;
  if (!(originalHeight > 0 && available > 0)) return;

  let fontSize = Number.parseFloat(style.fontSize) * available / originalHeight;
  let measured;
  for (let pass = 0; pass < 2; pass++) {
    title.style.setProperty('--wordmark-fit-size', `${fontSize}px`);
    measured = inkBounds(getComputedStyle(title));
    const height = measured.bottom - measured.top;
    if (!(height > 0) || Math.abs(available - height) < 0.2) break;
    fontSize *= available / height;
  }
  title.style.setProperty('--wordmark-fit-x', `${gutter - measured.left}px`);
  title.style.setProperty('--wordmark-fit-y', `${original.bottom - measured.bottom}px`);
}

function scheduleFit() {
  if (title && frame === undefined) frame = requestAnimationFrame(fit);
}

export function mountWordmarkFit(view) {
  title = view.querySelector('.wordmark-fit');
  if (!title) return;
  range = document.createRange();
  range.selectNodeContents(title);
  const name = title.firstChild;
  firstGlyph = document.createRange();
  firstGlyph.setStart(name, 0);
  firstGlyph.setEnd(name, 1);
  lastGlyph = document.createRange();
  lastGlyph.setStart(name, name.length - 1);
  lastGlyph.setEnd(name, name.length);
  scheduleFit();
  document.fonts.ready.then(scheduleFit);
}

window.addEventListener('resize', scheduleFit);

import '/contact.js';
import { createBandLabelRenderer, trackBandHover } from '/home.js';
import { mountSelection } from '/selection.js';
import { mountWordmark } from './wordmark.js';

const panel = document.querySelector('.type-lab');
const form = document.querySelector('#lab');
const fields = form.elements;
const testHover = document.querySelector('#test-hover');
const copyStatus = document.querySelector('#copy-status');
const resolvedSize = document.querySelector('#resolved-size');
const numberFields = new Map(Array.from(form.querySelectorAll('[data-range]'), input => [input.dataset.range, input]));
const view = document.querySelector('.home-layout');
mountWordmark(view);
mountSelection(view);
const rainbow = view.querySelector('.rainbow');
const labelLayer = view.querySelector('.rainbow-labels');
const renderBand = createBandLabelRenderer(view);
const bands = new Map(Array.from(rainbow.querySelectorAll('[data-band]'), band => [band.getAttribute('href'), band]));
const options = Array.from(bands, ([href, band]) => new Option(band.getAttribute('aria-label'), href));
options.at(-1).defaultSelected = true;
fields.band.replaceChildren(...options);
panel.open = !matchMedia('(max-width: 44rem)').matches;
const previewParams = new URLSearchParams(location.search);
fields['wordmark-guide'].checked = previewParams.get('guide') === '1';

const centerGuide = document.createElementNS('http://www.w3.org/2000/svg', 'path');
centerGuide.id = 'band-center-guide';
centerGuide.setAttribute('fill', 'none');
centerGuide.setAttribute('stroke', '#fff');
centerGuide.setAttribute('stroke-width', '1.25');
centerGuide.setAttribute('stroke-dasharray', '4 5');
centerGuide.setAttribute('opacity', '0.85');
centerGuide.setAttribute('visibility', 'hidden');

const baselineGuide = document.createElementNS('http://www.w3.org/2000/svg', 'use');
baselineGuide.id = 'type-baseline-guide';
baselineGuide.setAttribute('fill', 'none');
baselineGuide.setAttribute('stroke', '#25221f');
baselineGuide.setAttribute('stroke-width', '1.25');
baselineGuide.setAttribute('opacity', '0.65');
baselineGuide.setAttribute('visibility', 'hidden');
labelLayer.querySelector('defs').after(centerGuide, baselineGuide);

let drawFrame;
let testingHover = false;
let hoveredBand;
let activeLabel;

function readSettings() {
  return {
    wordmarkGuide: fields['wordmark-guide'].checked,
    band: fields.band.value,
    size: Number(fields.size.value),
    tracking: Number(fields.tracking.value),
    weight: Number(fields.weight.value),
    roundness: Number(fields.roundness.value),
    opticalSize: fields['auto-optical'].checked ? 'auto' : Number(fields['optical-size'].value),
    bend: Number(fields.bend.value),
    offset: Number(fields.offset.value),
    showGuide: fields.guide.checked,
    showBaseline: fields.baseline.checked,
  };
}

function draw() {
  drawFrame = undefined;
  const settings = readSettings();
  view.toggleAttribute('data-wordmark-guide', settings.wordmarkGuide);
  const opticalSize = settings.opticalSize === 'auto' ? '' : `, 'opsz' ${settings.opticalSize}`;
  labelLayer.style.setProperty('--band-label-scale', settings.size / 100);
  labelLayer.style.setProperty('--band-label-weight', settings.weight);
  labelLayer.style.setProperty('--band-label-variations', `'ROND' ${settings.roundness}${opticalSize}`);
  labelLayer.style.setProperty('--band-label-tracking', `${settings.tracking}em`);
  centerGuide.setAttribute('visibility', !testingHover && settings.showGuide ? 'visible' : 'hidden');
  baselineGuide.setAttribute('visibility', !testingHover && settings.showBaseline ? 'visible' : 'hidden');
  const band = testingHover ? hoveredBand : bands.get(settings.band);
  const nextLabel = band && renderBand(band, { bend: settings.bend / 100, offset: settings.offset, centerGuide });
  if (nextLabel !== activeLabel) activeLabel?.removeAttribute('data-visible');
  activeLabel = nextLabel;
  if (activeLabel) baselineGuide.setAttribute('href', activeLabel.querySelector('textPath').getAttribute('href'));

  fields['optical-size'].disabled = settings.opticalSize === 'auto';
  numberFields.get('optical-size').disabled = fields['optical-size'].disabled;
  const actualSize = Number.parseFloat(getComputedStyle(activeLabel ?? labelLayer.querySelector('.band-label')).fontSize).toFixed(1);
  resolvedSize.value = `· ${actualSize} px`;
  const readouts = {
    size: `${settings.size}% · ${actualSize} px`,
    tracking: `${settings.tracking.toFixed(3)} em`,
    weight: settings.weight,
    roundness: settings.roundness,
    'optical-size': settings.opticalSize === 'auto' ? 'Auto' : settings.opticalSize,
    bend: `${settings.bend}%`,
    offset: `${settings.offset > 0 ? '+' : ''}${settings.offset} px`,
  };
  for (const [name, value] of Object.entries(readouts)) {
    fields[name].setAttribute('aria-valuetext', value);
    const input = numberFields.get(name);
    if (input !== document.activeElement) input.value = fields[name].value;
  }
}

function scheduleDraw() {
  drawFrame ??= requestAnimationFrame(draw);
}

function setHoverMode(enabled) {
  testingHover = enabled;
  testHover.setAttribute('aria-pressed', enabled);
  scheduleDraw();
}

trackBandHover(rainbow, (band) => {
  hoveredBand = band;
  if (testingHover) scheduleDraw();
});

for (const [name, input] of numberFields) {
  const slider = fields[name];
  input.min = slider.min;
  input.max = slider.max;
  input.step = slider.step || '1';
  input.defaultValue = slider.defaultValue;

  input.addEventListener('input', () => {
    const value = input.valueAsNumber;
    if (value >= Number(slider.min) && value <= Number(slider.max)) slider.value = input.value;
  });

  function commit() {
    if (input.value !== '') slider.value = input.value;
    input.value = slider.value;
    scheduleDraw();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
  });
}

rainbow.addEventListener('click', event => {
  const band = event.target.closest('[data-band]');
  if (!band) return;

  event.preventDefault();
  fields.band.value = band.getAttribute('href');
  setHoverMode(false);
});

testHover.addEventListener('click', () => setHoverMode(!testingHover));
fields.band.addEventListener('change', () => setHoverMode(false));
form.addEventListener('input', scheduleDraw);
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('reset', () => {
  copyStatus.textContent = '';
  scheduleDraw();
});

document.querySelector('#copy-settings').addEventListener('click', async () => {
  try {
    const viewport = { width: innerWidth, height: innerHeight };
    await navigator.clipboard.writeText(JSON.stringify({ viewport, ...readSettings() }, null, 2));
    copyStatus.textContent = 'Settings copied';
  } catch {
    copyStatus.textContent = 'Couldn’t copy settings';
  }
});

new ResizeObserver(scheduleDraw).observe(rainbow);
document.fonts.ready.then(scheduleDraw);
scheduleDraw();

import { ZZFX, zzfx } from '/vendor/zzfx/ZzFX.js';

// The first note in each phrase is also the band's entry note. All pitches are relative to C4.
const navigationPhrases = {
  '/': [7, 4, 0],
  '/about/': [0, 4, 7],
  '/context/': [2, 9, 5],
  '/favs/': [4, 7, 12],
  '/technology/': [5, 12, 9],
  '/tools/': [7, 11, 14],
  '/community/': [9, 12, 16],
  '/stuff-ive-made/': [11, 14, 12],
};
const bandHoldDelay = 145;
const heldToneLevel = 0.023;
const context = ZZFX.audioContext;
const navigationSamples = new Map();
let heartHoverSamples;
let heartClickSamples;
let mountedView;
let mountedControls;
let soundedLink;
let bandHold;
let navigationVoice;
let navigationRequest = 0;

function frequencyFor(note) {
  return 261.6256 * 2 ** (note / 12);
}

function playLinkNote(link, note, volume) {
  if (context.state !== 'running' || soundedLink === link) return;

  zzfx(volume, 0, frequencyFor(note), 0.015, 0.045, 0.18);
  soundedLink = link;
}

function mixNotes(notes) {
  const tracks = notes.map(({ note, at = 0, volume, attack = 0.007, sustain = 0.014, release = 0.075 }) => ({
    offset: Math.round(at * ZZFX.sampleRate),
    samples: ZZFX.buildSamples(volume, 0, frequencyFor(note), attack, sustain, release),
  }));
  const mix = new Float32Array(Math.max(...tracks.map(({ offset, samples }) => offset + samples.length)));
  for (const { offset, samples } of tracks) {
    for (let i = 0; i < samples.length; i++) mix[offset + i] += samples[i];
  }
  return mix;
}

export async function playNavigationChime(link) {
  const route = link.getAttribute('href');
  const notes = navigationPhrases[route];
  if (!notes) return;

  releaseBandHold();
  const request = ++navigationRequest;
  const clickedAt = performance.now();
  if (context.state !== 'running') await unlockAudio();
  if (context.state !== 'running' || request !== navigationRequest || performance.now() - clickedAt > 230) return;

  if (!navigationSamples.has(route)) {
    const [first, second, third] = notes;
    navigationSamples.set(route, mixNotes([
      { note: first, volume: 0.14, attack: 0.005, sustain: 0.012, release: 0.052 },
      { note: second, at: 0.062, volume: 0.095 },
      { note: third, at: 0.125, volume: 0.10, release: 0.085 },
    ]));
  }

  if (navigationVoice) {
    const now = context.currentTime;
    navigationVoice.gainNode.gain.setTargetAtTime(0, now, 0.008);
    navigationVoice.stop(now + 0.04);
  }
  const voice = ZZFX.playSamples([navigationSamples.get(route)]);
  navigationVoice = voice;
  voice.onended = () => {
    if (navigationVoice === voice) navigationVoice = undefined;
  };
}

function startBandSwell(hold) {
  if (hold !== bandHold || hold.voice || context.state !== 'running') return;

  const now = context.currentTime;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.setTargetAtTime(1, now, 0.11);
  envelope.connect(context.destination);

  const tone = context.createOscillator();
  const harmonic = context.createOscillator();
  const body = context.createGain();
  const brightness = context.createGain();
  tone.frequency.value = frequencyFor(hold.note);
  harmonic.frequency.value = tone.frequency.value * 2;
  body.gain.value = heldToneLevel;
  brightness.gain.value = 0;
  tone.connect(body).connect(envelope);
  harmonic.connect(brightness).connect(envelope);
  tone.onended = () => {
    tone.disconnect();
    harmonic.disconnect();
    body.disconnect();
    brightness.disconnect();
    envelope.disconnect();
  };
  hold.voice = { tone, harmonic, body, brightness, envelope };
  tone.start(now);
  harmonic.start(now);
}

function releaseBandHold() {
  const hold = bandHold;
  bandHold = undefined;
  if (!hold) return;

  window.clearTimeout(hold.timer);
  if (!hold.voice) return;

  const { tone, harmonic, envelope } = hold.voice;
  const now = context.currentTime;
  envelope.gain.setTargetAtTime(0, now, 0.028);
  tone.stop(now + 0.17);
  harmonic.stop(now + 0.17);
}

function holdBand(band, note, event) {
  releaseBandHold();
  const hold = { band, note, pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  bandHold = hold;
  hold.timer = window.setTimeout(() => {
    hold.timer = undefined;
    startBandSwell(hold);
  }, bandHoldDelay);
}

function shapeBandSwell(band, event) {
  const hold = bandHold;
  if (hold?.band !== band || hold.pointerId !== event.pointerId) return;

  const distance = Math.hypot(event.clientX - hold.x, event.clientY - hold.y);
  const elapsed = Math.max(8, Math.min(event.timeStamp - hold.time, 48));
  hold.x = event.clientX;
  hold.y = event.clientY;
  hold.time = event.timeStamp;
  if (!hold.voice || distance === 0 || context.state !== 'running') return;

  const lift = Math.min(distance / (elapsed * 0.75), 1);
  const now = context.currentTime;
  const { body, brightness } = hold.voice;
  // Each movement replaces the previous return to the resting tone.
  body.gain.cancelScheduledValues(now);
  brightness.gain.cancelScheduledValues(now);
  body.gain.setTargetAtTime(heldToneLevel + lift * 0.016, now, 0.045);
  brightness.gain.setTargetAtTime(lift * 0.004, now, 0.045);
  body.gain.setTargetAtTime(heldToneLevel, now + 0.085, 0.12);
  brightness.gain.setTargetAtTime(0, now + 0.085, 0.12);
}

function playHeartHover(event) {
  if (event.pointerType === 'touch' || context.state !== 'running') return;
  heartHoverSamples ??= mixNotes([
    { note: 19, volume: 0.075, attack: 0.009, sustain: 0.012, release: 0.097 },
    { note: 31, volume: 0.018, attack: 0.009, sustain: 0.004, release: 0.043 },
  ]);
  ZZFX.playSamples([heartHoverSamples]);
}

async function playHeartClick() {
  const clickedAt = performance.now();
  if (context.state !== 'running') await unlockAudio();
  if (context.state !== 'running' || performance.now() - clickedAt > 230) return;

  heartClickSamples ??= mixNotes([
    { note: 0, volume: 0.17, attack: 0.005, release: 0.095 },
    { note: 7, at: 0.085, volume: 0.11, release: 0.11 },
  ]);
  ZZFX.playSamples([heartClickSamples]);
}

async function unlockAudio() {
  if (context.state === 'running') return;
  try {
    await context.resume();
    if (bandHold && bandHold.timer === undefined) startBandSwell(bandHold);
  } catch {
    // Another gesture can resume audio if this one was blocked.
  }
}

for (const eventName of ['pointerdown', 'pointerup', 'click', 'keydown']) {
  window.addEventListener(eventName, unlockAudio, { capture: true });
}

if (navigator.userActivation?.hasBeenActive) unlockAudio();
window.addEventListener('blur', releaseBandHold);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseBandHold();
});

export function mountSound(view) {
  if (mountedView === view) return;

  mountedControls?.abort();
  mountedView = view;
  mountedControls = new AbortController();
  soundedLink = undefined;
  releaseBandHold();

  const { signal } = mountedControls;
  const heart = view.querySelector('.contact-heart');
  heart?.addEventListener('pointerenter', playHeartHover, { signal });
  heart?.addEventListener('click', () => { playHeartClick().catch(() => {}); }, { signal });

  for (const link of view.querySelectorAll('[data-band], .section-index a, .home-link')) {
    const route = link.getAttribute('href');
    const notes = navigationPhrases[route];
    if (!notes) continue;
    const isHomeLink = route === '/';
    const note = isHomeLink ? notes[0] - 12 : notes[0];
    const volume = isHomeLink ? 0.105 : 0.17;
    const isHomeBand = link.hasAttribute('data-band');

    function clearNote() {
      if (soundedLink === link) soundedLink = undefined;
    }

    link.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      playLinkNote(link, note, volume);
      if (isHomeBand) holdBand(link, note, event);
    }, { signal });

    if (isHomeBand) {
      link.addEventListener('pointermove', (event) => shapeBandSwell(link, event), { signal });
    }
    for (const eventName of ['pointerleave', 'pointercancel']) {
      link.addEventListener(eventName, (event) => {
        clearNote();
        if (bandHold?.band === link && bandHold.pointerId === event.pointerId) releaseBandHold();
      }, { signal });
    }

    link.addEventListener('focus', () => {
      if (link.matches(':focus-visible')) playLinkNote(link, note, volume);
    }, { signal });

    link.addEventListener('blur', clearNote, { signal });
  }
}

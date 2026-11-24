import './contact.js';
import { morphBand, mountBandLabels } from './home.js';
import { clearSelection, mountSelection } from './selection.js';
import { crossfadeSection, positionSectionIndicator, revealSection } from './section.js';
import { mountWordmarkFit } from './wordmark-fit.js';

const viewSelector = '.home-layout, .section-frame';
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const description = document.querySelector('meta[name="description"]');
let view = document.querySelector(viewSelector);
let path = location.pathname;
let entry = history.state?.rainbowEntry ?? crypto.randomUUID();
let pending;
let sound;

const routes = new Set(['/', ...Array.from(view.querySelectorAll('[data-band], .section-index a'), (link) => linkUrl(link).pathname)]);
const scrollPositions = new Map();
const pages = new Map();

function readPage(document) {
  return {
    view: document.querySelector(viewSelector).cloneNode(true),
    title: document.title,
    description: document.querySelector('meta[name="description"]').content,
    bodyClass: document.body.className,
    color: document.documentElement.style.getPropertyValue('--section'),
  };
}

pages.set(path, readPage(document));
history.replaceState({ ...history.state, rainbowEntry: entry }, '');
history.scrollRestoration = 'manual';

async function loadPage(url) {
  if (pages.has(url.pathname)) return pages.get(url.pathname);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url.pathname}`);
  const next = readPage(new DOMParser().parseFromString(await response.text(), 'text/html'));
  pages.set(url.pathname, next);
  return next;
}

function mountView() {
  mountBandLabels(view);
  mountWordmarkFit(view);
  mountSelection(view);
  sound?.mountSound(view);
}

function linkUrl(link) {
  return new URL(link.getAttribute('href'), location.href);
}

function findLink(selector, destination) {
  return Array.from(view.querySelectorAll(selector)).find((link) => linkUrl(link).pathname === destination);
}

function outgoingMotion(destination) {
  if (reducedMotion.matches) return;

  if (path === '/') {
    const band = findLink('[data-band]', destination);
    if (band) return morphBand(band);
  } else if (destination !== '/' && root.animate) {
    const destinationLink = findLink('.section-index a', destination);
    if (destinationLink) return crossfadeSection(view, destinationLink);
  }
}

function displayPage(next, destination) {
  const nextView = document.importNode(next.view, true);
  if (path !== '/' && destination !== '/') {
    // Keep the actual header and strip mounted while swapping section content.
    view.querySelector('.section-main').replaceWith(nextView.querySelector('.section-main'));
    view.querySelector('[aria-current="page"]')?.removeAttribute('aria-current');
    const destinationLink = findLink('.section-index a', destination);
    destinationLink?.setAttribute('aria-current', 'page');
    positionSectionIndicator(destinationLink);
  } else {
    view.replaceWith(nextView);
    view = nextView;
  }

  document.body.className = next.bodyClass;
  root.style.setProperty('--section', next.color);
  document.title = next.title;
  description.content = next.description;
  document.querySelector('.copy-toast').textContent = '';
}

async function navigate(url, historyEntry) {
  pending?.motion?.cancel();
  if (url.pathname === path) {
    positionSectionIndicator(view.querySelector('.section-index a[aria-current="page"]'));
    pending = undefined;
    return;
  }

  scrollPositions.set(entry, window.scrollY);
  clearSelection();
  const job = { motion: outgoingMotion(url.pathname) };
  if (!job.motion) positionSectionIndicator(view.querySelector('.section-index a[aria-current="page"]'));
  pending = job;

  try {
    const [next] = await Promise.all([loadPage(url), job.motion?.finished]);
    if (pending !== job) return;

    const previousPath = path;
    entry = historyEntry ?? crypto.randomUUID();
    if (!historyEntry) history.pushState({ rainbowEntry: entry }, '', url);

    displayPage(next, url.pathname);
    path = url.pathname;
    window.scrollTo(0, scrollPositions.get(entry) ?? 0);
    const heading = view.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    mountView();

    job.motion?.cancel();
    job.motion = undefined;

    if (!reducedMotion.matches && previousPath !== '/') {
      if (path === '/') {
        const band = findLink('[data-band]', previousPath);
        if (band) job.motion = morphBand(band, true);
      } else if (root.animate) {
        revealSection(view);
      }
    }

    await job.motion?.finished;
    if (pending === job) {
      job.motion?.cancel();
      pending = undefined;
    }
  } catch {
    if (pending === job) {
      job.motion?.cancel();
      window.location.assign(url);
    }
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-band], .home-link, .section-index a');
  if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const url = linkUrl(link);
  if (url.origin !== location.origin || !routes.has(url.pathname)) return;
  event.preventDefault();
  if (url.pathname !== path) sound?.playNavigationChime(link).catch(() => {});
  navigate(url);
});

window.addEventListener('popstate', (event) => {
  if (event.state?.rainbowEntry && routes.has(location.pathname)) {
    navigate(new URL(location.href), event.state.rainbowEntry);
  }
});

mountView();
import('./sound.js').then((module) => {
  sound = module;
  sound.mountSound(view);
}).catch(() => {
  // An unavailable audio engine should not interrupt navigation.
});

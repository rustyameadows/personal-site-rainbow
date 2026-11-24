export function positionSectionIndicator(link) {
  if (!link) return;
  const strip = link.closest('.section-index');
  const index = Array.from(strip.querySelectorAll('a')).indexOf(link);
  strip.style.setProperty('--active-section', index);
}

export function crossfadeSection(view, destinationLink) {
  const root = document.documentElement;
  const content = view.querySelector('.section-main');
  const stripStyle = getComputedStyle(destinationLink.closest('.section-index'));
  const color = destinationLink.style.getPropertyValue('--swatch');
  const timing = {
    duration: Number(stripStyle.getPropertyValue('--section-crossfade-ms')),
    easing: stripStyle.getPropertyValue('--section-crossfade-easing').trim(),
    fill: 'forwards',
  };
  const background = root.animate([{ backgroundColor: getComputedStyle(root).backgroundColor }, { backgroundColor: color }], timing);
  const fade = content.animate([{ opacity: 1 }, { opacity: 0.88, offset: 0.42 }, { opacity: 0 }], timing);
  positionSectionIndicator(destinationLink);

  return {
    finished: background.finished.catch(() => {}),
    cancel() {
      background.cancel();
      fade.cancel();
    },
  };
}

export function revealSection(view) {
  view.querySelector('.section-main').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, easing: 'ease-out' });
}

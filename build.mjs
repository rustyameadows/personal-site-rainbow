import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { archive } from './src/archive.mjs';
import { objects, projects } from './src/project-images.mjs';
import { sections } from './src/sections.mjs';

const siteName = 'Rusty Meadows';
const contactEmail = 'rusty@rustymeadows.com';
const [stylesheet, labControls, labStylesheet, labScript, navigationScript, contactHeartSvg] = await Promise.all([
  readFile('src/styles.css'),
  readFile('src/homepage-lab.html', 'utf8'),
  readFile('public/homepage-lab/lab.css'),
  readFile('public/homepage-lab/lab.js'),
  readFile('src/navigation.js'),
  readFile('public/images/contact-heart.svg', 'utf8'),
]);
const contactHeart = `<button class="contact-heart" type="button" data-copy-email="${contactEmail}" aria-label="Contact" aria-description="Copies the email address">
      ${contactHeartSvg.trim()}
      <span class="contact-heart-label" aria-hidden="true">Contact</span>
    </button>`;

function assetVersion(contents) {
  return createHash('sha256').update(contents).digest('hex').slice(0, 12);
}

const stylesheetVersion = assetVersion(stylesheet);
const labStylesheetVersion = assetVersion(labStylesheet);
const labScriptVersion = assetVersion(labScript);
const navigationVersion = assetVersion(navigationScript);

// Outer edge first. Each band is the region between two neighboring outlines.
const outlines = [
  'M 3 650 C 40 423 162 173 340 79 C 495 -3 635 0 760 49 C 963 128 1077 355 1097 650 Z',
  'M 82 650 C 119 455 218 235 371 149 C 506 74 633 70 750 120 C 915 191 1003 392 1017 650 Z',
  'M 157 650 C 189 485 273 307 408 220 C 532 141 634 146 738 190 C 876 249 934 433 940 650 Z',
  'M 232 650 C 262 516 337 369 445 296 C 548 226 641 217 727 260 C 838 315 868 471 867 650 Z',
  'M 303 650 C 329 532 391 426 483 360 C 568 299 640 291 715 328 C 799 369 803 511 802 650 Z',
  'M 370 650 C 387 561 444 473 520 420 C 576 381 642 362 700 395 C 759 428 766 538 765 650 Z',
  'M 436 650 C 449 578 491 520 552 473 C 601 435 652 427 698 462 C 739 493 727 584 726 650 Z',
  'M 499 650 C 507 597 538 552 580 525 C 618 500 653 496 675 524 C 694 549 687 603 687 650 Z',
];

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function document(title, description, className, content, { sectionColor, lab = false } = {}) {
  const theme = sectionColor ? ` style="--section: ${sectionColor}"` : '';
  const script = lab ? `/homepage-lab/lab.js?v=${labScriptVersion}` : `/navigation.js?v=${navigationVersion}`;
  return `<!doctype html>
<html lang="en"${theme}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="/styles.css?v=${stylesheetVersion}">
${lab ? `  <link rel="stylesheet" href="/homepage-lab/lab.css?v=${labStylesheetVersion}">` : ''}
</head>
<body class="${className}">
${content}
${lab ? labControls : ''}
<div class="copy-toast" role="status"></div>
<script src="${script}" type="module"></script>
</body>
</html>
`;
}

function sectionIndex(activeSection) {
  const links = sections.map((section) => {
    const current = section === activeSection ? ' aria-current="page"' : '';
    return `    <li><a href="/${section.slug}/" style="--swatch: ${section.color}"${current}><span class="swatch" aria-hidden="true"></span><span class="section-name">${escapeHtml(section.title)}</span></a></li>`;
  });

  return `<nav class="section-index" aria-label="Sections" style="--active-section: ${sections.indexOf(activeSection)}; --section-count: ${sections.length}">
  <ul>
${links.join('\n')}
  </ul>
  <span class="section-indicator" aria-hidden="true"></span>
</nav>`;
}

function home({ lab = false } = {}) {
  // The rings have no overlapping hit areas, so the DOM can follow the inner-to-outer order.
  const bands = sections.map((section, index) => {
    const edge = sections.length - 1 - index;
    return `      <a href="/${section.slug}/" aria-label="${escapeHtml(section.title)}" data-band="${section.slug}" style="--band: ${section.color}; --band-hover: ${section.hoverColor}">
        <path fill-rule="evenodd" d="${outlines[edge]} ${outlines[edge + 1]}"></path>
      </a>`;
  });
  const labelPaths = sections.map(({ slug }) => `<path id="band-label-curve-${slug}"></path>`);
  const labels = sections.map(({ slug }) => `      <text class="band-label" data-band-label="${slug}" text-anchor="middle" dominant-baseline="alphabetic"><textPath href="#band-label-curve-${slug}"></textPath></text>`);

  return document(lab ? `Rainbow type lab · ${siteName}` : siteName, 'The personal site of Rusty Meadows.', 'home', `
<main class="home-layout">
  <h1 class="wordmark${lab ? '' : ' wordmark-fit'}" style="--wordmark-selection: ${sections[0].color}">${siteName}</h1>
${lab ? `  <svg class="wordmark-curve" aria-hidden="true" focusable="false" hidden>
    <defs><path id="wordmark-curve-path"></path></defs>
    <path class="wordmark-guide wordmark-projection"></path>
    <g>
      <path class="wordmark-guide wordmark-baseline"></path>
      <text style="--wordmark-selection: ${sections[0].color}"><textPath href="#wordmark-curve-path" spacing="exact">${siteName}</textPath></text>
    </g>
  </svg>
` : ''}  <div class="site-actions">
    ${contactHeart}
  </div>
  <div class="rainbow-stage">
    <svg class="rainbow" viewBox="0 0 1100 650" preserveAspectRatio="none" role="group" aria-label="Explore the seven sections" tabindex="-1">
${bands.join('\n')}
    </svg>
    <svg class="rainbow-labels" aria-hidden="true" focusable="false">
      <defs>${labelPaths.join('')}</defs>
${labels.join('\n')}
    </svg>
  </div>
</main>`, { lab });
}

function renderTopics(topics) {
  return topics ? `<ul class="topics">${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('')}</ul>` : '';
}

function renderProse(text, role = '') {
  return text ? `<p class="archive-prose${role ? ` ${role}` : ''}">${escapeHtml(text)}</p>` : '';
}

function renderArchiveLead({ heading, intro, leadParagraphs = [], leadMedia, quotes = [] }) {
  return `<div class="archive-lead">
    <div class="archive-lead-copy">
      <h2 id="archive-heading">${escapeHtml(heading)}</h2>
      ${renderProse(intro, 'archive-intro')}
      ${leadParagraphs.map((paragraph) => renderProse(paragraph)).join('\n')}
    </div>
    ${leadMedia ? renderDraftMedia(leadMedia) : ''}
    ${quotes.length ? `<ul class="archive-quote-list" role="list">
${quotes.map((quote) => `      <li>${renderDraftQuote(quote)}</li>`).join('\n')}
    </ul>` : ''}
  </div>`;
}

function renderProject(project, index) {
  const title = escapeHtml(project.title);
  const visual = project.image
    ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.alt)}" width="1300" height="800" decoding="async">`
    : `<div class="draft-image" data-tone="${escapeHtml(project.tone)}" aria-hidden="true"></div>`;
  const tile = `${visual}
    <h3>${title}</h3>${renderProse(project.category, 'archive-caption')}
    ${renderProse(project.detail)}`;
  return `<li${index < 2 ? ' class="project-lead"' : ''}>${project.href ? `<a href="${escapeHtml(project.href)}">${tile}</a>` : tile}</li>`;
}

function renderCommunity({ events, entries }) {
  return `<div class="community-events">
${events.map(({ project, when, description, href, linkText }) => `
    <article class="community-event">
      <header class="community-event-heading">
        <h3>${escapeHtml(project.title)}</h3>
        <p class="community-event-meta">${escapeHtml(when)}</p>
      </header>
      <img src="${project.image}" alt="${escapeHtml(project.alt)}" width="1300" height="800" decoding="async">
      <div class="community-event-copy">
        ${renderProse(description)}
        <a href="${escapeHtml(href)}">${escapeHtml(linkText)}</a>
      </div>
    </article>`).join('')}
  </div>
  <section class="community-earlier" aria-labelledby="earlier-community-work">
    <h2 id="earlier-community-work">Earlier communities and events</h2>
    ${renderEntries(entries, 'archive-entries')}
  </section>`;
}

function renderDraftMedia({ image, alt, caption, tone = 'ink' }) {
  const visual = image
    ? `<img class="draft-image" src="${escapeHtml(image)}" alt="${escapeHtml(alt ?? '')}" decoding="async">`
    : `<div class="draft-image" data-tone="${escapeHtml(tone)}" aria-hidden="true"></div>`;

  return `<figure class="draft-media">
    ${visual}
    ${caption ? `<figcaption class="archive-prose archive-caption">${escapeHtml(caption)}</figcaption>` : ''}
  </figure>`;
}

function renderEntries(entries, className) {
  return `<ul class="${className}">
${entries.map(({ title, description, label, topics, media }) => `
    <li class="draft-entry">
      ${media ? renderDraftMedia(media) : ''}
      <div class="draft-entry-copy">
        <h3>${escapeHtml(title)}</h3>
        ${label ? `<p class="draft-entry-label">${escapeHtml(label)}</p>` : ''}
        ${renderProse(description)}
        ${renderTopics(topics)}
      </div>
    </li>`).join('')}
  </ul>`;
}

function renderDraftQuote({ text, author }) {
  return `<figure class="draft-quote">
    <blockquote><p>“${escapeHtml(text)}”</p></blockquote>
    <figcaption>
      <cite>${escapeHtml(author)}</cite>
    </figcaption>
  </figure>`;
}

function renderDraftBlock({ heading, intro, paragraphs = [], layout, entries, media }) {
  const layoutClass = layout ? ` draft-${escapeHtml(layout)}` : '';

  return `<section class="draft-block${layoutClass}">
    <h2>${escapeHtml(heading)}</h2>
    ${renderProse(intro, 'draft-block-intro')}
    <div class="draft-block-body">
      <div class="draft-block-copy">
        ${paragraphs.map((paragraph) => renderProse(paragraph)).join('\n')}
        ${entries?.length ? renderEntries(entries, 'draft-list') : ''}
      </div>
      ${media ? renderDraftMedia(media) : ''}
    </div>
  </section>`;
}

function renderArchive(section) {
  const collection = archive[section.slug];
  const { blocks, entries } = collection;
  let content = '';
  if (blocks) {
    content = blocks.map(renderDraftBlock).join('\n');
  } else if (section.slug === 'stuff-ive-made') {
    content = `<ul class="project-grid">${projects.map(renderProject).join('')}</ul>
    <section class="project-objects" aria-labelledby="project-objects-heading">
      <h2 id="project-objects-heading">Objects and packaging</h2>
      <ul class="project-grid">${objects.map(renderProject).join('')}</ul>
    </section>`;
  } else if (section.slug === 'community') {
    content = renderCommunity(collection);
  } else if (entries?.length) {
    content = renderEntries(entries, 'archive-entries');
  }

  return `<section class="archive-content archive-${section.slug}" aria-labelledby="archive-heading">
    <div class="archive-inner">
      ${renderArchiveLead(collection)}
      ${content}
    </div>
  </section>`;
}

function sectionPage(section) {
  return document(`${section.title} · ${siteName}`, section.description, 'section-page', `
<div class="section-frame">
  <header class="section-header">
    <a class="home-link" href="/">${siteName}</a>
    ${sectionIndex(section)}
    <div class="site-actions">${contactHeart}</div>
  </header>
  <main class="section-main">
    <div class="section-intro">
      <h1>${escapeHtml(section.title)}</h1>
      <p>${escapeHtml(section.description)}</p>
    </div>
    ${renderArchive(section)}
  </main>
</div>`, { sectionColor: section.color });
}

await mkdir('dist', { recursive: true });
await mkdir('dist/vendor/zzfx', { recursive: true });
await Promise.all([
  cp('public', 'dist', { recursive: true }),
  writeFile('dist/styles.css', stylesheet),
  cp('src/home.js', 'dist/home.js'),
  cp('src/contact.js', 'dist/contact.js'),
  cp('src/selection.js', 'dist/selection.js'),
  cp('src/wordmark-fit.js', 'dist/wordmark-fit.js'),
  cp('src/sound.js', 'dist/sound.js'),
  cp('src/section.js', 'dist/section.js'),
  writeFile('dist/navigation.js', navigationScript),
  cp('node_modules/zzfx/ZzFX.js', 'dist/vendor/zzfx/ZzFX.js'),
  cp('node_modules/zzfx/LICENSE', 'dist/vendor/zzfx/LICENSE'),
  writeFile('dist/index.html', home()),
  ...sections.map(async (section) => {
    const directory = `dist/${section.slug}`;
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/index.html`, sectionPage(section));
  }),
]);
await writeFile('dist/homepage-lab/index.html', home({ lab: true }));

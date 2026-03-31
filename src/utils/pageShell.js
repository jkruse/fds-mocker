/**
 * Wraps a raw HTML snippet in a full DKFDS page document.
 *
 * The iframe uses srcdoc, so relative URLs won't resolve against the app origin.
 * We therefore inject the CSS and JS as inline <style> / <script> tags fetched
 * once at app startup and cached in module-level variables.
 */

const cachedThemeCss = { virkdk: null, borgerdk: null };
let cachedJs = null;
let cachedIcons = null;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

/**
 * Pre-fetches DKFDS assets so buildShell() can work synchronously afterwards.
 * Call this once when the app mounts.
 */
export async function preloadDkfdsAssets(base) {
  const virkkUrl = `${base}dkfds/css/dkfds-virkdk.min.css`;
  const borgerUrl = `${base}dkfds/css/dkfds-borgerdk.min.css`;
  const jsUrl = `${base}dkfds/js/dkfds.min.js`;
  const iconsUrl = `${base}dkfds/img/all-svg-icons.svg`;

  const [rawVirkk, rawBorger, rawJs, rawIcons] = await Promise.all([
    fetchText(virkkUrl),
    fetchText(borgerUrl),
    fetchText(jsUrl),
    fetchText(iconsUrl),
  ]);

  // Rewrite relative url() references in the CSS so they resolve correctly inside srcdoc iframes.
  // The CSS lives at <base>dkfds/css/, so "../img/" → absolute <base>dkfds/img/
  const imgBase = `${location.origin}${base}dkfds/img/`;
  const rewrite = (css) => css.replace(/url\((['"]?)\.\.\/img\//g, `url($1${imgBase}`);
  cachedThemeCss.virkdk = rewrite(rawVirkk);
  cachedThemeCss.borgerdk = rewrite(rawBorger);

  cachedJs = rawJs;
  cachedIcons = rawIcons.replace(/<\?xml[^?]*\?>\s*/i, '').replace(/<!DOCTYPE[^>]*>\s*/i, '');
}

/**
 * Returns a complete HTML document string with the user snippet injected.
 * Requires preloadDkfdsAssets() to have been called first.
 * @param {string} snippet - Raw HTML to render inside the page body.
 * @param {'virkdk'|'borgerdk'} theme - Which DKFDS theme to apply.
 */
export function buildShell(snippet, theme = 'virkdk') {
  const css = cachedThemeCss[theme] ?? cachedThemeCss.virkdk ?? '/* DKFDS CSS not yet loaded */';
  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
${css}
  </style>
</head>
<body>
  ${cachedIcons ? `<div class="hide-base-svg">${cachedIcons}</div>` : ''}
  <div class="container page-container" style="padding: 2rem;">
${snippet}
  </div>
  <script>
${cachedJs ?? '/* DKFDS JS not yet loaded */'}
  <\/script>
  <script>DKFDS.init()<\/script>
</body>
</html>`;
}

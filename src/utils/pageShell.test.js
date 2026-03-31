import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Because pageShell.js stores its assets in module-level variables, each test
 * resets the module registry so it gets a clean slate via dynamic import.
 */
describe('pageShell', () => {
  let buildShell;
  let preloadDkfdsAssets;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./pageShell.js');
    buildShell = mod.buildShell;
    preloadDkfdsAssets = mod.preloadDkfdsAssets;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // buildShell — before assets are loaded
  // ---------------------------------------------------------------------------
  describe('buildShell (assets not yet loaded)', () => {
    it('returns a string starting with <!DOCTYPE html>', () => {
      expect(buildShell('<p>test</p>')).toMatch(/^<!DOCTYPE html>/);
    });

    it('injects the snippet into the body', () => {
      expect(buildShell('<p>my snippet</p>')).toContain('<p>my snippet</p>');
    });

    it('includes DKFDS.init() call', () => {
      expect(buildShell('')).toContain('DKFDS.init()');
    });

    it('shows CSS placeholder when assets not loaded', () => {
      expect(buildShell('')).toContain('/* DKFDS CSS not yet loaded */');
    });

    it('shows JS placeholder when assets not loaded', () => {
      expect(buildShell('')).toContain('/* DKFDS JS not yet loaded */');
    });

    it('defaults to virkdk theme even when nothing is cached', () => {
      // Both theme params should fall back to the same placeholder
      const defaultResult = buildShell('');
      const explicitResult = buildShell('', 'virkdk');
      expect(defaultResult).toBe(explicitResult);
    });
  });

  // ---------------------------------------------------------------------------
  // Helpers shared by preloadDkfdsAssets tests
  // ---------------------------------------------------------------------------
  function makeFetchMock({
    virkCss = '.virkdk-default{}',
    borgerCss = '.borgerdk-default{}',
    js = 'var DKFDS={}',
    icons = '<svg><symbol id="test-icon"/></svg>',
  } = {}) {
    return vi.fn((url) => {
      let text;
      if (url.includes('dkfds-virkdk')) text = virkCss;
      else if (url.includes('dkfds-borgerdk')) text = borgerCss;
      else if (url.endsWith('.js')) text = js;
      else text = icons;
      return Promise.resolve({ ok: true, text: () => Promise.resolve(text) });
    });
  }

  // ---------------------------------------------------------------------------
  // preloadDkfdsAssets
  // ---------------------------------------------------------------------------
  describe('preloadDkfdsAssets', () => {
    it('fetches both theme CSS files, the JS bundle, and the SVG icons', async () => {
      const fetchMock = makeFetchMock();
      vi.stubGlobal('fetch', fetchMock);

      await preloadDkfdsAssets('/fds-mocker/');

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('dkfds-virkdk'));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('dkfds-borgerdk'));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('.js'));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('all-svg-icons'));
    });

    it('uses base path to construct asset URLs', async () => {
      const fetchMock = makeFetchMock();
      vi.stubGlobal('fetch', fetchMock);

      await preloadDkfdsAssets('/my-app/');

      const calledUrls = fetchMock.mock.calls.map(([url]) => url);
      expect(calledUrls.every((u) => u.startsWith('/my-app/'))).toBe(true);
    });

    it('after preload, buildShell injects virkdk CSS by default', async () => {
      vi.stubGlobal('fetch', makeFetchMock({ virkCss: '.virkdk-marker{}' }));

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('<p/>');

      expect(result).toContain('.virkdk-marker{}');
      expect(result).not.toContain('/* DKFDS CSS not yet loaded */');
    });

    it('after preload, buildShell with theme="borgerdk" injects borgerdk CSS', async () => {
      vi.stubGlobal('fetch', makeFetchMock({ borgerCss: '.borgerdk-marker{}' }));

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('<p/>', 'borgerdk');

      expect(result).toContain('.borgerdk-marker{}');
    });

    it('after preload, virkdk and borgerdk CSS are independent', async () => {
      vi.stubGlobal('fetch', makeFetchMock({ virkCss: '.virkdk-unique{}', borgerCss: '.borgerdk-unique{}' }));

      await preloadDkfdsAssets('/fds-mocker/');

      expect(buildShell('', 'virkdk')).toContain('.virkdk-unique{}');
      expect(buildShell('', 'virkdk')).not.toContain('.borgerdk-unique{}');
      expect(buildShell('', 'borgerdk')).toContain('.borgerdk-unique{}');
      expect(buildShell('', 'borgerdk')).not.toContain('.virkdk-unique{}');
    });

    it('after preload, buildShell injects the JS bundle', async () => {
      vi.stubGlobal('fetch', makeFetchMock({ js: 'var DKFDS_LOADED=true' }));

      await preloadDkfdsAssets('/fds-mocker/');

      expect(buildShell('')).toContain('var DKFDS_LOADED=true');
      expect(buildShell('')).not.toContain('/* DKFDS JS not yet loaded */');
    });

    it('rewrites relative ../img/ URLs in CSS to absolute paths', async () => {
      const css = "background: url('../img/logo.png') url('../img/icon.svg')";
      vi.stubGlobal('fetch', makeFetchMock({ virkCss: css }));

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('', 'virkdk');

      // Relative references must be gone; the absolute path must be present
      expect(result).not.toContain('../img/');
      expect(result).toContain('/fds-mocker/dkfds/img/logo.png');
      expect(result).toContain('/fds-mocker/dkfds/img/icon.svg');
    });

    it('preserves quoted url() references after rewriting', async () => {
      vi.stubGlobal(
        'fetch',
        makeFetchMock({ virkCss: `url("../img/a.woff2") url('../img/b.woff2')` }),
      );

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('', 'virkdk');

      expect(result).not.toContain('../img/');
      expect(result).toContain('/fds-mocker/dkfds/img/a.woff2');
      expect(result).toContain('/fds-mocker/dkfds/img/b.woff2');
    });

    it('strips the XML declaration from SVG icons', async () => {
      const icons = '<?xml version="1.0" encoding="utf-8"?>\n<svg><symbol id="i"/></svg>';
      vi.stubGlobal('fetch', makeFetchMock({ icons }));

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('');

      expect(result).not.toContain('<?xml');
      expect(result).toContain('<symbol id="i"/>');
    });

    it('strips the DOCTYPE declaration from SVG icons', async () => {
      const icons = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "">\n<svg><symbol id="i"/></svg>';
      vi.stubGlobal('fetch', makeFetchMock({ icons }));

      await preloadDkfdsAssets('/fds-mocker/');
      const result = buildShell('');

      // The SVG DOCTYPE should be removed; the outer HTML DOCTYPE is expected
      expect(result).not.toContain('<!DOCTYPE svg');
      expect(result).toContain('<symbol id="i"/>');
    });

    it('throws when a fetch returns a non-OK response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );

      await expect(preloadDkfdsAssets('/fds-mocker/')).rejects.toThrow('404');
    });

    it('throws when fetch rejects (network error)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      );

      await expect(preloadDkfdsAssets('/fds-mocker/')).rejects.toThrow('Failed to fetch');
    });
  });
});

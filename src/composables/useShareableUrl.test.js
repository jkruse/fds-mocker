import { describe, it, expect, vi, afterEach } from 'vitest';
import { encode, decode } from './useShareableUrl.js';

describe('useShareableUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // encode + decode round-trip
  // ---------------------------------------------------------------------------
  describe('encode / decode round-trip', () => {
    it('recovers content and theme after a round-trip', async () => {
      const content = '<button class="button button-primary">Primær knap</button>';
      const theme = 'virkdk';
      const fragment = await encode(content, theme);
      const result = await decode(fragment);
      expect(result).toEqual({ content, theme });
    });

    it('recovers borgerdk theme', async () => {
      const fragment = await encode('<p>test</p>', 'borgerdk');
      const result = await decode(fragment);
      expect(result?.theme).toBe('borgerdk');
    });

    it('handles multi-line HTML content', async () => {
      const content = '<div class="form-group">\n  <label>Navn</label>\n  <input type="text">\n</div>';
      const fragment = await encode(content, 'virkdk');
      const result = await decode(fragment);
      expect(result?.content).toBe(content);
    });

    it('handles content with special characters', async () => {
      const content = '<p>Indhold med æøå og "citationstegn" & <tegn></p>';
      const fragment = await encode(content, 'virkdk');
      const result = await decode(fragment);
      expect(result?.content).toBe(content);
    });

    it('handles empty content', async () => {
      const fragment = await encode('', 'virkdk');
      const result = await decode(fragment);
      expect(result).toEqual({ content: '', theme: 'virkdk' });
    });

    it('accepts a hash with a leading "#"', async () => {
      const fragment = await encode('<p>test</p>', 'virkdk');
      const result = await decode('#' + fragment);
      expect(result?.content).toBe('<p>test</p>');
    });

    it('produces a string starting with "v1:"', async () => {
      const fragment = await encode('<p/>', 'virkdk');
      expect(fragment.startsWith('v1:')).toBe(true);
    });

    it('produces a fragment shorter than the raw JSON', async () => {
      // Compression should outpace base64 overhead for non-trivial content
      const content = Array(10).fill('<div class="form-group"><input type="text"></div>').join('\n');
      const fragment = await encode(content, 'virkdk');
      const rawJson = JSON.stringify({ c: content, t: 'virkdk' });
      expect(fragment.length).toBeLessThan(rawJson.length);
    });
  });

  // ---------------------------------------------------------------------------
  // decode — invalid / missing input
  // ---------------------------------------------------------------------------
  describe('decode — invalid input', () => {
    it('returns null for an empty string', async () => {
      expect(await decode('')).toBeNull();
    });

    it('returns null for a bare "#"', async () => {
      expect(await decode('#')).toBeNull();
    });

    it('returns null for an unrecognised format prefix', async () => {
      expect(await decode('#v99:abc')).toBeNull();
    });

    it('returns null for corrupt base64url data', async () => {
      expect(await decode('#v1:!!!notbase64!!!')).toBeNull();
    });

    it('returns null for base64 that decompresses to invalid JSON', async () => {
      // Encode some bytes that are valid base64url but not valid deflate-raw
      const garbage = btoa('this is not deflated').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(await decode(`#v1:${garbage}`)).toBeNull();
    });

    it('returns null when decoded JSON is missing "c" field', async () => {
      // Craft a v1u fragment with missing field
      const json = JSON.stringify({ t: 'virkdk' }); // no "c"
      const bytes = new TextEncoder().encode(json);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(await decode(`v1u:${encoded}`)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Uncompressed fallback (v1u)
  // ---------------------------------------------------------------------------
  describe('v1u fallback (no CompressionStream)', () => {
    it('falls back to v1u: when CompressionStream is undefined', async () => {
      vi.stubGlobal('CompressionStream', undefined);
      const fragment = await encode('<p>test</p>', 'virkdk');
      expect(fragment.startsWith('v1u:')).toBe(true);
    });

    it('v1u fragments decode correctly', async () => {
      vi.stubGlobal('CompressionStream', undefined);
      const fragment = await encode('<p>hello</p>', 'borgerdk');
      const result = await decode(fragment);
      expect(result).toEqual({ content: '<p>hello</p>', theme: 'borgerdk' });
    });
  });
});

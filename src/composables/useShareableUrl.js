/**
 * Encodes and decodes the editor state (content + theme) to/from a URL fragment.
 *
 * Format: "v1:<base64url(deflate-raw(JSON))>"
 * Fallback (no CompressionStream): "v1u:<base64url(JSON)>"
 *
 * The fragment stored in location.hash always includes the leading "#", e.g.
 * "#v1:abc123". Pass the raw hash (or the part after "#") to decode().
 */

const VERSION_COMPRESSED = 'v1';
const VERSION_UNCOMPRESSED = 'v1u';

function toBase64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function compress(str) {
  const input = new TextEncoder().encode(str);
  const chunks = [];
  const writable = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    }
  });
  await new ReadableStream({
    start(c) {
      c.enqueue(input);
      c.close();
    },
  }).pipeThrough(new CompressionStream('deflate-raw')).pipeTo(writable);
  const totalLen = chunks.reduce((n, c) => n + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompress(bytes) {
  const chunks = [];
  const writable = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    }
  });
  await new ReadableStream({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  }).pipeThrough(new DecompressionStream('deflate-raw')).pipeTo(writable);
  return new TextDecoder().decode(
    chunks.reduce((acc, c) => {
      const r = new Uint8Array(acc.length + c.length);
      r.set(acc);
      r.set(c, acc.length);
      return r;
    }, new Uint8Array(0))
  );
}

/**
 * Encodes content + theme into a URL fragment string (without the leading "#").
 * @param {string} content
 * @param {string} theme
 * @returns {Promise<string>} e.g. "v1:abc123" or "v1u:abc123"
 */
export async function encode(content, theme) {
  const json = JSON.stringify({ c: content, t: theme });
  if (typeof CompressionStream !== 'undefined') {
    const compressed = await compress(json);
    return `${VERSION_COMPRESSED}:${toBase64url(compressed)}`;
  }
  // Fallback: uncompressed
  const bytes = new TextEncoder().encode(json);
  return `${VERSION_UNCOMPRESSED}:${toBase64url(bytes)}`;
}

/**
 * Decodes a URL fragment (with or without leading "#") into { content, theme }.
 * Returns null if the fragment is missing, invalid, or corrupt.
 * @param {string} hash  e.g. "#v1:abc123" or "v1:abc123"
 * @returns {Promise<{content: string, theme: string}|null>}
 */
export async function decode(hash) {
  if (!hash) return null;
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;

  try {
    if (fragment.startsWith(`${VERSION_COMPRESSED}:`)) {
      const encoded = fragment.slice(VERSION_COMPRESSED.length + 1);
      const bytes = fromBase64url(encoded);
      const json = await decompress(bytes);
      const { c, t } = JSON.parse(json);
      if (typeof c !== 'string' || typeof t !== 'string') return null;
      return { content: c, theme: t };
    }

    if (fragment.startsWith(`${VERSION_UNCOMPRESSED}:`)) {
      const encoded = fragment.slice(VERSION_UNCOMPRESSED.length + 1);
      const bytes = fromBase64url(encoded);
      const json = new TextDecoder().decode(bytes);
      const { c, t } = JSON.parse(json);
      if (typeof c !== 'string' || typeof t !== 'string') return null;
      return { content: c, theme: t };
    }
  } catch {
    // Corrupt/invalid data — fall through to null
  }

  return null;
}

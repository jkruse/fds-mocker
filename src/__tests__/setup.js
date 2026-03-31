// Polyfill ResizeObserver — required by CodeMirror 6 in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill matchMedia — used by some browser-detection paths
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill Range.getClientRects — called by CodeMirror's layout layer in jsdom
// where no real rendering engine is present.
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {},
  });
}

// Expose Node.js built-in CompressionStream / DecompressionStream in the jsdom
// global scope so useShareableUrl.js can be tested without mocking.
if (typeof CompressionStream === 'undefined') {
  const { CompressionStream, DecompressionStream } = await import('stream/web');
  global.CompressionStream = CompressionStream;
  global.DecompressionStream = DecompressionStream;
}

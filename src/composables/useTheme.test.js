import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp, nextTick } from 'vue';

const STORAGE_KEY = 'fds-mocker-theme';
const DEFAULT_THEME = 'virkdk';

function withSetup(composable) {
  let result;
  const app = createApp({ setup() { result = composable(); return () => null; } });
  app.mount(document.createElement('div'));
  return [result, () => app.unmount()];
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to "virkdk" when localStorage is empty', async () => {
    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    expect(theme.value).toBe(DEFAULT_THEME);
    unmount();
  });

  it('returns the stored theme from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'borgerdk');

    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    expect(theme.value).toBe('borgerdk');
    unmount();
  });

  it('persists theme changes to localStorage', async () => {
    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    theme.value = 'borgerdk';
    await nextTick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('borgerdk');
    unmount();
  });

  it('falls back to "virkdk" when localStorage.getItem throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    expect(theme.value).toBe(DEFAULT_THEME);
    unmount();
  });

  it('silently ignores localStorage.setItem errors', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    theme.value = 'borgerdk';
    await nextTick();

    // No throw — theme is updated in memory despite storage failure
    expect(theme.value).toBe('borgerdk');
    unmount();
  });

  it('persisting back to "virkdk" after switching updates localStorage', async () => {
    const { useTheme } = await import('./useTheme.js');
    const [{ theme }, unmount] = withSetup(useTheme);

    theme.value = 'borgerdk';
    await nextTick();
    theme.value = 'virkdk';
    await nextTick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('virkdk');
    unmount();
  });
});

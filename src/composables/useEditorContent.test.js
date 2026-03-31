import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp, nextTick } from 'vue';

const STORAGE_KEY = 'fds-mocker-content';
const DEFAULT_CONTENT = '<button class="button button-primary">Primær knap</button>';

/**
 * Mounts a minimal Vue app that calls the composable, giving it a proper
 * component context (watchers, lifecycle hooks). Returns the result and an
 * unmount function.
 */
function withSetup(composable) {
  let result;
  const app = createApp({ setup() { result = composable(); return () => null; } });
  app.mount(document.createElement('div'));
  return [result, () => app.unmount()];
}

describe('useEditorContent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the default content when localStorage is empty', async () => {
    const { useEditorContent } = await import('./useEditorContent.js');
    const [{ content }, unmount] = withSetup(useEditorContent);

    expect(content.value).toBe(DEFAULT_CONTENT);
    unmount();
  });

  it('returns stored content when localStorage has a saved value', async () => {
    localStorage.setItem(STORAGE_KEY, '<p>stored</p>');

    const { useEditorContent } = await import('./useEditorContent.js');
    const [{ content }, unmount] = withSetup(useEditorContent);

    expect(content.value).toBe('<p>stored</p>');
    unmount();
  });

  it('persists content changes to localStorage', async () => {
    const { useEditorContent } = await import('./useEditorContent.js');
    const [{ content }, unmount] = withSetup(useEditorContent);

    content.value = '<span>updated</span>';
    await nextTick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('<span>updated</span>');
    unmount();
  });

  it('falls back to default when localStorage.getItem throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const { useEditorContent } = await import('./useEditorContent.js');
    const [{ content }, unmount] = withSetup(useEditorContent);

    expect(content.value).toBe(DEFAULT_CONTENT);
    unmount();
  });

  it('silently ignores localStorage.setItem errors', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { useEditorContent } = await import('./useEditorContent.js');
    const [{ content }, unmount] = withSetup(useEditorContent);

    content.value = 'something new';
    await nextTick();

    // No throw — the ref still holds the new value in memory
    expect(content.value).toBe('something new');
    unmount();
  });
});

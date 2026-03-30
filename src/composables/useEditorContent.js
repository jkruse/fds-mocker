import { ref, watch } from 'vue';

const STORAGE_KEY = 'fds-mocker-content';
const DEFAULT_CONTENT = `<button class="button button-primary">Primær knap</button>`;

export function useEditorContent() {
  let stored = DEFAULT_CONTENT;
  try {
    stored = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CONTENT;
  } catch {
    // localStorage unavailable (e.g. private browsing, quota exceeded)
  }
  const content = ref(stored);

  watch(content, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch {
      // Silently ignore write failures (quota exceeded, storage disabled)
    }
  });

  return { content };
}

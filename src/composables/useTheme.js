import { ref, watch } from 'vue';

const STORAGE_KEY = 'fds-mocker-theme';
const DEFAULT_THEME = 'virkdk';

export function useTheme() {
  let stored = DEFAULT_THEME;
  try {
    stored = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  } catch {
    // localStorage unavailable
  }
  const theme = ref(stored);

  watch(theme, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch {
      // Silently ignore write failures
    }
  });

  return { theme };
}

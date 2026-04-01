<template>
  <div class="app">
    <header class="toolbar">
      <span class="toolbar-title">FDS Mocker · DKFDS {{ dkfdsVersion }}</span>
      <span class="toolbar-hint">Paste DKFDS component HTML on the left — see the result on the right</span>
      <div class="theme-toggle" role="group" aria-label="Vælg tema">
        <button
          class="theme-btn"
          :class="{ active: theme === 'virkdk' }"
          @click="theme = 'virkdk'"
        >Virk.dk</button>
        <button
          class="theme-btn"
          :class="{ active: theme === 'borgerdk' }"
          @click="theme = 'borgerdk'"
        >Borger.dk</button>
      </div>
      <button class="copy-link-btn" @click="copyLink" :aria-label="copyLabel">
        {{ copyLabel }}
      </button>
    </header>
    <main class="workspace">
      <div class="pane pane-editor">
        <div class="pane-label">HTML</div>
        <Editor v-model="content"/>
      </div>
      <div class="divider" @mousedown="startResize"/>
      <div class="pane pane-preview" :style="{ flexBasis: previewWidth + 'px', pointerEvents: isResizing ? 'none' : undefined }">
        <div class="pane-label">Preview</div>
        <Preview :content="content" :theme="theme"/>
      </div>
    </main>
    <footer class="footer">
      <a href="https://github.com/jkruse/fds-mocker" target="_blank" rel="noopener noreferrer">github.com/jkruse/fds-mocker</a>
    </footer>
  </div>
</template>

<script setup>
import { useWindowSize, watchDebounced } from '@vueuse/core';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Editor from './components/Editor.vue';
import Preview from './components/Preview.vue';
import { useEditorContent } from './composables/useEditorContent.js';
import { decode, encode } from './composables/useShareableUrl.js';
import { useTheme } from './composables/useTheme.js';
import { preloadDkfdsAssets } from './utils/pageShell.js';

const dkfdsVersion = __DKFDS_VERSION__;
const { content } = useEditorContent();
const { theme } = useTheme();

// URL fragment sync ──────────────────────────────────────────────────────────

// On mount: if the URL contains a valid fragment, it takes precedence over localStorage.
onMounted(async () => {
  const parsed = await decode(location.hash);
  if (parsed) {
    content.value = parsed.content;
    theme.value = parsed.theme;
  }
});

// Keep the URL fragment in sync as the user edits (debounced to avoid thrashing).
watchDebounced(
  [content, theme],
  async ([c, t]) => {
    try {
      const fragment = await encode(c, t);
      history.replaceState(null, '', '#' + fragment);
    } catch {
      // Encoding failed (e.g. no CompressionStream and fallback also failed) — ignore.
    }
  },
  { debounce: 1500, immediate: true },
);

// Copy link button ────────────────────────────────────────────────────────────

const LABEL_DEFAULT = '🔗 Copy link';
const LABEL_COPIED  = '✓ Copied!';
const copyLabel = ref(LABEL_DEFAULT);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href);
    copyLabel.value = LABEL_COPIED;
    setTimeout(() => { copyLabel.value = LABEL_DEFAULT; }, 2000);
  } catch {
    // Clipboard API unavailable — silently ignore.
  }
}

// DKFDS assets ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    await preloadDkfdsAssets(import.meta.env.BASE_URL);
  } catch (e) {
    console.error('[FDS Mocker] Failed to load DKFDS assets:', e);
  }
});

// Resizable panes ─────────────────────────────────────────────────────────────

const { width: windowWidth } = useWindowSize();
const previewRatio = ref(0.5);
const previewWidth = computed(() => Math.max(200, windowWidth.value * previewRatio.value));
const isResizing = ref(false);

function startResize(e) {
  isResizing.value = true;
  e.preventDefault();
  window.addEventListener('mousemove', onResize);
  window.addEventListener('mouseup', stopResize);
}

function onResize(e) {
  if (!isResizing.value) return;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const rect = workspace.getBoundingClientRect();
  const workspaceWidth = rect.width;
  const distanceFromRight = rect.right - e.clientX;
  previewRatio.value = Math.max(200, Math.min(distanceFromRight, workspaceWidth - 200)) / workspaceWidth;
}

function stopResize() {
  isResizing.value = false;
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopResize);
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

/*noinspection CssUnusedSymbol*/
html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  color: #e2e8f0;
  flex-shrink: 0;
}

.toolbar-title {
  font-weight: 700;
  font-size: 1rem;
  color: #63b3ed;
}

.toolbar-hint {
  font-size: 0.8rem;
  color: #718096;
}

.theme-toggle {
  display: flex;
  margin-left: auto;
  border: 1px solid #0f3460;
  border-radius: 999px;
  overflow: hidden;
}

.theme-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: #718096;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.theme-btn:hover {
  color: #e2e8f0;
}

.theme-btn.active {
  background: #63b3ed;
  color: #16213e;
}

.copy-link-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: #718096;
  border: 1px solid #0f3460;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.copy-link-btn:hover {
  color: #e2e8f0;
  border-color: #63b3ed;
}

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.pane-preview {
  flex: none;
}

.pane-label {
  padding: 0.3rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #718096;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  flex-shrink: 0;
}

.divider {
  width: 4px;
  background: #0f3460;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}

.divider:hover {
  background: #63b3ed;
}
.footer {
  padding: 0.3rem 1rem;
  background: #16213e;
  border-top: 1px solid #0f3460;
  font-size: 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.footer a {
  color: #718096;
  text-decoration: none;
}

.footer a:hover {
  color: #63b3ed;
}
</style>

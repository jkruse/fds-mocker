<template>
  <div class="app">
    <header class="toolbar">
      <span class="toolbar-title">FDS Mocker</span>
      <span class="toolbar-hint">Paste DKFDS component HTML on the left — see the result on the right</span>
    </header>
    <main class="workspace">
      <div class="pane pane-editor">
        <div class="pane-label">HTML</div>
        <Editor v-model="content"/>
      </div>
      <div class="divider" @mousedown="startResize"/>
      <div class="pane pane-preview" :style="{ flexBasis: previewWidth + 'px', pointerEvents: isResizing ? 'none' : undefined }">
        <div class="pane-label">Preview</div>
        <Preview :content="content"/>
      </div>
    </main>
    <footer class="footer">
      <a href="https://github.com/jkruse/fds-mocker" target="_blank" rel="noopener noreferrer">github.com/jkruse/fds-mocker</a>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useWindowSize } from '@vueuse/core';
import Editor from './components/Editor.vue';
import Preview from './components/Preview.vue';
import { useEditorContent } from './composables/useEditorContent.js';
import { preloadDkfdsAssets } from './utils/pageShell.js';

const { content } = useEditorContent();

const { width: windowWidth } = useWindowSize();
const previewRatio = ref(0.5);
const previewWidth = computed(() => Math.max(200, windowWidth.value * previewRatio.value));
const isResizing = ref(false);

onMounted(async () => {
  try {
    await preloadDkfdsAssets(import.meta.env.BASE_URL);
  } catch (e) {
    console.error('[FDS Mocker] Failed to load DKFDS assets:', e);
  }
});

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

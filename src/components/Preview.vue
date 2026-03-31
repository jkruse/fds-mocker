<template>
  <div class="preview-container">
    <iframe ref="iframe" sandbox="allow-scripts"/>
  </div>
</template>

<script setup>
import { useTemplateRef, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { buildShell } from '../utils/pageShell.js';

const props = defineProps({
  content: { type: String, default: '' },
  theme: { type: String, default: 'virkdk' },
});

const iframeRef = useTemplateRef('iframe');
watchDebounced(
  () => props.content,
  (val) => updatePreview(val),
  { debounce: 300, immediate: true },
);

watch(() => props.theme, () => updatePreview(props.content));

function updatePreview(snippet) {
  if (iframeRef.value) {
    iframeRef.value.srcdoc = buildShell(snippet, props.theme);
  }
}
</script>

<style scoped>
.preview-container {
  height: 100%;
  background: #fff;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>

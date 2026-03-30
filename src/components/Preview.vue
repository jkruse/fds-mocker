<template>
  <div class="preview-container">
    <iframe ref="iframe" sandbox="allow-scripts"/>
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { buildShell } from '../utils/pageShell.js';

const props = defineProps({
  content: { type: String, default: '' },
});

const iframeRef = useTemplateRef('iframe');
watchDebounced(
  () => props.content,
  (val) => updatePreview(val),
  { debounce: 300, immediate: true },
);

function updatePreview(snippet) {
  if (iframeRef.value) {
    iframeRef.value.srcdoc = buildShell(snippet);
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

<template>
  <div ref="editor" class="editor-container"/>
</template>

<script setup>
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { bracketMatching, foldCode, foldGutter, indentOnInput, indentUnit, unfoldCode } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from '@codemirror/view';
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

const model = defineModel({ type: String, default: '' });

const editorRef = useTemplateRef('editor');
let view = null;

onMounted(() => {
  view = new EditorView({
    parent: editorRef.value,
    state: createState(model.value),
  });
});

onBeforeUnmount(() => {
  view?.destroy();
});

watch(model, (newVal) => {
  if (view && view.state.doc.toString() !== newVal) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal },
    });
  }
});

function createState(content) {
  return EditorState.create({
    doc: content,
    extensions: [
      lineNumbers(),
      foldGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      highlightSelectionMatches(),
      html(),
      oneDark,
      indentUnit.of('    '),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        { key: 'Mod--', preventDefault: true, run: foldCode },
        { key: 'Mod-+', preventDefault: true, run: unfoldCode },
        ...completionKeymap,
        indentWithTab
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          model.value = update.state.doc.toString();
        }
      }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '13px' },
        '.cm-scroller': { overflow: 'auto', fontFamily: '\'Fira Mono\', \'Cascadia Code\', monospace' },
      }),
    ],
  });
}
</script>

<style scoped>
.editor-container {
  height: 100%;
  overflow: hidden;
}
</style>

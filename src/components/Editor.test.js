import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from './Editor.vue';

/**
 * CodeMirror 6 relies on many DOM APIs that jsdom stubs or omits.
 * These tests focus on the component contract (props, mounting, unmounting)
 * rather than the internal editor behaviour.
 */
describe('Editor', () => {
  it('mounts without throwing', () => {
    expect(() => mount(Editor, { props: { modelValue: '' } })).not.toThrow();
  });

  it('renders a container element', () => {
    const wrapper = mount(Editor, { props: { modelValue: '' } });
    expect(wrapper.element).toBeTruthy();
  });

  it('renders the initial modelValue content in the editor', () => {
    const wrapper = mount(Editor, { props: { modelValue: '<p>hello</p>' } });
    // CodeMirror renders text content into .cm-line elements
    expect(wrapper.find('.cm-line').text()).toContain('hello');
  });

  it('unmounts without throwing', () => {
    const wrapper = mount(Editor, { props: { modelValue: '' } });
    expect(() => wrapper.unmount()).not.toThrow();
  });
});

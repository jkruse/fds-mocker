import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Preview from './Preview.vue';

vi.mock('../utils/pageShell.js', () => ({
  buildShell: vi.fn((snippet, theme = 'virkdk') => `<html data-theme="${theme}">${snippet}</html>`),
}));

// Import the mock so we can inspect calls
import { buildShell } from '../utils/pageShell.js';

describe('Preview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a sandboxed iframe', () => {
    const wrapper = mount(Preview);
    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('sandbox')).toContain('allow-scripts');
  });

  it('calls buildShell on mount with the initial snippet and theme', async () => {
    mount(Preview, { props: { content: '<p>hello</p>', theme: 'virkdk' } });
    await vi.runAllTimersAsync();

    expect(buildShell).toHaveBeenCalledWith('<p>hello</p>', 'virkdk');
  });

  it('defaults theme to "virkdk" when no theme prop is provided', async () => {
    mount(Preview, { props: { content: 'snippet' } });
    await vi.runAllTimersAsync();

    expect(buildShell).toHaveBeenCalledWith('snippet', 'virkdk');
  });

  it('sets iframe srcdoc from buildShell output on mount', async () => {
    const wrapper = mount(Preview, { props: { content: '<b>bold</b>', theme: 'virkdk' } });
    await vi.runAllTimersAsync();

    expect(wrapper.find('iframe').element.srcdoc).toContain('<b>bold</b>');
  });

  it('does not re-render before the 300 ms debounce fires', async () => {
    const wrapper = mount(Preview, { props: { content: 'initial', theme: 'virkdk' } });
    await vi.runAllTimersAsync();
    vi.clearAllMocks();

    await wrapper.setProps({ content: 'updated' });
    await vi.advanceTimersByTimeAsync(100);

    expect(buildShell).not.toHaveBeenCalled();
  });

  it('re-renders content after the 300 ms debounce', async () => {
    const wrapper = mount(Preview, { props: { content: 'initial', theme: 'virkdk' } });
    await vi.runAllTimersAsync();
    vi.clearAllMocks();

    await wrapper.setProps({ content: 'updated' });
    await vi.advanceTimersByTimeAsync(300);

    expect(buildShell).toHaveBeenCalledWith('updated', 'virkdk');
  });

  it('re-renders immediately when the theme prop changes (no debounce)', async () => {
    const wrapper = mount(Preview, { props: { content: 'test', theme: 'virkdk' } });
    await vi.runAllTimersAsync();
    vi.clearAllMocks();

    await wrapper.setProps({ theme: 'borgerdk' });
    await nextTick();

    // Should have fired without advancing timers
    expect(buildShell).toHaveBeenCalledWith('test', 'borgerdk');
  });

  it('theme switch passes the new theme to buildShell', async () => {
    const wrapper = mount(Preview, { props: { content: '<div/>', theme: 'virkdk' } });
    await vi.runAllTimersAsync();

    await wrapper.setProps({ theme: 'borgerdk' });
    await nextTick();

    expect(buildShell).toHaveBeenLastCalledWith('<div/>', 'borgerdk');
  });

  it('batches rapid content changes into a single render', async () => {
    const wrapper = mount(Preview, { props: { content: 'a', theme: 'virkdk' } });
    await vi.runAllTimersAsync();
    vi.clearAllMocks();

    await wrapper.setProps({ content: 'b' });
    await wrapper.setProps({ content: 'c' });
    await wrapper.setProps({ content: 'd' });
    await vi.advanceTimersByTimeAsync(300);

    expect(buildShell).toHaveBeenCalledTimes(1);
    expect(buildShell).toHaveBeenCalledWith('d', 'virkdk');
  });
});

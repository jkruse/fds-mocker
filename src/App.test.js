import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import App from './App.vue';

vi.mock('./utils/pageShell.js', () => ({
  preloadDkfdsAssets: vi.fn().mockResolvedValue(undefined),
  buildShell: vi.fn(() => '<html></html>'),
}));

vi.mock('./composables/useShareableUrl.js', () => ({
  encode: vi.fn().mockResolvedValue('v1:mockfragment'),
  decode: vi.fn().mockResolvedValue(null),
}));

import { decode } from './composables/useShareableUrl.js';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    decode.mockResolvedValue(null);
    // Reset location.hash
    history.replaceState(null, '', '#');
  });

  it('renders the toolbar title containing "FDS Mocker"', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.toolbar-title').text()).toContain('FDS Mocker');
  });

  it('renders a DKFDS semver version string in the toolbar title', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.toolbar-title').text()).toMatch(/\d+\.\d+\.\d+/);
  });

  it('renders a hint text in the toolbar', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.toolbar-hint').text()).toContain('DKFDS');
  });

  it('renders exactly two theme toggle buttons', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.findAll('.theme-btn')).toHaveLength(2);
  });

  it('labels the buttons "Virk.dk" and "Borger.dk"', () => {
    const wrapper = shallowMount(App);
    const [virkBtn, borgerBtn] = wrapper.findAll('.theme-btn');
    expect(virkBtn.text()).toBe('Virk.dk');
    expect(borgerBtn.text()).toBe('Borger.dk');
  });

  it('"Virk.dk" button is active by default', () => {
    const wrapper = shallowMount(App);
    const [virkBtn] = wrapper.findAll('.theme-btn');
    expect(virkBtn.classes()).toContain('active');
  });

  it('"Borger.dk" button is not active by default', () => {
    const wrapper = shallowMount(App);
    const [, borgerBtn] = wrapper.findAll('.theme-btn');
    expect(borgerBtn.classes()).not.toContain('active');
  });

  it('clicking "Borger.dk" makes it active', async () => {
    const wrapper = shallowMount(App);
    const [, borgerBtn] = wrapper.findAll('.theme-btn');
    await borgerBtn.trigger('click');
    expect(borgerBtn.classes()).toContain('active');
  });

  it('clicking "Borger.dk" deactivates "Virk.dk"', async () => {
    const wrapper = shallowMount(App);
    const [virkBtn, borgerBtn] = wrapper.findAll('.theme-btn');
    await borgerBtn.trigger('click');
    expect(virkBtn.classes()).not.toContain('active');
  });

  it('clicking "Virk.dk" after switching back makes it active again', async () => {
    const wrapper = shallowMount(App);
    const [virkBtn, borgerBtn] = wrapper.findAll('.theme-btn');
    await borgerBtn.trigger('click');
    await virkBtn.trigger('click');
    expect(virkBtn.classes()).toContain('active');
    expect(borgerBtn.classes()).not.toContain('active');
  });

  it('renders a footer with a GitHub link', () => {
    const wrapper = shallowMount(App);
    const link = wrapper.find('footer a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toContain('github.com');
  });

  it('passes the selected theme to the Preview component', async () => {
    const wrapper = shallowMount(App);
    const [, borgerBtn] = wrapper.findAll('.theme-btn');

    await borgerBtn.trigger('click');

    const previewStub = wrapper.findComponent({ name: 'Preview' });
    expect(previewStub.props('theme')).toBe('borgerdk');
  });

  it('starts with "virkdk" stored in localStorage when Virk.dk is selected', async () => {
    const wrapper = shallowMount(App);
    const [, borgerBtn] = wrapper.findAll('.theme-btn');
    await borgerBtn.trigger('click');

    expect(localStorage.getItem('fds-mocker-theme')).toBe('borgerdk');
  });

  // ---------------------------------------------------------------------------
  // Copy Link button
  // ---------------------------------------------------------------------------
  it('renders a Copy Link button', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.copy-link-btn').exists()).toBe(true);
  });

  it('Copy Link button shows default label', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.copy-link-btn').text()).toContain('Copy link');
  });

  it('clicking Copy Link calls navigator.clipboard.writeText with the current URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const wrapper = shallowMount(App);
    await wrapper.find('.copy-link-btn').trigger('click');

    expect(writeText).toHaveBeenCalledWith(location.href);
    vi.unstubAllGlobals();
  });

  it('Copy Link button shows "✓ Copied!" after clicking', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    const wrapper = shallowMount(App);
    await wrapper.find('.copy-link-btn').trigger('click');
    await flushPromises(); // let clipboard.writeText resolve and copyLabel update

    expect(wrapper.find('.copy-link-btn').text()).toContain('Copied');
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // URL fragment loading
  // ---------------------------------------------------------------------------
  it('overrides content and theme from URL fragment on mount', async () => {
    decode.mockResolvedValue({ content: '<p>from-url</p>', theme: 'borgerdk' });

    const wrapper = shallowMount(App);
    await flushPromises(); // let onMounted async decode + Vue reactivity settle

    const previewStub = wrapper.findComponent({ name: 'Preview' });
    expect(previewStub.props('theme')).toBe('borgerdk');
    expect(previewStub.props('content')).toBe('<p>from-url</p>');
  });
});

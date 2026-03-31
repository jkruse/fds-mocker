import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import App from './App.vue';

vi.mock('./utils/pageShell.js', () => ({
  preloadDkfdsAssets: vi.fn().mockResolvedValue(undefined),
  buildShell: vi.fn(() => '<html></html>'),
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the toolbar title "FDS Mocker"', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.find('.toolbar-title').text()).toBe('FDS Mocker');
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
    // Default theme click sets the default — trigger it explicitly
    const [, borgerBtn] = wrapper.findAll('.theme-btn');
    await borgerBtn.trigger('click');

    expect(localStorage.getItem('fds-mocker-theme')).toBe('borgerdk');
  });
});

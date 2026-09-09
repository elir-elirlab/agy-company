// Tests for SettingsModal component (Language switching & font size scaling)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal, DEFAULT_FONT_SIZE } from '../components/SettingsModal';
import { I18nProvider } from '../i18n/context';

describe('SettingsModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = '';
  });

  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={false} onClose={onClose} />
      </I18nProvider>
    );

    expect(screen.queryByText(/ダッシュボード設定|Dashboard Settings/)).not.toBeInTheDocument();
  });

  it('renders language and font size sections when open', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    expect(screen.getByText(/ダッシュボード設定|Dashboard Settings/)).toBeInTheDocument();
    expect(screen.getByText('日本語 (Japanese)')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('changes document font size and saves to localStorage when clicking preset button', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    // Click 21px preset (4K 大 / 4K Large)
    const largePresetBtn = screen.getByText(/21px/);
    fireEvent.click(largePresetBtn);

    expect(document.documentElement.style.fontSize).toBe('21px');
    expect(localStorage.getItem('agy_company_font_size')).toBe('21');
  });

  it('resets font size to default (18.5px) when clicking reset button', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    // First change to 24px
    const xlargePreset = screen.getByText(/24px/);
    fireEvent.click(xlargePreset);
    expect(document.documentElement.style.fontSize).toBe('24px');

    // Click reset button
    const resetBtn = screen.getByRole('button', { name: /初期値|Reset to default/i });
    fireEvent.click(resetBtn);

    expect(document.documentElement.style.fontSize).toBe(`${DEFAULT_FONT_SIZE}px`);
    expect(localStorage.getItem('agy_company_font_size')).toBe(DEFAULT_FONT_SIZE.toString());
  });

  it('switches language when clicking English option', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    const englishBtn = screen.getByText('English');
    fireEvent.click(englishBtn);

    // Header title should update to English
    expect(screen.getByText('Dashboard Settings')).toBeInTheDocument();
    expect(localStorage.getItem('agy_company_language')).toBe('en');
  });
});

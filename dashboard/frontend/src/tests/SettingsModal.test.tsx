// Tests for SettingsModal component (Language switching, font size scaling, Mermaid diagram dimensions)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SettingsModal,
  DEFAULT_FONT_SIZE,
  DEFAULT_MERMAID_HEIGHT,
  DEFAULT_MODAL_WIDTH
} from '../components/SettingsModal';
import { I18nProvider } from '../i18n/context';

describe('SettingsModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = '';
    document.documentElement.style.removeProperty('--mermaid-min-height');
    document.documentElement.style.removeProperty('--modal-max-width');
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
    const xlargePreset = screen.getByRole('button', { name: /4K.*24px/ });
    fireEvent.click(xlargePreset);
    expect(document.documentElement.style.fontSize).toBe('24px');

    // Click font size reset button
    const resetBtn = screen.getByRole('button', {
      name: /初期値 \(18\.5px\) にリセット|Reset to default \(18\.5px\)/,
    });
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

  it('changes Mermaid diagram height and saves to localStorage when clicking height preset', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    // Click 500px preset
    const largeHeightBtn = screen.getByText(/500px/);
    fireEvent.click(largeHeightBtn);

    expect(document.documentElement.style.getPropertyValue('--mermaid-min-height')).toBe('500px');
    expect(localStorage.getItem('agy_company_mermaid_height')).toBe('500');
  });

  it('changes modal width and saves to localStorage when clicking width option', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    // Click 6XL option button
    const extraWideBtn = screen.getByRole('button', { name: /6XL/i });
    fireEvent.click(extraWideBtn);

    expect(document.documentElement.style.getPropertyValue('--modal-max-width')).toBe('82rem');
    expect(localStorage.getItem('agy_company_modal_width')).toBe('6xl');

    // Click 7XL option button (Full width 95vw)
    const fullBtn = screen.getByRole('button', { name: /7XL/i });
    fireEvent.click(fullBtn);

    expect(document.documentElement.style.getPropertyValue('--modal-max-width')).toBe('95vw');
    expect(localStorage.getItem('agy_company_modal_width')).toBe('7xl');
  });

  it('resets Mermaid settings back to default when clicking reset button', () => {
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </I18nProvider>
    );

    // Change to 650px
    const xlargeHeightBtn = screen.getByText(/650px/);
    fireEvent.click(xlargeHeightBtn);
    expect(document.documentElement.style.getPropertyValue('--mermaid-min-height')).toBe('650px');

    // Click diagram reset button
    const resetBtn = screen.getByRole('button', { name: /ダイアグラム設定を初期値にリセット|Reset diagram settings to default/i });
    fireEvent.click(resetBtn);

    expect(document.documentElement.style.getPropertyValue('--mermaid-min-height')).toBe(`${DEFAULT_MERMAID_HEIGHT}px`);
    expect(localStorage.getItem('agy_company_mermaid_height')).toBe(DEFAULT_MERMAID_HEIGHT.toString());
  });
});

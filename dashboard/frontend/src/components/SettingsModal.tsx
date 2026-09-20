// Settings modal allowing user to switch language (ja/en), scale overall font size for 4K displays, and adjust Mermaid diagram rendering dimensions
import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Globe, Type, RotateCcw, Check, Maximize2, Layout } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_SIZE_STORAGE_KEY = 'agy_company_font_size';
export const DEFAULT_FONT_SIZE = 18.5; // Optimized base font size for 4K displays

export const MERMAID_HEIGHT_STORAGE_KEY = 'agy_company_mermaid_height';
export const DEFAULT_MERMAID_HEIGHT = 360; // Default height providing comfortable diagram canvas

export const MODAL_WIDTH_STORAGE_KEY = 'agy_company_modal_width';
export const DEFAULT_MODAL_WIDTH = '5xl'; // Default wide layout for diagrams and reports

export const MODAL_WIDTH_MAP: Record<string, string> = {
  '4xl': '48rem', // Compact (approx 768px-880px)
  '5xl': '64rem', // Standard (approx 1024px-1180px)
  '6xl': '82rem', // Wide (approx 1312px-1500px)
  '7xl': '95vw',  // Dynamic full width (95% of viewport)
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage } = useI18n();

  // Manage root font size state
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_FONT_SIZE;
  });

  // Manage Mermaid diagram minimum height state
  const [mermaidHeight, setMermaidHeightState] = useState<number>(() => {
    const saved = localStorage.getItem(MERMAID_HEIGHT_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_MERMAID_HEIGHT;
  });

  // Manage FileViewerModal maximum width state
  const [modalWidth, setModalWidthState] = useState<string>(() => {
    const saved = localStorage.getItem(MODAL_WIDTH_STORAGE_KEY);
    return saved || DEFAULT_MODAL_WIDTH;
  });

  // Apply font size to document root (html tag) so all Tailwind rem units scale proportionally
  const applyFontSize = useCallback((size: number) => {
    setFontSizeState(size);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size.toString());
  }, []);

  // Apply Mermaid diagram minimum height to CSS variable --mermaid-min-height
  const applyMermaidHeight = useCallback((height: number) => {
    setMermaidHeightState(height);
    document.documentElement.style.setProperty('--mermaid-min-height', `${height}px`);
    localStorage.setItem(MERMAID_HEIGHT_STORAGE_KEY, height.toString());
  }, []);

  // Apply modal width to CSS variable --modal-max-width
  const applyModalWidth = useCallback((widthKey: string) => {
    setModalWidthState(widthKey);
    const cssVal = MODAL_WIDTH_MAP[widthKey] || '64rem';
    document.documentElement.style.setProperty('--modal-max-width', cssVal);
    localStorage.setItem(MODAL_WIDTH_STORAGE_KEY, widthKey);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Preset font size options
  const presets = [
    { label: t.settings.fontSizePresets.normal, size: 16 },
    { label: t.settings.fontSizePresets.medium, size: 18.5 },
    { label: t.settings.fontSizePresets.large, size: 21 },
    { label: t.settings.fontSizePresets.xlarge, size: 24 }
  ];

  // Preset Mermaid diagram height options
  const mermaidPresets = [
    { label: t.settings.mermaidPresets.compact, size: 240 },
    { label: t.settings.mermaidPresets.medium, size: 360 },
    { label: t.settings.mermaidPresets.large, size: 500 },
    { label: t.settings.mermaidPresets.xlarge, size: 650 }
  ];

  // Modal max width options
  const modalWidthOptions = [
    { key: '4xl', label: t.settings.modalWidthPresets.standard },
    { key: '5xl', label: t.settings.modalWidthPresets.wide },
    { key: '6xl', label: t.settings.modalWidthPresets.extraWide },
    { key: '7xl', label: t.settings.modalWidthPresets.full }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.settings.title}</h2>
              <p className="text-sm text-slate-400">{t.settings.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.settings.closeBtn}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Language Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{t.settings.languageSection}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Japanese Option */}
              <button
                type="button"
                onClick={() => setLanguage('ja')}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                  language === 'ja'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-md shadow-indigo-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="text-sm">日本語 (Japanese)</div>
                  <div className="text-sm text-slate-400 font-normal mt-0.5">日本語 UI</div>
                </div>
                {language === 'ja' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>

              {/* English Option */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                  language === 'en'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-md shadow-indigo-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="text-sm">English</div>
                  <div className="text-sm text-slate-400 font-normal mt-0.5">English UI</div>
                </div>
                {language === 'en' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Font Size Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Type className="w-4 h-4 text-indigo-400" />
                <span>{t.settings.fontSizeSection}</span>
              </div>
              <span className="text-sm font-mono font-bold bg-indigo-500/15 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                {fontSize.toFixed(1)} px
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {t.settings.fontSizeDesc}
            </p>

            {/* Font Size Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="14"
                max="26"
                step="0.5"
                value={fontSize}
                onChange={(e) => applyFontSize(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-sm text-slate-500 font-mono">
                <span>14px (最小)</span>
                <span>18.5px (4K標準)</span>
                <span>26px (最大)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {presets.map((preset) => (
                <button
                  key={preset.size}
                  type="button"
                  onClick={() => applyFontSize(preset.size)}
                  className={`py-2 px-2.5 rounded-lg text-sm font-semibold border transition ${
                    Math.abs(fontSize - preset.size) < 0.1
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => applyFontSize(DEFAULT_FONT_SIZE)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.settings.resetBtn}</span>
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {t.settings.samplePreview}
              </div>
              <div className="text-base text-slate-200 font-medium leading-relaxed">
                {t.settings.sampleText}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Tag: sample
                </span>
                <span className="text-sm text-slate-400">
                  font-size: {fontSize.toFixed(1)}px (1rem = {fontSize.toFixed(1)}px)
                </span>
              </div>
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Mermaid Diagram & Modal Dimensions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <span>{t.settings.mermaidSection}</span>
              </div>
              <span className="text-sm font-mono font-bold bg-indigo-500/15 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                {mermaidHeight} px
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {t.settings.mermaidDesc}
            </p>

            {/* Mermaid Height Slider */}
            <div className="space-y-2">
              <div className="text-sm text-slate-300 font-semibold flex items-center justify-between">
                <span>{t.settings.mermaidHeightLabel}</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="20"
                value={mermaidHeight}
                onChange={(e) => applyMermaidHeight(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-sm text-slate-500 font-mono">
                <span>200px</span>
                <span>360px (標準)</span>
                <span>800px</span>
              </div>
            </div>

            {/* Quick Presets for Mermaid Height */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {mermaidPresets.map((preset) => (
                <button
                  key={preset.size}
                  type="button"
                  onClick={() => applyMermaidHeight(preset.size)}
                  className={`py-2 px-2.5 rounded-lg text-sm font-semibold border transition ${
                    mermaidHeight === preset.size
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Modal Max Width Options */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Layout className="w-4 h-4 text-indigo-400" />
                  <span>{t.settings.modalWidthSection}</span>
                </div>
                <span className="text-sm font-mono font-bold bg-indigo-500/15 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  {modalWidth.toUpperCase()} ({MODAL_WIDTH_MAP[modalWidth]})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {modalWidthOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => applyModalWidth(opt.key)}
                    className={`py-2 px-2 rounded-lg text-sm font-semibold border transition ${
                      modalWidth === opt.key
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Visual Width Preview Box */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-2 space-y-1.5">
                <div className="w-full bg-slate-900/90 h-10 rounded-lg flex items-center justify-center p-1 relative overflow-hidden border border-slate-700/60">
                  <div
                    className="bg-indigo-600/30 border border-indigo-400/80 h-full rounded flex items-center justify-center transition-all duration-300 shadow-sm"
                    style={{
                      width:
                        modalWidth === '4xl' ? '50%' :
                        modalWidth === '5xl' ? '68%' :
                        modalWidth === '6xl' ? '84%' : '98%'
                    }}
                  >
                    <span className="text-xs font-bold text-indigo-200 tracking-wider">
                      {modalWidth.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-center">
                  {language === 'ja'
                    ? '※ ブラウザ画面の表示幅に合わせて最大幅が適用されます（7XLは全画面95%）'
                    : '※ Max width is applied up to your browser window size (7XL spans 95vw)'}
                </div>
              </div>
            </div>

            {/* Reset Mermaid Settings Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  applyMermaidHeight(DEFAULT_MERMAID_HEIGHT);
                  applyModalWidth(DEFAULT_MODAL_WIDTH);
                }}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.settings.resetMermaidBtn}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20"
          >
            {t.settings.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

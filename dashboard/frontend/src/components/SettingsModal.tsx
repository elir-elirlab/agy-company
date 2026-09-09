// Settings modal allowing user to switch language (ja/en) and scale overall font size for 4K displays
import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Globe, Type, RotateCcw, Check } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_SIZE_STORAGE_KEY = 'agy_company_font_size';
export const DEFAULT_FONT_SIZE = 18.5; // Optimized base font size for 4K displays

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage } = useI18n();

  // Manage root font size state
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_FONT_SIZE;
  });

  // Apply font size to document root (html tag) so all Tailwind rem units scale proportionally
  const applyFontSize = useCallback((size: number) => {
    setFontSizeState(size);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size.toString());
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.settings.title}</h2>
              <p className="text-xs text-slate-400">{t.settings.subtitle}</p>
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
                  <div className="text-xs text-slate-400 font-normal mt-0.5">標準インターフェース</div>
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
                  <div className="text-xs text-slate-400 font-normal mt-0.5">English UI</div>
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
              <span className="text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                {fontSize.toFixed(1)} px
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
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
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
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
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition ${
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
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.settings.resetBtn}</span>
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t.settings.samplePreview}
              </div>
              <div className="text-base text-slate-200 font-medium leading-relaxed">
                {t.settings.sampleText}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Tag: sample
                </span>
                <span className="text-xs text-slate-400">
                  font-size: {fontSize.toFixed(1)}px (1rem = {fontSize.toFixed(1)}px)
                </span>
              </div>
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

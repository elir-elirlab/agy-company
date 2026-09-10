import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Tag, Link2, Calendar, FileCode, Eye, FileText } from 'lucide-react';
import { getObsidianUri } from '../utils/obsidian';
import { useI18n } from '../i18n/context';
import { MarkdownViewer } from './MarkdownViewer';

interface FileViewerModalProps {
  filePath: string | null;
  onClose: () => void;
}

interface FileDetail {
  path: string;
  filename: string;
  frontmatter: Record<string, any>;
  body: string;
  raw: string;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ filePath, onClose }) => {
  const { t } = useI18n();
  const [data, setData] = useState<FileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  useEffect(() => {
    if (!filePath) {
      setData(null);
      return;
    }

    setIsLoading(true);
    fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Failed to load file', err))
      .finally(() => setIsLoading(false));
  }, [filePath]);

  if (!filePath) return null;

  const obsidianUrl = getObsidianUri(filePath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="bg-slate-850 bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-h-[88vh] flex flex-col overflow-hidden transition-all"
        style={{ maxWidth: 'var(--modal-max-width, 64rem)' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/80 space-y-3">
          {/* Top Row: Icon, Title, Obsidian Link, Close Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-emerald-500/15 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg truncate" title={data?.filename || filePath.split('/').pop()}>
                {data?.filename || filePath.split('/').pop()}
              </h3>
              <a
                href={obsidianUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-sm shrink-0 whitespace-nowrap"
              >
                <span>{t.fileViewer.openInObsidian}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700/60 shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Row: View Mode Switcher (Preview / Raw) */}
          <div className="flex items-center justify-start pt-0.5">
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.fileViewer.tabPreview}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  viewMode === 'raw'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.fileViewer.tabRaw}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400">{t.fileViewer.loading}</div>
          ) : data ? (
            <>
              {/* Frontmatter Metadata Display */}
              {Object.keys(data.frontmatter || {}).length > 0 && (
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-2.5 text-xs shadow-inner">
                  <div className="text-slate-400 font-semibold uppercase tracking-wider text-xs">
                    {t.fileViewer.metadataTitle}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    {data.frontmatter.id && (
                      <div>
                        <span className="text-slate-500">ID: </span>
                        <span className="font-mono text-slate-200">{data.frontmatter.id}</span>
                      </div>
                    )}
                    {data.frontmatter.created && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-500">Created: </span>
                        <span className="font-mono text-slate-200">{data.frontmatter.created}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {data.frontmatter.tags && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      {Array.isArray(data.frontmatter.tags)
                        ? data.frontmatter.tags.map((t: string) => (
                            <span
                              key={t}
                              className="bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-md border border-slate-700 font-medium"
                            >
                              {t}
                            </span>
                          ))
                        : String(data.frontmatter.tags)}
                    </div>
                  )}

                  {/* Cross links */}
                  {data.frontmatter.link && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                      {Array.isArray(data.frontmatter.link)
                        ? data.frontmatter.link.map((l: string) => (
                            <span
                              key={l}
                              className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-2.5 py-0.5 rounded-md font-mono text-xs"
                            >
                              {l}
                            </span>
                          ))
                        : String(data.frontmatter.link)}
                    </div>
                  )}
                </div>
              )}

              {/* Document Body Markdown Rendering */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 shadow-inner">
                {viewMode === 'preview' ? (
                  <MarkdownViewer content={data.body} />
                ) : (
                  <pre className="text-base font-mono whitespace-pre-wrap text-slate-200 leading-relaxed overflow-x-auto">
                    {data.body}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-rose-400">{t.fileViewer.error}</div>
          )}
        </div>
      </div>
    </div>
  );
};

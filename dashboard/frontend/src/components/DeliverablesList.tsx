import React from 'react';
import { FileText, ExternalLink, Link2, Tag } from 'lucide-react';
import { DeliverableMeta } from '../types';
import { getObsidianUri } from '../utils/obsidian';
import { useI18n } from '../i18n/context';

interface DeliverablesListProps {
  deliverables: DeliverableMeta[];
  selectedDepartment: string | null;
  onSelectDepartment: (dept: string | null) => void;
  onOpenFile: (path: string) => void;
}

export const DeliverablesList: React.FC<DeliverablesListProps> = ({
  deliverables,
  selectedDepartment,
  onSelectDepartment,
  onOpenFile
}) => {
  const { t } = useI18n();

  // Extract unique departments
  const departments = Array.from(new Set(deliverables.map((d) => d.department)));

  const filtered = selectedDepartment
    ? deliverables.filter((d) => d.department === selectedDepartment)
    : deliverables;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/70 shadow-lg p-5 flex flex-col h-full overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/80 mb-4 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-emerald-500/15 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{t.deliverables.title}</h2>
          <span className="text-xs bg-slate-700/70 text-slate-300 font-medium px-2.5 py-0.5 rounded-full border border-slate-600/40">
            {filtered.length} {t.deliverables.filesCount}
          </span>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-sm pb-1">
          <button
            onClick={() => onSelectDepartment(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition duration-150 ${
              selectedDepartment === null
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.deliverables.all}
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => onSelectDepartment(dept)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition duration-150 ${
                selectedDepartment === dept
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 px-4 text-center">
          <p className="text-base font-medium text-slate-400">{t.deliverables.noDeliverables}</p>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
            {t.deliverables.noDeliverablesHint}
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {filtered.map((item) => {
            const obsidianUrl = getObsidianUri(item.relative_path);

            return (
              <div
                key={item.relative_path}
                className="bg-slate-750 bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/40 rounded-xl p-4 transition duration-150 shadow-sm flex flex-col space-y-2.5 group"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => onOpenFile(item.relative_path)}
                    className="text-left font-bold text-base text-slate-100 group-hover:text-indigo-300 transition line-clamp-1"
                  >
                    {item.title || item.relative_path.split('/').pop()}
                  </button>

                  <a
                    href={obsidianUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ml-2 transition shadow-sm"
                    title={t.deliverables.obsidianBtn}
                  >
                    <span>{t.deliverables.obsidianBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    {item.department}
                  </span>

                  {item.created && (
                    <span className="text-slate-400 font-mono text-xs">
                      {item.created}
                    </span>
                  )}

                  {/* Tags */}
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700/60"
                    >
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span>{tag}</span>
                    </span>
                  ))}

                  {/* Cross Links count */}
                  {item.links && item.links.length > 0 && (
                    <span className="flex items-center gap-1 text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 rounded-md">
                      <Link2 className="w-3 h-3 text-indigo-400" />
                      <span>{item.links.length} {t.deliverables.linksCount}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

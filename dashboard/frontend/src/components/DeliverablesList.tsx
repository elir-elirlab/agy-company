import React from 'react';
import { FileText, ExternalLink, Link2, Tag } from 'lucide-react';
import { DeliverableMeta, OrgChartData } from '../types';
import { getObsidianUri } from '../utils/obsidian';
import { useI18n } from '../i18n/context';

interface DeliverablesListProps {
  deliverables: DeliverableMeta[];
  selectedDepartment: string | null;
  onSelectDepartment: (dept: string | null) => void;
  onOpenFile: (path: string) => void;
  orgData?: OrgChartData | null;
}

export const DeliverablesList: React.FC<DeliverablesListProps> = ({
  deliverables,
  selectedDepartment,
  onSelectDepartment,
  onOpenFile,
  orgData
}) => {
  const { t, language } = useI18n();

  // Helper function to check if a department identifier refers to the secretary office
  const isSecretaryDept = (dept: string): boolean => {
    const normalized = dept.trim().toLowerCase();
    return normalized === 'secretary' || normalized === '秘書室' || normalized.includes('秘書');
  };

  // Helper function to remove emoji characters from labels
  const stripEmoji = (text: string): string => {
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu, '').trim();
  };

  // Resolve localized full display name for tooltips and accessibility
  const getDepartmentFullLabel = (dept: string): string => {
    if (isSecretaryDept(dept)) {
      const orgTitle = orgData?.secretary?.translations?.[language]?.title;
      const rawTitle = orgTitle || (language === 'ja' ? '秘書室 (Executive Secretary)' : 'Executive Secretary');
      return stripEmoji(rawTitle);
    }

    if (dept.toLowerCase() === 'general') {
      return language === 'ja' ? '全体 (General)' : 'General';
    }

    if (orgData?.departments) {
      const matched = orgData.departments.find(
        (d) => d.id.toLowerCase() === dept.toLowerCase() || d.name === dept
      );
      if (matched) {
        const localized = matched.translations?.[language]?.name;
        if (localized) {
          return stripEmoji(localized);
        }
      }
    }

    return stripEmoji(dept);
  };

  // Resolve compact clean label for filter pill buttons without emojis
  const getDepartmentShortLabel = (dept: string): string => {
    if (isSecretaryDept(dept)) {
      return language === 'ja' ? '秘書室' : 'Secretary';
    }

    if (dept.toLowerCase() === 'general') {
      return language === 'ja' ? '全体' : 'General';
    }

    // Look up specialized department in orgData
    if (orgData?.departments) {
      const matched = orgData.departments.find(
        (d) => d.id.toLowerCase() === dept.toLowerCase() || d.name === dept
      );
      if (matched) {
        // 1. Priority: Explicit short_name in configuration if defined
        const customShort =
          matched.translations?.[language]?.short_name ||
          matched.short_name;
        if (customShort) {
          return stripEmoji(customShort);
        }

        // 2. Derive short name from full name
        const rawName = matched.translations?.[language]?.name || matched.name;
        let clean = stripEmoji(rawName);
        // Remove parenthesized content such as '(Engineering)'
        clean = clean.replace(/\s*\(.*?\)/g, '').trim();
        // Remove trailing ' Department' or ' Office' in English mode
        if (language === 'en') {
          clean = clean.replace(/\s+(Department|Office)$/i, '').trim();
        }
        if (clean) {
          return clean;
        }
      }
    }

    // Default fallback: strip parentheses and capitalize first letter if ascii ID
    let fallback = stripEmoji(dept).replace(/\s*\(.*?\)/g, '').trim();
    if (/^[a-z]+$/i.test(fallback)) {
      fallback = fallback.charAt(0).toUpperCase() + fallback.slice(1);
    }
    return fallback;
  };

  // Extract unique departments
  const departments = Array.from(new Set(deliverables.map((d) => d.department)));

  const filtered = selectedDepartment
    ? deliverables.filter((d) => {
        if (isSecretaryDept(selectedDepartment)) {
          return isSecretaryDept(d.department);
        }
        return d.department.toLowerCase() === selectedDepartment.toLowerCase();
      })
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
          <span className="text-sm bg-slate-700/70 text-slate-300 font-medium px-2.5 py-0.5 rounded-full border border-slate-600/40">
            {filtered.length} {t.deliverables.filesCount}
          </span>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-sm pb-1 shrink-0">
          <button
            onClick={() => onSelectDepartment(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition duration-150 whitespace-nowrap shrink-0 ${
              selectedDepartment === null
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.deliverables.all}
          </button>
          {departments.map((dept) => {
            // Determine if the department button is currently selected
            const isSelected =
              selectedDepartment === dept ||
              (isSecretaryDept(selectedDepartment || '') && isSecretaryDept(dept));

            const shortLabel = getDepartmentShortLabel(dept);
            const fullLabel = getDepartmentFullLabel(dept);

            return (
              <button
                key={dept}
                onClick={() => onSelectDepartment(isSelected ? null : dept)}
                title={fullLabel}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition duration-150 whitespace-nowrap shrink-0 max-w-[130px] truncate ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 px-4 text-center">
          <p className="text-base font-medium text-slate-400">{t.deliverables.noDeliverables}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
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
                    className="text-sm bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ml-2 transition shadow-sm"
                    title={t.deliverables.obsidianBtn}
                  >
                    <span>{t.deliverables.obsidianBtn}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Frontmatter Summary Preview (if present) */}
                {item.summary && item.summary.length > 0 && (
                  <ul className="text-sm text-slate-300 space-y-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 list-disc list-inside">
                    {item.summary.map((point, idx) => (
                      <li key={idx} className="leading-snug text-slate-300">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    title={getDepartmentFullLabel(item.department)}
                    className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium text-xs max-w-[150px] truncate"
                  >
                    {getDepartmentShortLabel(item.department)}
                  </span>

                  {/* Document purpose category badge (Knowledge / Proposal / Discussion / Undefined) */}
                  {(() => {
                    const docType = item.doc_type || 'undefined';
                    let badgeStyle = 'bg-slate-700/60 text-slate-400 border-slate-600/40';
                    let label = t.docTypes.undefined;

                    if (docType === 'knowledge') {
                      badgeStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                      label = t.docTypes.knowledge;
                    } else if (docType === 'proposal') {
                      badgeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                      label = t.docTypes.proposal;
                    } else if (docType === 'discussion') {
                      badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                      label = t.docTypes.discussion;
                    }

                    return (
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badgeStyle}`}>
                        {label}
                      </span>
                    );
                  })()}

                  {item.created && (
                    <span className="text-slate-400 font-mono text-sm">
                      {item.created}
                    </span>
                  )}

                  {/* Tags */}
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700/60"
                    >
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
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

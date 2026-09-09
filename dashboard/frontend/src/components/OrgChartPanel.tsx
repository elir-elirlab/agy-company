import React, { useEffect, useState } from 'react';
import { Building2, User, BellRing, ArrowDown, FolderTree, Layers, FileText } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface DepartmentDetail {
  id: string;
  name: string;
  role: string;
  deliverables_count: number;
  path: string;
}

interface OrgChartData {
  owner: {
    title: string;
    role: string;
  };
  secretary: {
    title: string;
    role: string;
    is_permanent: boolean;
  };
  departments: DepartmentDetail[];
}

interface OrgChartPanelProps {
  selectedDepartment: string | null;
  onSelectDepartment: (dept: string | null) => void;
}

export const OrgChartPanel: React.FC<OrgChartPanelProps> = ({
  selectedDepartment,
  onSelectDepartment
}) => {
  const { t, language } = useI18n();
  const [data, setData] = useState<OrgChartData | null>(null);
  const [treeData, setTreeData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/org').then((r) => r.json()),
      fetch('/api/tree').then((r) => r.json())
    ])
      .then(([org, tree]) => {
        setData(org);
        setTreeData(tree);
      })
      .catch((err) => console.error('Failed to load org chart:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-slate-850/80 backdrop-blur-sm bg-slate-800 rounded-2xl border border-slate-700/70 shadow-lg p-5 flex flex-col h-full overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/80 mb-4 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-500/15 p-1.5 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{t.org.title}</h2>
        </div>
        <span className="text-xs bg-slate-700/70 text-slate-300 px-2.5 py-0.5 rounded-full font-medium border border-slate-600/40">
          {data?.departments.length ?? 0} {t.org.departmentsCount}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading organization...
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Hierarchy Tree Visual */}
          <div className="flex flex-col items-center space-y-2.5">
            {/* 1. Owner Card */}
            <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/35 rounded-xl p-3.5 w-full text-center shadow-sm">
              <div className="flex items-center justify-center space-x-1.5 text-amber-300 font-bold text-sm">
                <User className="w-4 h-4" />
                <span>{language === 'ja' ? data.owner.title : t.org.ownerTitle}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                {language === 'ja' ? data.owner.role : t.org.ownerRole}
              </p>
            </div>

            {/* Connecting Arrow */}
            <div className="flex flex-col items-center text-slate-500">
              <div className="w-0.5 h-3 bg-slate-600/80" />
              <ArrowDown className="w-3.5 h-3.5 -mt-1 text-slate-400" />
            </div>

            {/* 2. Secretary Card */}
            <div className="bg-indigo-950/50 border border-indigo-500/35 rounded-xl p-3.5 w-full text-center shadow-sm">
              <div className="flex items-center justify-center space-x-1.5 text-indigo-300 font-bold text-sm">
                <BellRing className="w-4 h-4" />
                <span>{language === 'ja' ? data.secretary.title : t.org.secretaryTitle}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                {language === 'ja' ? data.secretary.role : t.org.secretaryRole}
              </p>
              <span className="inline-block mt-2 text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                {t.org.permanentBadge}
              </span>
            </div>

            {/* Connecting Arrow */}
            <div className="flex flex-col items-center text-slate-500">
              <div className="w-0.5 h-3 bg-slate-600/80" />
              <ArrowDown className="w-3.5 h-3.5 -mt-1 text-slate-400" />
            </div>

            {/* 3. Specialized Departments List */}
            <div className="w-full space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                {t.org.activeDeptsHeader}
              </div>

              {data.departments.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center text-slate-400 text-xs leading-relaxed">
                  {t.org.noDeptsMessage}
                </div>
              ) : (
                <div className="space-y-2">
                  {data.departments.map((dept) => {
                    const isSelected = selectedDepartment === dept.id;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => onSelectDepartment(isSelected ? null : dept.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition duration-150 shadow-sm flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500/80 ring-1 ring-indigo-500/40 text-white'
                            : 'bg-slate-750 bg-slate-700/40 hover:bg-slate-700/70 border-slate-600/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-slate-100">
                            {dept.name}
                          </span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                            {dept.deliverables_count} {t.org.deliverablesCount}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {dept.role}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Directory Tree */}
          {treeData && (
            <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
                <FolderTree className="w-4.5 h-4.5 text-indigo-400" />
                <span>{t.org.vaultTreeTitle}</span>
              </div>

              <div className="space-y-3 font-mono">
                {/* 01_Inbox */}
                <div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                    <Layers className="w-4 h-4" />
                    {t.org.inboxFolder}
                  </div>
                  {treeData.inbox && treeData.inbox.length > 0 ? (
                    <ul className="pl-3.5 border-l-2 border-slate-700 ml-1.5 mt-1.5 space-y-1.5 text-slate-300 text-xs">
                      {treeData.inbox.map((item: any) => (
                        <li key={item.relative_path} className="truncate hover:text-white transition">
                          {item.is_dir ? '📁' : '📄'} {item.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 pl-4 py-1 inline-block italic text-xs">
                      {t.org.empty}
                    </span>
                  )}
                </div>

                {/* 02_Daily */}
                <div>
                  <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-sm">
                    <FileText className="w-4 h-4" />
                    {t.org.dailyFolder}
                  </div>
                  {treeData.daily && treeData.daily.length > 0 ? (
                    <ul className="pl-3.5 border-l-2 border-slate-700 ml-1.5 mt-1.5 space-y-1.5 text-slate-300 text-xs">
                      {treeData.daily.map((item: any) => (
                        <li key={item.relative_path} className="truncate hover:text-white transition">
                          📄 {item.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 pl-4 py-1 inline-block italic text-xs">
                      {t.org.empty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-rose-400 text-xs text-center py-5">
          Failed to load organization.
        </div>
      )}
    </div>
  );
};

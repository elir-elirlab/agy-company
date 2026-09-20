import React, { useEffect, useState } from 'react';
import { X, Building2, User, BellRing, Layers, FolderTree, FileText, ArrowDown } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface DepartmentDetail {
  id: string;
  name: string;
  role: string;
  translations?: {
    ja?: { name: string; role: string };
    en?: { name: string; role: string };
  };
  deliverables_count: number;
  path: string;
}

interface OrgChartData {
  owner: {
    title: string;
    role: string;
    translations?: {
      ja?: { title: string; role: string };
      en?: { title: string; role: string };
    };
  };
  secretary: {
    title: string;
    role: string;
    is_permanent: boolean;
    translations?: {
      ja?: { title: string; role: string; permanent_badge?: string };
      en?: { title: string; role: string; permanent_badge?: string };
    };
  };
  departments: DepartmentDetail[];
}

interface OrgChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (dept: string) => void;
}

export const OrgChartModal: React.FC<OrgChartModalProps> = ({
  isOpen,
  onClose,
  onSelectDepartment
}) => {
  const { t, language } = useI18n();
  const [data, setData] = useState<OrgChartData | null>(null);
  const [treeData, setTreeData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">仮想組織図 (Organization Chart)</h3>
              <p className="text-sm text-slate-400">
                階層構造・アクティブな部署・成果物の一元可視化
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading organization data...</div>
          ) : data ? (
            <>
              {/* Hierarchy Tree Visualization */}
              <div className="flex flex-col items-center space-y-4">
                {/* 1. Owner Card */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl p-4 w-72 text-center shadow-md">
                  <div className="flex items-center justify-center space-x-2 text-amber-300 font-bold text-base mb-1">
                    <User className="w-5 h-5" />
                    <span>
                      {data.owner.translations?.[language]?.title ??
                        (language === 'ja' ? data.owner.title : t.org.ownerTitle)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {data.owner.translations?.[language]?.role ??
                      (language === 'ja' ? data.owner.role : t.org.ownerRole)}
                  </p>
                </div>

                {/* Connecting Arrow */}
                <div className="flex flex-col items-center text-slate-500">
                  <div className="w-0.5 h-4 bg-slate-600" />
                  <ArrowDown className="w-4 h-4 -mt-1" />
                </div>

                {/* 2. Secretary Card */}
                <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-4 w-80 text-center shadow-md">
                  <div className="flex items-center justify-center space-x-2 text-indigo-300 font-bold text-base mb-1">
                    <BellRing className="w-5 h-5" />
                    <span>
                      {data.secretary.translations?.[language]?.title ??
                        (language === 'ja' ? data.secretary.title : t.org.secretaryTitle)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {data.secretary.translations?.[language]?.role ??
                      (language === 'ja' ? data.secretary.role : t.org.secretaryRole)}
                  </p>
                  <span className="inline-block mt-2 text-sm bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                    {data.secretary.translations?.[language]?.permanent_badge ?? t.org.permanentBadge}
                  </span>
                </div>

                {/* Connecting Arrow to Departments */}
                <div className="flex flex-col items-center text-slate-500">
                  <div className="w-0.5 h-4 bg-slate-600" />
                  <ArrowDown className="w-4 h-4 -mt-1" />
                </div>

                {/* 3. Specialized Departments Grid */}
                <div className="w-full">
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                    {t.org.activeDeptsHeader}
                  </div>

                  {data.departments.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-6 text-center text-slate-500 text-sm">
                      {t.org.noDeptsMessage}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.departments.map((dept) => {
                        const deptName = dept.translations?.[language]?.name ?? dept.name;
                        const deptRole = dept.translations?.[language]?.role ?? dept.role;

                        return (
                          <div
                            key={dept.id}
                            onClick={() => {
                              onSelectDepartment(dept.id);
                              onClose();
                            }}
                            className="bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/50 rounded-xl p-4 cursor-pointer transition shadow-sm flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-100 text-base group-hover:text-indigo-300 transition">
                                  {deptName}
                                </h4>
                                <span className="text-sm bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {dept.deliverables_count} {t.org.deliverablesCount}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {deptRole}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-600/30 flex items-center justify-between text-sm text-slate-400">
                              <span className="font-mono">{dept.path}</span>
                              <span className="text-indigo-400 group-hover:underline">{t.org.viewList}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Directory Structure Tree */}
              {treeData && (
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-300 font-semibold text-base">
                    <FolderTree className="w-5 h-5 text-indigo-400" />
                    <span>Vault フォルダ構成ツリー</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono text-slate-300">
                    {/* 01_Inbox Tree */}
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5 text-base">
                        <Layers className="w-4 h-4" />
                        01_Inbox/ (成果物)
                      </div>
                      {treeData.inbox && treeData.inbox.length > 0 ? (
                        <ul className="space-y-1.5 pl-3 border-l border-slate-800 ml-1 mt-1.5">
                          {treeData.inbox.map((item: any) => (
                            <li key={item.relative_path} className="flex items-center gap-1.5 text-slate-300">
                              {item.is_dir ? '📁' : '📄'}
                              <span>{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 pl-2 text-sm">空のディレクトリ</span>
                      )}
                    </div>

                    {/* 02_Daily Tree */}
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5 text-base">
                        <FileText className="w-4 h-4" />
                        02_Daily/ (デイリーノート)
                      </div>
                      {treeData.daily && treeData.daily.length > 0 ? (
                        <ul className="space-y-1.5 pl-3 border-l border-slate-800 ml-1 mt-1.5">
                          {treeData.daily.map((item: any) => (
                            <li key={item.relative_path} className="flex items-center gap-1.5 text-slate-300">
                              📄 <span>{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 pl-2 text-sm">空のディレクトリ</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-rose-400">Failed to load organization data.</div>
          )}
        </div>
      </div>
    </div>
  );
};

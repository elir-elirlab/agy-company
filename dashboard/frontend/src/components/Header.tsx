import React from 'react';
import { Building2, CheckCircle2, Clock, FolderGit2, Settings } from 'lucide-react';
import { StatusResponse } from '../types';
import { useI18n } from '../i18n/context';

interface HeaderProps {
  status: StatusResponse | null;
  isConnected: boolean;
  onOpenQuickNote: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, isConnected, onOpenQuickNote, onOpenSettings }) => {
  const { t } = useI18n();
  const completionRate = status?.todos.completion_rate ?? 0;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/80 px-8 py-3.5 sticky top-0 z-20 shadow-lg transition-colors">
      <div className="w-full flex items-center justify-between">
        {/* Brand & Date */}
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/20 border border-indigo-400/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {t.header.title}
              </h1>
              <span className="text-sm bg-indigo-500/15 text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                {t.header.cockpitSubtitle}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              {status?.today ? `${status.today} (${t.header.dailyStandup})` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-4">
          {/* Daily Progress Widget */}
          <div className="flex items-center space-x-3 bg-slate-800/80 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-700/60 shadow-inner transition">
            <CheckCircle2 className={`w-5 h-5 ${completionRate === 100 ? 'text-emerald-400' : 'text-indigo-400'}`} />
            <div>
              <div className="text-sm text-slate-400 font-medium leading-none mb-1">
                {t.header.dailyProgress}
              </div>
              <div className="text-sm font-bold text-white leading-none">
                {status?.todos.completed ?? 0} / {status?.todos.total ?? 0}
                <span className="text-sm font-semibold text-slate-400 ml-1.5">({completionRate}%)</span>
              </div>
            </div>
            <div className="w-20 bg-slate-700/80 h-2 rounded-full overflow-hidden ml-1 border border-slate-600/30">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completionRate === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Deliverables Count */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-sm">
            <FolderGit2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">
              {status?.deliverables_count ?? 0} <span className="text-slate-400 font-normal">{t.header.deliverables}</span>
            </span>
          </div>

          {/* Quick Capture Button */}
          <button
            onClick={onOpenQuickNote}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-600/25 transition duration-150 flex items-center gap-2 border border-indigo-400/20"
          >
            <Clock className="w-4 h-4" />
            <span>{t.header.quickCapture}</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-700/60 text-sm font-semibold transition flex items-center gap-2"
            title={t.header.settings}
            aria-label={t.header.settings}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>{t.header.settings}</span>
          </button>

          {/* Live Sync Status */}
          <div className="flex items-center space-x-1.5 bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-700/40 text-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-400 text-sm font-medium">{isConnected ? t.header.live : t.header.offline}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

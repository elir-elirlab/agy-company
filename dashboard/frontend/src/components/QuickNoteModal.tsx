import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, department: string) => Promise<void>;
  departments: string[];
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [department, setDepartment] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title, content, department);
      setTitle('');
      setContent('');
      setDepartment('general');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-850 bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/15 p-1.5 rounded-lg border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">{t.quickNote.modalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.quickNote.titleLabel}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.quickNote.titlePlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.quickNote.deptLabel}
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="general">{t.quickNote.generalInbox}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  01_Inbox/{d}/
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.quickNote.contentLabel}
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.quickNote.contentPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-xl transition"
            >
              {t.quickNote.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition duration-150 flex items-center gap-2 border border-indigo-400/20"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? t.quickNote.savingBtn : t.quickNote.saveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

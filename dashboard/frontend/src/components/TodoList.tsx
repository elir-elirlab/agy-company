import React from 'react';
import { CheckSquare, Square, Calendar, ExternalLink } from 'lucide-react';
import { TodoItem } from '../types';
import { getObsidianUri } from '../utils/obsidian';
import { useI18n } from '../i18n/context';

interface TodoListProps {
  todos: TodoItem[];
  todayDate: string;
  onToggleTodo: (lineNumber: number) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, todayDate, onToggleTodo }) => {
  const { t } = useI18n();
  const dailyRelPath = `02_Daily/${todayDate}.md`;
  const obsidianUrl = getObsidianUri(dailyRelPath);

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/70 shadow-lg p-5 flex flex-col h-full overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/80 mb-4 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-500/15 p-1.5 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{t.todos.title}</h2>
          <span className="text-xs bg-slate-700/70 text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-slate-600/40">
            {todayDate}
          </span>
        </div>

        <a
          href={obsidianUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
          title={t.todos.openInObsidian}
        >
          <span>{t.todos.openInObsidian}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {todos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 px-4 text-center">
          <p className="text-base font-medium text-slate-400">{t.todos.noTasks}</p>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
            {t.todos.noTasksHint}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5 overflow-y-auto flex-1 pr-1">
          {todos.map((todo) => (
            <li
              key={todo.line_number}
              onClick={() => onToggleTodo(todo.line_number)}
              className={`flex items-start space-x-3.5 p-3.5 rounded-xl border cursor-pointer transition duration-150 ${
                todo.completed
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through opacity-75'
                  : 'bg-slate-700/40 hover:bg-slate-700/70 border-slate-600/40 text-slate-100 shadow-sm'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-slate-400 hover:text-indigo-400 focus:outline-none transition shrink-0"
                aria-label={todo.completed ? t.todos.markIncomplete : t.todos.markComplete}
              >
                {todo.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 text-base leading-relaxed">
                <span>{todo.text}</span>
                {todo.priority && (
                  <span
                    className={`ml-2.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      todo.priority.toLowerCase().includes('high') || todo.priority.includes('最優先')
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {todo.priority}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

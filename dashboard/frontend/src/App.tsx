import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { DeliverablesList } from './components/DeliverablesList';
import { QuickNoteModal } from './components/QuickNoteModal';
import { FileViewerModal } from './components/FileViewerModal';
import { OrgChartPanel } from './components/OrgChartPanel';
import { SettingsModal } from './components/SettingsModal';
import { StatusResponse, TodoItem, DeliverableMeta } from './types';

import { ActivityHeatmap } from './components/ActivityHeatmap';

export const App: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableMeta[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Modals
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // Fetch all dashboard data
  const refreshData = useCallback(async () => {
    try {
      const [statusRes, todosRes, inboxRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()),
        fetch('/api/todos/today').then((r) => r.json()),
        fetch('/api/inbox').then((r) => r.json())
      ]);

      setStatus(statusRes);
      setTodos(todosRes);
      setDeliverables(inboxRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  // Initial load & WebSocket connection for live reload
  useEffect(() => {
    // Restore user-customized font size from localStorage
    const savedFontSize = localStorage.getItem('agy_company_font_size');
    if (savedFontSize) {
      document.documentElement.style.fontSize = `${savedFontSize}px`;
    }

    // Restore user-customized Mermaid diagram height and modal width
    const savedMermaidHeight = localStorage.getItem('agy_company_mermaid_height');
    if (savedMermaidHeight) {
      document.documentElement.style.setProperty('--mermaid-min-height', `${savedMermaidHeight}px`);
    }

    // Restore user-customized modal maximum width for FileViewerModal (default: 5xl / 64rem)
    const savedModalWidth = localStorage.getItem('agy_company_modal_width') || '5xl';
    const widthMap: Record<string, string> = {
      '4xl': '48rem', // Compact (approx 768px-880px)
      '5xl': '64rem', // Standard (approx 1024px-1180px)
      '6xl': '82rem', // Wide (approx 1312px-1500px)
      '7xl': '95vw',  // Dynamic full width (95% of viewport)
    };
    document.documentElement.style.setProperty('--modal-max-width', widthMap[savedModalWidth] || '64rem');

    refreshData();

    // Set up periodic refresh every 60 seconds to ensure date transitions at midnight are caught
    const intervalId = setInterval(() => {
      refreshData();
    }, 60000);

    // Refresh immediately when tab becomes visible again (e.g. waking up laptop or switching back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // WebSocket connection to backend /ws
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setIsConnected(true);
      socket.onclose = () => setIsConnected(false);
      socket.onmessage = () => {
        // Triggered when file change is detected
        refreshData();
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (socket) socket.close();
    };
  }, [refreshData]);

  // Handle TODO toggle
  const handleToggleTodo = async (lineNumber: number) => {
    if (!status?.today) return;
    const relPath = `02_Daily/${status.today}.md`;

    try {
      const res = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relative_path: relPath, line_number: lineNumber })
      });

      if (res.ok) {
        // Optimistically update local state & sync
        setTodos((prev) =>
          prev.map((t) =>
            t.line_number === lineNumber ? { ...t, completed: !t.completed } : t
          )
        );
        refreshData();
      }
    } catch (err) {
      console.error('Failed to toggle TODO:', err);
    }
  };

  // Handle Quick Note creation
  const handleCreateQuickNote = async (title: string, content: string, department: string) => {
    try {
      const res = await fetch('/api/inbox/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, department })
      });

      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Failed to save quick note:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      <Header
        status={status}
        isConnected={isConnected}
        onOpenQuickNote={() => setIsQuickNoteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="w-full px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Column 1: Activity Heatmap + Org Chart Panel */}
        <section className="lg:col-span-3 flex flex-col gap-6 h-[calc(100vh-140px)]">
          <ActivityHeatmap
            todayDate={status?.today}
            onOpenFile={(path) => setActiveFilePath(path)}
          />
          {/* OrgChartPanel takes remaining height after heatmap, min-h-0 enables flex shrink */}
          <div className="flex-1 min-h-0">
            <OrgChartPanel
              selectedDepartment={selectedDept}
              onSelectDepartment={setSelectedDept}
            />
          </div>
        </section>

        {/* Column 2: Daily Tasks */}
        <section className="lg:col-span-4 h-[calc(100vh-140px)]">
          <TodoList
            todos={todos}
            todayDate={status?.today || 'Today'}
            onToggleTodo={handleToggleTodo}
          />
        </section>

        {/* Column 3: Deliverables in 01_Inbox */}
        <section className="lg:col-span-5 h-[calc(100vh-140px)]">
          <DeliverablesList
            deliverables={deliverables}
            selectedDepartment={selectedDept}
            onSelectDepartment={setSelectedDept}
            onOpenFile={(path) => setActiveFilePath(path)}
          />
        </section>
      </main>

      {/* Modals */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        onSubmit={handleCreateQuickNote}
        departments={status?.departments || []}
      />

      <FileViewerModal
        filePath={activeFilePath}
        onClose={() => setActiveFilePath(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

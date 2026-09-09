import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoList } from '../components/TodoList';
import { I18nProvider } from '../i18n/context';
import { TodoItem } from '../types';

describe('TodoList Component', () => {
  const mockTodos: TodoItem[] = [
    {
      line_number: 5,
      text: 'Draft architecture proposal',
      completed: false,
      priority: 'High'
    },
    {
      line_number: 8,
      text: 'Morning sync meeting',
      completed: true,
      priority: null
    }
  ];

  it('renders task list items with correct priority labels', () => {
    const onToggle = vi.fn();
    render(
      <I18nProvider>
        <TodoList todos={mockTodos} todayDate="2026-09-08" onToggleTodo={onToggle} />
      </I18nProvider>
    );

    expect(screen.getByText('Draft architecture proposal')).toBeInTheDocument();
    expect(screen.getByText('Morning sync meeting')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('triggers toggle callback when clicking on a task item', () => {
    const onToggle = vi.fn();
    render(
      <I18nProvider>
        <TodoList todos={mockTodos} todayDate="2026-09-08" onToggleTodo={onToggle} />
      </I18nProvider>
    );

    const firstTask = screen.getByText('Draft architecture proposal');
    fireEvent.click(firstTask);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it('renders empty state when there are no tasks', () => {
    const onToggle = vi.fn();
    render(
      <I18nProvider>
        <TodoList todos={[]} todayDate="2026-09-08" onToggleTodo={onToggle} />
      </I18nProvider>
    );

    expect(screen.getByText(/本日のタスクはありません|No tasks found for today/)).toBeInTheDocument();
  });
});

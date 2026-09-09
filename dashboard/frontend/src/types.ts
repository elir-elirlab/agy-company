// Type definitions for agy-company dashboard

export interface TodoItem {
  line_number: number;
  text: string;
  completed: boolean;
  priority?: string | null;
}

export interface DeliverableMeta {
  id?: string;
  aliases?: string[];
  tags: string[];
  created?: string;
  updated?: string;
  links: string[];
  title: string;
  relative_path: string;
  department: string;
}

export interface StatusResponse {
  today: string;
  has_daily_note: boolean;
  todos: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  deliverables_count: number;
  departments: string[];
}

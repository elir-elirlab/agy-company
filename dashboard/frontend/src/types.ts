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
  summary?: string[];
  // Document purpose type: knowledge | proposal | discussion | undefined
  doc_type?: string;
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

export interface DepartmentDetail {
  id: string;
  name: string;
  short_name?: string;
  role: string;
  translations?: {
    ja?: { name: string; short_name?: string; role: string };
    en?: { name: string; short_name?: string; role: string };
  };
  deliverables_count: number;
  path: string;
}

export interface OrgChartData {
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


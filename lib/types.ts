// 数据类型定义

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string; // JSON字符串
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
  };
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  project_id: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  available: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResult {
  type: 'note' | 'todo' | 'project';
  id: number;
  title: string;
  content: string;
  relevance: number;
}
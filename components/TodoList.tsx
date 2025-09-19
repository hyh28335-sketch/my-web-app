'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check, Clock, AlertCircle } from 'lucide-react';

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface TodoListProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodoList: React.FC<TodoListProps> = ({ isOpen, onClose }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  });

  // 获取所有待办事项
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/todos');
      if (!response.ok) {
        throw new Error('获取待办事项失败');
      }
      const data = await response.json();
      setTodos(data.todos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取待办事项失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建待办事项
  const createTodo = async () => {
    if (!newTodo.title.trim()) return;

    try {
      setLoading(true);
      const todoData = {
        ...newTodo,
        due_date: newTodo.due_date || null
      };

      const response = await fetch('http://localhost:5000/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      if (!response.ok) {
        throw new Error('创建待办事项失败');
      }

      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
      setIsCreating(false);
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建待办事项失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新待办事项
  const updateTodo = async (todo: Todo) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      });

      if (!response.ok) {
        throw new Error('更新待办事项失败');
      }

      setEditingTodo(null);
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新待办事项失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换完成状态
  const toggleComplete = async (todo: Todo) => {
    await updateTodo({ ...todo, completed: !todo.completed });
  };

  // 删除待办事项
  const deleteTodo = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除待办事项失败');
      }

      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除待办事项失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchTodos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">待办事项</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="添加待办事项"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 创建新待办事项 */}
          {isCreating && (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-4">创建新待办事项</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="待办事项标题..."
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
                />
                <textarea
                  placeholder="描述（可选）..."
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 resize-none"
                  rows={3}
                />
                <div className="flex space-x-4">
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createTodo}
                    disabled={loading || !newTodo.title.trim()}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 待办事项列表 */}
          {loading && todos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">暂无待办事项</p>
              <p className="text-white/40 text-sm mt-2">点击右上角的 + 按钮添加新的待办事项</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 bg-white/5 border border-white/10 rounded-lg transition-all ${
                    todo.completed ? 'opacity-60' : ''
                  }`}
                >
                  {editingTodo?.id === todo.id ? (
                    // 编辑模式
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTodo.title}
                        onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                      />
                      <textarea
                        value={editingTodo.description}
                        onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-blue-400/50"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateTodo(editingTodo)}
                          className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingTodo(null)}
                          className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 rounded text-sm hover:bg-white/10 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(todo)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-white/30 hover:border-white/50'
                        }`}
                      >
                        {todo.completed && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${todo.completed ? 'line-through text-white/50' : 'text-white'}`}>
                            {todo.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(todo.priority)}`}>
                            {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        
                        {todo.description && (
                          <p className={`text-sm mb-2 ${todo.completed ? 'text-white/40' : 'text-white/70'}`}>
                            {todo.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-white/50">
                          <span>创建于 {formatDate(todo.created_at)}</span>
                          {todo.due_date && (
                            <span className="flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>截止 {formatDate(todo.due_date)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingTodo(todo)}
                          className="p-1 text-white/40 hover:text-white/70 hover:bg-white/10 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
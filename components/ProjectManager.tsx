'use client';

import React, { useState, useEffect } from 'react';

// 项目数据类型定义
interface Project {
  id: number;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    progress_percentage: number;
  };
}

// 任务数据类型定义
interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  due_date?: string;
  project_id: number;
  created_at: string;
  updated_at: string;
}

// 里程碑数据类型定义
interface Milestone {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed';
  project_id: number;
  created_at: string;
}

// 组件Props类型定义
interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose }) => {
  // 状态管理
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<'projects' | 'tasks' | 'timeline' | 'stats'>('projects');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 表单状态
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    start_date: '',
    end_date: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assignee: '',
    due_date: '',
    project_id: 0
  });

  // 加载项目数据
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载任务数据
  const loadTasks = async (projectId?: number) => {
    try {
      const url = projectId 
        ? `http://localhost:5000/api/projects/${projectId}/tasks`
        : 'http://localhost:5000/api/tasks';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  };

  // 加载里程碑数据
  const loadMilestones = async (projectId?: number) => {
    try {
      const url = projectId 
        ? `http://localhost:5000/api/projects/${projectId}/milestones`
        : 'http://localhost:5000/api/milestones';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.data || []);
      }
    } catch (error) {
      console.error('加载里程碑失败:', error);
    }
  };

  // 创建项目
  const createProject = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectForm),
      });

      if (response.ok) {
        await loadProjects();
        setShowCreateProject(false);
        resetProjectForm();
      }
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  // 更新项目
  const updateProject = async () => {
    if (!editingProject) return;

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectForm),
      });

      if (response.ok) {
        await loadProjects();
        setEditingProject(null);
        resetProjectForm();
      }
    } catch (error) {
      console.error('更新项目失败:', error);
    }
  };

  // 删除项目
  const deleteProject = async (projectId: number) => {
    if (!confirm('确定要删除这个项目吗？这将同时删除所有相关任务。')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      }
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  };

  // 创建任务
  const createTask = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        await loadTasks(selectedProject?.id);
        await loadProjects(); // 重新加载项目以更新统计信息
        setShowCreateTask(false);
        resetTaskForm();
      }
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  // 更新任务
  const updateTask = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        await loadTasks(selectedProject?.id);
        await loadProjects(); // 重新加载项目以更新统计信息
        setEditingTask(null);
        resetTaskForm();
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  // 删除任务
  const deleteTask = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTasks(selectedProject?.id);
        await loadProjects(); // 重新加载项目以更新统计信息
      }
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  // 重置表单
  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      start_date: '',
      end_date: ''
    });
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: '',
      due_date: '',
      project_id: selectedProject?.id || 0
    });
  };

  // 编辑项目
  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : ''
    });
    setShowCreateProject(true);
  };

  // 编辑任务
  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      project_id: task.project_id
    });
    setShowCreateTask(true);
  };

  // 选择项目
  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('tasks');
    loadTasks(project.id);
    loadMilestones(project.id);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-500',
      active: 'bg-green-500',
      on_hold: 'bg-yellow-500',
      completed: 'bg-purple-500',
      cancelled: 'bg-red-500',
      todo: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      done: 'bg-green-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      urgent: 'text-red-400'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-400';
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // 如果模态框未打开，不渲染
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">项目管理</h2>
              <p className="text-white/70">管理你的项目和任务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 导航栏 */}
        <div className="flex items-center space-x-1 p-6 border-b border-white/20">
          {[
            { key: 'projects', label: '项目列表', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { key: 'tasks', label: '任务管理', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { key: 'timeline', label: '时间线', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { key: 'stats', label: '统计', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentView(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                currentView === tab.key
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden">
          {/* 项目列表视图 */}
          {currentView === 'projects' && (
            <div className="h-full flex flex-col">
              {/* 操作栏 */}
              <div className="flex items-center justify-between p-6">
                <h3 className="text-xl font-semibold text-white">项目列表</h3>
                <button
                  onClick={() => {
                    resetProjectForm();
                    setEditingProject(null);
                    setShowCreateProject(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>新建项目</span>
                </button>
              </div>

              {/* 项目网格 */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                        onClick={() => selectProject(project)}
                      >
                        {/* 项目头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                              {project.title}
                            </h4>
                            <p className="text-white/70 text-sm line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditProject(project);
                              }}
                              className="text-white/70 hover:text-white transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                              }}
                              className="text-white/70 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* 状态和优先级 */}
                        <div className="flex items-center space-x-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>

                        {/* 进度条 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/70 text-sm">进度</span>
                            <span className="text-white text-sm font-medium">
                              {project.stats.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.stats.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 任务统计 */}
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-white text-lg font-bold">{project.stats.total_tasks}</div>
                            <div className="text-white/70 text-xs">总任务</div>
                          </div>
                          <div>
                            <div className="text-green-400 text-lg font-bold">{project.stats.completed_tasks}</div>
                            <div className="text-white/70 text-xs">已完成</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 任务管理视图 */}
          {currentView === 'tasks' && (
            <div className="h-full flex flex-col">
              {/* 操作栏 */}
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('projects')}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {selectedProject ? selectedProject.title : '任务管理'}
                    </h3>
                    {selectedProject && (
                      <p className="text-white/70 text-sm">{selectedProject.description}</p>
                    )}
                  </div>
                </div>
                {selectedProject && (
                  <button
                    onClick={() => {
                      resetTaskForm();
                      setTaskForm(prev => ({ ...prev, project_id: selectedProject.id }));
                      setEditingTask(null);
                      setShowCreateTask(true);
                    }}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>新建任务</span>
                  </button>
                )}
              </div>

              {/* 任务列表 */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {selectedProject ? (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">{task.title}</h4>
                            <p className="text-white/70 text-sm mb-4">{task.description}</p>
                            
                            <div className="flex items-center space-x-4 mb-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.assignee && (
                                <span className="text-white/70 text-sm">
                                  负责人: {task.assignee}
                                </span>
                              )}
                              {task.due_date && (
                                <span className="text-white/70 text-sm">
                                  截止: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => startEditTask(task)}
                              className="text-white/70 hover:text-white transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-white/70 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-white/70">请先选择一个项目</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 时间线视图 */}
          {currentView === 'timeline' && (
            <div className="h-full flex flex-col">
              {/* 操作栏 */}
              <div className="flex items-center justify-between p-6">
                <h3 className="text-xl font-semibold text-white">项目时间线</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === parseInt(e.target.value));
                      if (project) {
                        setSelectedProject(project);
                        loadTasks(project.id);
                        loadMilestones(project.id);
                      }
                    }}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">选择项目</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 时间线内容 */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {selectedProject ? (
                  <div className="relative">
                    {/* 时间线主轴 */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>
                    
                    <div className="space-y-8">
                      {/* 项目开始 */}
                      {selectedProject.start_date && (
                        <div className="relative flex items-center">
                          <div className="absolute left-6 w-4 h-4 bg-green-500 rounded-full border-4 border-white/20"></div>
                          <div className="ml-16 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <h4 className="text-white font-semibold">项目开始</h4>
                            </div>
                            <p className="text-white/70 text-sm">{selectedProject.title}</p>
                            <p className="text-white/50 text-xs mt-1">
                              {new Date(selectedProject.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 里程碑 */}
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="relative flex items-center">
                          <div className={`absolute left-6 w-4 h-4 rounded-full border-4 border-white/20 ${
                            milestone.status === 'completed' ? 'bg-purple-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="ml-16 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              <h4 className="text-white font-semibold">{milestone.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {milestone.status === 'completed' ? '已完成' : '进行中'}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm">{milestone.description}</p>
                            <p className="text-white/50 text-xs mt-1">
                              截止: {new Date(milestone.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* 任务 */}
                      {tasks.filter(task => task.due_date).sort((a, b) => 
                        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
                      ).map((task) => (
                        <div key={task.id} className="relative flex items-center">
                          <div className={`absolute left-6 w-4 h-4 rounded-full border-4 border-white/20 ${
                            task.status === 'done' ? 'bg-green-500' : 
                            task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}></div>
                          <div className="ml-16 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <h4 className="text-white font-semibold">{task.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {task.status === 'done' ? '已完成' : 
                                 task.status === 'in_progress' ? '进行中' : '待办'}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm">{task.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-white/50">
                              {task.assignee && (
                                <span>负责人: {task.assignee}</span>
                              )}
                              <span>截止: {new Date(task.due_date!).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 项目结束 */}
                      {selectedProject.end_date && (
                        <div className="relative flex items-center">
                          <div className="absolute left-6 w-4 h-4 bg-red-500 rounded-full border-4 border-white/20"></div>
                          <div className="ml-16 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              <h4 className="text-white font-semibold">项目结束</h4>
                            </div>
                            <p className="text-white/70 text-sm">项目计划完成</p>
                            <p className="text-white/50 text-xs mt-1">
                              {new Date(selectedProject.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-white/70">请选择一个项目查看时间线</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 统计视图 */}
          {currentView === 'stats' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-white/70">统计功能开发中...</p>
              </div>
            </div>
          )}
        </div>

        {/* 创建/编辑项目模态框 */}
        {showCreateProject && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-2xl mx-4 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                {editingProject ? '编辑项目' : '创建新项目'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">项目标题</label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="输入项目标题..."
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">项目描述</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="输入项目描述..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">状态</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value as Project['status'] }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="planning">规划中</option>
                      <option value="active">进行中</option>
                      <option value="on_hold">暂停</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">优先级</label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, priority: e.target.value as Project['priority'] }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">开始日期</label>
                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">结束日期</label>
                    <input
                      type="date"
                      value={projectForm.end_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowCreateProject(false);
                    setEditingProject(null);
                    resetProjectForm();
                  }}
                  className="px-6 py-2 text-white/70 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={editingProject ? updateProject : createProject}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  {editingProject ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 创建/编辑任务模态框 */}
        {showCreateTask && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-2xl mx-4 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                {editingTask ? '编辑任务' : '创建新任务'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">任务标题</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="输入任务标题..."
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">任务描述</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="输入任务描述..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">状态</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="todo">待办</option>
                      <option value="in_progress">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">优先级</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">负责人</label>
                    <input
                      type="text"
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="输入负责人..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">截止日期</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowCreateTask(false);
                    setEditingTask(null);
                    resetTaskForm();
                  }}
                  className="px-6 py-2 text-white/70 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={editingTask ? updateTask : createTask}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                >
                  {editingTask ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
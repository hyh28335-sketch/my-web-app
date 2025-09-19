"use client";

import React, { useState, useEffect } from 'react';
import { noteService } from '@/lib/services/noteService';
import { Note } from '@/lib/types';
import NoteEditor from './NoteEditor';
import AIChat from './AIChat';
import SearchModal from './SearchModal';
import TodoList from './TodoList';
import PomodoroTimer from './PomodoroTimer';
import ProjectManager from './ProjectManager';
import CardSlider from './CardSlider';

export default function MainContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);

  // 加载笔记
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await noteService.getAllNotes();
      setNotes(notesData.slice(0, 3)); // 只显示最近3条
    } catch (error) {
      console.error('加载笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setShowNoteEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteEditor(true);
  };

  const handleSaveNote = (savedNote: Note) => {
    if (editingNote) {
      // 更新现有笔记
      setNotes(notes.map(note => note.id === savedNote.id ? savedNote : note));
    } else {
      // 添加新笔记
      setNotes([savedNote, ...notes]);
    }
    loadNotes(); // 重新加载以获取最新数据
  };

  const handleDeleteNote = async (noteId: number) => {
    if (confirm('确定要删除这条笔记吗？')) {
      try {
        await noteService.deleteNote(noteId);
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('删除笔记失败:', error);
        alert('删除笔记失败，请重试');
      }
    }
  };

  const handleAIChat = () => {
    setShowAIChat(true);
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const handleTodoList = () => {
    setShowTodoList(true);
  };

  const handlePomodoroTimer = () => {
    setShowPomodoroTimer(true);
  };

  const handleProjectManager = () => {
    setShowProjectManager(true);
  };

  const handleSelectNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteEditor(true);
  };
  return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center px-4">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 text-shadow">
          欢迎使用
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            {" "}AI智能工作台
          </span>
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto text-shadow">
          让AI助手帮你整理思路，记录灵感，提升工作效率
        </p>
      </div>

      {/* Quick Actions - 炫酷卡片滑动 */}
      <div className="w-full mb-12">
        <CardSlider cards={[
          {
            id: 'new-note',
            title: '新建笔记',
            description: '创建一个新的智能笔记，AI将帮助你整理内容',
            gradient: 'bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-md',
            onClick: handleNewNote,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )
          },
          {
            id: 'ai-chat',
            title: 'AI助手',
            description: '与AI对话，获取写作建议和内容优化',
            gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md',
            onClick: handleAIChat,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          },
          {
            id: 'search',
            title: '智能搜索',
            description: '快速找到你需要的笔记和信息',
            gradient: 'bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md',
            onClick: handleSearch,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )
          },
          {
            id: 'todo',
            title: '待办事项',
            description: '管理你的任务和计划，提升工作效率',
            gradient: 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 backdrop-blur-md',
            onClick: handleTodoList,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          {
            id: 'pomodoro',
            title: '番茄钟',
            description: '专注工作，高效管理时间',
            gradient: 'bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-md',
            onClick: handlePomodoroTimer,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          {
            id: 'project',
            title: '项目管理',
            description: '管理项目和任务，提升团队协作',
            gradient: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-md',
            onClick: handleProjectManager,
            icon: (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            )
          }
        ]} />
      </div>

      {/* Recent Notes Section */}
      <div className="w-full max-w-6xl">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">最近的笔记</h3>
            <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
              查看全部
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              // 加载状态
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 border border-white/20 animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-3"></div>
                  <div className="h-3 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded mb-3"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-12 bg-white/20 rounded-full"></div>
                    <div className="h-6 w-12 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              ))
            ) : notes.length > 0 ? (
              // 真实笔记数据
              notes.map((note) => {
                const tags = noteService.parseTags(note.tags || '[]');
                const timeAgo = new Date(note.updated_at).toLocaleDateString('zh-CN');
                
                return (
                  <div key={note.id} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-white font-medium truncate cursor-pointer" onClick={() => handleEditNote(note)}>
                        {note.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white/60 whitespace-nowrap">{timeAgo}</span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNote(note);
                            }}
                            className="p-1 text-white/60 hover:text-blue-400 transition-colors"
                            title="编辑"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="p-1 text-white/60 hover:text-red-400 transition-colors"
                            title="删除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-3 line-clamp-3 cursor-pointer" onClick={() => handleEditNote(note)}>
                      {note.content || '暂无内容...'}
                    </p>
                    <div className="flex items-center space-x-2 flex-wrap">
                      {Array.isArray(tags) && tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {Array.isArray(tags) && tags.length > 2 && (
                        <span className="text-xs text-white/60">+{tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // 空状态
              <div className="col-span-full text-center py-8">
                <div className="text-white/60 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">还没有笔记</p>
                  <p className="text-sm">点击"新建笔记"开始记录你的想法</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Floating Button */}
      <div className="fixed bottom-8 right-8">
        <button 
          onClick={handleAIChat}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        >
          <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* 笔记编辑器 */}
      <NoteEditor
        isOpen={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />

      {/* AI聊天 */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* 搜索模态框 */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectNote={handleSelectNote}
      />

      {/* 待办事项 */}
      <TodoList
        isOpen={showTodoList}
        onClose={() => setShowTodoList(false)}
      />

      {/* 番茄钟 */}
      <PomodoroTimer
        isOpen={showPomodoroTimer}
        onClose={() => setShowPomodoroTimer(false)}
      />

      {/* 项目管理 */}
      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />
    </div>
  );
}
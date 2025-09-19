'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Calendar } from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string; // JSON字符串
  created_at: string;
  updated_at: string;
}

interface SearchResult {
  success: boolean;
  data: Note[];
  total: number;
  search_type: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectNote }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 搜索函数
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const data: SearchResult = await response.json();
        if (data.success) {
          setResults(data.data);
          setHasSearched(true);
        } else {
          console.error('搜索失败:', data);
          setResults([]);
        }
      } else {
        console.error('搜索请求失败');
        setResults([]);
      }
    } catch (error) {
      console.error('搜索错误:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  // 高亮搜索关键词
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // 截取内容预览
  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 重置搜索状态
  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  // 关闭模态框时重置状态
  const handleClose = () => {
    resetSearch();
    onClose();
  };

  // 选择笔记
  const handleSelectNote = (note: Note) => {
    onSelectNote(note);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">搜索笔记</h2>
              <p className="text-sm text-white/60">快速查找您的笔记</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-6 border-b border-white/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入关键词搜索笔记..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="ml-3 text-white/60">搜索中...</span>
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="p-4 space-y-3">
                <div className="text-sm text-white/60 mb-4">
                  找到 {results.length} 条相关笔记
                </div>
                {results.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white flex-1">
                        {highlightText(note.title, query)}
                      </h3>
                      <FileText className="h-5 w-5 text-white/40 ml-2 flex-shrink-0" />
                    </div>
                    
                    <p className="text-white/70 text-sm mb-3 line-clamp-3">
                      {highlightText(getContentPreview(note.content), query)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        更新于 {formatDate(note.updated_at)}
                      </div>
                      {note.tags && (() => {
                        try {
                          const parsedTags = JSON.parse(note.tags);
                          return parsedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsedTags.slice(0, 3).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white/10 text-white/70 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {parsedTags.length > 3 && (
                                <span className="text-white/40">+{parsedTags.length - 3}</span>
                              )}
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/50">
              <Search className="h-12 w-12 mb-4 text-white/30" />
              <p className="text-lg font-medium mb-2">未找到相关笔记</p>
              <p className="text-sm">尝试使用不同的关键词搜索</p>
            </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/50">
              <Search className="h-12 w-12 mb-4 text-white/30" />
              <p className="text-lg font-medium mb-2">开始搜索</p>
              <p className="text-sm">输入关键词来查找您的笔记</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ExternalLink, Globe, Clock, Bookmark } from 'lucide-react';

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleSearchModal: React.FC<GoogleSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从本地存储加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('googleSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // ESC键关闭模态框
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Ctrl/Cmd + Enter 执行搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, onClose]);

  // 生成搜索建议
  const generateSuggestions = (inputQuery: string) => {
    if (!inputQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const commonSuggestions = [
      `${inputQuery} 是什么`,
      `${inputQuery} 怎么用`,
      `${inputQuery} 教程`,
      `${inputQuery} 最新`,
      `${inputQuery} 下载`
    ];

    // 从搜索历史中筛选相关建议
    const historySuggestions = searchHistory
      .filter(item => item.toLowerCase().includes(inputQuery.toLowerCase()))
      .slice(0, 3);

    const allSuggestions = [...historySuggestions, ...commonSuggestions].slice(0, 5);
    setSuggestions(allSuggestions);
    setShowSuggestions(true);
  };

  // 保存搜索历史到本地存储
  const saveSearchHistory = (searchQuery: string) => {
    const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('googleSearchHistory', JSON.stringify(updatedHistory));
  };

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      const response = await fetch('http://localhost:5001/api/google-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`搜索请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换数据格式以匹配组件期望的结构
      const formattedResults = data.results.map((result: any) => ({
        title: result.title,
        link: result.url,
        snippet: result.snippet,
        displayLink: result.displayUrl
      }));
      
      setResults(formattedResults);
      saveSearchHistory(searchQuery);
    } catch (error) {
      console.error('搜索失败:', error);
      setError(error instanceof Error ? error.message : '搜索服务暂时不可用，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 调用真实的Google搜索API
  const handleSearch = async () => {
    await performSearch(query.trim());
  };

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 打开链接
  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 保存到笔记
  const saveToNote = async (result: GoogleSearchResult) => {
    const noteContent = `# ${result.title}\n\n**来源**: [${result.displayLink}](${result.link})\n\n**摘要**: ${result.snippet}\n\n**搜索关键词**: ${query}\n\n**保存时间**: ${new Date().toLocaleString()}\n\n---\n\n*此内容来自Google搜索结果*`;
    
    try {
      const response = await fetch('http://localhost:5001/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `搜索结果: ${result.title}`,
          content: noteContent,
          tags: ['搜索结果', query.trim()].filter(Boolean)
        }),
      });

      if (response.ok) {
        alert('已成功保存到笔记！');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存到笔记失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('googleSearchHistory');
  };

  // 清除搜索结果
  const clearSearchResults = () => {
    setResults([]);
    setQuery('');
    setHasSearched(false);
    setError(null);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Google 搜索</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-6 border-b border-white/20">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  generateSuggestions(e.target.value);
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => generateSuggestions(query)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="输入搜索关键词..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 outline-none text-white placeholder-white/60"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
            {(hasSearched || results.length > 0) && (
              <button
                onClick={clearSearchResults}
                className="px-4 py-3 bg-red-500/80 text-white rounded-lg hover:bg-red-600/80 transition-colors"
                title="清除搜索结果"
              >
                清除
              </button>
            )}
          </div>

          {/* 搜索建议 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg absolute z-10 w-full max-w-2xl">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/20 first:rounded-t-lg last:rounded-b-lg border-b border-white/20 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-white/60" />
                    <span className="text-white">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史 */}
          {searchHistory.length > 0 && !hasSearched && !showSuggestions && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  搜索历史
                </span>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-white/60 hover:text-white/80"
                >
                  清除
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(historyItem)}
                    className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm hover:bg-white/20 transition-colors border border-white/20"
                  >
                    {historyItem}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-white/80">正在搜索...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium">搜索出错了</p>
              <p className="text-sm text-white/60 mt-2">{error}</p>
              <button
                onClick={() => handleSearch()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/80">没有找到相关结果</p>
              <p className="text-sm text-white/60 mt-2">请尝试使用不同的关键词</p>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/80">输入关键词开始搜索</p>
              <p className="text-sm text-white/60 mt-2">搜索全网内容，发现更多信息</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-green-400">{result.displayLink}</span>
                      </div>
                      <h3 className="text-lg font-medium text-blue-400 hover:text-blue-300 cursor-pointer mb-2"
                          onClick={() => openLink(result.link)}>
                        {result.title}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed mb-3">
                        {result.snippet}
                      </p>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => openLink(result.link)}
                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>打开链接</span>
                        </button>
                        <button
                          onClick={() => saveToNote(result)}
                          className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm"
                        >
                          <Bookmark className="w-4 h-4" />
                          <span>保存到笔记</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSearchModal;
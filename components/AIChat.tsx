"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是你的AI助手，可以帮你整理笔记、提供写作建议、回答问题。有什么我可以帮助你的吗？',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 调用真实的AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          // 允许通过环境变量设置默认模型
          model: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'claude-3.5-sonnet'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || '抱歉，我现在无法回应。请稍后再试。',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI响应失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，AI服务暂时不可用。请检查网络连接或稍后再试。',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('笔记') || input.includes('记录')) {
      return '关于笔记管理，我建议你：\n\n1. 使用清晰的标题来概括主要内容\n2. 添加相关标签便于后续查找\n3. 定期回顾和整理笔记\n4. 使用结构化的格式，如列表或段落\n\n需要我帮你优化某个特定的笔记吗？';
    }
    
    if (input.includes('写作') || input.includes('文章')) {
      return '写作建议：\n\n📝 **结构化思考**\n- 明确主题和目标读者\n- 列出要点大纲\n- 逐步展开每个要点\n\n✨ **提升质量**\n- 使用具体的例子和数据\n- 保持逻辑清晰\n- 适当使用过渡词\n\n你想写什么类型的文章呢？';
    }
    
    if (input.includes('搜索') || input.includes('查找')) {
      return '智能搜索技巧：\n\n🔍 **关键词搜索**\n- 使用核心关键词\n- 尝试同义词和相关词\n\n🏷️ **标签筛选**\n- 利用标签快速定位\n- 组合多个标签精确查找\n\n📅 **时间范围**\n- 按创建或修改时间筛选\n\n需要我帮你找什么内容吗？';
    }
    
    if (input.includes('你好') || input.includes('hello')) {
      return '你好！很高兴为你服务！🎉\n\n我可以帮助你：\n• 📝 整理和优化笔记内容\n• ✍️ 提供写作建议和灵感\n• 🔍 协助搜索和查找信息\n• 💡 回答各种问题\n\n有什么具体需要帮助的吗？';
    }
    
    if (input.includes('谢谢') || input.includes('感谢')) {
      return '不客气！很高兴能帮到你！😊\n\n如果还有其他问题，随时可以问我。我会尽力为你提供有用的建议和帮助。';
    }
    
    // 默认响应
    const responses = [
      '这是一个很有趣的问题！让我来帮你分析一下...\n\n基于你的描述，我建议你可以从以下几个角度来思考：\n\n1. 明确目标和预期结果\n2. 分析现有资源和限制\n3. 制定具体的行动计划\n4. 设置检查点和调整机制\n\n你觉得哪个方面最需要关注呢？',
      
      '很好的想法！💡\n\n为了更好地帮助你，我想了解更多细节：\n\n• 你的具体目标是什么？\n• 目前遇到了什么挑战？\n• 有什么资源可以利用？\n\n这样我就能给出更针对性的建议了。',
      
      '我理解你的想法。这确实需要仔细考虑。\n\n建议你可以：\n\n📋 **整理思路**\n- 列出所有相关因素\n- 分析优缺点\n\n🎯 **设定优先级**\n- 确定最重要的目标\n- 制定时间计划\n\n💪 **开始行动**\n- 从小步骤开始\n- 持续调整优化\n\n需要我帮你细化某个步骤吗？'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI助手</h2>
              <p className="text-sm text-white/60">智能写作伙伴</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-white/50'}`}>
                  {message.timestamp.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-white/60 text-sm">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/20">
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题或想法..."
              rows={1}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}
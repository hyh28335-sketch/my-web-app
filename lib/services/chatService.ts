// AI聊天服务
import { apiGet, apiPost } from '../api';
import { ChatMessage, AIModel, ApiResponse } from '../types';

// 默认模型支持通过环境变量配置
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'claude-3.5-sonnet';

export const chatService = {
  // 获取可用的AI模型
  async getModels(): Promise<AIModel[]> {
    const response = await apiGet<ApiResponse<AIModel[]>>('/api/models');
    return response.data || [];
  },

  // 发送聊天消息
  async sendMessage(message: string, model: string = DEFAULT_MODEL): Promise<string> {
    const response = await apiPost<ApiResponse<{ response: string }>>('/api/chat', {
      message,
      model
    });
    
    if (!response.data) {
      throw new Error('AI响应失败');
    }
    
    return response.data.response;
  },

  // 智能搜索
  async search(query: string): Promise<any[]> {
    const response = await apiPost<ApiResponse<any[]>>('/api/search', {
      query
    });
    
    return response.data || [];
  }
};
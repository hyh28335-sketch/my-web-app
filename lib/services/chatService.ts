// AI聊天服务
import { apiGet, apiPost } from '../api';
import { ChatMessage, AIModel, ApiResponse } from '../types';

export const chatService = {
  // 获取可用的AI模型
  async getModels(): Promise<AIModel[]> {
    const response = await apiGet<ApiResponse<AIModel[]>>('/api/models');
    return response.data || [];
  },

  // 发送聊天消息
  async sendMessage(message: string, model: string = 'claude-3.5-sonnet'): Promise<string> {
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
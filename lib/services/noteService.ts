// 笔记服务
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { Note, ApiResponse } from '../types';

export const noteService = {
  // 获取所有笔记
  async getAllNotes(): Promise<Note[]> {
    const response = await apiGet<ApiResponse<Note[]>>('/api/notes');
    return response.data || [];
  },

  // 获取单个笔记
  async getNote(id: number): Promise<Note> {
    const response = await apiGet<ApiResponse<Note>>(`/api/notes/${id}`);
    if (!response.data) {
      throw new Error('笔记不存在');
    }
    return response.data;
  },

  // 创建笔记
  async createNote(noteData: Partial<Note>): Promise<Note> {
    const response = await apiPost<ApiResponse<Note>>('/api/notes', noteData);
    if (!response.data) {
      throw new Error('创建笔记失败');
    }
    return response.data;
  },

  // 更新笔记
  async updateNote(id: number, noteData: Partial<Note>): Promise<Note> {
    const response = await apiPut<ApiResponse<Note>>(`/api/notes/${id}`, noteData);
    if (!response.data) {
      throw new Error('更新笔记失败');
    }
    return response.data;
  },

  // 删除笔记
  async deleteNote(id: number): Promise<void> {
    await apiDelete<ApiResponse<void>>(`/api/notes/${id}`);
  },

  // 解析标签
  parseTags(tagsString: string): string[] {
    try {
      return JSON.parse(tagsString) || [];
    } catch {
      return [];
    }
  },

  // 格式化标签
  formatTags(tags: string[]): string {
    return JSON.stringify(tags);
  }
};
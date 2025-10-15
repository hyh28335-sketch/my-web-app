import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../lib/api';

export async function GET(request: NextRequest) {
  try {
    // 代理请求到后端Flask服务器
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Models API Error:', error);
    return NextResponse.json(
      { error: '无法获取AI模型列表' },
      { status: 500 }
    );
  }
}
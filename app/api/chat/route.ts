import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 代理请求到后端Flask服务器
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'AI服务暂时不可用，请稍后再试' },
      { status: 500 }
    );
  }
}
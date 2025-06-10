import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // 清除 auth token cookie
  response.cookies.delete('auth-token');
  
  return response;
}
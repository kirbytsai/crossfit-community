import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.append('response_type', 'code');
  lineAuthUrl.searchParams.append('client_id', process.env.LINE_CHANNEL_ID!);
  lineAuthUrl.searchParams.append('redirect_uri', process.env.LINE_REDIRECT_URI!);
  lineAuthUrl.searchParams.append('state', state);
  lineAuthUrl.searchParams.append('scope', 'profile openid');
  lineAuthUrl.searchParams.append('nonce', nonce);
  
  // 建立重定向回應
  const response = NextResponse.redirect(lineAuthUrl.toString());
  
  // 設定 cookie 來儲存 state（修正 cookie 設定）
  response.cookies.set('line_auth_state', state, {
    httpOnly: true,
    secure: false, // 開發環境設為 false
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 分鐘
    path: '/', // 確保 cookie 在所有路徑可用
  });
  
  return response;
}
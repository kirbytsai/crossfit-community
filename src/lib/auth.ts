import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LineProfile } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JWTPayload {
  userId: string;
  lineUserId: string;
  username: string;
}

// 生成 JWT Token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// 驗證 JWT Token
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// 解析 Bearer Token
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Hash 密碼（如果未來需要的話）
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 驗證密碼
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// LINE API 相關函數
export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LINE profile');
  }

  return response.json();
}

// 驗證 LINE Access Token
export async function verifyLineAccessToken(accessToken: string): Promise<boolean> {
  const response = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.client_id === process.env.LINE_CHANNEL_ID;
}
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { generateToken, getLineProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('Callback received:', { code: !!code, state, error });

    // 檢查錯誤
    if (error) {
      console.error('LINE auth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${error}&description=${errorDescription}`
      );
    }

    // 驗證 state
    const storedState = request.cookies.get('line_auth_state')?.value;
    console.log('State comparison:', { received: state, stored: storedState });
    
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { state, storedState });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_state`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`
      );
    }

    // 交換 code 取得 access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINE_REDIRECT_URI!,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    // 取得用戶資料
    const profile = await getLineProfile(access_token);

    // 連接資料庫
    await dbConnect();

    // 查找或創建用戶
    let user = await UserModel.findByLineUserId(profile.userId);

    if (!user) {
      // 新用戶，需要創建帳號
      // 生成唯一的 username（可以之後讓用戶修改）
      let username = profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      let suffix = 1;
      
      while (await UserModel.isUsernameTaken(username)) {
        username = `${profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}${suffix}`;
        suffix++;
      }

      user = await UserModel.create({
        lineUserId: profile.userId,
        username,
        displayName: profile.displayName,
        profilePicture: profile.pictureUrl,
      });
    } else {
      // 更新現有用戶的資料
      user.displayName = profile.displayName;
      if (profile.pictureUrl) {
        user.profilePicture = profile.pictureUrl;
      }
      await user.save();
    }

    // 生成 JWT token
    const token = generateToken({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      lineUserId: user.lineUserId,
      username: user.username,
    });

    // 設定 cookie 並重定向到首頁
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile`);
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // 開發環境設為 false
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/', // 確保 cookie 在所有路徑可用
    });

    // 清除 state cookie
    response.cookies.delete('line_auth_state');

    return response;
  } catch (error) {
    console.error('LINE callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=server_error`
    );
  }
}
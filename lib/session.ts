import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import crypto from "crypto";

export type SessionData = {
  githubToken?: string;
  createdAt?: number;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "gh_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24時間
  },
};

// サーバーサイドでセッションからトークンを取得
export async function getSessionToken(): Promise<string | undefined> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  return session.githubToken;
}

// Rate Limit用のidentifier（トークンのハッシュ値）
// トークン未設定時はnullを返し、呼び出し元でIPフォールバックする
export async function getSessionIdentifier(): Promise<string | null> {
  const token = await getSessionToken();
  if (token) {
    return crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);
  }
  return null;
}

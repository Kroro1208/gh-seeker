import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionOptions, SessionData } from "@/lib/session";
import { logger } from "@/lib/logger";

const GITHUB_TOKEN_REGEX =
  /^(ghp_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9_]{20,})$/;

// トークン保存
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    if (!GITHUB_TOKEN_REGEX.test(token)) {
      return NextResponse.json(
        { error: "Invalid token format. Expected format: ghp_..." },
        { status: 400 },
      );
    }

    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    );

    session.githubToken = token;
    session.createdAt = Date.now();
    await session.save();

    logger.info("GitHub token saved to session");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to save token", { error });
    return NextResponse.json(
      { error: "Failed to save token" },
      { status: 500 },
    );
  }
}

// トークン削除
export async function DELETE() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    );

    session.destroy();

    logger.info("GitHub token removed from session");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to remove token", { error });
    return NextResponse.json(
      { error: "Failed to remove token" },
      { status: 500 },
    );
  }
}

// トークン存在確認（値は返さない）
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    );

    return NextResponse.json({
      hasToken: Boolean(session.githubToken),
    });
  } catch {
    return NextResponse.json({ hasToken: false });
  }
}

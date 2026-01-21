import { NextResponse } from "next/server";
import { GitHubAPIError, getRepository } from "@/lib/github/server-client";

type RouteContext = {
  params: Promise<{
    owner?: string;
    repo?: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { owner = "", repo = "" } = await params;
    const data = await getRepository(owner, repo);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      return NextResponse.json(
        { message: error.message, details: error.response },
        { status: error.status ?? 500 },
      );
    }

    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

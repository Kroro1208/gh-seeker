"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getGitHubToken, setGitHubToken } from "@/lib/github/token";

type GitHubTokenInputProps = {
  className?: string;
};

export function GitHubTokenInput({ className }: GitHubTokenInputProps) {
  const [token, setToken] = useState(() => getGitHubToken() || "");

  return (
    <div className={className}>
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">GitHub Token</span>
        <Input
          type="password"
          name="github_token"
          autoComplete="off"
          placeholder="ghp_..."
          value={token}
          onChange={(event) => {
            const nextToken = event.target.value;
            setToken(nextToken);
            setGitHubToken(nextToken);
          }}
          className="h-9 w-full"
          aria-label="GitHub Personal Access Token"
        />
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        GitHub API
        リクエストにのみ使われます（タブを閉じた場合、再度入力してください）
      </p>
    </div>
  );
}

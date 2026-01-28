"use client";

import { ExternalLink, Key, Shield } from "lucide-react";
import { useQueryState } from "nuqs";
import { searchParamsParsers } from "@/lib/url";

export function TokenGuide() {
  const [query] = useQueryState("q", searchParamsParsers.q);

  // 検索クエリがある場合は表示しない
  if (query) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border/60 bg-background/60 p-6">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">
          はじめに: GitHub Token の設定
        </h2>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        このアプリを使用するには、GitHub Token の設定が必要です。
        右上の入力欄にトークンを入力して「保存」してください。
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/30 p-3 text-sm">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <div>
          <p className="font-medium">トークンは安全に保存されます</p>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-medium">Token の取得手順</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>
            <a
              href="https://github.com/settings/tokens/new?description=GH%20Seeaker&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              GitHub Token 作成ページ
              <ExternalLink className="h-3 w-3" />
            </a>
            を開く（GitHub へのログインが必要）
          </li>
          <li>Expiration（有効期限）を選択（推奨: 90 days）</li>
          <li>「Generate token」をクリック</li>
          <li>
            生成されたトークン（
            <code className="rounded bg-muted px-1 text-xs">ghp_...</code>
            ）をコピー
          </li>
          <li>右上の入力欄にペーストして「保存」</li>
        </ol>
      </div>
    </div>
  );
}

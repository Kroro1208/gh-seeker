"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setGitHubToken, hasGitHubToken } from "@/lib/github/token";
import { Check, Loader2 } from "lucide-react";

type GitHubTokenInputProps = {
  className?: string;
};

export function GitHubTokenInput({ className }: GitHubTokenInputProps) {
  const t = useTranslations("token");
  const tCommon = useTranslations("common");
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState<boolean | null>(null); // null = 確認中
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初回マウント時にトークンの存在を確認
  useEffect(() => {
    hasGitHubToken().then(setHasToken);
  }, []);

  const isLoading = hasToken === null;

  const handleSave = useCallback(async () => {
    if (!token.trim()) return;

    setSaving(true);
    setError(null);

    const success = await setGitHubToken(token);

    if (success) {
      setToken(""); // 入力欄クリア
      setHasToken(true);
    } else {
      setError(t("saveError"));
    }

    setSaving(false);
  }, [token, t]);

  const handleClear = useCallback(async () => {
    setSaving(true);
    await setGitHubToken("");
    setHasToken(false);
    setSaving(false);
  }, []);

  return (
    <div className={className}>
      <label className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">{t("label")}</span>
        {isLoading ? (
          <span className="text-muted-foreground">{t("checking")}</span>
        ) : hasToken ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              {t("configured")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={saving}
              className="h-7 px-2 text-xs"
            >
              {t("clear")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center w-full gap-2">
            <Input
              type="password"
              name="github_token"
              autoComplete="off"
              placeholder={t("placeholder")}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="h-9 w-full"
              aria-label={t("inputLabel")}
            />
            <Button
              onClick={handleSave}
              disabled={saving || !token.trim()}
              size="sm"
              className="h-9"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                tCommon("save")
              )}
            </Button>
          </div>
        )}
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

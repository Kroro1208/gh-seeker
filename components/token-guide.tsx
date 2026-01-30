"use client";

import { ExternalLink, Key, Shield } from "lucide-react";
import { useQueryState } from "nuqs";
import { useTranslations } from "next-intl";
import { searchParamsParsers } from "@/lib/url";

export function TokenGuide() {
  const t = useTranslations("tokenGuide");
  const [query] = useQueryState("q", searchParamsParsers.q);

  // 検索クエリがある場合は表示しない
  if (query) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border/60 bg-card/80 p-6">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">{t("title")}</h2>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{t("description")}</p>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/30 p-3 text-sm">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <div>
          <p className="font-medium">{t("securityNote")}</p>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-medium">{t("stepsTitle")}</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>
            <a
              href="https://github.com/settings/tokens/new?description=GH%20Seeaker&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {t("step1Link")}
              <ExternalLink className="h-3 w-3" />
            </a>
            {t("step1")}
          </li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>
            {t("step4Prefix")}
            <code className="rounded bg-muted px-1 text-xs">ghp_...</code>
            {t("step4")}
          </li>
          <li>{t("step5")}</li>
        </ol>
      </div>
    </div>
  );
}

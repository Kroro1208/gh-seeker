"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function LocaleToggle() {
  const t = useTranslations("header");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const handleToggle = () => {
    const currentIndex = locales.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const nextLocale = locales[nextIndex];

    // クライアント側で直接Cookieを設定
    document.cookie = `locale=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={t("languageToggle")}
      title={localeNames[currentLocale]}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}

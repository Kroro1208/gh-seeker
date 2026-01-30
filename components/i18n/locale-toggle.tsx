"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/lib/i18n/actions";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function LocaleToggle() {
  const t = useTranslations("header");
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    const currentIndex = locales.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const nextLocale = locales[nextIndex];

    startTransition(async () => {
      await setLocale(nextLocale);
      router.refresh();
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={t("languageToggle")}
      title={localeNames[currentLocale]}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import jaMessages from "@/lib/i18n/locales/ja.json";

type IntlWrapperProps = {
  children: ReactNode;
  locale?: string;
  messages?: typeof jaMessages;
};

export function IntlWrapper({
  children,
  locale = "ja",
  messages = jaMessages,
}: IntlWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

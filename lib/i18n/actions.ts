"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { type Locale, locales } from "./config";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1年
    sameSite: "lax",
  });

  // ルートレイアウトを再検証して新しいlocaleを反映
  revalidatePath("/", "layout");
}

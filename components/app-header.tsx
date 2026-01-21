"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="hover:underline">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Image
              src="/github-icon.svg"
              alt="GitHub"
              width={48}
              height={48}
              className="h-12 w-12 dark:invert"
              priority
            />
            <span>GitHub Repository Search</span>
          </h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

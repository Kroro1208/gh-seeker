"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { GitHubTokenInput } from "@/components/github/github-token-input";

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            <span>GH Seeaker</span>
          </h1>
        </Link>
        <div className="flex w-full items-start gap-4 lg:w-auto lg:flex-1 lg:justify-end">
          <GitHubTokenInput className="w-full max-w-xl" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

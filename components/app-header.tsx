"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="hover:underline">
          <h1 className="text-3xl font-bold tracking-tight">
            GitHub Repository Search
          </h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

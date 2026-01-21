"use client";

import { Button } from "@/components/ui/button";
import { SEARCH_TEMPLATES } from "@/lib/search/templates";

type SearchGuideProps = {
  onSelectTemplate: (value: string) => void;
};

export function SearchGuide({ onSelectTemplate }: SearchGuideProps) {
  return (
    <div className="flex items-start justify-center pt-4">
      <div className="mx-auto max-w-xl text-sm text-foreground">
        <p className="text-center text-base font-semibold">
          この検索でできること
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          クリックするとそのままテンプレートが入力されます
        </p>
        <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          {SEARCH_TEMPLATES.map((template) => (
            <Button
              key={template.label}
              type="button"
              variant="outline"
              onClick={() => onSelectTemplate(template.value)}
              className="h-auto w-full flex-col items-start justify-start gap-0 whitespace-normal border-border/60 bg-background/60 p-3 text-left text-foreground shadow-none transition hover:bg-background/80 hover:text-foreground focus-visible:ring-2"
            >
              <p className="font-medium text-foreground">{template.label}</p>
              <p className="mt-1">
                例: <span className="font-mono">{template.example}</span>
              </p>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

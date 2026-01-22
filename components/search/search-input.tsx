"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useSearchForm } from "@/hooks/use-search-form";
import { SearchGuide } from "@/components/search/search-guide";

export function SearchInput() {
  const { state, handlers } = useSearchForm();
  const { inputValue, validationError } = state;
  const { setInputValue, handleSubmit, clearValidationError } = handlers;

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="リポジトリを検索..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="pl-9"
            aria-label="リポジトリ検索"
          />
        </div>
        <Button type="submit" className="cursor-pointer">
          検索
        </Button>
      </form>
      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      {/* 検索ガイドエリア */}
      <SearchGuide
        onSelectTemplate={(value) => {
          setInputValue(value);
          clearValidationError();
        }}
      />
    </div>
  );
}

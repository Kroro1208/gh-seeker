"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useSearchForm } from "@/hooks/use-search-form";
import { SearchGuide } from "@/components/search/search-guide";

export function SearchInput() {
  const { state, handlers } = useSearchForm();
  const { inputValue, validationError } = state;
  const { setInputValue, handleSubmit, clearValidationError } = handlers;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusInputEnd = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    // 開始位置と終了位置を同じにすることで、カーソルを末尾に移動
    input.setSelectionRange(length, length);
  };

  useEffect(() => {
    focusInputEnd();
  }, []);

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
            ref={inputRef}
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
          requestAnimationFrame(() => {
            focusInputEnd();
          });
        }}
      />
    </div>
  );
}

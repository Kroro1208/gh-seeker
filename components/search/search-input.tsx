"use client";

import { Input } from "@/components/ui/input";
import { useQueryState } from "nuqs";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchGuide } from "@/components/search/search-guide";

export function SearchInput() {
  // nuqs を使ってクエリパラメータを管理
  // クエリパラメータとstateを同期する
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    shallow: false, // ページ遷移を伴わない更新を行う
  });
  const [, setPage] = useQueryState("page", {
    defaultValue: "1",
    shallow: false,
  });

  const [inputValue, setInputValue] = useState(query); // ここでnuqsのqueryを初期値として設定しておく
  const [validationMessage, setValidationMessage] = useState("");

  // フォームの送信用
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = inputValue.trim();
    if (!nextQuery) {
      setValidationMessage("キーワードを入力してください");
    } else {
      setValidationMessage("");
    }
    // クエリパラメータを更新
    setQuery(nextQuery || null);
    if (nextQuery) {
      setPage("1");
    } else {
      setPage(null);
    }
  };

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
            onChange={(event) => {
              const nextValue = event.target.value;
              setInputValue(nextValue);
              if (validationMessage && nextValue.trim()) {
                setValidationMessage("");
              }
            }}
            className="pl-9"
            aria-label="リポジトリ検索"
          />
        </div>
        <Button type="submit" className="cursor-pointer">
          検索
        </Button>
      </form>
      {validationMessage ? (
        <p className="text-sm text-destructive">{validationMessage}</p>
      ) : null}

      {/* 検索ガイドエリア */}
      <SearchGuide
        onSelectTemplate={(value) => {
          setInputValue(value);
          if (validationMessage) {
            setValidationMessage("");
          }
        }}
      />
    </div>
  );
}

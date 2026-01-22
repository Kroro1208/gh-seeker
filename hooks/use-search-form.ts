"use client";

import { useState, useCallback, FormEvent } from "react";
import { useQueryState } from "nuqs";

export type SearchFormState = {
  inputValue: string;
  validationError: string | null;
};

export type SearchFormHandlers = {
  setInputValue: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  clearValidationError: () => void;
};

export type UseSearchFormResult = {
  state: SearchFormState;
  handlers: SearchFormHandlers;
};

/**
 * 検索フォームのロジックを管理するカスタムフック
 * バリデーションとURL同期を担当
 */
export function useSearchForm(): UseSearchFormResult {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    shallow: false,
  });
  const [, setPage] = useQueryState("page", {
    defaultValue: "1",
    shallow: false,
  });

  const [inputValue, setInputValue] = useState(query);
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (validationError && value.trim()) {
        setValidationError(null);
      }
    },
    [validationError],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextQuery = inputValue.trim();

      if (!nextQuery) {
        setValidationError("キーワードを入力してください");
        return;
      }

      setValidationError(null);
      setQuery(nextQuery);
      setPage("1");
    },
    [inputValue, setQuery, setPage],
  );

  return {
    state: {
      inputValue,
      validationError,
    },
    handlers: {
      setInputValue: handleInputChange,
      handleSubmit,
      clearValidationError,
    },
  };
}

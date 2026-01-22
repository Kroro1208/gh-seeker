"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRepository,
  useSearchRepositories,
} from "@/lib/github/use-search-repository";
import { buildRelatedQuery } from "@/lib/search/related";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Circle,
  Calendar,
  Scale,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { RepositoryCard } from "./repository-card";
import { getErrorPresentation } from "@/lib/github/errors";

interface RepositoryDetailProps {
  owner: string;
  repo: string;
}

export function RepositoryDetail({ owner, repo }: RepositoryDetailProps) {
  const searchParams = useSearchParams();
  const repoIdParam = searchParams.get("repoId");
  const parsedRepoId = repoIdParam ? Number.parseInt(repoIdParam, 10) : NaN;
  const repoId = Number.isFinite(parsedRepoId) ? parsedRepoId : undefined;
  const { data, isLoading, error, refetch } = useRepository(
    owner,
    repo,
    repoId,
  );

  const relatedQuery = buildRelatedQuery(data, owner, repo);
  // Fallbackクエリの構築
  const fallbackQuery = data?.language
    ? `language:${data.language} -repo:${owner}/${repo}`
    : "";
  const {
    data: relatedData,
    isLoading: relatedLoading,
    error: relatedError,
  } = useSearchRepositories({
    q: relatedQuery,
    sort: "stars",
    order: "desc",
    per_page: 6,
    page: 1,
  });

  // Fallback検索を行うかどうかの判定
  const shouldFetchFallback =
    Boolean(fallbackQuery) &&
    !relatedLoading &&
    Boolean(relatedData) &&
    relatedData?.items.length === 0;

  // Fallback検索の実行
  const {
    data: fallbackData,
    isLoading: fallbackLoading,
    error: fallbackError,
  } = useSearchRepositories(
    {
      q: fallbackQuery,
      sort: "stars",
      order: "desc",
      per_page: 6,
      page: 1,
    },
    { enabled: shouldFetchFallback },
  );

  const backParams = new URLSearchParams();
  const keysToKeep = ["q", "language", "sort", "order", "page", "per_page"];

  for (const key of keysToKeep) {
    const value = searchParams.get(key);
    if (value) {
      backParams.set(key, value);
    }
  }

  const backHref = backParams.toString() ? `/?${backParams.toString()}` : "/";

  if (isLoading) {
    return <RepositoryDetailSkeleton />;
  }

  if (error) {
    const { title, description, canRetry } = getErrorPresentation(error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{description}</p>
          {canRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              再試行
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="gap-2">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          検索結果に戻る
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Image
              src={data.owner.avatar_url}
              alt={`${data.owner.login} avatar`}
              width={80}
              height={80}
              className="rounded-full"
            />
            <div className="flex-1 space-y-2">
              <CardTitle className="text-2xl">{data.name}</CardTitle>
              <p className="text-muted-foreground">{data.owner.login}</p>
              {data.description && (
                <p className="text-sm">{data.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 統計情報 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stars</p>
                <p className="text-lg font-semibold">
                  {data.stargazers_count.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Watchers</p>
                <p className="text-lg font-semibold">
                  {data.watchers_count.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GitFork className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Forks</p>
                <p className="text-lg font-semibold">
                  {data.forks_count.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-lg font-semibold">
                  {data.open_issues_count.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* プログラミング言語 */}
          {data.language && (
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 fill-current" />
              <span className="text-sm font-medium">{data.language}</span>
            </div>
          )}

          {/* 作成日・更新日 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>作成日: {formatDate(data.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>最終更新: {formatDate(data.updated_at)}</span>
            </div>
          </div>

          {/* ライセンス */}
          {data.license && (
            <div className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4" />
              <span className="font-medium">
                ライセンス: {data.license.name}
              </span>
            </div>
          )}

          {/* GitHubへのリンク */}
          <Button asChild className="w-full">
            <a href={data.html_url} target="_blank" rel="noopener noreferrer">
              GitHubで開く
            </a>
          </Button>
        </CardContent>
      </Card>

      {data.language && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">関連リポジトリ</h2>
          {relatedLoading ||
          (relatedData?.items.length === 0 && fallbackLoading) ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40" />
              ))}
            </div>
          ) : relatedError && fallbackError ? (
            <p className="text-sm text-muted-foreground">
              関連リポジトリを取得できませんでした
            </p>
          ) : relatedData && relatedData.items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedData.items.map((related) => (
                <RepositoryCard key={related.id} repository={related} />
              ))}
            </div>
          ) : fallbackData && fallbackData.items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fallbackData.items.map((related) => (
                <RepositoryCard key={related.id} repository={related} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              関連リポジトリが見つかりませんでした
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function RepositoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

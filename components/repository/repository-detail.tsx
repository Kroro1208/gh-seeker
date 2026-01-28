"use client";

import Image from "next/image";
import Link from "next/link";
import { useRepository } from "@/lib/github/use-search-repository";
import { useRelatedRepositories } from "@/hooks/use-related-repositories";
import { formatDateJa } from "@/lib/date";
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
import { useQueryStates } from "nuqs";
import { RepositoryCard } from "./repository-card";
import { getErrorPresentation } from "@/lib/github/errors";
import { searchParamsParsers, serializeSearchParams } from "@/lib/url";

interface RepositoryDetailProps {
  owner: string;
  repo: string;
}

export function RepositoryDetail({ owner, repo }: RepositoryDetailProps) {
  const [
    {
      repoId: repoIdParam,
      q: searchQuery,
      language,
      sort,
      order,
      page,
      per_page: perPage,
    },
  ] = useQueryStates(searchParamsParsers);
  const repoId = repoIdParam ?? undefined;

  const { data, isLoading, error, refetch } = useRepository(
    owner,
    repo,
    repoId,
  );
  const relatedState = useRelatedRepositories(data, owner, repo);

  const backHref = buildBackHref({
    searchQuery,
    language,
    sort,
    order,
    page,
    perPage,
  });

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
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              再試行
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

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
            <StatItem
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              label="Stars"
              value={data.stargazers_count}
            />
            <StatItem
              icon={<Eye className="h-5 w-5 text-blue-500" />}
              label="Watchers"
              value={data.watchers_count}
            />
            <StatItem
              icon={<GitFork className="h-5 w-5 text-green-500" />}
              label="Forks"
              value={data.forks_count}
            />
            <StatItem
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              label="Issues"
              value={data.open_issues_count}
            />
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
              <span>作成日: {formatDateJa(data.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>最終更新: {formatDateJa(data.updated_at)}</span>
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

      {/* 関連リポジトリ */}
      {data.language && (
        <RelatedRepositoriesSection
          state={relatedState}
          searchQuery={searchQuery}
          language={language}
          sort={sort}
          order={order}
          page={page}
          perPage={perPage}
        />
      )}
    </div>
  );
}

// 統計情報アイテム
function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

// 関連リポジトリセクション
function RelatedRepositoriesSection({
  state,
  searchQuery,
  language,
  sort,
  order,
  page,
  perPage,
}: {
  state: ReturnType<typeof useRelatedRepositories>;
  searchQuery: string | null;
  language: string | null;
  sort: string | null;
  order: string | null;
  page: number | null;
  perPage: number | null;
}) {
  const { items, isLoading, error, hasResults } = state;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">関連リポジトリ</h2>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          関連リポジトリを取得できませんでした
        </p>
      ) : hasResults ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((related) => (
            <RepositoryCard
              key={related.id}
              repository={related}
              searchQuery={searchQuery ?? undefined}
              language={language ?? undefined}
              sort={sort ?? undefined}
              order={order ?? undefined}
              page={page ?? undefined}
              perPage={perPage ?? undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          関連リポジトリが見つかりませんでした
        </p>
      )}
    </section>
  );
}

// 戻るリンクのURL構築
function buildBackHref(params: {
  searchQuery: string | null;
  language: string | null;
  sort: string | null;
  order: string | null;
  page: number | null;
  perPage: number | null;
}): string {
  return serializeSearchParams("/", {
    q: params.searchQuery?.trim() || null,
    language: params.language || null,
    sort: params.sort || null,
    order: params.order || null,
    page: Number.isFinite(params.page ?? NaN) ? params.page : null,
    per_page: Number.isFinite(params.perPage ?? NaN) ? params.perPage : null,
  });
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

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Repository } from "@/lib/github/types";
import { serializeSearchParams } from "@/lib/url";
import { Star, GitFork, Circle } from "lucide-react";

interface RepositoryCardProps {
  repository: Repository;
  searchQuery?: string;
  language?: string;
  sort?: string;
  order?: string;
  page?: number;
  perPage?: number;
}

export function RepositoryCard({
  repository,
  searchQuery,
  language,
  sort,
  order,
  page,
  perPage,
}: RepositoryCardProps) {
  // nuqsを使って検索パラメータをシリアライズ
  const href = serializeSearchParams(
    `/repository/${repository.owner.login}/${repository.name}`,
    {
      q: searchQuery?.trim() || null,
      repoId: repository.id,
      language: language || null,
      sort: sort || null,
      order: order || null,
      page: page && page > 1 ? page : null,
      per_page: perPage ?? null,
    },
  );

  return (
    <Link href={href} className="block transition-shadow hover:shadow-md">
      <Card className="h-full cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Image
              src={repository.owner.avatar_url}
              alt={`${repository.owner.login} avatar`}
              width={48}
              height={48}
              className="rounded-full"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {repository.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {repository.owner.login}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {repository.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {repository.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {repository.language && (
              <div className="flex items-center gap-1">
                <Circle className="h-3 w-3 fill-current" />
                <span>{repository.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{repository.stargazers_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{repository.forks_count.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

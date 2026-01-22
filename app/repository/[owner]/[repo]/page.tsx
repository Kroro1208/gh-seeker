import { RepositoryDetail } from "@/components/repository/repository-detail";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/app-header";

interface RepositoryPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { owner, repo } = await params;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AppHeader />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <RepositoryDetail owner={owner} repo={repo} />
        </Suspense>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: RepositoryPageProps) {
  const { owner, repo } = await params;

  return {
    title: `${owner}/${repo} - GitHub Repository Search`,
    description: `View details for ${owner}/${repo} repository`,
  };
}

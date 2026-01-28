import { RepositoryList } from "@/components/repository/repository-list";
import { Suspense } from "react";
import { RepositoryListSkeleton } from "@/components/repository/repository-list-skeleton";
import { BackgroundImages } from "@/components/background-images";
import { AppHeader } from "@/components/app-header";
import { SearchInput } from "@/components/search/search-input";
import { TokenGuide } from "@/components/token-guide";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen overflow-hidden">
        <Suspense fallback={null}>
          <BackgroundImages />
        </Suspense>
        <div className="min-h-screen bg-background/70">
          <div className="container mx-auto px-4 py-8">
            <AppHeader />
            <SearchInput />
            <main>
              <TokenGuide />
              <Suspense fallback={<RepositoryListSkeleton />}>
                <RepositoryList />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

export function BackgroundImages() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim();
  // クエリが存在する場合、背景画像をコンテンツの背後に配置する
  const zClass = query ? "z-[-1]" : "";

  return (
    <>
      <div
        className={`pointer-events-none absolute bottom-[4%] right-[4%] h-[45vh] w-[45vh] -rotate-45 opacity-30 ${zClass}`}
      >
        <Image
          src="/github.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 45vh, 45vw"
          className="object-contain opacity-30 dark:opacity-20 dark:invert"
          priority={false}
        />
      </div>
      <div
        className={`pointer-events-none absolute bottom-[4%] left-[4%] h-[45vh] w-[45vh] rotate-45 opacity-30 ${zClass}`}
      >
        <Image
          src="/github.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 45vh, 45vw"
          className="object-contain opacity-30 dark:opacity-20 dark:invert"
          priority={false}
        />
      </div>
    </>
  );
}

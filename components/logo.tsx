import Image from "next/image";
import { cn } from "@/lib/cn";

/** Company logo. Its letters are transparent, so it always sits on white (a small plate in dark mode). */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="S-Tec"
      width={1372}
      height={432}
      sizes="160px"
      priority
      className={cn("w-auto rounded-[3px] bg-white dark:p-[3px]", className)}
    />
  );
}

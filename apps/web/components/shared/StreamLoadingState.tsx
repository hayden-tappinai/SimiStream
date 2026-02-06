import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StreamLoadingStateProps {
  className?: string;
}

export function StreamLoadingState({ className }: StreamLoadingStateProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      <Skeleton className="aspect-video w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
